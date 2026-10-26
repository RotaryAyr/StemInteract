# Marking instructions in Question Explorers

All 16 explorers use `assets/js/marking-resources.js` for marking links and AI source guidance. `assets/js/marking-availability.js` records real local PDF filenames, per explorer, year and (where applicable) paper. Missing entries mean unavailable on this site; they do not assert publication status elsewhere.

When adding or removing official marking PDFs:

1. Place the official PDF in its explorer directory using the existing `mi_…_YYYY.pdf` filename convention (case is preserved). For separate-paper schemes use `Paper-1`, `Paper-2`, etc. English RUAE excludes Critical Reading schemes.
2. Run `python3 scripts/build-marking-availability.py` and commit the generated catalogue alongside the PDF change.
3. Run `node tests/marking-resources.cjs`.

New years need no special missing-instructions rule. Missing catalogue entries disable the marking link and provide AI fallback instructions. If an available URL fails or the AI cannot read its relevant section, the copied prompt also directs the AI to fall back to the original question, label its answer as AI-generated and avoid claims of official marks. The site cannot guarantee that an external AI follows these instructions.

Question PDFs, page references, filters and hint/explanation modes remain page-specific. Existing summaries are not automatically certified as checked; publication notices are never supplied as solution guidance.
