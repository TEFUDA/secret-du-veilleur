// /api/create-checkout.js
// API pour créer une session de paiement Stripe

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Configuration des produits
const PRODUCTS = {
  ebook: {
    name: 'Mind Games — La Toile Mortelle (Ebook)',
    description: 'Roman complet ePub + PDF + Dossier #7 + Chapitre 0',
    price: 999, // en centimes
    shipping: false
  },
  paperback: {
    name: 'Mind Games — La Toile Mortelle (Broché + Ebook)',
    description: 'Livre papier + ePub + PDF + Dossier #7 + Chapitre 0',
    price: 1999, // en centimes
    shipping: true
  }
};

export default async function handler(req, res) {
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
  
  try {
    const { 
      format, 
      firstName, 
      lastName, 
      email, 
      address, 
      city, 
      postalCode, 
      country 
    } = req.body;
    
    // Validation
    if (!format || !firstName || !lastName || !email) {
      return res.status(400).json({ error: 'Informations manquantes' });
    }
    
    const product = PRODUCTS[format];
    if (!product) {
      return res.status(400).json({ error: 'Format invalide' });
    }
    
    // Validation adresse pour livre papier
    if (format === 'paperback' && (!address || !city || !postalCode)) {
      return res.status(400).json({ error: 'Adresse de livraison requise pour le livre broché' });
    }
    
    // Préparer les métadonnées pour retrouver la commande après
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
    
    // Créer la session Stripe Checkout
    const sessionConfig = {
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      locale: 'fr', // Interface en français !
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: product.name,
              description: product.description,
              images: ['https://secret-du-veilleur.fr/cover-mind-games.jpg'], // Ajouter une image de couverture
            },
            unit_amount: product.price,
          },
          quantity: 1,
        },
      ],
      metadata,
      success_url: `${process.env.SITE_URL || 'https://secret-du-veilleur.fr'}/commander.html?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL || 'https://secret-du-veilleur.fr'}/commander.html?canceled=true`,
    };
    
    // Ajouter la collecte d'adresse si livre papier
    if (product.shipping) {
      sessionConfig.shipping_address_collection = {
        allowed_countries: ['FR', 'BE', 'CH', 'CA', 'LU', 'MC', 'CI', 'SN', 'MA', 'TN'],
      };
    }
    
    const session = await stripe.checkout.sessions.create(sessionConfig);
    
    // Retourner l'URL de paiement
    return res.status(200).json({ url: session.url });
    
  } catch (error) {
    console.error('Stripe error:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de la création du paiement',
      details: error.message 
    });
  }
}
