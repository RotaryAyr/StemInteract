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

Following the 2026 Advanced Higher audit, explanation prompts also require checking every separately marked mechanism stage (including transition states), current systematic names, charge placement, equilibrium phase labels and absorbed versus observed colours. These checks follow the supplied scheme rather than embedding answers to particular questions. They explicitly withhold claims of completeness when a required visual is unreadable. Hint prompts omit these explanation-only checks and the extracted marking answers. Prompt tests verify this separation across all indexed Chemistry questions; they do not establish an external tutor's reasoning accuracy.

A fresh Q6 trial described the transition state but displayed a third-party image under an official-mechanism heading. Explanation prompts now also prohibit web-search image substitution or false official attribution, distinguish original source images from illustrative reconstructions, and require truthful image-access claims. The initial trial remains a partial result, not a pass.

The 2026 Higher Chemistry self-audit adds checks for explicit branch-to-atom connectivity in rendered structures, distinct rate and equilibrium marking points, named interactions broken during denaturation, and preference for reagents explicitly accepted by the supplied scheme. Chemically valid unlisted reagents must not be called wrong or guaranteed marks. These are shared explanation safeguards across all three levels; no exam answers or original source records were changed. Targeted regressions exercise the actual Higher Q5–7 source payloads and retain the hint/explanation separation. These checks validate prompt contents, not future tutor compliance or a fresh external-provider trial.

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
