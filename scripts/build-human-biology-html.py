"""Build committed HTML companions and prompt text from the supplied official PDFs.

Run locally with pdfplumber, pypdfium2 and Pillow. Not part of the Netlify build.
No OCR, paraphrasing or generated answers are used. Page images preserve layout.
"""
from pathlib import Path
import hashlib
import html
import json
import re
import textwrap

import pdfplumber
import pypdfium2 as pdfium

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'Higher/HB-H'
OUTPUT = SOURCE / 'readable'
OUTPUT.mkdir(exist_ok=True)
EXPLORER = SOURCE / 'Higher-Human-Biology-Question-Explorer.html'
questions = json.loads(re.search(r'const questions=(\[.*?\]);', EXPLORER.read_text())[1])
records = {}
manifest = []
previous_manifest = OUTPUT / 'manifest.json'
previous_hashes = {item['file']: item['sha256'] for item in json.loads(previous_manifest.read_text())} if previous_manifest.exists() else {}


def clean(text):
    return re.sub(r'\n{3,}', '\n\n', textwrap.dedent('\n'.join(line.rstrip() for line in text.splitlines())).strip())


def text_of(page, box=None):
    region = page.crop(box) if box else page
    return clean(region.extract_text(layout=True, x_density=7.25, y_density=13) or '')


def spans(doc, starts, end, marking, paper):
    """Assign complete vertical spans to questions, including continuation pages."""
    result = {}
    for i, (q, first, top) in enumerate(starts):
        stop_page, stop_top = (starts[i+1][1], starts[i+1][2]) if i+1 < len(starts) else end
        parts = []
        for pg in range(first, stop_page+1):
            # The space above a new question at the top of a page is furniture,
            # not a continuation of the preceding question.
            if pg != first and pg == stop_page and stop_top < 120:
                continue
            y0 = top if pg == first else 28
            y1 = stop_top if pg == stop_page else min(785, doc.pages[pg-1].height-35)
            if y1 <= y0:
                continue
            # Paper 1 uses the full text width; Paper 2 reserves its right edge
            # for the "DO NOT WRITE" sidebar. Keep the marks column intact.
            right = 556 if marking or paper == 1 else 530
            box = (40, y0, min(right, doc.pages[pg-1].width-20), y1)
            text = text_of(doc.pages[pg-1], box)
            text = clean('\n'.join(line for line in text.splitlines() if not re.search(r'\[Turn over|\[END OF (QUESTION PAPER|MARKING INSTRUCTIONS)\]', line)))
            if text:
                parts.append({'page': pg, 'box': list(box), 'text': text})
        result[q] = parts
    return result


for source in sorted(SOURCE.glob('*.pdf')):
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    year = int(source.stem[-4:])
    marking = source.name.startswith('mi_')
    paper = 1 if ('Paper1' in source.name or 'Paper-1' in source.name) else 2
    expected = [q for q in questions if q['y'] == year and q['p'] == paper]
    title = f'{year} Higher Human Biology - Paper {paper}' + (' marking instructions' if marking else ' questions')
    stem = source.stem
    folder = OUTPUT / stem
    folder.mkdir(exist_ok=True)
    with pdfplumber.open(source) as doc:
        page_texts = [text_of(p) for p in doc.pages]
        starts = []
        if marking and paper == 1:
            for pg, page in enumerate(doc.pages, 1):
                for w in page.extract_words():
                    match = re.fullmatch(r'(\d{1,2})\.', w['text'])
                    if match and 210 < w['x0'] < 240:
                        q = int(match[1])
                        if q == len(starts)+1:
                            starts.append((q, pg, w['top']-1))
            end = (len(doc.pages), min(785, doc.pages[-1].height-35))
        else:
            for pg, page in enumerate(doc.pages, 1):
                if pg == 1:
                    continue
                for w in page.extract_words():
                    match = re.fullmatch(r'(\d{1,2})\.', w['text'])
                    lower, upper = (40, 60) if marking else (48, 74)
                    if match and lower <= w['x0'] <= upper and w['top'] < 760:
                        q = int(match[1])
                        if q == len(starts)+1:
                            starts.append((q, pg, w['top']-1))
            end = (len(doc.pages), min(785, doc.pages[-1].height-35))
            if not marking:
                for pg, page in enumerate(doc.pages, 1):
                    for line in page.extract_text_lines():
                        if 'END OF QUESTION PAPER' in line['text']:
                            end = (pg, line['top'])
        assert len(starts) == len(expected), (source.name, len(starts), len(expected))
        assert [x[0] for x in starts] == [q['q'] for q in expected]
        if not marking:
            assert [x[1] for x in starts] == [q['pg'] for q in expected], source.name
        extracted = spans(doc, starts, end, marking, paper)
        general = '\n\n'.join(page_texts[1:starts[0][1]-1]) if marking and paper == 2 else ''
        for q, parts in extracted.items():
            key = f'{year}:{paper}:{q}'
            record = records.setdefault(key, {})
            field = 'marking' if marking else 'question'
            record[field] = {
                'html': f'readable/{stem}.html#q-{q}',
                'pdf': source.name,
                'parts': parts,
                'text': '\n\n'.join(f'[PDF page {p["page"]}]\n{p["text"]}' for p in parts),
            }
            if marking:
                record[field]['principles'] = general
            assert all(p['text'] for p in parts), (key, field)
        # Render every page, including covers and acknowledgements, without alteration.
        rendered = pdfium.PdfDocument(str(source))
        for pg in range(len(rendered)):
            image_path = folder / f'page-{pg+1}.png'
            if not image_path.exists() or previous_hashes.get(source.name) != digest:
                bitmap = rendered[pg].render(scale=1.5)
                bitmap.to_pil().save(image_path, optimize=True)
                bitmap.close()
        rendered.close()
        nav = ' '.join(f'<a href="#q-{q[0]}">Question {q[0]}</a>' for q in starts)
        sections = []
        for pg, text in enumerate(page_texts, 1):
            anchors = ''.join(f'<span id="q-{q}" class="question-anchor">Question {q}</span>' for q, start_pg, _ in starts if start_pg == pg)
            sections.append(f'<section id="page-{pg}"><h2>PDF page {pg}</h2>{anchors}<figure><a href="{stem}/page-{pg}.png"><img src="{stem}/page-{pg}.png" loading="lazy" width="893" alt="Original {html.escape(title)}, PDF page {pg}. Open full-size page to inspect diagrams and table layout."></a><figcaption>Original page image: preserves diagrams, tables, symbols and layout.</figcaption></figure><details open><summary>Selectable page text</summary><pre>{html.escape(text)}</pre></details></section>')
        document = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(title)} | StemInteract</title><link rel="stylesheet" href="human-biology.css"></head><body><main><nav><a href="../Higher-Human-Biology-Question-Explorer.html">Human Biology explorer</a> · <a href="index.html">All readable papers</a> · <a href="../{source.name}">Original PDF</a></nav><h1>{html.escape(title)}</h1><p>Source: Scottish Qualifications Authority (SQA) / Qualifications Scotland. This is a StemInteract HTML companion, not an official HTML edition. Extracted text is supplied alongside unaltered page images; use the images or original PDF for table layout, diagrams and symbols.</p><details><summary>Jump to a question</summary><nav class="questions">{nav}</nav></details>{''.join(sections)}</main></body></html>'''
        (OUTPUT / f'{stem}.html').write_text(document)
        manifest.append({'file': source.name, 'sha256': digest, 'pages': len(doc.pages), 'questions': len(starts), 'html': f'{stem}.html'})
    print(source.name, len(page_texts), 'pages', flush=True)

assert len(records) == 199
assert all('question' in record and 'marking' in record for record in records.values())
# No raw HTML is inserted into scripts: escape < so source text cannot close a script.
data = json.dumps(records, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')
(SOURCE / 'human-biology-sources.js').write_text('/* Generated by scripts/build-human-biology-html.py; do not edit. */\nwindow.StemHumanBiologySources=' + data + ';\n')
(OUTPUT / 'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
links = ''.join(f'<li><a href="{item["html"]}">{html.escape(item["file"].removesuffix(".pdf").replace("_", " "))}</a> ({item["pages"]} pages)</li>' for item in manifest)
(OUTPUT / 'index.html').write_text(f'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Readable Higher Human Biology papers | StemInteract</title><link rel="stylesheet" href="human-biology.css"><main><nav><a href="../Higher-Human-Biology-Question-Explorer.html">Human Biology explorer</a></nav><h1>Higher Human Biology papers and marking instructions</h1><p>HTML companions with selectable text and original page images. Source: SQA / Qualifications Scotland, 2022–2026. These are StemInteract conversions; the official PDFs remain available on each page.</p><ul>{links}</ul></main></html>')
print('Built', len(manifest), 'HTML companions and', len(records), 'matched question/marking records.')
