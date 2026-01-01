// /api/create-checkout.js
// API pour créer une session de paiement Stripe

const Stripe = require('stripe');

// Configuration des produits
const PRODUCTS = {
  ebook: {
    name: 'Mind Games — La Toile Mortelle (Ebook)',
    description: 'Roman complet ePub + PDF + Dossier #7 + Chapitre 0',
    price: 499,
    shipping: false
  },
  paperback: {
    name: 'Mind Games — La Toile Mortelle (Broché + Ebook)',
    description: 'Livre papier + ePub + PDF + Dossier #7 + Chapitre 0',
    price: 999,
    shipping: true
  }
};

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
  
  // Vérifier que la clé Stripe est configurée
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY non configurée');
    return res.status(500).json({ error: 'Configuration Stripe manquante' });
  }
  
  // Initialiser Stripe
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  
  try {
    const body = req.body || {};
    const { 
      format, 
      firstName, 
      lastName, 
      email, 
      address, 
      city, 
      postalCode, 
      country 
    } = body;
    
    console.log('Commande reçue:', { format, firstName, lastName, email });
    
    // Validation
    if (!format || !firstName || !lastName || !email) {
      console.error('Champs manquants:', { format, firstName, lastName, email });
      return res.status(400).json({ error: 'Informations manquantes' });
    }
    
    const product = PRODUCTS[format];
    if (!product) {
      console.error('Format invalide:', format);
      return res.status(400).json({ error: 'Format invalide' });
    }
    
    // Validation adresse pour livre papier
    if (format === 'paperback' && (!address || !city || !postalCode)) {
      return res.status(400).json({ error: 'Adresse de livraison requise pour le livre broché' });
    }
    
    // Préparer les métadonnées
    const metadata = {
      format,
      firstName,
      lastName,
      customerEmail: email,
      address: address || '',
      city: city || '',
      postalCode: postalCode || '',
      country: country || 'FR',
      orderDate: new Date().toISOString()
    };
    
    // URL de base
    const baseUrl = process.env.SITE_URL || 'https://secrets-du-veilleur.fr';
    
    // Créer la session Stripe Checkout
    const sessionConfig = {
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      locale: 'fr',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: product.name,
              description: product.description,
            },
            unit_amount: product.price,
          },
          quantity: 1,
        },
      ],
      metadata,
      success_url: `${baseUrl}/commander.html?success=true`,
      cancel_url: `${baseUrl}/commander.html?canceled=true`,
    };
    
    // Ajouter la collecte d'adresse si livre papier
    if (product.shipping) {
      sessionConfig.shipping_address_collection = {
        allowed_countries: ['FR', 'BE', 'CH', 'CA', 'LU', 'MC', 'CI', 'SN', 'MA', 'TN'],
      };
    }
    
    console.log('Création session Stripe...');
    const session = await stripe.checkout.sessions.create(sessionConfig);
    console.log('Session créée:', session.id);
    
    // Retourner l'URL de paiement
    return res.status(200).json({ url: session.url });
    
  } catch (error) {
    console.error('Erreur Stripe:', error.message);
    console.error('Stack:', error.stack);
    return res.status(500).json({ 
      error: 'Erreur lors de la création du paiement',
      message: error.message
    });
  }
};
