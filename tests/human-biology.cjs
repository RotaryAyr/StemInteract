/* Run with node tests/human-biology.cjs; checks the authored index and source files. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const directory = path.join(root, 'Higher/HB-H');
const html = fs.readFileSync(path.join(directory, 'Higher-Human-Biology-Question-Explorer.html'), 'utf8');
const index = html.slice(html.indexOf('const topicAreas='), html.indexOf('const year='));
const context = vm.createContext({});
vm.runInContext(index, context);
const questions = vm.runInContext('questions', context);
const topicAreas = vm.runInContext('topicAreas', context);
const links = vm.runInContext('noteLinks', context);
assert.equal(questions.length, 199);
assert.equal(Object.values(topicAreas).flat().length, 25);
assert.equal(Object.keys(links).length, 25);
const contentTopics = Object.values(topicAreas).slice(0,3).flat();
assert.equal(new Set(contentTopics.map(topic => links[topic])).size, 24);
contentTopics.forEach(topic => assert.match(links[topic], /^https:\/\/www\.bbc\.co\.uk\/bitesize\/guides\/[a-z0-9]+\/revision\/1$/));
assert.equal(links.Memory, 'https://www.bbc.co.uk/bitesize/guides/zm24382/revision/1');
assert.equal(links['Structure and function of the heart'], 'https://www.bbc.co.uk/bitesize/guides/zrrry9q/revision/1');
assert.ok(html.includes('BBC Bitesize notes'));
assert.ok(html.includes('Extra revision notes and workbooks'));
assert.ok(html.includes('drive.google.com/file/d/11Cl5yCIdbBnrBLngLMhJ6zjPDlX0MU4d/view'));
assert.ok(questions.every(q => q.topics.length && q.areas.length && q.d.length > 20));
assert.equal(new Set(questions.map(q => [q.y,q.p,q.q].join(':'))).size, 199);
for (const year of [2022,2023,2024,2025,2026]) {
  for (const paper of [1,2]) {
    const rows = questions.filter(q => q.y === year && q.p === paper);
    assert.equal(rows.length, paper === 1 ? 25 : year === 2026 ? 14 : 15);
    assert.equal(rows.reduce((sum,q) => sum + q.m, 0), paper === 1 ? 25 : 95);
    rows.forEach((q,i) => {
      assert.equal(q.q, i+1);
      assert.ok(q.pg >= 2);
      assert.ok(q.m > 0 && Number.isInteger(q.m));
      q.topics.forEach(t => assert.ok(Object.values(topicAreas).flat().includes(t)));
      q.areas.forEach(a => assert.ok(q.topics.some(t => topicAreas[a].includes(t))));
    });
    const filename = (paper === 1 ? 'NH_Human-Biology_Paper1-Multiple-choice_' : 'NH_Human-Biology_Paper2_') + year + '.pdf';
    assert.equal(fs.readFileSync(path.join(directory, filename)).subarray(0,5).toString(), '%PDF-');
  }
}
assert.match(html, /session 2026–27/);
assert.match(html, /Workbooks include activities and some blanks/);
assert.doesNotMatch(html, /NH_Biology|Higher\/Bi-H|Sustainability and interdependence/);
assert.ok(fs.readFileSync(path.join(root, 'Biology-Question-Explorers.html'), 'utf8').includes('Higher/HB-H/Higher-Human-Biology-Question-Explorer.html'));
const markingContext = vm.createContext({window: {}, URL});
for (const file of ['marking-availability.js','marking-resources.js']) vm.runInContext(fs.readFileSync(path.join(root,'assets/js',file),'utf8'), markingContext);
const previewPrompt = markingContext.window.StemMarking.forExplorer('Higher/HB-H','https://deploy-preview-4--steminteract.netlify.app').prompt({y:2026,p:2});
assert.ok(previewPrompt.includes('https://deploy-preview-4--steminteract.netlify.app/Higher/HB-H/mi_NH_Human-Biology_Paper-2_2026.pdf'));
assert.doesNotMatch(previewPrompt, /https:\/\/steminteract.uk/);
console.log('PASS: 199 unique questions, ten complete paper indexes, correct 25/95 mark totals, 25 topic-resource mappings, navigation and source-PDF checks.');
