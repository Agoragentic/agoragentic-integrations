#!/usr/bin/env python3
"""Generate and independently verify public-safe semantic fixtures."""

from __future__ import annotations

import csv
from datetime import datetime
import hashlib
from importlib.metadata import version
from io import BytesIO
import json
from pathlib import Path
import shutil
import xml.etree.ElementTree as ET
from zipfile import ZipFile

from docx import Document
from docx.shared import Inches as DocxInches
from openpyxl import Workbook, load_workbook
from PIL import Image, ImageDraw
from pptx import Presentation
from pptx.util import Inches
from reportlab.lib.pdfencrypt import StandardEncryption
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
import xlsxwriter

ROOT = Path(__file__).resolve().parent
GENERATED = ROOT / "generated"
MANIFEST = GENERATED / "fixture-manifest.json"
REQUIREMENTS_LOCK = ROOT / "requirements.txt"
TEXT_PDF_LINES = ("Synthetic text PDF control", "Text evidence marker 1269")
ENCRYPTED_PDF_TEXT = "Synthetic encrypted document"
DOCX_HEADER_TEXT = "Synthetic section header"
DOCX_FOOTER_TEXT = "Synthetic section footer"
DOCX_COMMENT_ANCHOR = "Synthetic comment anchor"
DOCX_COMMENT_TEXT = "Synthetic review annotation"
PPTX_SPEAKER_NOTE = "Synthetic speaker notes"
XLSX_FORMAT_ROWS = (
    ("Calendar value", datetime(2025, 1, 15), "yyyy-mm-dd"),
    ("Currency value", 82.75, '"USD "#,##0.00'),
    ("Accounting value", -64.2, '_("$"* #,##0.00_);_("$"* (#,##0.00);_("$"* "-"??_);_(@_)'),
    ("Scientific value", 0.00000275, "0.00E+00"),
)
DOCX_IMAGE_SIZE = (12, 12)
GENERATOR_DISTRIBUTIONS = (
    "charset-normalizer",
    "et-xmlfile",
    "lxml",
    "openpyxl",
    "Pillow",
    "python-docx",
    "python-pptx",
    "reportlab",
    "typing-extensions",
    "xlsxwriter",
)


def sha256_file(path: Path) -> str:
    return f"sha256:{hashlib.sha256(path.read_bytes()).hexdigest()}"


def write_csv() -> None:
    path = GENERATED / "baseline.csv"
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["name", "value"])
        writer.writerow(["alpha", 1])
        writer.writerow(["beta", 2])


def write_long_csv() -> None:
    path = GENERATED / "long-content.csv"
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["payload"])
        writer.writerow([f"{'A' * 2_400}FINAL_MARKER"])


def write_xlsx() -> None:
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Data Sheet"

    sheet["A1"] = "Visible row"
    sheet["A2"] = "Hidden row"
    sheet.row_dimensions[2].hidden = True

    sheet["B1"] = "Hidden column"
    sheet.column_dimensions["B"].hidden = True

    sheet["C1"] = "Displayed percent"
    sheet["C2"] = 0.075
    sheet["C2"].number_format = "0.0%"

    sheet["D1"] = "Formula"
    sheet["D2"] = "=C2"

    sheet.merge_cells("F1:O3")
    sheet["F1"] = "Merged heading"

    xlsx_path = GENERATED / "semantic-risks.xlsx"
    workbook.save(xlsx_path)
    shutil.copyfile(xlsx_path, GENERATED / "semantic-risks.xlsm")


def write_xlsx_formats() -> None:
    with xlsxwriter.Workbook(GENERATED / "formats.xlsx") as workbook:
        workbook.set_properties({"created": datetime(2025, 1, 15)})
        sheet = workbook.add_worksheet("Format Controls")
        for row, (label, value, number_format) in enumerate(XLSX_FORMAT_ROWS):
            sheet.write(row, 0, label)
            sheet.write(row, 1, value, workbook.add_format({"num_format": number_format}))
        sheet.write(4, 0, "Cached result")
        # The intentionally stale cache distinguishes reading from recalculation.
        sheet.write_formula(4, 1, "=6*7", None, 43)
        workbook.add_worksheet("Second Tab").write(0, 0, "Second sheet marker 1269")


def write_docx() -> None:
    document = Document()
    document.add_heading("Nested table evidence", level=1)
    section = document.sections[0]
    section.header.paragraphs[0].text = DOCX_HEADER_TEXT
    section.footer.paragraphs[0].text = DOCX_FOOTER_TEXT
    outer = document.add_table(rows=1, cols=1)
    cell = outer.cell(0, 0)
    cell.paragraphs[0].add_run("Section A")
    inner = cell.add_table(rows=3, cols=2)
    inner.cell(0, 0).text = "Metric"
    inner.cell(0, 1).text = "Value"
    inner.cell(1, 0).text = "Height"
    inner.cell(1, 1).text = "120"
    inner.cell(2, 0).text = "Weight"
    inner.cell(2, 1).text = "34"
    document.save(GENERATED / "nested-table.docx")


def write_docx_embedded_image() -> None:
    png = BytesIO()
    Image.new("RGB", DOCX_IMAGE_SIZE, "navy").save(png, format="PNG")
    png.seek(0)
    document = Document()
    document.add_paragraph("Text beside a synthetic image")
    document.add_picture(png, width=DocxInches(1))
    document.save(GENERATED / "embedded-image.docx")


def write_docx_comment() -> None:
    document = Document()
    run = document.add_paragraph().add_run(DOCX_COMMENT_ANCHOR)
    comment = document.add_comment(run, text=DOCX_COMMENT_TEXT, author="Synthetic", initials="SY")
    assert comment.comment_id == 0 and comment.text == DOCX_COMMENT_TEXT
    path = GENERATED / "commented-document.docx"
    document.save(path)


def add_textbox(slide, text: str) -> None:
    box = slide.shapes.add_textbox(Inches(1), Inches(1), Inches(8), Inches(2))
    box.text_frame.text = text


def write_pptx() -> None:
    presentation = Presentation()
    first = presentation.slides.add_slide(presentation.slide_layouts[5])
    first.shapes.title.text = "Titled slide"

    second = presentation.slides.add_slide(presentation.slide_layouts[6])
    add_textbox(second, "Second slide, no title placeholder.")
    second.notes_slide.notes_text_frame.text = PPTX_SPEAKER_NOTE

    third = presentation.slides.add_slide(presentation.slide_layouts[6])
    add_textbox(third, "Third slide, also untitled.")

    presentation.save(GENERATED / "untitled-slides.pptx")


def write_text_pdf() -> None:
    path = GENERATED / "text.pdf"
    pdf = canvas.Canvas(str(path), pagesize=(360, 180), pageCompression=0, invariant=1)
    for y, line in zip((132, 110), TEXT_PDF_LINES, strict=True):
        pdf.drawString(36, y, line)
    pdf.showPage()
    pdf.save()


def write_image_only_pdf() -> None:
    image = Image.new("RGB", (300, 120), "white")
    draw = ImageDraw.Draw(image)
    draw.rectangle((20, 20, 280, 100), outline="black", width=3)
    draw.text((40, 50), "pixels only", fill="black")

    png = BytesIO()
    image.save(png, format="PNG")
    png.seek(0)

    path = GENERATED / "image-only.pdf"
    pdf = canvas.Canvas(str(path), pagesize=(360, 180))
    pdf.drawImage(ImageReader(png), 30, 30, width=300, height=120)
    pdf.showPage()
    pdf.save()


def write_encrypted_pdf() -> None:
    path = GENERATED / "encrypted.pdf"
    encryption = StandardEncryption("public-test-fixture-only")
    pdf = canvas.Canvas(
        str(path), pagesize=(360, 180), invariant=1, pageCompression=0, encrypt=encryption,
    )
    pdf.drawString(36, 132, ENCRYPTED_PDF_TEXT)
    pdf.showPage()
    pdf.save()


def write_malformed_pdf() -> None:
    path = GENERATED / "malformed.pdf"
    path.write_bytes(b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")


def verify_sources() -> dict[str, list[str]]:
    with (GENERATED / "baseline.csv").open(encoding="utf-8", newline="") as handle:
        assert list(csv.reader(handle)) == [["name", "value"], ["alpha", "1"], ["beta", "2"]]

    with (GENERATED / "long-content.csv").open(encoding="utf-8", newline="") as handle:
        rows = list(csv.reader(handle))
    assert rows[0] == ["payload"]
    assert len(rows[1][0]) == 2_412 and rows[1][0].endswith("FINAL_MARKER")

    workbook = load_workbook(GENERATED / "semantic-risks.xlsx", data_only=False)
    sheet = workbook["Data Sheet"]
    assert sheet.row_dimensions[2].hidden is True
    assert sheet.column_dimensions["B"].hidden is True
    assert sheet["C2"].value == 0.075 and sheet["C2"].number_format == "0.0%"
    assert sheet["D2"].value == "=C2"
    assert "F1:O3" in {str(item) for item in sheet.merged_cells.ranges}
    assert (GENERATED / "semantic-risks.xlsx").read_bytes() == (GENERATED / "semantic-risks.xlsm").read_bytes()

    formats_path = GENERATED / "formats.xlsx"
    formats = load_workbook(formats_path, data_only=False)
    assert formats.sheetnames == ["Format Controls", "Second Tab"]
    assert formats["Second Tab"]["A1"].value == "Second sheet marker 1269"
    formatted_sheet = formats["Format Controls"]
    for row, (label, value, number_format) in enumerate(XLSX_FORMAT_ROWS, start=1):
        assert formatted_sheet.cell(row, 1).value == label
        assert formatted_sheet.cell(row, 2).value == value
        assert formatted_sheet.cell(row, 2).number_format == number_format
    assert formatted_sheet["B5"].value == "=6*7"
    cached_formats = load_workbook(formats_path, data_only=True)
    assert cached_formats["Format Controls"]["B5"].value == 43

    image_path = GENERATED / "embedded-image.docx"
    image_document = Document(image_path)
    assert len(image_document.inline_shapes) == 1
    assert image_document.paragraphs[0].text == "Text beside a synthetic image"
    with ZipFile(image_path) as archive:
        media = [name for name in archive.namelist() if name.startswith("word/media/")]
        assert len(media) == 1
        with Image.open(BytesIO(archive.read(media[0]))) as image:
            assert image.format == "PNG" and image.size == DOCX_IMAGE_SIZE
            image.verify()

    comment_path = GENERATED / "commented-document.docx"
    comment_document = Document(comment_path)
    assert comment_document.paragraphs[0].text == DOCX_COMMENT_ANCHOR
    comment = comment_document.comments.get(0)
    assert comment is not None and comment.text == DOCX_COMMENT_TEXT
    with ZipFile(comment_path) as archive:
        document_root = ET.fromstring(archive.read("word/document.xml"))
        assert "word/comments.xml" in archive.namelist()
    word_ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    paragraph = document_root.find(f".//{{{word_ns}}}p")
    assert paragraph is not None
    children = list(paragraph)
    start_tag = f"{{{word_ns}}}commentRangeStart"
    end_tag = f"{{{word_ns}}}commentRangeEnd"
    run_tag = f"{{{word_ns}}}r"
    text_tag = f"{{{word_ns}}}t"
    reference_tag = f"{{{word_ns}}}commentReference"
    starts = [
        index for index, child in enumerate(children)
        if child.tag == start_tag and child.get(f"{{{word_ns}}}id") == "0"
    ]
    ends = [
        index for index, child in enumerate(children)
        if child.tag == end_tag and child.get(f"{{{word_ns}}}id") == "0"
    ]
    anchor_runs = [
        index for index, child in enumerate(children)
        if child.tag == run_tag
        and any(node.tag == text_tag and node.text == DOCX_COMMENT_ANCHOR for node in child.iter())
    ]
    references = [
        index for index, child in enumerate(children)
        if child.tag == run_tag
        and any(
            node.tag == reference_tag and node.get(f"{{{word_ns}}}id") == "0"
            for node in child.iter()
        )
    ]
    assert len(starts) == len(ends) == len(anchor_runs) == len(references) == 1
    assert starts[0] < anchor_runs[0] < ends[0] < references[0]

    document = Document(GENERATED / "nested-table.docx")
    section = document.sections[0]
    assert section.header.paragraphs[0].text == DOCX_HEADER_TEXT
    assert section.footer.paragraphs[0].text == DOCX_FOOTER_TEXT
    nested = document.tables[0].cell(0, 0).tables[0]
    assert [[cell.text for cell in row.cells] for row in nested.rows] == [
        ["Metric", "Value"],
        ["Height", "120"],
        ["Weight", "34"],
    ]

    presentation = Presentation(GENERATED / "untitled-slides.pptx")
    assert len(presentation.slides) == 3
    assert presentation.slides[0].shapes.title.text == "Titled slide"
    assert presentation.slides[1].shapes.title is None
    assert presentation.slides[2].shapes.title is None
    slide_text = [
        " ".join(shape.text for shape in slide.shapes if hasattr(shape, "text_frame"))
        for slide in presentation.slides
    ]
    assert "Second slide, no title placeholder." in slide_text[1]
    assert "Third slide, also untitled." in slide_text[2]
    assert presentation.slides[1].notes_slide.notes_text_frame.text == PPTX_SPEAKER_NOTE
    assert all(PPTX_SPEAKER_NOTE not in text for text in slide_text)

    text_pdf = (GENERATED / "text.pdf").read_bytes()
    assert text_pdf.startswith(b"%PDF-") and b"/Subtype /Image" not in text_pdf
    for line in TEXT_PDF_LINES:
        assert f"({line}) Tj".encode("ascii") in text_pdf

    pdf_bytes = (GENERATED / "image-only.pdf").read_bytes()
    assert pdf_bytes.startswith(b"%PDF-") and b"/Subtype /Image" in pdf_bytes

    encrypted_pdf = (GENERATED / "encrypted.pdf").read_bytes()
    assert encrypted_pdf.startswith(b"%PDF-") and encrypted_pdf.rstrip().endswith(b"%%EOF")
    assert b"/Encrypt " in encrypted_pdf and b"/Filter /Standard" in encrypted_pdf
    assert ENCRYPTED_PDF_TEXT.encode("ascii") not in encrypted_pdf

    malformed_pdf = (GENERATED / "malformed.pdf").read_bytes()
    assert malformed_pdf.startswith(b"%PDF-") and b"/Pages 2 0 R" in malformed_pdf
    assert b"2 0 obj" not in malformed_pdf
    assert b"startxref" not in malformed_pdf and b"%%EOF" not in malformed_pdf

    return {
        "baseline.csv": ["exact_csv_rows_verified"],
        "long-content.csv": ["long_cell_length_and_terminal_marker_verified"],
        "semantic-risks.xlsx": [
            "hidden_row_verified",
            "hidden_column_verified",
            "display_format_verified",
            "formula_verified",
            "merged_range_verified",
        ],
        "semantic-risks.xlsm": ["byte_identical_alias_fixture_verified"],
        "formats.xlsx": [
            "dates_currency_accounting_and_scientific_formats_verified",
            "formula_and_distinct_cached_value_verified",
            "worksheet_names_order_and_cell_coordinates_verified",
        ],
        "embedded-image.docx": ["single_inline_png_and_image_dimensions_verified"],
        "commented-document.docx": [
            "docx_comment_part_and_anchor_range_verified",
            "comment_text_kept_out_of_public_fixture_facts",
        ],
        "nested-table.docx": ["nested_table_cells_verified", "section_header_and_footer_text_verified"],
        "untitled-slides.pptx": [
            "untitled_slide_structure_and_text_verified",
            "speaker_note_text_verified_outside_slide_shapes",
        ],
        "text.pdf": ["pdf_contains_both_text_showing_operators", "pdf_contains_no_image_objects"],
        "image-only.pdf": ["pdf_contains_embedded_image_object"],
        "encrypted.pdf": ["pdf_standard_encryption_dictionary_present", "pdf_marker_absent_in_plaintext"],
        "malformed.pdf": ["pdf_page_tree_reference_has_no_target", "pdf_cross_reference_and_eof_missing"],
    }


def write_manifest(facts: dict[str, list[str]]) -> None:
    fixtures = {}
    for filename, verified_facts in sorted(facts.items()):
        path = GENERATED / filename
        fixtures[filename] = {
            "size_bytes": path.stat().st_size,
            "source_hash": sha256_file(path),
            "verified_source_facts": verified_facts,
        }
    manifest = {
        "schema": "agoragentic.anydoc-conformance-fixtures.v1",
        "generator_dependencies": {
            distribution: version(distribution)
            for distribution in GENERATOR_DISTRIBUTIONS
        },
        "requirements_lock": {
            "path": "requirements.txt",
            "source_hash": sha256_file(REQUIREMENTS_LOCK),
            "hashes_required": True,
        },
        "fixtures": fixtures,
    }
    MANIFEST.write_text(f"{json.dumps(manifest, indent=2)}\n", encoding="utf-8")


def main() -> None:
    if GENERATED.exists():
        shutil.rmtree(GENERATED)
    GENERATED.mkdir(parents=True)
    write_csv()
    write_long_csv()
    write_xlsx()
    write_xlsx_formats()
    write_docx()
    write_docx_embedded_image()
    write_docx_comment()
    write_pptx()
    write_text_pdf()
    write_image_only_pdf()
    write_encrypted_pdf()
    write_malformed_pdf()
    facts = verify_sources()
    write_manifest(facts)
    for path in sorted(GENERATED.iterdir()):
        print(f"generated {path.name} ({path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
