# Générateur automatique de PDFs

Ce système permet de générer facilement des versions PDF de tous vos cours de mathématiques directement depuis votre navigateur.

## 🎯 Deux méthodes disponibles

### Méthode 1 : Interface Web (Recommandée ⭐)

La méthode la plus simple et rapide, sans installation nécessaire !

#### 💻 Utilisation

1. Ouvrez le fichier `generateur-pdfs.html` dans votre navigateur web
2. Choisissez la classe et le chapitre que vous souhaitez convertir
3. Cliquez sur "🖨️ Imprimer"
4. Dans la boîte de dialogue d'impression :
   - Sélectionnez **"Enregistrer au format PDF"** ou **"Microsoft Print to PDF"**
   - Ajustez les paramètres si nécessaire (marges, orientation, etc.)
   - Cliquez sur **"Enregistrer"**

#### ✨ Fonctionnalités

- ✅ **Interface intuitive** : Navigation facile par classe et chapitre
- ✅ **Pas d'installation** : Fonctionne directement dans le navigateur
- ✅ **Prévisualisation** : Voyez le rendu avant de générer le PDF
- ✅ **Génération en masse** : Bouton pour ouvrir tous les cours d'une classe
- ✅ **Styles préservés** : Tous les styles CSS et images sont conservés

#### 📝 Raccourcis clavier

- **Ctrl + P** (Windows/Linux) ou **Cmd + P** (Mac) : Ouvrir la boîte d'impression
- **Échap** : Annuler

---

### Méthode 2 : Script Node.js (Avancée)

Pour une automatisation complète via ligne de commande.

#### 📋 Prérequis

- Node.js (version 14 ou supérieure)
- npm (généralement installé avec Node.js)
- Chrome ou Chromium installé sur votre système

#### 🚀 Installation

```bash
npm install
```

#### 💻 Utilisation

Générer tous les PDFs :
```bash
npm run generate:all
```

Générer les PDFs d'un niveau spécifique :
```bash
npm run generate:6e  # Classe de 6ème
npm run generate:5e  # Classe de 5ème
npm run generate:4e  # Classe de 4ème
npm run generate:3e  # Classe de 3ème
```

#### 📁 Fichiers générés

Les PDFs sont créés dans le dossier `pdfs/` avec le format : `[niveau]-[chapitre].pdf`

---

## 🎨 Paramètres de génération PDF

Que vous utilisiez la méthode Web ou Node.js, voici les paramètres recommandés :

- **Format** : A4
- **Orientation** : Portrait
- **Marges** : 10-20mm sur chaque côté
- **Arrière-plans** : Activés (pour conserver les couleurs des définitions/exemples)
- **Échelle** : 100%

## 💡 Conseils et astuces

### Pour de meilleurs PDFs

1. **Vérifiez la mise en page** : Avant d'enregistrer, prévisualisez le PDF
2. **Ajustez les marges** : Si du contenu est coupé, réduisez les marges
3. **Mode d'économie d'encre** : Désactivé pour conserver les couleurs
4. **En-têtes et pieds de page** : Vous pouvez les désactiver dans les paramètres d'impression

### Génération en masse

Pour générer rapidement tous les cours d'une classe :

1. Cliquez sur "📑 Imprimer tous les cours"
2. Les cours s'ouvriront dans des onglets séparés
3. Utilisez Ctrl+P sur chaque onglet
4. Enregistrez chaque PDF avec un nom descriptif

## 🛠️ Résolution des problèmes

### Les images ne s'affichent pas dans le PDF

**Solution** : Attendez que toutes les images soient chargées avant d'imprimer. Vérifiez que votre connexion Internet est active si les images sont en ligne.

### Les rectangles colorés (définitions, exemples) ne s'affichent pas

**Solution** : Les couleurs devraient s'imprimer automatiquement grâce aux règles CSS optimisées. Si le problème persiste :

1. **Chrome/Edge** : Dans la fenêtre d'impression, activez l'option "Graphiques d'arrière-plan" dans "Plus de paramètres"
2. **Firefox** : Allez dans Fichier > Mise en page > Options d'impression > cochez "Imprimer les couleurs et images d'arrière-plan"
3. **Safari** : Dans le menu Fichier > Imprimer, cochez "Imprimer les arrière-plans"

Note : Les règles CSS ont été configurées pour forcer l'impression des couleurs (`print-color-adjust: exact`), donc ce problème devrait être rare.

### Le PDF est coupé sur les côtés

**Solution** : Réduisez les marges dans les paramètres d'impression ou ajustez l'échelle à 90-95%.

### Erreur avec le script Node.js

**Solution** : Assurez-vous que Chrome ou Chromium est installé sur votre système, ou utilisez la méthode Web qui fonctionne avec n'importe quel navigateur.

## 📝 Notes

- La méthode Web fonctionne avec tous les navigateurs modernes (Chrome, Firefox, Edge, Safari)
- Les PDFs générés conservent toute la mise en forme originale
- Aucune connexion Internet n'est nécessaire si les ressources sont locales
- Les dossiers `node_modules/` et `pdfs/` sont exclus du dépôt git
