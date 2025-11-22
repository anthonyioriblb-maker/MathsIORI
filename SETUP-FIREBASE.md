# 🔥 Configuration du Compteur de Visiteurs avec Firebase

Ce guide vous explique comment configurer Firebase pour avoir un **compteur de visiteurs global en temps réel** sur votre site.

## ⏱️ Temps estimé : 10 minutes

---

## 📋 Étape 1 : Créer un projet Firebase

1. **Allez sur la console Firebase** : https://console.firebase.google.com/

2. **Cliquez sur "Ajouter un projet"**

3. **Entrez un nom de projet** (par exemple : `mathsiori-visitor-counter`)

4. **Désactivez Google Analytics** (optionnel, pas nécessaire pour un compteur)

5. **Cliquez sur "Créer le projet"** et attendez quelques secondes

---

## 📋 Étape 2 : Activer Realtime Database

1. Dans le menu de gauche, cliquez sur **"Realtime Database"**

2. Cliquez sur **"Créer une base de données"**

3. **Choisissez un emplacement** (par exemple : `europe-west1`)

4. **Mode de sécurité** : Sélectionnez **"Démarrer en mode test"**
   - ⚠️ Important : Nous allons sécuriser la base après

5. Cliquez sur **"Activer"**

---

## 📋 Étape 3 : Configurer les règles de sécurité

Pour que seul le compteur puisse être modifié :

1. Dans **"Realtime Database"**, allez dans l'onglet **"Règles"**

2. Remplacez le contenu par :

```json
{
  "rules": {
    "visitors": {
      "count": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

3. Cliquez sur **"Publier"**

**Explication des règles :**
- `.read: true` : Tout le monde peut lire le compteur
- `.write: true` : Tout le monde peut incrémenter le compteur
- Le reste de la base de données est protégé

---

## 📋 Étape 4 : Obtenir la configuration Firebase

1. Cliquez sur **l'icône engrenage** ⚙️ en haut à gauche → **"Paramètres du projet"**

2. Faites défiler jusqu'à **"Vos applications"**

3. Cliquez sur l'icône **Web** `</>`

4. Donnez un nom à votre application (par exemple : `MathsIORI Site`)

5. **NE COCHEZ PAS** "Configurer aussi Firebase Hosting"

6. Cliquez sur **"Enregistrer l'application"**

7. **Copiez les valeurs** de `firebaseConfig` qui s'affichent

---

## 📋 Étape 5 : Configurer le fichier firebase-config.js

1. Ouvrez le fichier **`firebase-config.js`** dans votre projet

2. Remplacez les valeurs par celles que vous avez copiées :

```javascript
const firebaseConfig = {
    apiKey: "VOTRE_VRAIE_API_KEY",
    authDomain: "votre-projet.firebaseapp.com",
    databaseURL: "https://votre-projet-default-rtdb.firebaseio.com",
    projectId: "votre-projet-id",
    storageBucket: "votre-projet.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abc123def456"
};
```

3. **Sauvegardez le fichier**

---

## 🎯 Étape 6 : Tester le compteur

1. **Ouvrez `index.html`** dans votre navigateur

2. Le compteur devrait afficher **1** (première visite)

3. **Rechargez la page** → Le compteur devrait passer à **2**

4. **Ouvrez dans un autre navigateur** → Le compteur devrait continuer à s'incrémenter

5. **Vérifiez dans Firebase Console** :
   - Allez dans "Realtime Database"
   - Vous devriez voir : `visitors > count: X`

---

## ✅ C'est terminé !

Votre compteur de visiteurs global est maintenant fonctionnel ! 🎉

### Caractéristiques :
- ✅ Compteur **global** partagé entre tous les visiteurs
- ✅ Mise à jour en **temps réel**
- ✅ **Gratuit** jusqu'à 100 000 connexions simultanées
- ✅ **Fallback automatique** vers localStorage si Firebase n'est pas configuré

---

## 🔒 Note de sécurité

Les règles actuelles permettent à n'importe qui d'incrémenter le compteur. C'est volontaire pour la simplicité.

**Si vous voulez plus de sécurité** (empêcher la triche), vous pouvez :
1. Utiliser Firebase Authentication
2. Implémenter une Cloud Function qui contrôle l'incrémentation
3. Limiter les écritures par IP (via Cloud Functions)

---

## 📊 Consulter les statistiques

Pour voir les statistiques détaillées de votre site :
1. Retournez dans **Firebase Console**
2. Allez dans **"Realtime Database"**
3. Le compteur est visible en temps réel : `visitors > count`

---

## ❓ Problèmes courants

### Le compteur reste à "..."
- Vérifiez que `firebase-config.js` contient vos vraies valeurs
- Ouvrez la console du navigateur (F12) pour voir les erreurs
- Vérifiez que la Realtime Database est activée

### Le compteur ne s'incrémente pas
- Vérifiez les règles de sécurité dans Firebase Console
- Assurez-vous que `.write: true` est bien configuré

### Erreur "Permission denied"
- Les règles de sécurité sont trop restrictives
- Retournez à l'Étape 3 et vérifiez les règles

---

## 📞 Besoin d'aide ?

Si vous rencontrez des problèmes, ouvrez une issue sur GitHub avec :
- Le message d'erreur (console du navigateur)
- Votre configuration Firebase (sans l'apiKey !)
