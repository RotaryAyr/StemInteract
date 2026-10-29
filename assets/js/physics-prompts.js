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
            (question.verifiedTextCorrections ? 'StemInteract has checked notation repairs in this question against the original image. sqrt(...) means square root; * means multiplication; ^ denotes a power. These are transcription repairs, not added answers.\n\n' : '')+
            'BEGIN EXTRACTED QUESTION TEXT\n'+question.text+'\nEND EXTRACTED QUESTION TEXT\n\n'+
            'The question wording is included above. Use it directly; do not ask me to upload or retype it just because a PDF or link cannot be opened. This is source transcription, not a paraphrase. Verified notation repairs are identified separately; remaining text is mechanically extracted. Some legacy mathematical symbols and raised/lowered characters have been decoded, but fractions, vector arrows, equations, graph coordinates and table columns may still require the original image. Do not interpret an ambiguous flattened expression as a complete equation. First try the supplied HTML/page-image sources for any missing visual or mathematical layout. If these cannot be viewed, ask only for the specific diagram, formula or value you need; do not guess or claim the entire question is unreadable. Do not infer an answer from its topic description.\n\n';
          text+='PHYSICS DIAGRAM CHECK: inspect the original diagram whenever directions, graph positions or circuit connections determine the answer. For a current-carrying wire in a magnetic field, identify the N-to-S magnetic-field direction and conventional-current direction for each labelled side. Apply Fleming’s left-hand rule (first finger: field, second finger: conventional current, thumb: force), then check every arrow against that side’s current and field. Do not guess from the apparent perspective or give a force direction without checking the diagram. If the image cannot be read, ask only for the missing directions or connections. In hint mode, guide the student through this check one step at a time without supplying the force arrows, complete solution or marking answers.\n\n';
          if (mode==='explain' && source.marking) {
            const marking=source.marking;
            text+='Official marking instructions, HTML companion: '+absolute(marking.html)+'\n'+
              'BEGIN EXTRACTED OFFICIAL MARKING TEXT FOR QUESTION '+item.q+'\n'+marking.text+'\nEND EXTRACTED OFFICIAL MARKING TEXT\n\n';
            if (marking.verifiedTextCorrections) text+='StemInteract has checked notation repairs in the marking transcription against the original marking-page image; sqrt(...) means square root. The allocation and meaning of marking points are retained.\n\n';
            text+=marking.parts.map(piece=>'Official marking page '+piece.page+' image: '+absolute('readable/'+marking.pdf.replace(/\.pdf$/i,'')+'/page-'+piece.page+'.png')).join('\n')+'\n\n';
            if (marking.principles) text+='BEGIN GENERAL MARKING PRINCIPLES FROM THE SAME PAPER\n'+marking.principles+'\nEND GENERAL MARKING PRINCIPLES\n\n';
            text+='PHYSICS WORKING CHECK: compare the explanation with each relevant marking point and any explicit working requirement, not just the final number. Use one complete permitted method. For torque from two opposite forces, show both forces and each perpendicular distance to the axis, for example 2*N*F*(d/2) for a centred coil with N turns and full side separation d, or state and fully substitute the permitted B*I*A*N method at the appropriate orientation. Identify any angle factor when needed. Do not present an unshown cancellation as explicit working. For experimental improvements, distinguish an improvement explicitly accepted by the supplied scheme from a physically reasonable alternative. Give the accepted response when available, with its physical reason; label alternatives as alternatives and do not guarantee marks unless the scheme clearly accepts them. If no scheme is readable, explain the physical rationale without claiming official acceptance.\n\n';
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
