// /api/create-checkout.js
const Stripe = require('stripe');

module.exports = async function handler(req, res) {
  // Log de démarrage
  console.log('=== CREATE-CHECKOUT API CALLED ===');
  console.log('Method:', req.method);
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Vérifier la clé Stripe
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  console.log('STRIPE_SECRET_KEY exists:', !!stripeKey);
  console.log('STRIPE_SECRET_KEY starts with:', stripeKey ? stripeKey.substring(0, 10) + '...' : 'N/A');
  
  if (!stripeKey) {
    console.error('ERROR: STRIPE_SECRET_KEY is not set');
    return res.status(500).json({ error: 'Stripe not configured' });
  }
  
  try {
    // Initialiser Stripe
    const stripe = new Stripe(stripeKey);
    console.log('Stripe initialized');
    
    // Récupérer les données
    const body = req.body || {};
    console.log('Request body:', JSON.stringify(body));
    
    const { format, firstName, lastName, email } = body;
    
    // Validation basique
    if (!format || !firstName || !lastName || !email) {
      console.error('Missing fields:', { format, firstName, lastName, email });
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Déterminer le prix
    const price = format === 'paperback' ? 999 : 499;
    const productName = format === 'paperback' 
      ? 'Mind Games — Broché + Ebook' 
      : 'Mind Games — Ebook';
    
    console.log('Creating session for:', { format, price, productName, email });
    
    // URL de base
    const siteUrl = process.env.SITE_URL || 'https://www.secrets-du-veilleur.fr';
    console.log('Site URL:', siteUrl);
    
    // Créer la session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      locale: 'fr',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: productName,
          },
          unit_amount: price,
        },
        quantity: 1,
      }],
      metadata: {
        format,
        firstName,
        lastName,
        email,
      },
      success_url: `${siteUrl}/commander.html?success=true`,
      cancel_url: `${siteUrl}/commander.html?canceled=true`,
    });
    
    console.log('Session created:', session.id);
    console.log('Session URL:', session.url);
    
    return res.status(200).json({ url: session.url });
    
  } catch (error) {
    console.error('=== STRIPE ERROR ===');
    console.error('Error type:', error.type);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', JSON.stringify(error, null, 2));
    
    return res.status(500).json({ 
      error: 'Payment error',
      message: error.message,
      type: error.type
    });
  }
};
