/* Full source coverage, section matching and offline prompt regressions. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const levels=JSON.parse(execFileSync(process.execPath,[path.join(root,'scripts/physics-source-index.cjs')]));
let pages=0,papers=0,questions=0,prompts=0;
for(const level of levels){
  const base=path.join(root,level.directory),ctx=vm.createContext({window:{},URL});
  vm.runInContext(fs.readFileSync(path.join(base,'physics-sources.js'),'utf8'),ctx);
  vm.runInContext(fs.readFileSync(path.join(root,'assets/js/physics-prompts.js'),'utf8'),ctx);
  const sources=ctx.window.StemPhysicsSources;
  const helper=ctx.window.StemPhysics.forExplorer(level.directory,level.title,level.unit,'https://preview.example');
  const manifest=JSON.parse(fs.readFileSync(path.join(base,'readable/manifest.json')));
  assert.equal(Object.keys(sources).length,level.questions.length);
  const explorer=fs.readFileSync(path.join(base,level.explorer),'utf8');
  assert.ok(explorer.includes('physics-sources.js'));
  assert.ok(explorer.includes('readableQuestionUrl('));
  assert.ok(explorer.includes('mode="hint"'));
  assert.doesNotMatch(explorer,/<textarea readonly>['"]\+prompt\(/,'Source text must be assigned as text, not parsed as HTML');
  for(const item of manifest){
    const pdf=fs.readFileSync(path.join(base,item.file));
    assert.equal(crypto.createHash('sha256').update(pdf).digest('hex'),item.sha256);
    const html=fs.readFileSync(path.join(base,'readable',item.html),'utf8');
    for(let pg=1;pg<=item.pages;pg++){
      assert.ok(html.includes('id="page-'+pg+'"'));
      const image=fs.readFileSync(path.join(base,'readable',item.file.replace(/\.pdf$/,''),'page-'+pg+'.png'));
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
    assert.equal(record.question.parts[0].page,row.page);
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
      assert.match(prompt,/PHYSICS DIAGRAM CHECK/);
      assert.equal(prompt.includes('PHYSICS WORKING CHECK'),mode==='explain');
      assert.ok(prompt.includes(record.question.text));
      assert.ok(prompt.includes('https://preview.example/'+level.directory+'/'+record.question.html));
      assert.ok(prompt.includes('ask only for the specific diagram, formula or value'));
      assert.equal(prompt.includes('BEGIN EXTRACTED OFFICIAL MARKING TEXT'),mode==='explain');
      if(mode==='explain')assert.ok(prompt.includes(record.marking.text));
      prompts++;
    }
    questions++;
  }
  // N5 shares a marking PDF but its two Question 1s must never share answers.
  if(level.unit==='Section'){
    assert.match(sources['2026:1:1'].marking.text,/1\.\s+A\s+1/);
    assert.match(sources['2026:2:1'].marking.text,/Pythagoras/);
    assert.doesNotMatch(sources['2026:2:1'].marking.principles,/25\.\s+[ABCDE]\s+1/);
  }
  if(level.unit==='Paper'){
    assert.match(sources['2022:1:15'].question.text,/irradiance/);
    assert.match(sources['2026:2:1'].marking.text,/uₕ\s*=ucosθ/);
    assert.match(sources['2026:2:1'].marking.text,/v²\s*=u²\+2as/);
  }
  if(!level.unit){
    assert.match(sources['2024:0:1'].question.text,/v=2\.4\+13t−0\.69t²/);
    assert.match(sources['2024:0:1'].question.text,/m s⁻¹/);
    assert.ok(sources['2022:0:16'].question.parts.length>=4,'LC/RC question continuation retained');
    const repaired=sources['2026:0:8'];
    assert.ok(repaired.question.text.includes('p = sqrt(2*m*e*V)'));
    assert.ok(repaired.question.text.includes('λ = 1.228e-9/sqrt(V)'));
    assert.doesNotMatch(repaired.question.text,/p = 2meV/);
    assert.equal(repaired.question.verifiedTextCorrections.length,2);
    assert.equal(repaired.marking.verifiedTextCorrections.length,1);
    for(const field of ['question','marking']){
      const record=repaired[field];
      assert.ok(record.text.includes('λ = 1.228e-9/sqrt(V)'));
      const html=fs.readFileSync(path.join(base,record.html.split('#')[0]),'utf8');
      assert.ok(html.includes('λ = 1.228e-9/sqrt(V)'));
    }
    assert.ok(repaired.marking.text.includes('λ = 1.228e-9/sqrt(150) (1)'));
    assert.match(repaired.marking.text,/order of magnitude/);
    assert.match(repaired.marking.text,/Photoelectric|P hotoelectric/);
    for(const q of [8,14,15]){
      const record=sources['2026:0:'+q],item={y:2026,q,pg:record.question.parts[0].page};
      const explain=helper.sourcePrompt(item,'explain','');
      const hint=helper.sourcePrompt(item,'hint','');
      assert.ok(explain.includes(record.marking.text));
      assert.match(explain,/N-to-S.*conventional-current/);
      assert.match(explain,/Fleming’s left-hand rule/);
      assert.match(explain,/2\*N\*F\*\(d\/2\)/);
      assert.match(explain,/physically reasonable alternative/);
      assert.match(explain,/do not guarantee marks/);
      for(const piece of record.marking.parts){
        const image='readable/'+record.marking.pdf.replace(/\.pdf$/i,'')+'/page-'+piece.page+'.png';
        assert.ok(explain.includes(image));
      }
      assert.match(hint,/without supplying the force arrows/);
      assert.doesNotMatch(hint,/PHYSICS WORKING CHECK|BEGIN EXTRACTED OFFICIAL MARKING TEXT|Official marking page/);
      if(q===8){
        assert.ok(hint.includes('p = sqrt(2*m*e*V)'));
        assert.match(explain,/checked notation repairs in the marking transcription/);
        assert.doesNotMatch(hint,/λ = 1.228e-9\/sqrt\(150\) \(1\)/);
      }
    }
    assert.ok(!sources['2025:0:8'].question.verifiedTextCorrections);

  }
  assert.equal(helper.sourcePrompt({y:2099,p:1,s:1,q:1},'hint',''),null);
}
assert.equal(questions,474);assert.equal(papers,45);assert.equal(pages,1374);assert.equal(prompts,948);
console.log(`PASS: ${questions} matched Physics questions, ${papers} unchanged PDFs, ${pages} page images, ${prompts} source-carrying prompts; MCQ/written matching, continuations and mathematical notation checked.`);
