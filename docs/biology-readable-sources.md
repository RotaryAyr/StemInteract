# Readable Biology papers and tutor sources

National 5, Higher and Advanced Higher Biology now use the readable-paper and embedded-source approach already used by Higher Human Biology. Coverage is all currently indexed 2022–2026 questions; the existing Human Biology implementation is retained.

| Level | Questions | Exam/marking PDFs | Page images |
| --- | ---: | ---: | ---: |
| National 5 | 206 | 15 | 283 |
| Higher | 200 | 20 | 359 |
| Advanced Higher | 164 | 15 | 345 |
| AH supplementary sheets | — | 5 | 20 |
| Total | 570 | 55 | 1,007 |

Read question opens the credited HTML companion at the selected question's first page. Original PDFs, readable marking links and a readable archive remain available. Existing filters and topic notes are retained. Two authored page indexes were corrected against the original papers: N5 2022 Paper 1 Question 3 and AH 2024 Paper 1 Question 4 both start on PDF page 3.

Hint prompts contain question text and original-page image links but omit marking answers. Explanation prompts also include matching official marking text, general principles and marking-page image links. No AI-written answer or new marking summary is added. Biology prompts require original images for ambiguous diagrams, genetic crosses, micrographs, graph scales and table layout; if those images cannot be viewed, they ask only for the missing figure or data.

## Advanced Higher supplementary material

Paper 2 Question 1 requires the corresponding year's supplementary sheet. All five sheets have HTML companions with selectable text, original images and unchanged PDF links. Both hint and explanation prompts include the supplementary text, HTML reference and every supplementary page-image URL, in addition to the question itself. The per-question supplementary button opens the readable sheet; the existing toolbar PDF link remains available. Guidance requires the supplementary evidence before proceeding and asks only for a specific inaccessible figure, rather than automatically requesting the entire PDF.

## Matching and rebuilding

N5 and AH have combined marking PDFs with repeated MCQ/written question numbers. The converter detects the actual MCQ table in either the left or centre column, supports AH's 20-question table, and keeps its anchors separate from written answers. Written question starts must fall inside the narrow question-number table cells; bare question numbers and continuation rows are supported. General principles exclude MCQ answers. All authored question page indexes are verified.

```sh
python scripts/build-biology-html.py
node tests/biology-sources.cjs
node tests/marking-resources.cjs
node tests/chemistry-sources.cjs
node tests/mathematics-sources.cjs
node tests/physics-sources.cjs
node tests/human-biology-sources.cjs
```

`scripts/biology-source-index.cjs` reads the existing explorer indexes without running UI code. The wrapper uses the shared `scripts/readable_papers.py` engine and `scripts/biology_supplements.py`. Rebuilding needs pdfplumber, pypdfium2, Pillow, reportlab and Node locally. `NODE_BINARY`, `--level N5`, `--level Higher`, `--level AH` and `--no-images` are supported. Generated files are committed; Netlify needs no conversion packages. Separate supplementary manifests retain source hashes and page counts, including image-cache invalidation when a source changes.

Source tests cover all 570 question/marking pairs, 55 unchanged PDF hashes, 1,007 images, 1,140 hint/explanation payloads and all 350 MCQ answer rows. Both prompt modes are checked for each year's required supplementary content. The shared suite exercises 4,922 actual prompts across 17 explorers. Browser samples check all three levels and the required supplementary flow. These checks do not claim that every biological expression, graph or answer has been manually proofread.


## Explanation safeguards following the 2026 AH audit

The shared Biology explanation prompt now requires a subpart-by-subpart check against readable official guidance, a concise exam answer followed by teaching explanation, and each distinct causal marking point. It calls for course definitions, named structures/sites and acceptance/rejection notes; scientifically reasonable unlisted alternatives are not automatically described as wrong or guaranteed credit.

Additional guidance distinguishes estimates from confidence limits, evidence from interpretation and negative controls from control of confounding variables. Process explanations must include required stages and amplification. Multiple-choice explanations reconcile their selected option with the matching official key; optional alternatives remain separate and are not double-counted. These instructions are not added to hint mode, which still omits extracted marking answers. Missing marking guidance cannot be replaced by invented official requirements. No answers, question-specific solutions, original PDFs or extracted official text were changed.

Regression tests exercise explanation/hint separation across all 570 records and missing-marking fallbacks at all three levels. The 2026 AH audit and subsequent guided review cover all 20 MCQs and 12 written questions, including both optional essays. The shared safeguards apply to N5 and Higher as well, but this does not mean their biological answers have now been audited. Prompt construction checks and a marking-guided assistant review are not fresh external student-service trials or guarantees of future answer accuracy.
