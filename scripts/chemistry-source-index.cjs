/* Read Mathematics metadata without executing the explorer UI. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const levels=[
  {directory:'N5/N5-Chemistry',title:'National 5 Chemistry',code:'N5',combined:true},
  {directory:'Higher/Ch-H',title:'Higher Chemistry',code:'NH',combined:false},
  {directory:'AH/Ch-AH',title:'Advanced Higher Chemistry',code:'NAH',combined:true}
];
const marking=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(root,'assets/js/marking-availability.js'),'utf8'),marking);
for(const level of levels){
  level.unit='Paper';level.questionColumn=[45,74];level.questionMinimumPage=2;level.questionRight=556;
  level.expandQuestionTop=true;level.dataFile='chemistry-sources.js';level.dataGlobal='StemChemistrySources';
  level.chemistry=true;
  level.explorer=fs.readdirSync(path.join(root,level.directory)).find(f=>f.endsWith('Question-Explorer.html'));
  const html=fs.readFileSync(path.join(root,level.directory,level.explorer),'utf8');
  const raw=vm.runInNewContext(html.match(/const raw=(\[[\s\S]*?\]);/)[1]);
  level.questions=raw.map(row=>{
    const [year,part,q,page]=row.split(':')[0].split('-').map(Number);
    const pdf=level.code+'_Chemistry_'+(level.combined?'Section'+part:part===1?'Paper1-Multiple-choice':'Paper2')+'_'+year+'.PDF';
    return {year,part,q,page,pdf,marking:marking.window.StemMarkingAvailability[level.directory][year+(level.combined?'':':'+part)]||null};
  });
  delete level.code;

}
process.stdout.write(JSON.stringify(levels));
