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

Le PDF est écrit dans "<niveau>°/Cours PDF/Chapitre <N> - <Nom>/A distribuer/Chapitre_<N>_<niveau>_images_a_coller.pdf".

Ajustements possibles au cas par cas (ex : rendre un élément encore plus
petit qu'un autre, changer l'ordre, exclure un élément décoratif) :
éditer IMG_OVERRIDES en bas du fichier, ou repartir de ce script pour un
réglage manuel comme pour le chapitre 1 (6ème).

Taille réelle : un <svg data-taille-reelle="1" ...> (dimensions en cm/mm, ex : demi-droite
d'unité 2 cm) est imprimé exactement à sa taille, jamais agrandi ni réduit.
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
MAX_H = 180      # hauteur max d'un élément (pt) -- borne les éléments "carrés"
SIDE_MARGIN = 28 # marge gauche/droite de la page (pt)
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
            markup = el["markup"]
            if "xmlns=" not in markup.split(">", 1)[0]:
                markup = markup.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"', 1)
            with open(tmp_path, "w", encoding="utf-8") as f:
                f.write(markup)
            svg_index += 1
            drawing = svg2rlg(tmp_path)
            if not drawing.width or not drawing.height:
                print("! SVG sans dimensions exploitables, ignoré (index", key, ")")
                continue
            # recadrage sur le contenu réellement dessiné (le SVG peut contenir
            # beaucoup de blanc autour du schéma, ex : repère 600x600)
            try:
                x0, y0, x1, y1 = drawing.getBounds()
                x0, y0, x1, y1 = x0 - 4, y0 - 4, x1 + 4, y1 + 4
            except Exception:
                x0, y0, x1, y1 = 0, 0, drawing.width, drawing.height
            cw, ch = x1 - x0, y1 - y0
            ratio = cw / ch
            mw, mh = img_overrides.get(key, (MAX_W, MAX_H))
            reel = "data-taille-reelle" in el["markup"].split(">", 1)[0]
            if reel:
                mw, mh = cw, ch
            infos.append({
                "kind": "svg", "svg_path": tmp_path, "fixed": reel,
                "orig_w": cw, "orig_h": ch, "off_x": x0, "off_y": y0,
                "ratio": ratio, "max_w": mw, "max_h": mh,
            })

    if not infos:
        print("Rien à mettre dans le PDF pour", cours_html)
        return

    # taille réelle d'un élément (cadre ajusté à l'élément, sans blanc inutile)
    def elem_size(info, scale):
        if info.get("fixed"):
            return info["max_w"], info["max_h"]
        h = block_height(info["ratio"], info["max_w"] * scale, info["max_h"] * scale)
        return h * info["ratio"], h

    # range les éléments en lignes : côte à côte tant que la largeur de la page le permet
    def layout_rows(scale):
        rows, row, row_w = [], [], 0.0
        usable = PAGE_W - 2 * SIDE_MARGIN
        for info in infos:
            w, h = elem_size(info, scale)
            bw = w + 2 * PAD * scale
            extra = bw if not row else bw + GAP * scale
            if row and row_w + extra > usable:
                rows.append(row); row, row_w = [], 0.0
                extra = bw
            row.append((info, w, h)); row_w += extra
        if row:
            rows.append(row)
        return rows

    # calcule la hauteur nécessaire pour UNE copie du jeu complet, à un scale donné
    def one_copy_height(scale=1.0):
        rows = layout_rows(scale)
        h = sum(max(e[2] for e in r) + 2 * PAD * scale for r in rows)
        h += GAP * scale * (len(rows) - 1)
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
        m = re.match(r"chapitre\s*0*(\d+)\s*-\s*(.+)", chapter_name, re.IGNORECASE)
        num = m.group(1) if m else "X"
        nom = m.group(2).strip() if m else chapter_name
        niveau_path = os.path.dirname(os.path.normpath(chapter_dir))
        niveau = os.path.basename(niveau_path).replace("°", "e")
        out_dir = os.path.join(niveau_path, "Cours PDF", f"Chapitre {num} - {nom}", "A distribuer")
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, f"Chapitre_{num}_{niveau}_images_a_coller.pdf")

    c = canvas.Canvas(out_path, pagesize=A4)
    y = PAGE_H - MARGIN_TOP
    pad, gap, copy_gap = PAD * scale, GAP * scale, COPY_GAP * scale

    for copy_idx in range(copies):
        for row in layout_rows(scale):
            row_h = max(e[2] for e in row)
            row_w = sum(e[1] + 2 * pad for e in row) + gap * (len(row) - 1)
            x_cur = (PAGE_W - row_w) / 2
            for info, w, h in row:
                x = x_cur + pad
                y_img = y - pad - (row_h - h) / 2 - h
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
                    dx = x + (w - draw_w) / 2 - info["off_x"] * fit_scale
                    dy = y_img + (h - draw_h) / 2 - info["off_y"] * fit_scale
                    drawing = svg2rlg(info["svg_path"])  # instance neuve à chaque tirage
                    drawing.scale(fit_scale, fit_scale)
                    renderPDF.draw(drawing, c, dx, dy)
                x_cur += bw + gap
            y = y - row_h - 2 * pad - gap

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
