/* Shared source-carrying prompts for the three Chemistry explorers. */
(function (global) {
  'use strict';
  global.StemChemistry = {
    forExplorer(directory, title, unit, origin) {
      const part = item => unit === 'Section' ? item.s : unit === 'Paper' ? item.p : 0;
      const lookup = item => (global.StemChemistrySources || {})[[item.y || 2025, part(item), item.q].join(':')];
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
          let text = 'CHEMICAL NOTATION CHECK: preserve element capitalisation, subscripts, isotope numbers, ionic charges, state symbols and reaction arrows. Structural formulae, bond positions, stereochemistry, spectra and apparatus diagrams may not survive text extraction. Check the supplied original page image whenever these are needed; do not infer a molecular structure from flattened text. If image access fails, ask only for the specific formula or diagram required.\n\n'+(question.requiresVisualMath ? 'MATHEMATICAL LAYOUT CHECK REQUIRED: this question contains stacked fractions or layered notation. Plain text can lose fraction bars, including inside powers. Read the supplied original page image before interpreting these expressions; never treat concatenated exponent digits as a complete power. If image access fails, ask only for the affected formula.\n\n' : '')+'Source: Scottish Qualifications Authority (SQA) / Qualifications Scotland, '+(item.y||2025)+', '+title+(unit?', '+unit+' '+part(item):'')+', Question '+item.q+'.\n'+
            'Original examination question PDF: '+absolute(question.pdf)+'#page='+page+'\n'+
            'Readable question HTML and original page images: '+absolute(question.html)+'\n'+
            question.parts.map(piece=>'PDF page '+piece.page+' image: '+absolute('readable/'+question.pdf.replace(/\.pdf$/i,'')+'/page-'+piece.page+'.png')).join('\n')+'\n\n'+
            'BEGIN EXTRACTED QUESTION TEXT\n'+question.text+'\nEND EXTRACTED QUESTION TEXT\n\n'+
            'The question wording is included above. Use it directly; do not ask me to upload or retype it just because a PDF or link cannot be opened. This is a mechanical extraction, not a paraphrase. Some legacy mathematical symbols and raised/lowered characters have been decoded, but fractions, vector arrows, equations, graph coordinates and table columns may still require the original image. Do not interpret an ambiguous flattened expression as a complete equation. First try the supplied HTML/page-image sources for any missing visual or mathematical layout. If these cannot be viewed, ask only for the specific diagram, formula or value you need; do not guess or claim the entire question is unreadable. Do not infer an answer from its topic description.\n\n';
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
            text+='CHEMISTRY COMPLETENESS CHECK: before finalising, compare your response with each separately awarded marking point whose guidance is readable. A mechanism may require both electron-pair curly arrows and a transition-state or intermediate drawing. Include every required stage; for a transition state check partial/dashed bonds, brackets and overall charge against the original marking image. A written description is not a substitute for a requested drawing. If the relevant image cannot be read, identify the specific missing visual and do not claim the mechanism is complete or that all marks are secured. Where guidance is unavailable, explain the chemistry without inventing official requirements.\n\n'+
              'CHEMISTRY NAMING AND NOTATION CHECK: use the current systematic name required by readable official guidance, including ligand names and oxidation states; do not substitute an older synonym when exact naming is required. Check ionic-fragment charges on the correct atom or on the whole bracketed ion, and distinguish subscripts from charges. In equilibrium expressions preserve concentration brackets, the required constant symbol and the phase or solvent labels for both numerator and denominator. For colour explanations distinguish the light absorbed from the colour observed, use transitions between the appropriate orbitals, and avoid adding conflicting colour alternatives or an emission explanation when absorption is required. Apply the actual acceptance and rejection notes, rather than assuming chemically similar wording earns the mark.\n\n';
          }
          return text+markingGuidance;
        }
      };
    }
  };
})(window);
