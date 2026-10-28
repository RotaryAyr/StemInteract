/* Full source coverage, section matching and offline prompt regressions. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const levels=JSON.parse(execFileSync(process.execPath,[path.join(root,'scripts/computing-source-index.cjs')]));
let pages=0,papers=0,questions=0,prompts=0;
for(const level of levels){
  const base=path.join(root,level.directory),ctx=vm.createContext({window:{},URL});
  vm.runInContext(fs.readFileSync(path.join(base,'computing-sources.js'),'utf8'),ctx);
  vm.runInContext(fs.readFileSync(path.join(root,'assets/js/computing-prompts.js'),'utf8'),ctx);
  const sources=ctx.window.StemComputingSources;
  const helper=ctx.window.StemComputing.forExplorer(level.directory,level.title,level.unit,'https://preview.example');
  const manifest=JSON.parse(fs.readFileSync(path.join(base,'readable/manifest.json')));
  assert.equal(Object.keys(sources).length,level.questions.length);
  const explorer=fs.readFileSync(path.join(base,level.explorer),'utf8');
  assert.ok(explorer.includes('computing-sources.js'));
  assert.ok(explorer.includes('readableQuestionUrl('));
  assert.ok(explorer.includes('mode="hint"'));
  assert.doesNotMatch(explorer,/<textarea readonly>['"]\+prompt\(/,'Source text must be assigned as text, not parsed as HTML');
  for(const item of manifest){
    const pdf=fs.readFileSync(path.join(base,item.file));
    assert.equal(crypto.createHash('sha256').update(pdf).digest('hex'),item.sha256);
    const html=fs.readFileSync(path.join(base,'readable',item.html),'utf8');
    for(let pg=1;pg<=item.pages;pg++){
      assert.ok(html.includes('id="page-'+pg+'"'));
      const image=fs.readFileSync(path.join(base,'readable',item.file.replace(/\.pdf$/i,''),'page-'+pg+'.png'));
      assert.equal(image.subarray(1,4).toString(),'PNG');
      assert.ok(image.readUInt32BE(16)>880);
      pages++;
    }
    papers++;
  }
  for(const row of level.questions){
    const key=[row.year,row.part,row.q].join(':'),record=sources[key];
    assert.ok(record,key);
    assert.equal(record.question.pdf,row.pdf);
    if(row.page)assert.equal(record.question.parts[0].page,row.page);
    assert.equal(record.marking.pdf,row.marking);
    for(const field of ['question','marking']){
      assert.ok(record[field].text.length>10,key);
      const html=fs.readFileSync(path.join(base,record[field].html.split('#')[0]),'utf8');
      assert.ok(html.includes('id="part-'+row.part+'-q-'+row.q+'"'));
    }
    const item={y:row.year,q:row.q};
    if(level.unit==='Section'){item.s=row.part;item.p=row.page;}
    else {item.pg=row.page;if(level.unit==='Paper')item.p=row.part;else item.s='Electromagnetism';}
    assert.equal(helper.markingHtml(item),record.marking.html);
    assert.equal(helper.questionHtml(item,row.pdf+'#page='+row.page),record.question.html);
    for(const mode of ['hint','explain']){
      if(level.directory==='N5/N5-ComputingScience')assert.match(sources['2022:0:12'].question.text,/WHERE test1 < 10 OR test2 > 90;/);
  const prompt=helper.sourcePrompt(item,mode,'Marking-resource guidance: fixture');
      assert.ok(prompt.includes(record.question.text));
      assert.ok(prompt.includes('https://preview.example/'+level.directory+'/'+record.question.html));
      assert.ok(prompt.includes('ask only for the specific diagram, formula or value'));
      assert.equal(prompt.includes('BEGIN EXTRACTED OFFICIAL MARKING TEXT'),mode==='explain');
      if(mode==='explain')assert.ok(prompt.includes(record.marking.text));
      prompts++;
    }
    questions++;
  }
  const examples=Object.values(sources);
  assert.ok(examples.some(x=>/SELECT/i.test(x.question.text)),'SQL source must be present');
  assert.ok(examples.some(x=>/<[a-z][^>]*>/i.test(x.question.text)),'HTML source must remain text');
  assert.ok(examples.some(x=>/\n[ ]{5,}\S/.test(x.question.text)),'Source layout must retain indentation');
  if(level.directory==='N5/N5-ComputingScience')assert.match(sources['2022:0:12'].question.text,/WHERE test1 < 10 OR test2 > 90;/);
  const prompt=helper.sourcePrompt({y:2026,q:1},'explain','');
  assert.match(prompt,/COMPUTING SOURCE CHECK/);
  assert.match(prompt,/Official marking page .* image:/);
  assert.match(prompt,/do not silently repair or invent the source/);
  assert.doesNotMatch(fs.readFileSync(path.join(base,'computing-sources.js'),'utf8'),/<\/script/i,'Source data must not close a script element');
  assert.equal(helper.sourcePrompt({y:2099,p:1,s:1,q:1},'hint',''),null);
}
assert.equal(questions,241);assert.equal(papers,30);assert.equal(pages,705);assert.equal(prompts,482);
console.log(`PASS: ${questions} matched Computing questions, ${papers} unchanged PDFs, ${pages} page images, ${prompts} source-carrying prompts; SQL/HTML source, indentation, script escaping and original-image safeguards checked.`);
