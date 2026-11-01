/* Read Biology metadata without executing the explorer UI. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const levels=[
  {directory:'N5/N5-Biology',title:'National 5 Biology',code:'N5',combined:true},
  {directory:'Higher/Bi-H',title:'Higher Biology',code:'NH',combined:false},
  {directory:'AH/Bi-AH',title:'Advanced Higher Biology',code:'NAH',combined:true}
];
const marking=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(root,'assets/js/marking-availability.js'),'utf8'),marking);
for(const level of levels){
  level.unit='Paper';level.questionColumn=[45,74];level.questionMinimumPage=2;level.questionRight=556;
  level.expandQuestionTop=true;level.dataFile='biology-sources.js';level.dataGlobal='StemBiologySources';
  level.mcqTables=true;
  level.explorer=fs.readdirSync(path.join(root,level.directory)).find(f=>f.endsWith('Question-Explorer.html'));
  const html=fs.readFileSync(path.join(root,level.directory,level.explorer),'utf8');
  const context=vm.createContext({});
  vm.runInContext(html.slice(html.indexOf('const topicAreas='),html.indexOf('const year=')),context);
  const items=vm.runInContext('questions',context);
  level.questions=items.map(item=>{
    const {y:year,p:part,q,pg:page}=item;
    const pdf=level.code+'_Biology_'+(level.combined?'Section'+part:part===1?'Paper1-Multiple-choice':'Paper2')+'_'+year+'.PDF';
    const row={year,part,q,page,pdf,marking:marking.window.StemMarkingAvailability[level.directory][year+(level.combined?'':':'+part)]||null};
    if(level.directory==='AH/Bi-AH' && part===2 && q===1)row.supplement='NAH_Biology_Supplementary-sheet_'+year+'.PDF';
    return row;
  });
  delete level.code;

}
process.stdout.write(JSON.stringify(levels));
