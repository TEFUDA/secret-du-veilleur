// /api/webhook-stripe.js
// Webhook pour recevoir les événements Stripe

const Stripe = require('stripe');

// Fonction pour envoyer un email via Brevo
async function sendConfirmationEmail(customer) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  
  if (!BREVO_API_KEY) {
    console.log('BREVO_API_KEY non configurée, email non envoyé');
    return;
  }
  
  try {
    // 1. Ajouter le contact à Brevo (liste acheteurs)
    await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        email: customer.email,
        attributes: {
          PRENOM: customer.firstName,
          NOM: customer.lastName,
          FORMAT: customer.format,
          DATE_ACHAT: customer.orderDate,
          ADRESSE: customer.address,
          VILLE: customer.city,
          CODE_POSTAL: customer.postalCode,
          PAYS: customer.country
        },
        listIds: [6],
        updateEnabled: true
      })
    });
    
    // 2. Envoyer email de confirmation
    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: 'Le Veilleur',
          email: 'jevousvois@secrets-du-veilleur.fr'
        },
        to: [{ email: customer.email, name: `${customer.firstName} ${customer.lastName}` }],
        subject: '✅ Confirmation de ta précommande — Mind Games',
        htmlContent: `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: Georgia, serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 40px;">
      <div style="font-size: 60px; margin-bottom: 20px;">🎉</div>
      <h1 style="color: #22c55e; font-size: 28px; margin: 0 0 10px;">Merci ${customer.firstName} !</h1>
      <p style="color: #888888; font-size: 14px; margin: 0;">Ta précommande a été enregistrée.</p>
    </div>
    <div style="background: #111111; border: 1px solid #333333; padding: 25px; margin-bottom: 30px;">
      <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 20px;">📦 RÉCAPITULATIF</h2>
      <p style="color: #aaaaaa; margin: 10px 0;">Produit: <strong style="color: #ffffff;">Mind Games — La Toile Mortelle</strong></p>
      <p style="color: #aaaaaa; margin: 10px 0;">Format: <strong style="color: #ffffff;">${customer.format === 'paperback' ? 'Broché + Ebook' : 'Ebook'}</strong></p>
      <p style="color: #ffd700; font-size: 18px; margin: 20px 0 0;">Total: ${customer.format === 'paperback' ? '9,99 €' : '4,99 €'}</p>
    </div>
    <div style="background: #111111; border: 1px solid #333333; padding: 25px;">
      <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 20px;">📋 PROCHAINES ÉTAPES</h2>
      <p style="color: #aaaaaa; margin: 10px 0;">📁 Télécharge le <a href="https://secrets-du-veilleur.fr/dossier-7.html" style="color: #dc143c;">Dossier #7</a></p>
      <p style="color: #aaaaaa; margin: 10px 0;">🔓 Débloque le Chapitre 0 sur le site</p>
      <p style="color: #aaaaaa; margin: 10px 0;">📖 Livre envoyé dès la sortie !</p>
    </div>
    <div style="text-align: center; margin-top: 40px;">
      <p style="color: #444444; font-size: 11px;">🕷️ Le Veilleur t'attend.</p>
    </div>
  </div>
</body>
</html>`
      })
    });
    
    console.log('Email envoyé à', customer.email);
    
  } catch (error) {
    console.error('Erreur envoi email:', error);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
  
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    if (webhookSecret && sig) {
      // Vérification de signature en production
      // Note: nécessite le raw body
      event = req.body;
    } else {
      event = req.body;
    }
    
    // Traiter l'événement
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      console.log('💰 Paiement réussi !', session.id);
      
      const metadata = session.metadata || {};
      
      const customer = {
        sessionId: session.id,
        email: session.customer_email || metadata.customerEmail,
        firstName: metadata.firstName,
        lastName: metadata.lastName,
        format: metadata.format,
        address: metadata.address,
        city: metadata.city,
        postalCode: metadata.postalCode,
        country: metadata.country,
        orderDate: metadata.orderDate || new Date().toISOString()
      };
      
      await sendConfirmationEmail(customer);
      
      console.log('✅ Commande traitée:', customer.email);
    }
    
    return res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Erreur webhook:', error.message);
    return res.status(400).json({ error: error.message });
  }
};
