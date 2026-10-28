# Readable Mathematics papers and tutor sources

All currently indexed National 5, Higher and Advanced Higher Mathematics questions (2022–2026) use readable HTML companions and source text in tutor prompts.

| Level | Questions | Exam/marking PDFs | Page images |
| --- | ---: | ---: | ---: |
| National 5 | 145 | 20 | 381 |
| Higher | 132 | 20 | 339 |
| Advanced Higher | 116 | 20 | 281 |
| Total | 393 | 60 | 1,001 |

Read question opens the relevant HTML question anchor. Each companion contains selectable text, original page images, source credits and the unchanged original PDF link. Existing topic notes, filters and relationship sheets remain available. Higher's 2022–2024 individual question PDF links are preserved; their readable companions use the full official paper.

Hint prompts include question text and image references but no marking answers. Explanation prompts also contain the matching official marking text, general principles and direct marking-page image links. No generated answer is added to the source material.

## Mathematical layout

Text extraction cannot reliably represent stacked fractions, matrices, vector notation or graph geometry. Conservative fraction detection flags potentially ambiguous layout, and the tutor prompt explicitly requires checking original images before interpreting such formulas. If image access fails, it asks for only the affected formula or diagram. This does not guarantee every expression is recovered as typed mathematics; original page images and PDFs remain authoritative.

Question boundaries include tall overlapping fraction/integral glyphs so these do not leak into the preceding question. Marking starts must lie in the narrow question-number table cell; numbered Notes and Commonly Observed Responses remain within their own answer. Bare numbers and merged Question subcolumns are supported. Existing authored page indexes are checked where present; Higher's legacy records are located in the full paper.

## Rebuild and validate

The shared engine is `scripts/readable_papers.py`, also used by the Physics wrapper. `scripts/mathematics-source-index.cjs` reads the existing explorer metadata and marking catalogue without executing the UI. It selects the existing exam and marking PDFs. Generated companions, source data and page images are committed; Netlify needs no PDF conversion packages.

```sh
python scripts/build-mathematics-html.py
node tests/mathematics-sources.cjs
node tests/marking-resources.cjs
node tests/physics-sources.cjs
node tests/human-biology-sources.cjs
```

Conversion needs pdfplumber, pypdfium2, Pillow, reportlab and Node. `NODE_BINARY` can select a bundled Node executable. `--level N5`, `--level Higher` and `--level AH` limit generation; `--no-images` retains images while rebuilding HTML/text. Hash manifests cause images to be regenerated if an original changes.

Tests verify 393 question/marking pairs, 60 unchanged source hashes, 1,001 page images and 786 hint/explanation payloads. Regression examples check numbered marking notes, legacy Higher question links, tall-expression boundaries and fractional-layout warnings. Browser samples cover each level. Automated coverage is not a claim that all mathematical expressions or answers have been manually proofread.
