/* Human Biology prompts carry the source wording, rather than only a PDF URL. */
(function (global) {
  'use strict';
  global.StemHumanBiology = {
    sourcePrompt(item, origin, mode, markingGuidance) {
      const source = global.StemHumanBiologySources && global.StemHumanBiologySources[[item.y, item.p, item.q].join(':')];
      if (!source) return null;
      const absolute = relative => new URL(relative, origin + '/Higher/HB-H/').href;
      const question = source.question;
      const imageLinks = question.parts.map(part =>
        'PDF page ' + part.page + ' image: ' + absolute('readable/' + question.pdf.replace(/\.pdf$/, '') + '/page-' + part.page + '.png')).join('\n');
      let text = 'Source: Scottish Qualifications Authority (SQA) / Qualifications Scotland, ' + item.y + ', Higher Human Biology, Paper ' + item.p + ', Question ' + item.q + '.\n' +
        'Original examination question PDF: ' + absolute(question.pdf) + '#page=' + item.pg + '\n' +
        'Readable question HTML and original page images: ' + absolute(question.html) + '\n' + imageLinks + '\n\n' +
        'BEGIN EXTRACTED QUESTION TEXT\n' + question.text + '\nEND EXTRACTED QUESTION TEXT\n\n' +
        'The question wording is included above. Use it directly; do not ask me to upload or retype it just because a PDF or link cannot be opened. This text is a mechanical extraction, not a paraphrase. Spacing, superscripts and table columns may need the original page image. If solving requires a diagram, graph, table layout or symbol that the text does not preserve, first try the supplied HTML/page-image sources. If these cannot be viewed, ask only for that specific missing visual or value; do not guess or claim the entire question is unreadable. Do not infer an answer from the topic description.\n\n';
      if (mode === 'explain' && source.marking) {
        const marking = source.marking;
        text += 'Official marking instructions, HTML companion: ' + absolute(marking.html) + '\n' +
          'BEGIN EXTRACTED OFFICIAL MARKING TEXT FOR QUESTION ' + item.q + '\n' + marking.text + '\nEND EXTRACTED OFFICIAL MARKING TEXT\n\n';
        if (marking.principles) text += 'BEGIN GENERAL MARKING PRINCIPLES FROM THE SAME PAPER\n' + marking.principles + '\nEND GENERAL MARKING PRINCIPLES\n\n';
        text += 'This is extracted official source text, not an AI-written answer or a manually checked marking summary. Use the supplied guidance where its wording and layout are clear. Check the HTML page image or original PDF if table columns, alternatives or acceptance/rejection notes are ambiguous; do not invent an official marking point. The fallback below applies only to guidance that is actually missing or unreadable, not merely to a PDF link that cannot be opened.\n\n';
      } else if (source.marking) {
        text += 'Official marking instructions, HTML companion: ' + absolute(source.marking.html) + '\nThe answer text is intentionally not included in this hint prompt. Do not reveal the answer.\n\n';
      }
      return text + markingGuidance;
    }
  };
})(window);
