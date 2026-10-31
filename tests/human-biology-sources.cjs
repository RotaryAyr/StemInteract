/* Verify embedded sources still work when no external document can be fetched. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const base = path.resolve(__dirname, '../Higher/HB-H');
const context = vm.createContext({window: {}, URL});
for (const name of ['human-biology-sources.js', 'human-biology-prompts.js']) vm.runInContext(fs.readFileSync(path.join(base,name),'utf8'), context);
const records = context.window.StemHumanBiologySources;
const manifest = JSON.parse(fs.readFileSync(path.join(base,'readable/manifest.json')));
assert.equal(manifest.length,20);
assert.equal(manifest.reduce((sum,item) => sum+item.pages,0),361);
for (const item of manifest) {
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(base,item.file))).digest('hex'),item.sha256);
  const html = fs.readFileSync(path.join(base,'readable',item.html),'utf8');
  for (let pg=1;pg<=item.pages;pg++) {
    assert.ok(html.includes('id="page-'+pg+'"'));
    const image = fs.readFileSync(path.join(base,'readable',item.file.replace(/\.pdf$/,''),'page-'+pg+'.png'));
    assert.equal(image.subarray(1,4).toString(),'PNG');
    assert.ok(image.readUInt32BE(16) >= 890);
  }
}
assert.equal(Object.keys(records).length,199);
let prompts=0;
for (const [key,source] of Object.entries(records)) {
  const [y,p,q] = key.split(':').map(Number);
  const item = {y,p,q,pg:source.question.parts[0].page};
  for (const field of ['question','marking']) {
    const record = source[field];
    assert.ok(record.text.length>10,key+' '+field);
    assert.match(record.text,new RegExp('\\b'+q+'\\.'));
    const html = fs.readFileSync(path.join(base,record.html.split('#')[0]),'utf8');
    assert.ok(html.includes('id="q-'+q+'"'));
    assert.ok(record.parts.every(part => part.text.length && part.page>1));
  }
  for (const mode of ['hint','explain']) {
    const prompt = context.window.StemHumanBiology.sourcePrompt(item,'https://preview.example',mode,'Marking-resource guidance: fixture');
    assert.ok(prompt.includes(source.question.text),key);
    assert.ok(prompt.includes('https://preview.example/Higher/HB-H/'+source.question.html));
    assert.ok(prompt.includes('Use it directly; do not ask me to upload or retype it'));
    assert.equal(prompt.includes('BEGIN EXTRACTED OFFICIAL MARKING TEXT'),mode==='explain');
    if (mode==='explain') {
      assert.ok(prompt.includes(source.marking.text));
      for (const part of source.marking.parts) {
        const relative = 'readable/'+source.marking.pdf.replace(/\.pdf$/i,'')+'/page-'+part.page+'.png';
        assert.ok(fs.existsSync(path.join(base,relative)),key+' marking image exists');
        assert.ok(prompt.includes('https://preview.example/Higher/HB-H/'+relative),key+' matching marking image supplied');
      }
      assert.ok(prompt.includes('BIOLOGY MARKING-POINT CHECK'));
      assert.ok(prompt.includes('BIOLOGY GRAPH AND DRAWING CHECK'));
    } else {
      assert.ok(!prompt.includes('BIOLOGY MARKING-POINT CHECK'));
      assert.ok(!prompt.includes('Official marking page '));
    }
    if (p===2 && mode==='explain') assert.ok(prompt.includes('GENERAL MARKING PRINCIPLES'));
    prompts++;
  }
}
// Meaningful regressions: nested numbered lists must remain in the same question,
// continuations and both extended-response alternatives must be retained.
assert.match(records['2026:1:8'].question.text,/4\. Stimulates the interstitial cells/);
assert.match(records['2022:1:2'].question.text,/depending on their stage of diagnosis/);
assert.match(records['2022:1:2'].question.text,/in the\s+UK/);
assert.match(records['2026:2:11'].question.text,/Name the method that increases the capacity/);
assert.equal(records['2026:2:11'].question.parts.length,1);
assert.match(records['2026:2:11'].marking.text,/Elaboration/);
assert.match(records['2026:2:11'].marking.text,/Chunking/);
assert.match(records['2024:2:15'].marking.text,/15\. A/);
assert.match(records['2024:2:15'].marking.text,/15\. B/);
assert.ok(records['2024:2:15'].question.parts.length>=2);

// Audit regressions exercise real source records and both modes, with no answers
// hardcoded into the generic helper. These check the handoff, not AI accuracy.
const explain = (p,q) => context.window.StemHumanBiology.sourcePrompt({y:2026,p,q},'https://preview.example','explain','');
for (const q of [21,23]) {
  const prompt=explain(1,q);
  assert.ok(prompt.includes(records['2026:1:'+q].marking.text));
  assert.match(prompt,/verify the selected option against the matching official key/);
  assert.match(prompt,/do not silently change the quoted source or invent a justification/);
}
assert.match(explain(1,21),/do not insert web-search images/);
assert.match(explain(1,21),/Never reconstruct unseen graph values from the answer key/);
assert.match(explain(2,6),/compare the specified days or groups/);
assert.match(records['2026:2:6'].marking.text,/thinner/i);
assert.match(explain(2,9),/If an alternative is scientifically reasonable but not explicitly accepted/);
assert.match(records['2026:2:9'].marking.text,/negative feedback/i);
assert.match(explain(2,8),/Inspect the rendered result/);
assert.match(explain(2,8),/coordinates or prose alone are not a completed drawing/);
const optional=explain(2,14);
assert.match(records['2026:2:14'].marking.text,/14\. A/);
assert.match(records['2026:2:14'].marking.text,/14\. B/);
assert.match(optional,/do not add their marks together/);
assert.match(optional,/including any prose requirement/);

assert.equal(context.window.StemHumanBiology.sourcePrompt({y:2099,p:1,q:1},'https://preview.example','hint',''),null);
console.log('PASS: 20 unchanged PDF sources, 361 page images, 199 matched question/marking records and 398 prompts with embedded question text; hint prompts exclude answer text.');
