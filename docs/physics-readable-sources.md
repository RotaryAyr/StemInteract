# Readable Physics papers and source-carrying prompts

The National 5, Higher and Advanced Higher Physics explorers now use the same source-carrying approach as Higher Human Biology, covering all currently indexed years (2022–2026).

| Level | Questions | Exam/marking PDFs | Original page images |
| --- | ---: | ---: | ---: |
| National 5 | 195 | 15 | 479 |
| Higher | 197 | 20 | 498 |
| Advanced Higher | 82 | 10 | 397 |
| Total | 474 | 45 | 1,374 |

Each source PDF has a credited HTML companion with selectable page text, original page images, question anchors and a link to the original PDF. “Read question” opens the companion at the first page for the selected question. Original PDF and readable marking links remain on each card; the full archive is linked above the question grid. Relationship sheets, notes and filters retain their existing behaviour.

Both hint and explanation prompts include extracted question wording, exact source references and direct original-page-image URLs. Explanation prompts also include matching official marking text and general marking principles. Hint prompts omit the marking answers. Remote diagrams remain dependent on the AI service's ability to view images; prompts ask only for a specific missing visual or formula if the included text is insufficient and image access fails.

## Extraction and reproducibility

`scripts/physics-source-index.cjs` reads the existing authored explorer indexes and marking catalogue without running UI code. It normalises the different field conventions: N5's `s` is the paper/section and `p` is the PDF page, Higher's `p` is the paper, and AH's `s` is a course section rather than an exam-paper number. The Python converter uses that index to select the actual exam/marking files; it excludes course specifications, relationship sheets and an unrelated AH PDF present in the N5 folder.

Question starts are detected in the main-number column and checked against all authored first-page indexes. Adjacent number fragments such as the split “1” and “5.” in Higher 2022 Paper 1 are joined only in that column. Continuation pages are retained; blank pages and footer notices are excluded from prompt text. N5's shared marking PDFs have separate anchors and records for Section 1 and Section 2, so their identically numbered questions cannot share answers. The MCQ table is excluded from general marking principles.

Known Adobe Symbol font mappings and conservative CID-font mathematical operators are decoded. Numerically insignificant rotation matrices are treated as horizontal, correcting MathType exports that otherwise extract as vertical strings. Adjacent raised/lowered glyphs are represented as Unicode scripts where available, with their baseline adjusted only in the temporary text view. Original spaces are preserved, including unit separations such as `m s⁻¹`. Genuine rotated labels remain unmodified. These transformations do not reconstruct fractions, vector arrows or graph geometry: original page images and PDFs remain authoritative for mathematical layout.

Run locally with pdfplumber, pypdfium2, Pillow, reportlab and Node:

```
python scripts/build-physics-html.py
```

`NODE_BINARY` may name a bundled Node executable. `--level N5`, `--level Higher` and `--level AH` limit generation. `--no-images` checks/rebuilds text and HTML while retaining images. Generated files are committed; Netlify requires no conversion packages. The manifest records unchanged source hashes and page counts. Changed PDF hashes cause page images to be regenerated.

## Validation

```
node tests/physics-sources.cjs
node tests/marking-resources.cjs
node tests/human-biology-sources.cjs
```

Source tests cover all 474 question/marking pairs, 45 original hashes, 1,374 page images, 948 hint/explanation source payloads and both preview and missing-source behaviour. Regression cases cover N5's two Question 1s, Higher's split Question 15, a horizontal/vertical projectile calculation, AH's velocity polynomial with a squared term and inverse-second units, and a four-page LC/RC circuit question. The shared suite runs the actual new source helpers as well as every explorer's prompt functions, retaining the original missing-MI checks. Browser and visual review sample each level; automated coverage is not a claim that every mathematical expression has been manually proofread.

The original PDFs are unchanged. Human Biology's implementation and all other subject explorers are unaffected.
