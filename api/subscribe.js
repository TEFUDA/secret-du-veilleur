// api/subscribe.js
// Serverless function pour Vercel - Intégration Brevo (ex-Sendinblue)

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email invalide' });
  }

  // Clé API Brevo depuis les variables d'environnement Vercel
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const BREVO_LIST_ID = process.env.BREVO_LIST_ID || 2; // ID de ta liste Brevo

  if (!BREVO_API_KEY) {
    console.error('BREVO_API_KEY non configurée');
    return res.status(500).json({ error: 'Configuration serveur manquante' });
  }

  try {
    // Appel API Brevo pour ajouter le contact
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        email: email,
        listIds: [parseInt(BREVO_LIST_ID)],
        updateEnabled: true, // Met à jour si le contact existe déjà
        attributes: {
          SOURCE: 'secret-du-veilleur.fr',
          DATE_INSCRIPTION: new Date().toISOString(),
          STATUT: 'ENQUETEUR'
        }
      })
    });

    const data = await response.json();

    if (response.ok || response.status === 201) {
      // Succès - Contact créé ou mis à jour
      return res.status(200).json({ 
        success: true, 
        message: 'Bienvenue, Enquêteur !',
        id: data.id || 'existing'
      });
    } else if (response.status === 400 && data.message?.includes('already exist')) {
      // Contact déjà existant - c'est OK
      return res.status(200).json({ 
        success: true, 
        message: 'Vous êtes déjà inscrit, Enquêteur !',
        id: 'existing'
      });
    } else {
      console.error('Erreur Brevo:', data);
      return res.status(response.status).json({ 
        error: data.message || 'Erreur lors de l\'inscription' 
      });
    }

  } catch (error) {
    console.error('Erreur serveur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
