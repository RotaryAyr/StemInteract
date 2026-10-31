/* Shared source-carrying prompts for the three Biology explorers. */
(function (global) {
  'use strict';
  global.StemBiology = {
    forExplorer(directory, title, unit, origin) {
      const part = item => unit === 'Section' ? item.s : unit === 'Paper' ? item.p : 0;
      const lookup = item => (global.StemBiologySources || {})[[item.y || 2025, part(item), item.q].join(':')];
      const absolute = relative => new URL(relative, origin + '/' + directory + '/').href;
      return {
        lookup,
        questionHtml(item, pdfUrl) {
          const source=lookup(item);return source?source.question.html:pdfUrl;
        },
        markingHtml(item) {
          const source=lookup(item);
          return source && source.marking ? source.marking.html : null;
        },
        sourcePrompt(item, mode, markingGuidance) {
          const source = lookup(item);
          if (!source) return null;
          const question = source.question;
          const page = question.parts[0].page;
          let text = 'BIOLOGY VISUAL CHECK: preserve gene and allele notation, scientific names, labels, units and scales. Diagrams, genetic crosses, graphs, micrographs, spectra and table layout may need the supplied original page images. Check them before interpreting visual evidence; if image access fails, ask only for the specific missing figure or data.\n\n'+(question.requiresVisualMath ? 'MATHEMATICAL LAYOUT CHECK REQUIRED: this question contains stacked fractions or layered notation. Plain text can lose fraction bars, including inside powers. Read the supplied original page image before interpreting these expressions; never treat concatenated exponent digits as a complete power. If image access fails, ask only for the affected formula.\n\n' : '')+'Source: Scottish Qualifications Authority (SQA) / Qualifications Scotland, '+(item.y||2025)+', '+title+(unit?', '+unit+' '+part(item):'')+', Question '+item.q+'.\n'+
            'Original examination question PDF: '+absolute(question.pdf)+'#page='+page+'\n'+
            'Readable question HTML and original page images: '+absolute(question.html)+'\n'+
            question.parts.map(piece=>'PDF page '+piece.page+' image: '+absolute('readable/'+question.pdf.replace(/\.pdf$/i,'')+'/page-'+piece.page+'.png')).join('\n')+'\n\n'+
            'BEGIN EXTRACTED QUESTION TEXT\n'+question.text+'\nEND EXTRACTED QUESTION TEXT\n\n'+
            'The question wording is included above. Use it directly; do not ask me to upload or retype it just because a PDF or link cannot be opened. This is a mechanical extraction, not a paraphrase. Some legacy mathematical symbols and raised/lowered characters have been decoded, but fractions, vector arrows, equations, graph coordinates and table columns may still require the original image. Do not interpret an ambiguous flattened expression as a complete equation. First try the supplied HTML/page-image sources for any missing visual or mathematical layout. If these cannot be viewed, ask only for the specific diagram, formula or value you need; do not guess or claim the entire question is unreadable. Do not infer an answer from its topic description.\n\n';
          if(source.supplement){
            const extra=source.supplement;
            text+='REQUIRED SUPPLEMENTARY SHEET: this question depends on the additional material below. Use it together with the question before giving guidance.\nOriginal supplementary PDF: '+absolute(extra.pdf)+'\nReadable supplementary HTML: '+absolute(extra.html)+'\n'+extra.parts.map(piece=>'Supplement PDF page '+piece.page+' image: '+absolute('readable/'+extra.pdf.replace(/\.pdf$/i,'')+'/page-'+piece.page+'.png')).join('\n')+'\nBEGIN EXTRACTED SUPPLEMENTARY TEXT\n'+extra.text+'\nEND EXTRACTED SUPPLEMENTARY TEXT\nUse the original supplement images for figures and data layout. If a required figure cannot be viewed, ask only for that specific figure; do not proceed without the necessary evidence.\n\n';
          }
          if (mode==='explain' && source.marking) {
            const marking=source.marking;
            text+='Official marking instructions, HTML companion: '+absolute(marking.html)+'\n'+
              marking.parts.map(piece=>'Official marking page '+piece.page+' image: '+absolute('readable/'+marking.pdf.replace(/\.pdf$/i,'')+'/page-'+piece.page+'.png')).join('\n')+'\n'+
              'BEGIN EXTRACTED OFFICIAL MARKING TEXT FOR QUESTION '+item.q+'\n'+marking.text+'\nEND EXTRACTED OFFICIAL MARKING TEXT\n\n';
            if(marking.requiresVisualMath)text+='The marking text also contains stacked mathematical layout. Check its page image before interpreting fractions or powers; do not calculate from a flattened expression.\n\n';
            if (marking.principles) text+='BEGIN GENERAL MARKING PRINCIPLES FROM THE SAME PAPER\n'+marking.principles+'\nEND GENERAL MARKING PRINCIPLES\n\n';
            text+='This is extracted official source text, not an AI-written answer or a manually checked marking summary. Use guidance whose wording and layout are clear. Check the HTML page image or original PDF if equations, table columns, alternatives, underlining or acceptance/rejection notes are ambiguous. Do not invent official marking points. The fallback below applies only to guidance actually missing or unreadable, not merely to a PDF link that cannot be opened.\n\n';
          } else if (source.marking) {
            text+='Official marking instructions, HTML companion: '+absolute(source.marking.html)+'\nThe answer text is intentionally not included in this hint prompt. Do not reveal the answer.\n\n';
          }
          if (mode==='explain') {
            text+='BIOLOGY MARKING-POINT CHECK: before finalising, check every requested subpart against its own readable official marking guidance and allocated marks, including the additional guidance. Give a concise, clearly labelled Exam answer for each subpart, then explain the reasoning where useful. Include each separately required cause-and-effect link; a related fact, general advantage or plausible alternative mechanism does not replace the mechanism asked for. Use the course-specific definition and identify the named structure or site whose change causes the effect. Apply acceptance, rejection and cancellation notes, and do not append conflicting alternatives. If an alternative is scientifically reasonable but not explicitly accepted, distinguish it from the listed exam answer and do not guarantee credit. Where guidance is missing or unreadable, explain the biology without inventing official requirements or claiming full marks.\n\n'+
              'BIOLOGY EVIDENCE AND PRECISION CHECK: support graph conclusions with the correct axes, scale, units, groups and uncertainty intervals. Distinguish an estimate from its confidence limits and avoid claiming a significant difference without the required evidence. Separate an observation from its proposed biological explanation; identify the actual source of variation, the population or organism affected, and the relevant causal link. Distinguish an experimental control from control of confounding variables. For processes and signalling pathways, include required stages, direction of change and amplification where relevant. Ignore answer-space replacement characters and margin noise rather than interpreting them as data. Only claim to have inspected supplied images if you actually viewed them.\n\n'+
              'BIOLOGY GRAPH AND DRAWING CHECK: when a question requests a graph or drawing, produce the requested visual where your tools permit; coordinates or prose alone are not a completed drawing. For graphs use the requested type, labelled axes and units, a consistent scale, all supplied points and the required connecting line; do not add an origin point when no datum is given. Inspect the rendered result for visible tick labels, axis labels, units, clipping and plotted positions before calling it complete. Check any readable official graph requirements, including minimum axis usage. Label your own visual as a reconstruction, not an official figure. If you cannot produce or inspect the visual, state that specific limitation, give construction guidance and do not claim the drawing is complete or visually verified.\n\n'+
              'BIOLOGY MULTIPLE-CHOICE AND OPTIONAL-QUESTION CHECK: for multiple-choice explanations, verify the selected option against the matching official key when readable, then explain why it follows from the question. Reconcile any disagreement before presenting an answer; do not silently change the quoted source or invent a justification. If the published exam expectation appears scientifically oversimplified, distinguish it from the wider scientific explanation. For an optional written question, identify which alternative the learner chose and use only its matching marking points; if explaining both alternatives, label them separately and do not add their marks together.\n\n';
          }
          return text+'SOURCE VERIFICATION STATUS: Before answering, distinguish (1) original question text actually read, (2) original page image actually inspected, (3) official marking guidance actually read, and (4) your own inference. A URL supplied in this prompt is not proof that its contents were viewed. If a diagram, graph, code layout, table, formula, image or partial wireframe affects the answer, first try the linked original page image, readable HTML and PDF using available retrieval methods. A failed retrieval method is not proof that the image is unavailable. Never reconstruct unseen details from the marking scheme, topic, extracted text or general knowledge and call them an original-image reading. If a visual remains inaccessible, name the specific unverified detail, answer only what the readable evidence supports, and ask for only that missing detail if indispensable. Never describe an uninspected original image as verified or claim to have executed code or tested a diagram without doing so.\n\nQUESTION AND MARKING DISCIPLINE: Read restrictive wording such as "in use", "only", dates, boundaries, units and exact subparts before proposing an answer. Use official marking instructions as authoritative only for the specific points actually readable, including acceptance and rejection notes; do not treat an unavailable or ambiguous marking scheme as verified. Where an official sample answer appears logically inconsistent, distinguish the published marking expectation from your own analysis without silently changing the source. Keep the first response strategy-first and give one useful hint before a complete solution unless the learner explicitly asks for the answer. Preserve exact source notation, identifiers and labels; distinguish verified transcription corrections from conjecture.\n\n'+markingGuidance;
        }
      };
    }
  };
})(window);
