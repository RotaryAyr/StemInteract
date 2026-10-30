/* Full source coverage, section matching and offline prompt regressions. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const levels=JSON.parse(execFileSync(process.execPath,[path.join(root,'scripts/chemistry-source-index.cjs')]));
let pages=0,papers=0,questions=0,prompts=0;
for(const level of levels){
  const base=path.join(root,level.directory),ctx=vm.createContext({window:{},URL});
  vm.runInContext(fs.readFileSync(path.join(base,'chemistry-sources.js'),'utf8'),ctx);
  vm.runInContext(fs.readFileSync(path.join(root,'assets/js/chemistry-prompts.js'),'utf8'),ctx);
  const sources=ctx.window.StemChemistrySources;
  const helper=ctx.window.StemChemistry.forExplorer(level.directory,level.title,level.unit,'https://preview.example');
  const manifest=JSON.parse(fs.readFileSync(path.join(base,'readable/manifest.json')));
  assert.equal(Object.keys(sources).length,level.questions.length);
  const explorer=fs.readFileSync(path.join(base,level.explorer),'utf8');
  assert.ok(explorer.includes('chemistry-sources.js'));
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
      const prompt=helper.sourcePrompt(item,mode,'Marking-resource guidance: fixture');
      assert.ok(prompt.includes(record.question.text));
      assert.ok(prompt.includes('https://preview.example/'+level.directory+'/'+record.question.html));
      assert.ok(prompt.includes('ask only for the specific diagram, formula or value'));
      assert.equal(prompt.includes('BEGIN EXTRACTED OFFICIAL MARKING TEXT'),mode==='explain');
      assert.equal(prompt.includes('CHEMISTRY COMPLETENESS CHECK'),mode==='explain');
      assert.equal(prompt.includes('CHEMISTRY NAMING AND NOTATION CHECK'),mode==='explain');
      if(mode==='explain') {
        assert.match(prompt,/transition-state or intermediate drawing/);
        assert.match(prompt,/partial\/dashed bonds, brackets and overall charge/);
        assert.match(prompt,/do not claim the mechanism is complete/);
        assert.match(prompt,/do not substitute an older synonym/);
        assert.match(prompt,/correct atom or on the whole bracketed ion/);
        assert.match(prompt,/phase or solvent labels for both numerator and denominator/);
        assert.match(prompt,/distinguish the light absorbed from the colour observed/);
      }
      if(mode==='explain')assert.ok(prompt.includes(record.marking.text));
      prompts++;
    }
    questions++;
  }
  // Combined marking PDFs repeat question numbers in MCQ/written sections.
  for(const row of level.questions.filter(r=>r.part===1)){
    const source=sources[[row.year,1,row.q].join(':')];
    assert.match(source.marking.text,new RegExp('\\n'+row.q+'\\.\\s+[ABCD]\\s+1(?:\\s|$)'));
    assert.doesNotMatch(source.marking.principles,/Question\s+Answer\s+Mark/);
  }
  const written=sources['2026:2:1'];
  assert.ok(written.marking.text.length>150);
  assert.notEqual(written.marking.html,sources['2026:1:1'].marking.html);
  assert.match(helper.sourcePrompt({y:2026,p:2,q:1},'explain',''),/CHEMICAL NOTATION CHECK/);
  assert.match(helper.sourcePrompt({y:2026,p:2,q:1},'explain',''),/Official marking page .* image:/);
  if(level.directory==='N5/N5-Chemistry'){
    assert.match(written.marking.text,/Same atomic number/);
    assert.match(sources['2026:2:2'].marking.text,/C₂H₂/);
    assert.match(sources['2026:2:3'].marking.text,/Calcium carbonate/);
  }
  assert.equal(helper.sourcePrompt({y:2099,p:1,s:1,q:1},'hint',''),null);
}
assert.equal(questions,548);assert.equal(papers,50);assert.equal(pages,1095);assert.equal(prompts,1096);
console.log(`PASS: ${questions} matched Chemistry questions, ${papers} unchanged PDFs, ${pages} page images, ${prompts} source-carrying prompts; MCQ/written isolation, chemical notation and original-image safeguards checked.`);
