// /api/webhook-stripe.js
// Webhook pour recevoir les événements Stripe (paiement réussi, etc.)

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
        listIds: [3], // ID de ta liste "Acheteurs" dans Brevo (à modifier)
        updateEnabled: true
      })
    });
    
    // 2. Envoyer email de confirmation
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: 'Mind Games',
          email: 'contact@secret-du-veilleur.fr' // Ton email d'envoi Brevo
        },
        to: [{ email: customer.email, name: `${customer.firstName} ${customer.lastName}` }],
        subject: '✅ Confirmation de ta précommande — Mind Games',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: Georgia, serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <div style="text-align: center; margin-bottom: 40px;">
      <div style="font-size: 60px; margin-bottom: 20px;">🎉</div>
      <h1 style="color: #22c55e; font-size: 28px; margin: 0 0 10px;">Merci ${customer.firstName} !</h1>
      <p style="color: #888888; font-size: 14px; margin: 0;">Ta précommande a été enregistrée avec succès.</p>
    </div>
    
    <div style="background: #111111; border: 1px solid #333333; padding: 25px; margin-bottom: 30px;">
      <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 20px;">📦 RÉCAPITULATIF</h2>
      <table style="width: 100%; font-size: 14px; color: #aaaaaa;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #222;">Produit</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #222; text-align: right; color: #ffffff;">Mind Games — La Toile Mortelle</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #222;">Format</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #222; text-align: right; color: #ffffff;">${customer.format === 'paperback' ? 'Broché + Ebook' : 'Ebook (ePub + PDF)'}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0;">Total</td>
          <td style="padding: 10px 0; text-align: right; color: #ffd700; font-size: 18px;">${customer.format === 'paperback' ? '4,99 €' : '4,99 €'}</td>
        </tr>
      </table>
    </div>
    
    <div style="background: #111111; border: 1px solid #333333; padding: 25px; margin-bottom: 30px;">
      <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 20px;">📋 PROCHAINES ÉTAPES</h2>
      <ul style="color: #aaaaaa; font-size: 14px; line-height: 2; padding-left: 20px; margin: 0;">
        <li>📁 <strong style="color: #ffffff;">Dossier #7</strong> — Télécharge-le maintenant sur <a href="https://secret-du-veilleur.fr/dossier-7.html" style="color: #dc143c;">secret-du-veilleur.fr</a></li>
        <li>🔓 <strong style="color: #ffffff;">Chapitre 0</strong> — Débloque-le en résolvant les énigmes du site</li>
        <li>📖 <strong style="color: #ffffff;">Livre complet</strong> — Tu le recevras dès la sortie officielle</li>
      </ul>
    </div>
    
    <div style="text-align: center; padding: 30px 0; border-top: 1px solid #222222;">
      <p style="color: #666666; font-size: 12px; margin: 0;">
        Une question ? Réponds simplement à cet email.<br><br>
        🕷️ Le Veilleur t'attend.
      </p>
    </div>
    
  </div>
</body>
</html>
        `
      })
    });
    
    console.log('Email de confirmation envoyé à', customer.email);
    
  } catch (error) {
    console.error('Erreur envoi email:', error);
  }
}

// Fonction pour sauvegarder dans Google Sheets (optionnel)
async function saveToGoogleSheets(customer) {
  const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
  
  if (!GOOGLE_SCRIPT_URL) {
    console.log('Google Sheets non configuré');
    return;
  }
  
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: customer.orderDate,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        format: customer.format,
        amount: customer.amount,
        address: customer.address,
        city: customer.city,
        postalCode: customer.postalCode,
        country: customer.country,
        stripeSessionId: customer.sessionId
      })
    });
    console.log('Commande sauvegardée dans Google Sheets');
  } catch (error) {
    console.error('Erreur Google Sheets:', error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
  
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    // Vérifier la signature du webhook (sécurité)
    if (webhookSecret && sig) {
      // En production, utiliser la vérification de signature
      const rawBody = await getRawBody(req);
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      // En dev, accepter directement
      event = req.body;
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }
  
  // Traiter l'événement
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    console.log('💰 Paiement réussi !', session.id);
    
    // Récupérer les métadonnées
    const metadata = session.metadata || {};
    
    const customer = {
      sessionId: session.id,
      email: session.customer_email || metadata.customerEmail,
      firstName: metadata.firstName,
      lastName: metadata.lastName,
      format: metadata.format,
      amount: session.amount_total,
      address: metadata.address,
      city: metadata.city,
      postalCode: metadata.postalCode,
      country: metadata.country,
      orderDate: metadata.orderDate || new Date().toISOString()
    };
    
    // Actions post-paiement
    await Promise.all([
      sendConfirmationEmail(customer),
      saveToGoogleSheets(customer)
    ]);
    
    console.log('✅ Commande traitée:', customer.email);
  }
  
  return res.status(200).json({ received: true });
}

// Helper pour récupérer le raw body (nécessaire pour vérifier la signature Stripe)
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(Buffer.from(data)));
    req.on('error', reject);
  });
}

// Config Vercel pour le raw body
export const config = {
  api: {
    bodyParser: false,
  },
};
