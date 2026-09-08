#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Génère le PDF "images à coller" d'un chapitre MathsIORI : reprend toutes les
images <img src="images/...> ET tous les schémas <svg>...</svg> du cours.html,
dans leur ordre d'apparition, et les met sur une page A4 (sans titre), chacun
entouré d'une bordure pointillée (guide de découpe), prêts à être collés dans
le cahier.

Les SVG (schémas vectoriels utilisés à la place d'images statiques, ex :
droite graduée, repère du plan) sont convertis en vecteur PDF via svglib
(pas de perte de qualité à l'impression), pas rasterisés.

S'il reste de la place sur la page à taille normale, le contenu est dupliqué
plusieurs fois sur la MÊME page (séparées par un trait de coupe), pour qu'une
seule photocopie serve à plusieurs élèves. Sinon (contenu déjà volumineux),
une seule copie est mise, réduite si besoin pour tenir sur la page.

Usage :
    python3 build_a_coller_pdf.py "<dossier_du_chapitre>" [nb_copies]

Exemple :
    python3 build_a_coller_pdf.py "MathsIORI/6°/chapitre07 - Les angles"
    python3 build_a_coller_pdf.py "MathsIORI/5°/chapitre03 - Les nombres relatifs" 2

Si [nb_copies] est omis, le nombre de copies qui tiennent sur la page à
taille normale est calculé automatiquement. Passer 1 pour forcer une seule
copie (comportement d'origine).

Le PDF est écrit dans "<dossier_du_chapitre>/a distribuer/Chapitre_<N>_<niveau>_images_a_coller.pdf".

Ajustements possibles au cas par cas (ex : rendre un élément encore plus
petit qu'un autre, changer l'ordre, exclure un élément décoratif) :
éditer IMG_OVERRIDES en bas du fichier, ou repartir de ce script pour un
réglage manuel comme pour le chapitre 1 (6ème).
"""
import os
import re
import sys
import tempfile
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.graphics import renderPDF
from PIL import Image

try:
    from svglib.svglib import svg2rlg
except ImportError:
    svg2rlg = None

PAGE_W, PAGE_H = A4
MARGIN_TOP = 30
MARGIN_BOTTOM = 30
MAX_W = 420      # largeur max d'un élément (pt)
MAX_H = 130      # hauteur max d'un élément (pt) -- borne les éléments "carrés"
PAD = 8          # marge intérieure de la bordure pointillée
GAP = 14         # espace entre deux éléments (au sein d'une même copie)
COPY_GAP = 26    # espace entre deux copies (avec trait de coupe) sur la même page
MIN_SCALE_FOR_MULTI = 0.75  # échelle minimale tolérée pour gagner une copie de plus sur la page

# Regex combinée : capture les <img src="images/...> ET les <svg>...</svg>,
# dans l'ordre où ils apparaissent dans le fichier.
VISUAL_RE = re.compile(
    r'(?P<img><img[^>]+src="(?P<imgsrc>images/[^"]+)"[^>]*/?>)'
    r'|(?P<svg><svg\b[^>]*>.*?</svg>)',
    re.DOTALL,
)


def find_visual_elements(cours_html_path):
    """Renvoie la liste ordonnée des éléments visuels référencés dans cours.html
    (images <img src="images/...> et schémas <svg>...</svg> inline), dans
    l'ordre d'apparition. Les images sont dédoublonnées par chemin (une image
    réutilisée deux fois ne compte qu'une fois) ; les SVG ne sont jamais
    dédoublonnés (chaque schéma est unique même si deux se ressemblent)."""
    with open(cours_html_path, encoding="utf-8") as f:
        html = f.read()

    elements = []
    seen_imgs = set()
    for m in VISUAL_RE.finditer(html):
        if m.group("img"):
            src = m.group("imgsrc")
            if src in seen_imgs:
                continue
            seen_imgs.add(src)
            elements.append({"kind": "img", "src": src})
        elif m.group("svg"):
            elements.append({"kind": "svg", "markup": m.group("svg")})
    return elements


def block_height(ratio, max_w, max_h):
    h = max_w / ratio
    if h > max_h:
        h = max_h
    return h


def build(chapter_dir, out_path=None, img_overrides=None, copies=None):
    """img_overrides: dict optionnel {nom_fichier_ou_index: (max_w, max_h)} pour
    forcer une taille différente sur un élément précis (ex: le rendre plus
    petit). Pour une image : clé = nom de fichier (ex: "5-12.png"). Pour un
    SVG : clé = son index dans l'ordre d'apparition, préfixé "svg" (ex: "svg0").

    copies: nombre de fois où le jeu complet d'éléments est répété sur la même
    page (pour qu'une photocopie serve à plusieurs élèves). None = calculé
    automatiquement selon la place disponible à taille normale."""
    img_overrides = img_overrides or {}
    cours_html = os.path.join(chapter_dir, "cours.html")
    elements = find_visual_elements(cours_html)
    if not elements:
        print("Aucune image ni schéma trouvé dans", cours_html)
        return

    img_dir = os.path.join(chapter_dir, "images")
    tmp_dir = tempfile.mkdtemp(prefix="a_coller_")

    infos = []
    svg_index = 0
    for el in elements:
        if el["kind"] == "img":
            fname = os.path.basename(el["src"])
            path = os.path.join(img_dir, fname)
            if not os.path.isfile(path):
                print("! image manquante, ignorée:", path)
                continue
            with Image.open(path) as im:
                w_px, h_px = im.size
            ratio = w_px / h_px
            mw, mh = img_overrides.get(fname, (MAX_W, MAX_H))
            infos.append({"kind": "img", "path": path, "ratio": ratio, "max_w": mw, "max_h": mh})
        else:
            if svg2rlg is None:
                raise RuntimeError(
                    "svglib n'est pas installé (pip install svglib) — impossible "
                    "de convertir les schémas SVG en PDF."
                )
            key = f"svg{svg_index}"
            tmp_path = os.path.join(tmp_dir, f"_svg_{svg_index}.svg")
            with open(tmp_path, "w", encoding="utf-8") as f:
                f.write(el["markup"])
            svg_index += 1
            drawing = svg2rlg(tmp_path)
            if not drawing.width or not drawing.height:
                print("! SVG sans dimensions exploitables, ignoré (index", key, ")")
                continue
            ratio = drawing.width / drawing.height
            mw, mh = img_overrides.get(key, (MAX_W, MAX_H))
            infos.append({
                "kind": "svg", "svg_path": tmp_path,
                "orig_w": drawing.width, "orig_h": drawing.height,
                "ratio": ratio, "max_w": mw, "max_h": mh,
            })

    if not infos:
        print("Rien à mettre dans le PDF pour", cours_html)
        return

    # calcule la hauteur nécessaire pour UNE copie du jeu complet, à un scale donné
    def one_copy_height(scale=1.0):
        h = 0.0
        for info in infos:
            bh = block_height(info["ratio"], info["max_w"] * scale, info["max_h"] * scale)
            h += bh + 2 * PAD * scale
        h += GAP * scale * (len(infos) - 1)
        return h

    available = PAGE_H - MARGIN_TOP - MARGIN_BOTTOM
    height_1x = one_copy_height(1.0)

    if copies is None:
        if height_1x <= 0:
            copies = 1
        else:
            # cherche le plus grand nombre de copies qui tient sur la page en
            # restant à une échelle raisonnable (on tolère un léger
            # rétrécissement pour gagner une copie supplémentaire, mais pas au
            # point de rendre les schémas trop petits)
            best = 1
            c = 1
            while True:
                needed_c = c * height_1x + (c - 1) * COPY_GAP if c > 1 else height_1x
                scale_c = min(1.0, available / needed_c) if needed_c > 0 else 1.0
                if scale_c >= MIN_SCALE_FOR_MULTI:
                    best = c
                    c += 1
                else:
                    break
                if c > 10:
                    break
            copies = best

    if copies <= 1:
        needed = height_1x
    else:
        needed = copies * height_1x + (copies - 1) * COPY_GAP

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
    pad, gap, copy_gap = PAD * scale, GAP * scale, COPY_GAP * scale

    for copy_idx in range(copies):
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

            if info["kind"] == "img":
                c.drawImage(ImageReader(info["path"]), x, y_img, width=w, height=h,
                            preserveAspectRatio=True, mask="auto")
            else:
                orig_w, orig_h = info["orig_w"], info["orig_h"]
                fit_scale = min(w / orig_w, h / orig_h)
                draw_w, draw_h = orig_w * fit_scale, orig_h * fit_scale
                dx = x + (w - draw_w) / 2
                dy = y_img + (h - draw_h) / 2
                drawing = svg2rlg(info["svg_path"])  # instance neuve à chaque tirage
                drawing.scale(fit_scale, fit_scale)
                renderPDF.draw(drawing, c, dx, dy)

            y = by - gap

        if copy_idx < copies - 1:
            # simple espace entre deux copies (deux élèves sur la même feuille)
            y = y - copy_gap

    c.showPage()
    c.save()
    print("OK ->", out_path)
    print(f"(échelle appliquée : {scale:.2f}, {len(infos)} élément(s), {copies} copie(s) sur la page)")
    return out_path


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    chapter_dir = sys.argv[1]
    copies_arg = int(sys.argv[2]) if len(sys.argv) > 2 else None
    build(chapter_dir, copies=copies_arg)
