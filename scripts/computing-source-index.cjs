/* Read Computing Science metadata without executing the explorer UI. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const levels=[
  {directory:'N5/N5-ComputingScience',title:'National 5 Computing Science',code:'N5'},
  {directory:'Higher/CpSc-H',title:'Higher Computing Science',code:'NH'},
  {directory:'AH/CpSc-AH',title:'Advanced Higher Computing Science',code:'NAH'}
];
const marking=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(root,'assets/js/marking-availability.js'),'utf8'),marking);
for(const level of levels){
  level.unit='';level.questionColumn=[45,74];level.markingColumn=[35,65];level.questionMinimumPage=2;level.questionRight=530;
  level.dataFile='computing-sources.js';level.dataGlobal='StemComputingSources';level.markingTables=true;level.literalText=true;
  level.explorer=fs.readdirSync(path.join(root,level.directory)).find(f=>f.endsWith('Question-Explorer.html'));
  const html=fs.readFileSync(path.join(root,level.directory,level.explorer),'utf8');
  const context=vm.createContext({});
  vm.runInContext(html.slice(html.indexOf('const topicAreas='),html.indexOf('const year=')),context);
  const items=vm.runInContext('questions',context);
  level.questions=items.map(item=>{
    const {y:year,q,pg:page}=item;
    return {year,part:0,q,page,pdf:level.code+'_Computing-Science_QP_'+year+'.PDF',marking:marking.window.StemMarkingAvailability[level.directory][year]||null};
  });
  delete level.code;

}
process.stdout.write(JSON.stringify(levels));
