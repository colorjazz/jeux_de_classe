"""Génère index.html (page d'installation du favori) à partir de saisie-notes.js.

Usage : python3 build.py
"""
import html
import pathlib
import re
import urllib.parse

ICI = pathlib.Path(__file__).parent

source = (ICI / "saisie-notes.js").read_text(encoding="utf-8")
code = re.sub(r"/\*.*?\*/", "", source, flags=re.S)  # le script n'utilise que des commentaires en bloc
code = " ".join(ligne.strip() for ligne in code.splitlines() if ligne.strip())
favori = "javascript:" + urllib.parse.quote(code, safe="(){}[];,=+-*/!?:'.<>&|_$")

modele = (ICI / "index.template.html").read_text(encoding="utf-8")
page = modele.replace("{{FAVORI_HREF}}", html.escape(favori, quote=True))
page = page.replace("{{FAVORI_TEXTE}}", html.escape(favori))
(ICI / "index.html").write_text(page, encoding="utf-8")
print(f"index.html généré ({len(favori)} caractères dans le favori)")
