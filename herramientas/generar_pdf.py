#!/usr/bin/env python3
"""Genera BITACORA.pdf a partir de BITACORA.md con WordCraft (Craft App Suite, CLI portable).

    py herramientas/generar_pdf.py

Pasos: BITACORA.md -> .docx -> salto de página antes de cada sección principal (1. a 8.) -> .pdf.
WordCraft se busca en D:/ArtCraft/Apps/wordcraft/*/wordcraft-cli.exe o en la variable WORDCRAFT_CLI.
"""
from __future__ import annotations

import glob
import os
import re
import subprocess
import tempfile
import zipfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SALTO = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'


def wordcraft() -> str:
    if os.environ.get("WORDCRAFT_CLI"):
        return os.environ["WORDCRAFT_CLI"]
    candidatos = sorted(glob.glob("D:/ArtCraft/Apps/wordcraft/*/wordcraft-cli.exe"))
    if not candidatos:
        raise SystemExit("No se encontró wordcraft-cli.exe; define WORDCRAFT_CLI")
    return candidatos[-1]


def main() -> None:
    cli = wordcraft()
    texto = (RAIZ / "BITACORA.md").read_text(encoding="utf-8")
    with tempfile.TemporaryDirectory() as tmp:
        md, docx = Path(tmp, "BITACORA.md"), Path(tmp, "BITACORA.docx")
        md.write_text(texto, encoding="utf-8")
        subprocess.run([cli, "convert", str(md), str(docx)], check=True)

        with zipfile.ZipFile(docx) as z:
            partes = {i.filename: z.read(i.filename) for i in z.infolist()}
        xml = partes["word/document.xml"].decode("utf-8")
        patron = re.compile(r'<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t xml:space="preserve">[1-8]\. ')
        xml, n = patron.subn(lambda m: SALTO + m.group(0), xml)
        print(f"saltos de página insertados: {n}")
        partes["word/document.xml"] = xml.encode("utf-8")
        with zipfile.ZipFile(docx, "w", zipfile.ZIP_DEFLATED) as z:
            for nombre, datos in partes.items():
                z.writestr(nombre, datos)

        subprocess.run([cli, "convert", str(docx), str(RAIZ / "BITACORA.pdf")], check=True)


if __name__ == "__main__":
    main()
