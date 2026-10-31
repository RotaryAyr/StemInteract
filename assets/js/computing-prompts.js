/* Shared source-carrying prompts for the three Computing explorers. */
(function (global) {
  'use strict';
  global.StemComputing = {
    forExplorer(directory, title, unit, origin) {
      const part = item => unit === 'Section' ? item.s : unit === 'Paper' ? item.p : 0;
      const lookup = item => (global.StemComputingSources || {})[[item.y || 2025, part(item), item.q].join(':')];
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
          let text = 'COMPUTING SOURCE CHECK: preserve code indentation, line breaks, case, identifiers, quotes, comparison operators and assignment symbols exactly. Use the SQA reference language and the language specified by the question. SQL, HTML, pseudocode, trace tables, diagrams and database layouts may need the supplied original page images. Check those images for ambiguous code or formatting; do not silently repair or invent the source. If image access fails, ask only for the specific missing line or diagram.\n\n'+(question.requiresVisualMath ? 'MATHEMATICAL LAYOUT CHECK REQUIRED: this question contains stacked fractions or layered notation. Plain text can lose fraction bars, including inside powers. Read the supplied original page image before interpreting these expressions; never treat concatenated exponent digits as a complete power. If image access fails, ask only for the affected formula.\n\n' : '')+'Source: Scottish Qualifications Authority (SQA) / Qualifications Scotland, '+(item.y||2025)+', '+title+(unit?', '+unit+' '+part(item):'')+', Question '+item.q+'.\n'+
            'Original examination question PDF: '+absolute(question.pdf)+'#page='+page+'\n'+
            'Readable question HTML and original page images: '+absolute(question.html)+'\n'+
            question.parts.map(piece=>'PDF page '+piece.page+' image: '+absolute('readable/'+question.pdf.replace(/\.pdf$/i,'')+'/page-'+piece.page+'.png')).join('\n')+'\n\n'+
            'BEGIN EXTRACTED QUESTION TEXT\n'+question.text+'\nEND EXTRACTED QUESTION TEXT\n\n'+
            'The question wording is included above. Use it directly; do not ask me to upload or retype it just because a PDF or link cannot be opened. This is a mechanical extraction, not a paraphrase. Known font symbols have been decoded; code is not rewritten as mathematical superscripts or subscripts. Indentation, punctuation, operators, trace-table columns and diagrams may still require the original image. Do not interpret ambiguous extracted code as an exact, complete program. First try the supplied HTML/page-image sources for any missing visual or mathematical layout. If these cannot be viewed, ask only for the specific diagram, formula or value you need; do not guess or claim the entire question is unreadable. Do not infer an answer from its topic description.\n\n';
          if (mode==='explain' && source.marking) {
            const marking=source.marking;
            text+='Official marking instructions, HTML companion: '+absolute(marking.html)+'\n'+
              marking.parts.map(piece=>'Official marking page '+piece.page+' image: '+absolute('readable/'+marking.pdf.replace(/\.pdf$/i,'')+'/page-'+piece.page+'.png')).join('\n')+'\n'+
              'BEGIN EXTRACTED OFFICIAL MARKING TEXT FOR QUESTION '+item.q+'\n'+marking.text+'\nEND EXTRACTED OFFICIAL MARKING TEXT\n\n';
            if(marking.requiresVisualMath)text+='The marking text also contains stacked mathematical layout. Check its page image before interpreting fractions or powers; do not calculate from a flattened expression.\n\n';
            if (marking.principles) text+='BEGIN GENERAL MARKING PRINCIPLES FROM THE SAME PAPER\n'+marking.principles+'\nEND GENERAL MARKING PRINCIPLES\n\n';
            text+='This is extracted official source text, not an AI-written answer or a manually checked marking summary. Use guidance whose wording and layout are clear. Check the HTML page image or original PDF if code, table columns, alternatives, underlining or acceptance/rejection notes are ambiguous. Do not invent official marking points. The fallback below applies only to guidance actually missing or unreadable, not merely to a PDF link that cannot be opened.\n\n';
          } else if (source.marking) {
            text+='Official marking instructions, HTML companion: '+absolute(source.marking.html)+'\nThe answer text is intentionally not included in this hint prompt. Do not reveal the answer.\n\n';
          }
          if (mode==='explain') {
            text+='COMPUTING MARKING-POINT CHECK: before finalising, check every requested subpart against its own readable official marking guidance, allocated marks and additional guidance. Give a concise, labelled Exam answer, then explain the reasoning. Include each separately required fact and causal link; do not assume that a broad description earns a more specific point. Identify the immediate action indicated by a diagram label or interface control, rather than substituting a later stage of its workflow. For modular development and testing, distinguish how modules are developed from how their interaction is tested. Apply the supplied general principles on alternative solutions, language differences and consequential errors. Where guidance is missing or unreadable, do not invent official requirements or guarantee marks.\n\n'+
              'COMPUTING CODE AND TRACE CHECK: provide the requested form of answer: recognisable code when code is requested, an appropriate design technique for a design task, and explicit intermediate states and output for a trace. State the language and indexing convention and use them consistently. Distinguish a declared reference type from the runtime object and do not generalise a restriction to languages with different dispatch rules. Check loop bounds, all supplied records/options, empty and missing entries, exact boundaries, and success and failure paths. Distinguish a failed query from a successful query with zero rows, and include any termination behaviour required by the readable marking guidance. Show required persistent database changes, not only local record assignments. Trace mutually exclusive and independent conditions separately; disclose any unstated priority assumption. Where tools permit, check representative and boundary cases; distinguish actual execution from a manual trace and do not claim a runtime test you did not perform.\n\n'+
              'COMPUTING DIAGRAM AND ROUTE CHECK: when a diagram is requested, deliver the diagram where tools permit; prose listing its contents alone is not a completed diagram. Inspect the rendered result for labels, types, visibility, relationships, arrow direction, missing elements and clipping before claiming completion. Use only the supplied original exam images as evidence; do not substitute an unrelated web image. Label your own reconstruction separately from the official figure. If a needed original image or your rendered diagram cannot be inspected, state that specific limitation without claiming visual verification. When the paper offers optional sections or routes, identify the chosen route; if explaining alternatives, label them separately and do not add their marks together.\n\n'+
              'COMPUTING SOURCE-DISCREPANCY CHECK: an official sample solution is not necessarily the only valid program or a verified executable implementation. Compare it with the original question, the specified language and the marking criteria. Preserve quoted official code and literal identifiers unchanged. If an apparent case, indexing, syntax, control-flow or data inconsistency is visible, identify it explicitly and distinguish the quoted source from a clearly labelled corrected or alternative implementation. Explain what the marking grid explicitly credits without inventing acceptance of your alternative. Do not silently copy an apparent defect into code presented as runnable, or claim different algorithms are equivalent without checking their behaviour.\n\n';
          }
          return text+markingGuidance;
        }
      };
    }
  };
})(window);
