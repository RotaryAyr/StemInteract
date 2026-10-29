/* Full source coverage, section matching and offline prompt regressions. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const levels=JSON.parse(execFileSync(process.execPath,[path.join(root,'scripts/mathematics-source-index.cjs')]));
let pages=0,papers=0,questions=0,prompts=0;
for(const level of levels){
  const base=path.join(root,level.directory),ctx=vm.createContext({window:{},URL});
  vm.runInContext(fs.readFileSync(path.join(base,'mathematics-sources.js'),'utf8'),ctx);
  vm.runInContext(fs.readFileSync(path.join(root,'assets/js/mathematics-prompts.js'),'utf8'),ctx);
  const sources=ctx.window.StemMathematicsSources;
  const helper=ctx.window.StemMathematics.forExplorer(level.directory,level.title,level.unit,'https://preview.example');
  const manifest=JSON.parse(fs.readFileSync(path.join(base,'readable/manifest.json')));
  assert.equal(Object.keys(sources).length,level.questions.length);
  const explorer=fs.readFileSync(path.join(base,level.explorer),'utf8');
  assert.ok(explorer.includes('mathematics-sources.js'));
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
      assert.match(prompt,/DIAGRAM AND BOUNDARY CHECK/);
      assert.equal(prompt.includes('WORKING AND MARKING CHECK'),mode==='explain');
      assert.ok(prompt.includes(record.question.text));
      assert.ok(prompt.includes('https://preview.example/'+level.directory+'/'+record.question.html));
      assert.ok(prompt.includes('ask only for the specific diagram, formula or value'));
      assert.equal(prompt.includes('BEGIN EXTRACTED OFFICIAL MARKING TEXT'),mode==='explain');
      if(mode==='explain')assert.ok(prompt.includes(record.marking.text));
      prompts++;
    }
    questions++;
  }
  // Check actual mathematical context and neighbouring-question isolation.
  if(level.directory==='N5/N5-Maths'){
    assert.match(sources['2026:1:1'].question.text,/Expand and simplify/);
    assert.match(sources['2026:1:1'].marking.text,/y³.*10y.*8/);
    assert.match(sources['2026:1:1'].marking.text,/2\. Accept/);
    assert.match(sources['2026:1:2'].marking.text,/60%.*180/);
    assert.match(sources['2026:1:2'].marking.text,/300 \(miles\)/);
    assert.equal(sources['2026:1:2'].marking.parts[0].page,6);
    assert.match(sources['2023:2:1'].marking.text,/1\. Correct/);
    assert.equal(sources['2023:2:1'].marking.parts[0].page,5);
  }
  if(level.directory==='Higher/Maths-H'){
    assert.match(sources['2022:1:1'].question.text,/perpendicular/);
    assert.equal(sources['2022:1:1'].question.parts[0].page,3);
    assert.doesNotMatch(sources['2026:1:1'].question.text,/Find|dx/);
    assert.match(sources['2026:1:2'].question.text,/Find/);
    assert.equal(sources['2026:1:2'].question.requiresVisualMath,true);
    const prompt=helper.sourcePrompt({y:2026,p:1,q:2},'explain','');
    assert.match(prompt,/MATHEMATICAL LAYOUT CHECK REQUIRED/);
    assert.match(prompt,/Official marking page .* image:/);
    // These audit failures require visual/marking checks even without a fraction flag.
    const area=sources['2026:2:7'];
    const logs=sources['2026:2:11'];
    assert.match(area.marking.text,/9/);
    assert.match(logs.marking.text,/explicitly/);
    for(const q of [7,11]){
      const record=sources['2026:2:'+q];
      const explain=helper.sourcePrompt({y:2026,p:2,q},'explain','');
      const hint=helper.sourcePrompt({y:2026,p:2,q},'hint','');
      assert.ok(explain.includes(record.question.text));
      assert.ok(explain.includes(record.marking.text));
      assert.match(explain,/DIAGRAM AND BOUNDARY CHECK/);
      assert.match(explain,/both sides of each axis/);
      assert.match(explain,/even if no mathematical-layout warning appears/);
      assert.match(explain,/WORKING AND MARKING CHECK/);
      assert.match(explain,/each relevant official marking point/);
      assert.match(explain,/taking the logarithm of the original expression before expanding/);
      for(const piece of record.question.parts){
        assert.ok(explain.includes('/page-'+piece.page+'.png'));
      }
      assert.match(hint,/without revealing them or the answer/);
      assert.doesNotMatch(hint,/WORKING AND MARKING CHECK|BEGIN EXTRACTED OFFICIAL MARKING TEXT/);
    }

  }
  if(level.directory==='AH/Maths-AH'){
    assert.match(sources['2024:2:1'].question.text,/sin7x/);
    assert.equal(sources['2024:2:1'].question.requiresVisualMath,true);
  }
  assert.equal(helper.sourcePrompt({y:2099,p:1,s:1,q:1},'hint',''),null);
}
assert.equal(questions,393);assert.equal(papers,60);assert.equal(pages,1001);assert.equal(prompts,786);
console.log(`PASS: ${questions} matched Mathematics questions, ${papers} unchanged PDFs, ${pages} page images, ${prompts} source-carrying prompts; legacy question matching, tall-expression boundaries and fractional-layout safeguards checked.`);
