# Higher Human Biology Question Explorer

Adds Human Biology as a separate Higher option on the Biology Question Explorers page, using the site's existing card, filter, copy-prompt and AI-service interfaces.

## Index and sources

The 20 PDFs in Higher/HB-H contain the question papers and marking instructions for Papers 1 and 2 from 2022 to 2026. The authored index in Higher-Human-Biology-Question-Explorer.html contains 199 main questions: 25 multiple-choice questions each year, 15 Paper 2 questions in 2022–2025 and 14 in 2026. Paper 2 totals are 95 marks each year; the final A/B alternatives are one question and count once. Links use PDF page numbers, not inferred question positions. Numbered lists inside questions were excluded when identifying question starts.

Summaries and topic tags were reviewed against the supplied papers. Multi-topic questions appear under each relevant topic; questions testing general data handling also use the course-wide skills filter. The index does not claim to provide checked answer summaries. Original diagrams, expressions and full question wording are supplied through the linked PDFs.

The three course areas and their eight topics each follow the Higher Human Biology course structure. The official course page confirms unchanged teaching content and a new one-paper assessment from session 2026–27. The page labels the 2022–2026 filters as past-paper formats and links to current guidance:
https://www.sqa.org.uk/sqa/47915.html

## Notes

The main topic-notes button links directly to the matching BBC Bitesize revision guide for each of the 24 Human Biology content topics. All 24 guide titles and URLs were checked against the BBC Higher Human Biology subject page:
https://www.bbc.co.uk/bitesize/subjects/zhstqp3

The Memory guide was opened and its Higher Human Biology revision content verified in a normal browser without signing in. BBC may show an optional sign-in invitation; it can be dismissed. General data-analysis skills retain the EA Biology problem-solving resources because the subject index offers a quiz rather than a matching revision-notes guide for this skill.

Complete unit summaries from EA Biology and three longer PDF workbooks linked by Ask Dr Murray remain under “Extra revision notes and workbooks”:
https://sites.google.com/my.glow.scot/eabiology/higher-human
https://blogs.glowscotland.org.uk/fi/askdrmurraydotcom/biology/higher-human-biology/

Workbooks are explicitly labelled as containing activities and classroom blanks. External notes are linked, not copied into this repository. Older assessment references in school notes are distinguished from the current official assessment guidance.

## Marking instructions and previews

The shared availability generator now recognises the separate Human Biology marking papers and preserves their actual filenames, including the 2023 Paper 1 capitalisation. The ten schemes use the existing checked-link and missing-file behaviour. Optional source origin in the shared prompt helper allows the new page's preview prompts to point to preview PDFs before production deployment; other explorers retain their existing production origin.

## Validation

- node tests/human-biology.cjs
- node tests/marking-resources.cjs
- python3 scripts/build-marking-availability.py

Browser checks cover filtering to 2026 Memory / Paper 2, the matching question and marking link, the correct unit summary, and the explanation prompt's exact PDF page and question context. Rendered source-page samples were checked for a graph-based multiple-choice question and written questions. The live site changes only after merge and deployment.
