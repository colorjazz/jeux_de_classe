"""Génère index.html (page d'installation du favori) à partir de saisie-notes.js et lecture-photo.js.

Usage : python3 build.py
"""
import html
import shutil
import subprocess
import pathlib
import re
import urllib.parse

ICI = pathlib.Path(__file__).parent

source = (ICI / "saisie-notes.js").read_text(encoding="utf-8")
lecture = (ICI / "lecture-photo.js").read_text(encoding="utf-8")
source = source.replace("/*@LECTURE@*/", lecture)  # avant de retirer les commentaires
# Le script n'utilise que des commentaires en bloc, toujours en début de ligne ou après une espace
# (ce qui évite de couper une chaîne comme "image/*").
code = re.sub(r"(?:^|(?<=\s))/\*.*?\*/", "", source, flags=re.S | re.M)
code = " ".join(ligne.strip() for ligne in code.splitlines() if ligne.strip())
if shutil.which("node"):  # vérification de syntaxe, si Node est installé
    subprocess.run(["node", "--check", "-"], input=code.encode(), check=True)
favori = "javascript:" + urllib.parse.quote(code, safe="(){}[];,=+-*/!?:'.<>&|_$")

modele = (ICI / "index.template.html").read_text(encoding="utf-8")
page = modele.replace("{{FAVORI_HREF}}", html.escape(favori, quote=True))
page = page.replace("{{FAVORI_TEXTE}}", html.escape(favori))
page = page.replace("{{LECTURE_JS}}", lecture)
(ICI / "index.html").write_text(page, encoding="utf-8")
print(f"index.html généré ({len(favori)} caractères dans le favori)")
