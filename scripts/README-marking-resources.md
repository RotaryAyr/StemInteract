# Marking instructions in Question Explorers

Upload official exam marking PDFs to the existing subject and qualification folders using the established `mi_…_YYYY.pdf` filenames. Netlify runs `python3 scripts/build-marking-availability.py` before each deployment, so there is no separate list to maintain. A generated catalogue is also committed for other static hosts; run the same command locally when using those hosts.

The generator matches each explorer's qualification, subject and paper. It preserves actual filename case and excludes assignment guidance, other subjects/levels and English Critical Reading schemes from the RUAE explorer. Invalid PDF files are omitted. Duplicate schemes for the same paper stop the build so the ambiguity can be corrected.

Every selected marking link also checks that its URL returns a PDF before enabling it. Missing, unreadable or failed responses display **Marking instructions unavailable for this paper.** No publication-status assumption is made. A slow response from a previous selection cannot replace the current link. Checks are cached for the page session.

Copied AI prompts continue to give the original question source. They use readable official instructions when possible and otherwise request an explicitly AI-generated solution without claims of official marking points. The site cannot guarantee that an external AI follows these instructions.

Run `node tests/marking-resources.cjs` to check real hint/explanation prompts, catalogue PDF links, selection transitions, 404/HTML/network failures and delayed-response selection changes.
