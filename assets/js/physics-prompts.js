/* Shared source-carrying prompts for the three Physics explorers. */
(function (global) {
  'use strict';
  global.StemPhysics = {
    forExplorer(directory, title, unit, origin) {
      const part = item => unit === 'Section' ? item.s : unit === 'Paper' ? item.p : 0;
      const lookup = item => (global.StemPhysicsSources || {})[[item.y || 2025, part(item), item.q].join(':')];
      const absolute = relative => new URL(relative, origin + '/' + directory + '/').href;
      return {
        lookup,
        questionHtml(item, pdfUrl) {
          return 'readable/'+pdfUrl.split('.pdf')[0]+'.html#part-'+part(item)+'-q-'+item.q;
        },
        markingHtml(item) {
          const source=lookup(item);
          return source && source.marking ? source.marking.html : null;
        },
        sourcePrompt(item, mode, markingGuidance) {
          const source = lookup(item);
          if (!source) return null;
          const question = source.question;
          const page = unit === 'Section' ? item.p : item.pg;
          let text = 'Source: Scottish Qualifications Authority (SQA) / Qualifications Scotland, '+(item.y||2025)+', '+title+(unit?', '+unit+' '+part(item):'')+', Question '+item.q+'.\n'+
            'Original examination question PDF: '+absolute(question.pdf)+'#page='+page+'\n'+
            'Readable question HTML and original page images: '+absolute(question.html)+'\n'+
            question.parts.map(piece=>'PDF page '+piece.page+' image: '+absolute('readable/'+question.pdf.replace(/\.pdf$/,'')+'/page-'+piece.page+'.png')).join('\n')+'\n\n'+
            'BEGIN EXTRACTED QUESTION TEXT\n'+question.text+'\nEND EXTRACTED QUESTION TEXT\n\n'+
            'The question wording is included above. Use it directly; do not ask me to upload or retype it just because a PDF or link cannot be opened. This is a mechanical extraction, not a paraphrase. Some legacy mathematical symbols and raised/lowered characters have been decoded, but fractions, vector arrows, equations, graph coordinates and table columns may still require the original image. Do not interpret an ambiguous flattened expression as a complete equation. First try the supplied HTML/page-image sources for any missing visual or mathematical layout. If these cannot be viewed, ask only for the specific diagram, formula or value you need; do not guess or claim the entire question is unreadable. Do not infer an answer from its topic description.\n\n';
          if (mode==='explain' && source.marking) {
            const marking=source.marking;
            text+='Official marking instructions, HTML companion: '+absolute(marking.html)+'\n'+
              'BEGIN EXTRACTED OFFICIAL MARKING TEXT FOR QUESTION '+item.q+'\n'+marking.text+'\nEND EXTRACTED OFFICIAL MARKING TEXT\n\n';
            if (marking.principles) text+='BEGIN GENERAL MARKING PRINCIPLES FROM THE SAME PAPER\n'+marking.principles+'\nEND GENERAL MARKING PRINCIPLES\n\n';
            text+='This is extracted official source text, not an AI-written answer or a manually checked marking summary. Use guidance whose wording and layout are clear. Check the HTML page image or original PDF if equations, table columns, alternatives, underlining or acceptance/rejection notes are ambiguous. Do not invent official marking points. The fallback below applies only to guidance actually missing or unreadable, not merely to a PDF link that cannot be opened.\n\n';
          } else if (source.marking) {
            text+='Official marking instructions, HTML companion: '+absolute(source.marking.html)+'\nThe answer text is intentionally not included in this hint prompt. Do not reveal the answer.\n\n';
          }
          return text+markingGuidance;
        }
      };
    }
  };
})(window);
