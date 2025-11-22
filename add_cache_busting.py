#!/usr/bin/env python3
"""
Script pour ajouter des meta tags anti-cache dans tous les fichiers HTML
et ajouter des paramètres de version aux fichiers CSS et JS.
"""

import os
import re
from datetime import datetime

# Timestamp pour le cache busting
VERSION = datetime.now().strftime("%Y%m%d%H%M%S")

# Meta tags à ajouter pour désactiver le cache
META_TAGS = '''    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">'''

def has_cache_meta_tags(content):
    """Vérifie si le fichier contient déjà les meta tags anti-cache"""
    return 'http-equiv="Cache-Control"' in content or 'http-equiv="Pragma"' in content

def add_cache_meta_tags(content):
    """Ajoute les meta tags anti-cache après la balise <head>"""
    if has_cache_meta_tags(content):
        # Si les meta tags existent déjà, on les met à jour
        # Supprimer les anciens meta tags
        content = re.sub(r'\s*<meta http-equiv="Cache-Control"[^>]*>\s*', '', content)
        content = re.sub(r'\s*<meta http-equiv="Pragma"[^>]*>\s*', '', content)
        content = re.sub(r'\s*<meta http-equiv="Expires"[^>]*>\s*', '', content)

    # Ajouter les meta tags après <head>
    if '<head>' in content:
        content = content.replace('<head>', '<head>\n' + META_TAGS)

    return content

def add_version_to_resources(content):
    """Ajoute un paramètre de version aux fichiers CSS et JS"""
    # Ajouter version aux fichiers CSS
    content = re.sub(
        r'(<link[^>]*href=")([^"?]+\.css)("[^>]*>)',
        r'\1\2?v=' + VERSION + r'\3',
        content
    )

    # Ajouter version aux fichiers JS locaux (pas les CDN)
    content = re.sub(
        r'(<script[^>]*src=")(?!https?://)([^"?]+\.js)("[^>]*>)',
        r'\1\2?v=' + VERSION + r'\3',
        content
    )

    return content

def process_html_file(filepath):
    """Traite un fichier HTML"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Ajouter les meta tags anti-cache
        content = add_cache_meta_tags(content)

        # Ajouter les versions aux ressources
        content = add_version_to_resources(content)

        # Sauvegarder si modifié
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True

        return False

    except Exception as e:
        print(f"Erreur lors du traitement de {filepath}: {e}")
        return False

def main():
    """Parcourt tous les fichiers HTML et les traite"""
    modified_files = []

    for root, dirs, files in os.walk('.'):
        # Ignorer les dossiers cachés et node_modules
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules']

        for file in files:
            if file.endswith('.html'):
                filepath = os.path.join(root, file)
                print(f"Traitement de {filepath}...")

                if process_html_file(filepath):
                    modified_files.append(filepath)
                    print(f"  ✓ Modifié")
                else:
                    print(f"  - Aucune modification nécessaire")

    print(f"\n{'='*60}")
    print(f"Traitement terminé!")
    print(f"Version du cache: {VERSION}")
    print(f"Fichiers modifiés: {len(modified_files)}")

    if modified_files:
        print("\nFichiers modifiés:")
        for f in modified_files:
            print(f"  - {f}")

if __name__ == "__main__":
    main()
