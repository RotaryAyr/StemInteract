/* Full source coverage, section matching and offline prompt regressions. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const levels=JSON.parse(execFileSync(process.execPath,[path.join(root,'scripts/biology-source-index.cjs')]));
let pages=0,papers=0,questions=0,prompts=0,supplementPages=0;
for(const level of levels){
  const base=path.join(root,level.directory),ctx=vm.createContext({window:{},URL});
  vm.runInContext(fs.readFileSync(path.join(base,'biology-sources.js'),'utf8'),ctx);
  vm.runInContext(fs.readFileSync(path.join(root,'assets/js/biology-prompts.js'),'utf8'),ctx);
  const sources=ctx.window.StemBiologySources;
  const helper=ctx.window.StemBiology.forExplorer(level.directory,level.title,level.unit,'https://preview.example');
  const manifest=JSON.parse(fs.readFileSync(path.join(base,'readable/manifest.json')));
  assert.equal(Object.keys(sources).length,level.questions.length);
  const explorer=fs.readFileSync(path.join(base,level.explorer),'utf8');
  assert.ok(explorer.includes('biology-sources.js'));
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
      if(mode==='explain')assert.ok(prompt.includes(record.marking.text));
      for(const label of ['BIOLOGY GRAPH AND DRAWING CHECK:', 'BIOLOGY MARKING-POINT CHECK:', 'BIOLOGY EVIDENCE AND PRECISION CHECK:', 'BIOLOGY MULTIPLE-CHOICE AND OPTIONAL-QUESTION CHECK:']){
        assert.equal(prompt.includes(label),mode==='explain',key+' '+mode+' explanation safeguards must not leak into hint mode');
      }
      if(mode==='hint')assert.ok(!prompt.includes(record.marking.text),key+' must omit the actual marking payload');
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
  assert.match(helper.sourcePrompt({y:2026,p:2,q:1},'explain',''),/BIOLOGY VISUAL CHECK/);
  assert.match(helper.sourcePrompt({y:2026,p:2,q:1},'explain',''),/Official marking page .* image:/);
  if(level.directory==='N5/N5-Biology'){
    assert.equal(sources['2022:1:3'].question.parts[0].page,3);
    // Actual 2026 audit cases: correct key and listed alternative reach explanations;
    // neither is inserted into hints or replaced by a hard-coded tutor answer.
    const mcq=helper.sourcePrompt({y:2026,s:1,p:1,q:7},'explain','');
    assert.match(sources['2026:1:7'].marking.text,/7\.\s+D\s+1/);
    assert.ok(mcq.includes(sources['2026:1:7'].marking.text));
    assert.match(mcq,/verify the selected option against the matching official key/);
    const crop=helper.sourcePrompt({y:2026,s:2,p:2,q:13},'explain','');
    assert.match(crop,/Genetically modified\/GM crop/);
    assert.match(crop,/scientifically reasonable but not explicitly accepted/);
    assert.match(crop,/do not guarantee credit/);
    const graph=helper.sourcePrompt({y:2026,s:2,p:2,q:14},'explain','');
    assert.match(graph,/plot a line graph/);
    assert.match(graph,/Points plotted and line drawn/);
    assert.match(graph,/coordinates or prose alone are not a completed drawing/);
    assert.match(graph,/visible tick labels, axis labels, units, clipping and plotted positions/);
    assert.match(graph,/do not add an origin point when no datum is given/);
    assert.match(graph,/do not claim the drawing is complete or visually verified/);
    for(const [s,q]of [[1,7],[2,13],[2,14]]){
      const hint=helper.sourcePrompt({y:2026,s,p:s,q},'hint','');
      assert.ok(!hint.includes(sources['2026:'+s+':'+q].marking.text));
      assert.ok(!hint.includes('BIOLOGY GRAPH AND DRAWING CHECK:'));
    }
  }
  if(level.directory==='AH/Bi-AH'){
    assert.equal(sources['2024:1:4'].question.parts[0].page,3);
    const supplementManifest=JSON.parse(fs.readFileSync(path.join(base,'readable/supplements-manifest.json')));
    assert.equal(supplementManifest.length,5);
    for(const sheet of supplementManifest){
      assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(base,sheet.file))).digest('hex'),sheet.sha256);
      const html=fs.readFileSync(path.join(base,'readable',sheet.html),'utf8');
      for(let pg=1;pg<=sheet.pages;pg++){
        assert.ok(html.includes('id="page-'+pg+'"'));
        const image=fs.readFileSync(path.join(base,'readable',sheet.file.replace(/\.pdf$/i,''),'page-'+pg+'.png'));
        assert.equal(image.subarray(1,4).toString(),'PNG');supplementPages++;
      }
    }
    for(const year of [2022,2023,2024,2025,2026]){
      const record=sources[year+':2:1'];assert.ok(record.supplement.text.length>500);
      for(const mode of ['hint','explain']){
        const prompt=helper.sourcePrompt({y:year,p:2,q:1},mode,'');
        assert.ok(prompt.includes(record.supplement.text));
        assert.match(prompt,/Supplement PDF page 1 image: https:\/\/preview.example/);
        assert.match(prompt,/REQUIRED SUPPLEMENTARY SHEET/);
      }
      assert.equal(sources[year+':2:2'].supplement,undefined);
    }
  }
  // Missing marking guidance must not become fabricated requirements; hint mode
  // must remain answer-free even when a record has no marking resource.
  const fixtureKey=Object.keys(sources)[0], fixture=sources[fixtureKey];
  const [fixtureYear,fixturePart,fixtureQ]=fixtureKey.split(':').map(Number);
  const fixtureItem={y:fixtureYear,q:fixtureQ,p:fixturePart,s:fixturePart};
  const savedMarking=fixture.marking;
  try {
    delete fixture.marking;
    const fallback=helper.sourcePrompt(fixtureItem,'explain','No official marking instructions available.');
    assert.ok(fallback.includes(fixture.question.text));
    assert.ok(fallback.includes('without inventing official requirements'));
    assert.ok(!fallback.includes('BEGIN EXTRACTED OFFICIAL MARKING TEXT'));
    const hint=helper.sourcePrompt(fixtureItem,'hint','');
    assert.ok(!hint.includes('BIOLOGY MARKING-POINT CHECK:'));
    assert.ok(!hint.includes(savedMarking.text));
  } finally { fixture.marking=savedMarking; }
  assert.equal(helper.sourcePrompt({y:2099,p:1,s:1,q:1},'hint',''),null);
}
assert.equal(questions,570);assert.equal(papers,50);assert.equal(pages,987);assert.equal(supplementPages,20);assert.equal(prompts,1140);
console.log(`PASS: ${questions} matched Biology questions, ${papers} unchanged PDFs, ${pages} page images, ${prompts} source-carrying prompts; MCQ/written isolation, supplementary material, corrected page links and original-image safeguards checked.`);
