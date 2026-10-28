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
  if(level.directory==='N5/N5-Biology')assert.equal(sources['2022:1:3'].question.parts[0].page,3);
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
  assert.equal(helper.sourcePrompt({y:2099,p:1,s:1,q:1},'hint',''),null);
}
assert.equal(questions,570);assert.equal(papers,50);assert.equal(pages,987);assert.equal(supplementPages,20);assert.equal(prompts,1140);
console.log(`PASS: ${questions} matched Biology questions, ${papers} unchanged PDFs, ${pages} page images, ${prompts} source-carrying prompts; MCQ/written isolation, supplementary material, corrected page links and original-image safeguards checked.`);
