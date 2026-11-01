# Readable Chemistry papers and tutor sources

National 5, Higher and Advanced Higher Chemistry use the same readable-paper and embedded-source approach as Physics, Mathematics and Human Biology. Coverage is all currently indexed 2022–2026 questions.

| Level | Questions | Exam/marking PDFs | Original page images |
| --- | ---: | ---: | ---: |
| National 5 | 185 | 15 | 343 |
| Higher | 180 | 20 | 392 |
| Advanced Higher | 183 | 15 | 360 |
| Total | 548 | 50 | 1,095 |

Read question opens a credited HTML companion at the selected question's first page. Original PDFs, readable marking links and a complete readable archive remain available. All existing filters and topic-note links are retained. Generated HTML contains selectable text alongside unchanged original page images.

Hint prompts include the extracted question wording and source references without official marking answers. Explanation prompts also include matching official marking text, general principles and direct marking-page images. No AI-written answer or new marking summary is added.

## Chemistry-specific extraction

National 5 and Advanced Higher use combined marking PDFs: the multiple-choice and written sections repeat question numbers. Their anchors and source keys retain the separate paper numbers. The converter locates the full MCQ table before scanning the written marking section, and general principles stop before the MCQ answers. Higher has separate marking PDFs for each paper.

The existing authored first-page indexes are checked for every question. Local small lowered digits immediately beside a base glyph are represented as Unicode subscripts, including baseline-aligned small glyphs used in formulas such as C₂H₂. Known font mappings and the shared raised/lowered-glyph handling are retained. This is mechanical extraction, not chemical inference.

Chemical structures, bond positions, stereochemistry, charges, isotope notation, reaction arrows, apparatus diagrams and spectra can depend on layout. Prompts explicitly require checking the supplied original image where this matters, and request only the specific missing formula or visual if image access fails. They must not infer a molecular structure from flattened text. Original images and PDFs remain authoritative; conversion does not promise fully reconstructed chemistry notation.

## Rebuild and checks

```sh
python scripts/build-chemistry-html.py
node tests/chemistry-sources.cjs
node tests/marking-resources.cjs
node tests/mathematics-sources.cjs
node tests/physics-sources.cjs
node tests/human-biology-sources.cjs
```

The wrapper uses `scripts/chemistry-source-index.cjs` and the shared `scripts/readable_papers.py`. It needs pdfplumber, pypdfium2, Pillow, reportlab and Node locally. `NODE_BINARY` selects a Node executable; `--level N5`, `--level Higher`, `--level AH` and `--no-images` are supported. Generated assets are committed, so Netlify requires no conversion dependencies. Manifests record the unchanged original hashes and page counts.

Source checks cover all 548 question/marking pairs, 50 PDF hashes, 1,095 images, 1,096 prompt payloads and all 375 MCQ answer rows. Regression examples cover MCQ/written isolation, a chemical subscript formula, written-answer context and the image-check guidance. The shared suite exercises 4,922 real prompts across 17 explorers. Browser and visual samples cover each level; these checks are not a claim that every chemical expression or answer has been manually proofread.
