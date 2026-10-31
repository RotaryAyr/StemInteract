/* Shared source-carrying prompts for the three Mathematics explorers. */
(function (global) {
  'use strict';
  global.StemMathematics = {
    forExplorer(directory, title, unit, origin) {
      const part = item => unit === 'Section' ? item.s : unit === 'Paper' ? item.p : 0;
      const lookup = item => (global.StemMathematicsSources || {})[[item.y || 2025, part(item), item.q].join(':')];
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
          let text = (question.requiresVisualMath ? 'MATHEMATICAL LAYOUT CHECK REQUIRED: this question contains stacked fractions or layered notation. Plain text can lose fraction bars, including inside powers. Read the supplied original page image before interpreting these expressions; never treat concatenated exponent digits as a complete power. If image access fails, ask only for the affected formula.\n\n' : '')+'Source: Scottish Qualifications Authority (SQA) / Qualifications Scotland, '+(item.y||2025)+', '+title+(unit?', '+unit+' '+part(item):'')+', Question '+item.q+'.\n'+
            'Original examination question PDF: '+absolute(question.pdf)+'#page='+page+'\n'+
            'Readable question HTML and original page images: '+absolute(question.html)+'\n'+
            question.parts.map(piece=>'PDF page '+piece.page+' image: '+absolute('readable/'+question.pdf.replace(/\.pdf$/i,'')+'/page-'+piece.page+'.png')).join('\n')+'\n\n'+
            (question.verifiedTextCorrections ? 'StemInteract has checked mathematical transcription corrections in this question against the original page image. sqrt(...) means square root; ^ denotes a power. These are notation repairs, not added answers.\n\n' : '')+
            'BEGIN EXTRACTED QUESTION TEXT\n'+question.text+'\nEND EXTRACTED QUESTION TEXT\n\n'+
            'The question wording is included above. Use it directly; do not ask me to upload or retype it just because a PDF or link cannot be opened. This is source transcription, not a paraphrase. Any verified notation repairs are identified above; the remaining text is mechanically extracted. Some legacy mathematical symbols and raised/lowered characters have been decoded, but fractions, vector arrows, equations, graph coordinates and table columns may still require the original image. Do not interpret an ambiguous flattened expression as a complete equation. First try the supplied HTML/page-image sources for any missing visual or mathematical layout. If these cannot be viewed, ask only for the specific diagram, formula or value you need; do not guess or claim the entire question is unreadable. Do not infer an answer from its topic description.\n\n';
          text+='DIAGRAM AND BOUNDARY CHECK: whenever a diagram determines the answer, inspect the original page image even if no mathematical-layout warning appears. For a shaded area, identify every bounding curve or line and the complete interval before integrating. Check for shaded portions on both sides of each axis and for separate regions; split the integral where needed and use positive areas. State the boundaries used. If the shading or a boundary cannot be verified, ask for that specific visual detail rather than assuming an axis is a boundary. In hint mode, guide the student to check these boundaries without revealing them or the answer.\n\n';
          if (mode==='explain' && source.marking) {
            const marking=source.marking;
            text+='Official marking instructions, HTML companion: '+absolute(marking.html)+'\n'+
              marking.parts.map(piece=>'Official marking page '+piece.page+' image: '+absolute('readable/'+marking.pdf.replace(/\.pdf$/i,'')+'/page-'+piece.page+'.png')).join('\n')+'\n'+
              'BEGIN EXTRACTED OFFICIAL MARKING TEXT FOR QUESTION '+item.q+'\n'+marking.text+'\nEND EXTRACTED OFFICIAL MARKING TEXT\n\n';
            if(marking.requiresVisualMath)text+='The marking text also contains stacked mathematical layout. Check its page image before interpreting fractions or powers; do not calculate from a flattened expression.\n\n';
            if (marking.principles) text+='BEGIN GENERAL MARKING PRINCIPLES FROM THE SAME PAPER\n'+marking.principles+'\nEND GENERAL MARKING PRINCIPLES\n\n';
            text+='WORKING AND MARKING CHECK: after solving, compare the explanation with each relevant official marking point, not just the final answer. Include every equation, justification or intermediate step that the selected marking method explicitly requires, even if it seems obvious. Follow one complete permitted method; do not combine partial requirements from different alternatives. For logarithms, show taking the logarithm of the original expression before expanding with logarithm laws, where required. Resolve any disagreement against the original question and marking-page images; identify uncertainty instead of claiming full marks.\n\n';
            text+='This is extracted official source text, not an AI-written answer or a manually checked marking summary. Use guidance whose wording and layout are clear. Check the HTML page image or original PDF if equations, table columns, alternatives, underlining or acceptance/rejection notes are ambiguous. Do not invent official marking points. The fallback below applies only to guidance actually missing or unreadable, not merely to a PDF link that cannot be opened.\n\n';
          } else if (source.marking) {
            text+='Official marking instructions, HTML companion: '+absolute(source.marking.html)+'\nThe answer text is intentionally not included in this hint prompt. Do not reveal the answer.\n\n';
          }
          return text+'SOURCE VERIFICATION STATUS: Before answering, distinguish (1) original question text actually read, (2) original page image actually inspected, (3) official marking guidance actually read, and (4) your own inference. A URL supplied in this prompt is not proof that its contents were viewed. If a diagram, graph, code layout, table, formula, image or partial wireframe affects the answer, first try the linked original page image, readable HTML and PDF using available retrieval methods. A failed retrieval method is not proof that the image is unavailable. Never reconstruct unseen details from the marking scheme, topic, extracted text or general knowledge and call them an original-image reading. If a visual remains inaccessible, name the specific unverified detail, answer only what the readable evidence supports, and ask for only that missing detail if indispensable. Never describe an uninspected original image as verified or claim to have executed code or tested a diagram without doing so.\n\nQUESTION AND MARKING DISCIPLINE: Read restrictive wording such as "in use", "only", dates, boundaries, units and exact subparts before proposing an answer. Use official marking instructions as authoritative only for the specific points actually readable, including acceptance and rejection notes; do not treat an unavailable or ambiguous marking scheme as verified. Where an official sample answer appears logically inconsistent, distinguish the published marking expectation from your own analysis without silently changing the source. Keep the first response strategy-first and give one useful hint before a complete solution unless the learner explicitly asks for the answer. Preserve exact source notation, identifiers and labels; distinguish verified transcription corrections from conjecture.\n\n'+markingGuidance;
        }
      };
    }
  };
})(window);
