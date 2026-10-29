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

The Physics wrapper uses the shared `scripts/readable_papers.py` engine. Run locally with pdfplumber, pypdfium2, Pillow, reportlab and Node:

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

## Safeguards following the 2026 Advanced Higher audit

The shared Physics prompt now requires reading the original diagram before interpreting directions, graph positions or circuit connections. For motor forces, it requires identifying the N-to-S field and conventional current for each labelled wire, applying Fleming's left-hand rule, and checking each arrow. Hints guide the check without disclosing the force arrows or marking answers. Explanation prompts include direct original marking-page image links, because the extracted marking text cannot convey answer arrows.

Explanation prompts also require complete working for the selected marking method. A centred rectangular coil can use two forces with half-separation lever arms, `2*N*F*(d/2)`, or the permitted `B*I*A*N` method at the appropriate orientation; other orientations require the angle factor. Experimental suggestions distinguish explicitly scheme-accepted improvements from physically justified alternatives, without promising marks for unlisted responses.

### Reviewed Q8 transcription

`scripts/physics-text-corrections.json` repairs the audited Advanced Higher 2026 Q8 question and marking transcription. It restores `p = sqrt(2*m*e*V)` and `lambda = 1.228e-9/sqrt(V)` in the question, and the corresponding square roots and fractions in the official marking transcription, preserving the allocations and surrounding acceptance notes. Only explanations receive the marking solutions. The readable HTML and prompt source data both include the repairs and identify them as verified transcriptions. The original PDFs and images are unchanged.

The Physics build uses the same hash-bound correction mechanism as Mathematics. Each repair records a PDF hash, page, question, exact expected extraction pattern and review date. A changed PDF, absent match or duplicate match stops rebuilding for review. Reviewed fixes are maintained outside generated data and survive regeneration. This does not validate unreviewed formulas in other questions, subjects or years.

### Regression and provider acceptance checks

Run `python3 tests/source-text-corrections.py` and `node tests/physics-sources.cjs`. Automated checks cover all 474 Physics questions / 948 prompts, the three audited regression cases, the corrected HTML and source data, marking-page image references and hint-answer separation. These check prompt construction and source delivery, not an AI provider's reasoning.

For manual trials with each supported provider, record the provider/model, date, complete prompt and response, and outcome. No external AI-provider responses were tested as part of this change.

| 2026 Advanced Higher case | Expected explanation | Reject or investigate |
| --- | --- | --- |
| Q8 | Preserve both square roots. At 150 V, wavelength is approximately 1.00×10⁻¹⁰ m, comparable in scale to the 230 pm lattice spacing. | Using `p=2meV`, a denominator of V rather than sqrt(V), or asking for the complete question despite receiving readable formulas. |
| Q15 | Read current and magnetic-field directions from the original figure. PQ force is upward, RS downward. For the torque show two forces and half-width lever arms, or a complete permitted BIAN calculation; result about 4.4×10⁻⁴ N m. | Reversed arrows, guessed perspective, or a claim that all explicitly required working is shown when it is not. |
| Q14(a)(iii) | Identify additional fall-time measurements as the explicit accepted improvement and explain the random-uncertainty benefit. Label other defensible ideas as alternatives whose acceptance may need examiner judgement. | Guaranteeing a mark for any physically plausible suggestion without checking the scheme. |

For each case, also try Hint: it should ask for the student's attempt and guide only the next useful step. It must not disclose the final force directions or inject marking-answer text. Expected answers in this table are developer acceptance criteria, not additions to student hint prompts. Prompt checks reduce risk but cannot guarantee correct future AI responses.
