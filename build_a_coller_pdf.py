#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Génère le PDF "images à coller" d'un chapitre MathsIORI : reprend toutes les
images <img src="images/...> du cours.html, dans leur ordre d'apparition,
et les met sur UNE SEULE page A4 (sans titre), chacune entourée d'une
bordure pointillée (guide de découpe), prêtes à être collées dans le cahier.

Usage :
    python3 build_a_coller_pdf.py "<dossier_du_chapitre>"

Exemple :
    python3 build_a_coller_pdf.py "MathsIORI/6°/chapitre07 - Les angles"

Le PDF est écrit dans "<dossier_du_chapitre>/a distribuer/Chapitre_<N>_<niveau>_images_a_coller.pdf".
Si le contenu ne tient pas sur une page à la taille par défaut (MAX_W x MAX_H
par image), tout est réduit uniformément pour que ça tienne quand même sur
UNE page.

Ajustements possibles au cas par cas (ex : rendre une image encore plus
petite qu'une autre, changer l'ordre, exclure une image décorative) :
éditer IMG_OVERRIDES en bas du fichier, ou repartir de ce script pour un
réglage manuel comme pour le chapitre 1 (6ème).
"""
import os
import re
import sys
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from PIL import Image

PAGE_W, PAGE_H = A4
MARGIN_TOP = 30
MARGIN_BOTTOM = 30
MAX_W = 420      # largeur max d'une image (pt)
MAX_H = 130      # hauteur max d'une image (pt) -- borne les images "carrées"
PAD = 8          # marge intérieure de la bordure pointillée
GAP = 14         # espace entre deux images


def find_images(cours_html_path):
    """Renvoie la liste ordonnée des chemins d'images référencées dans cours.html
    (uniquement celles dans images/...), sans doublons."""
    with open(cours_html_path, encoding="utf-8") as f:
        html = f.read()
    srcs = re.findall(r'<img[^>]+src="(images/[^"]+)"', html)
    seen, ordered = set(), []
    for s in srcs:
        if s not in seen:
            seen.add(s)
            ordered.append(s)
    return ordered


def block_height(ratio, max_w, max_h):
    h = max_w / ratio
    if h > max_h:
        h = max_h
    return h


def build(chapter_dir, out_path=None, img_overrides=None):
    """img_overrides: dict optionnel {nom_fichier: (max_w, max_h)} pour forcer
    une taille différente sur une image précise (ex: la rendre plus petite)."""
    img_overrides = img_overrides or {}
    cours_html = os.path.join(chapter_dir, "cours.html")
    images = find_images(cours_html)
    if not images:
        print("Aucune image trouvée dans", cours_html)
        return

    img_dir = os.path.join(chapter_dir, "images")
    infos = []
    for rel in images:
        fname = os.path.basename(rel)
        path = os.path.join(img_dir, fname)
        if not os.path.isfile(path):
            print("! image manquante, ignorée:", path)
            continue
        with Image.open(path) as im:
            w_px, h_px = im.size
        ratio = w_px / h_px
        mw, mh = img_overrides.get(fname, (MAX_W, MAX_H))
        infos.append({"path": path, "ratio": ratio, "max_w": mw, "max_h": mh})

    # calcule la hauteur totale nécessaire à taille normale
    def total_height(scale=1.0):
        h = 0.0
        for info in infos:
            bh = block_height(info["ratio"], info["max_w"] * scale, info["max_h"] * scale)
            h += bh + 2 * PAD * scale
        h += GAP * scale * (len(infos) - 1)
        return h

    available = PAGE_H - MARGIN_TOP - MARGIN_BOTTOM
    needed = total_height(1.0)
    scale = min(1.0, available / needed) if needed > 0 else 1.0

    if out_path is None:
        chapter_name = os.path.basename(os.path.normpath(chapter_dir))
        m = re.match(r"chapitre0*(\d+)", chapter_name, re.IGNORECASE)
        num = m.group(1) if m else "X"
        niveau_dir = os.path.basename(os.path.dirname(os.path.normpath(chapter_dir)))
        niveau = niveau_dir.replace("°", "e")
        out_dir = os.path.join(chapter_dir, "a distribuer")
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, f"Chapitre_{num}_{niveau}_images_a_coller.pdf")

    c = canvas.Canvas(out_path, pagesize=A4)
    y = PAGE_H - MARGIN_TOP
    pad, gap = PAD * scale, GAP * scale
    for info in infos:
        w = info["max_w"] * scale
        h = block_height(info["ratio"], info["max_w"] * scale, info["max_h"] * scale)
        x = (PAGE_W - w) / 2
        y_img = y - h
        bx, by, bw, bh = x - pad, y_img - pad, w + 2 * pad, h + 2 * pad
        c.setDash(4, 3)
        c.setLineWidth(0.8)
        c.setStrokeColorRGB(0.55, 0.55, 0.55)
        c.rect(bx, by, bw, bh, stroke=1, fill=0)
        c.setDash()
        c.drawImage(ImageReader(info["path"]), x, y_img, width=w, height=h,
                    preserveAspectRatio=True, mask="auto")
        y = by - gap

    c.showPage()
    c.save()
    print("OK ->", out_path)
    print(f"(échelle appliquée : {scale:.2f}, {len(infos)} image(s))")
    return out_path


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    build(sys.argv[1])
