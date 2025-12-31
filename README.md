# 🕷️ Secret du Veilleur - Landing Page

Landing page immersive pour **Mind Games - Tome 1 : La Toile Mortelle**.

> "Depuis 1847, Ravenwood cache un secret. Le Veilleur observe."

## 🚀 Déploiement rapide (5 minutes)

### Étape 1 : Créer un compte Brevo (gratuit)

1. Aller sur [brevo.com](https://www.brevo.com/fr/) et créer un compte gratuit
2. Aller dans **Paramètres** → **Clés API** → **Générer une nouvelle clé**
3. Copier la clé API (commence par `xkeysib-...`)
4. Aller dans **Contacts** → **Listes** → **Créer une liste** nommée "Enquêteurs Ravenwood"
5. Noter l'ID de la liste (visible dans l'URL, ex: `https://app.brevo.com/contact/list/2`)

### Étape 2 : Pousser sur GitHub

```bash
# 1. Créer un nouveau repo sur GitHub (github.com/new)
#    Nom suggéré : secret-du-veilleur

# 2. Dans le terminal, dans le dossier du projet :
git init
git add .
git commit -m "🕷️ Initial commit - Le Veilleur observe"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/secret-du-veilleur.git
git push -u origin main
```

### Étape 3 : Déployer sur Vercel

1. Aller sur [vercel.com](https://vercel.com) et se connecter avec GitHub
2. Cliquer **"Add New Project"**
3. Importer le repo `secret-du-veilleur`
4. **IMPORTANT** - Configurer les variables d'environnement :
   - Cliquer sur **"Environment Variables"**
   - Ajouter :
     - `BREVO_API_KEY` = `xkeysib-votre-cle-api`
     - `BREVO_LIST_ID` = `2` (ou l'ID de votre liste)
5. Cliquer **"Deploy"**
6. Attendre 1-2 minutes... 🎉 C'est en ligne !

### Étape 4 : Configurer le domaine personnalisé

1. Dans Vercel, aller dans **Settings** → **Domains**
2. Ajouter `secret-du-veilleur.fr`
3. Configurer les DNS chez votre registrar :
   - Type: `A` → `76.76.21.21`
   - Type: `CNAME` → `cname.vercel-dns.com`

---

## 📧 Séquence d'emails automatique (Brevo)

### Créer l'automation dans Brevo :

1. Aller dans **Automation** → **Créer un scénario**
2. Déclencheur : **"Contact ajouté à une liste"** → Sélectionner "Enquêteurs Ravenwood"
3. Ajouter les emails :

| Délai | Email | Objet |
|-------|-------|-------|
| Immédiat | Email 1 | 🕷️ Bienvenue, Enquêteur #RVW-XXXX |
| +3 jours | Email 2 | 📁 Premier indice déclassifié... |
| +7 jours | Email 3 | ⚠️ Chapitre 1 - La Proie [CONFIDENTIEL] |
| +14 jours | Email 4 | 🔓 Accès anticipé : Mind Games disponible |

### Template Email 1 (Bienvenue) :

```
Objet: 🕷️ Bienvenue, Enquêteur #RVW-{{contact.RANDOM_ID}}

---

Enquêteur,

Vous venez de rejoindre l'enquête. Il n'y a pas de retour en arrière.

Depuis 1847, Ravenwood cache un secret. Trois familles fondatrices. 
Des disparitions inexpliquées. Un observateur dans l'ombre.

Le Veilleur vous a repéré.

📁 VOTRE DOSSIER #7 EST EN COURS DE DÉCLASSIFICATION
Vous le recevrez dans les prochaines 24h.

En attendant, gardez l'œil ouvert.
Chaque détail compte.

— Le Bureau des Enquêtes de Ravenwood

P.S. : Ne partagez ce message avec personne. 
Sauf si vous voulez qu'ils découvrent la vérité aussi.
→ https://secret-du-veilleur.fr
```

---

## 🛠️ Développement local

```bash
# Installer les dépendances
npm install

# Créer le fichier d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés

# Lancer le serveur de développement
npm run dev

# Build de production
npm run build
```

---

## 📁 Structure du projet

```
secret-du-veilleur/
├── api/
│   └── subscribe.js      # API Vercel pour Brevo
├── public/
│   ├── favicon.svg
│   └── og-image.jpg      # Image Open Graph (1200x630)
├── src/
│   ├── App.jsx           # Composant principal
│   └── main.jsx          # Point d'entrée React
├── .env.example          # Variables d'environnement
├── .gitignore
├── index.html
├── package.json
├── README.md
├── vercel.json
└── vite.config.js
```

---

## 🔧 Personnalisation

### Modifier la date du countdown :
Dans `src/App.jsx`, ligne ~211 :
```javascript
const targetDate = new Date('2026-05-15T00:00:00').getTime();
```

### Modifier le nombre de places FOMO :
Dans `src/App.jsx`, rechercher `spotsRemaining` :
```javascript
const [spotsRemaining, setSpotsRemaining] = useState(847);
```

### Ajouter Google Analytics :
Dans `index.html`, ajouter avant `</head>` :
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## 📊 Tracking des conversions

Pour tracker les inscriptions dans Google Analytics, ajouter dans `handleSubmit` :
```javascript
if (window.gtag) {
  gtag('event', 'sign_up', {
    method: 'email',
    campaign: 'veilleur'
  });
}
```

---

## 🆘 Troubleshooting

### "BREVO_API_KEY non configurée"
→ Vérifier que les variables d'environnement sont bien configurées dans Vercel

### Emails non reçus
→ Vérifier dans Brevo : Contacts → Vérifier que le contact apparaît dans la liste

### Erreur 500
→ Vérifier les logs dans Vercel : Project → Functions → Logs

---

## 📜 Licence

© 2024 Loïc Gros-Flandre - Tous droits réservés

---

*"Le Veilleur observe depuis 1847"* 🕷️
