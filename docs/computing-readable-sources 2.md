# Readable Computing Science papers and tutor sources

National 5, Higher and Advanced Higher Computing Science now use readable HTML companions and embedded question/marking source text for every currently indexed 2022–2026 question.

| Level | Questions | Exam/marking PDFs | Page images |
| --- | ---: | ---: | ---: |
| National 5 | 101 | 10 | 235 |
| Higher | 90 | 10 | 270 |
| Advanced Higher | 50 | 10 | 200 |
| Total | 241 | 30 | 705 |

Read question opens the relevant HTML anchor. Companions contain selectable text, original page images, source credits and the unchanged PDF link. Each explorer retains its topic notes, filters, original PDF links and missing-marking behaviour, with readable marking links and a full readable archive added.

Hint prompts include question text and direct original-page image URLs but omit official marking answers. Explanations also include the matching official marking text, general principles and marking-page image URLs. No AI-written answer or new marking summary is added.

## Code and layout

Computing Science uses literal text extraction: the shared engine's automatic raised/lowered-glyph rewriting is disabled for these papers, so code identifiers are not reformatted as mathematical scripts. Relative horizontal spacing and line breaks are retained mechanically. HTML source is escaped in companions, source-data script delimiters are escaped and prompt text is assigned through textarea values, so source tags remain text rather than active markup. The prompt crop excludes the writing margin while original page images remain complete.

Extraction is not a guarantee of executable code or exact indentation. Prompts explicitly require checking original images for ambiguous code, quotes, comparison/assignment symbols, SQL, HTML, trace tables, database layouts and diagrams. They require SQA reference-language conventions and the language specified by the question, and ask only for the affected line/figure if images cannot be viewed. They must not silently repair or invent source code.

## Rebuild and validation

```sh
python scripts/build-computing-html.py
node tests/computing-sources.cjs
node tests/marking-resources.cjs
node tests/biology-sources.cjs
node tests/chemistry-sources.cjs
node tests/mathematics-sources.cjs
node tests/physics-sources.cjs
node tests/human-biology-sources.cjs
```

The wrapper uses `scripts/computing-source-index.cjs` and the shared `scripts/readable_papers.py` engine. It needs pdfplumber, pypdfium2, Pillow, reportlab and Node locally. `NODE_BINARY`, `--level N5`, `--level Higher`, `--level AH` and `--no-images` are supported. Generated assets are committed; Netlify needs no conversion packages. Hash manifests retain the unchanged source hashes and invalidate cached images when a source changes.

Question starts are checked against every authored page index. Marking anchors use narrow question-number table cells, accepting bare numbers while excluding numbered notes and code elsewhere in the answer. Source tests cover 241 question/marking pairs, 30 unchanged hashes, 705 page images and 482 hint/explanation payloads. Examples check SQL comparison operators, HTML-as-text, retained indentation, script escaping and the image-check guidance. The shared suite exercises 4,922 actual prompts across 17 explorers. Browser samples cover all three levels; these checks do not claim that every program, data table or answer has been manually proofread.
