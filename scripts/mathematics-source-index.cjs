/* Read Mathematics metadata without executing the explorer UI. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const levels=[
  {directory:'N5/N5-Maths',title:'National 5 Mathematics',code:'N5',start:'const rows='},
  {directory:'Higher/Maths-H',title:'Higher Mathematics',code:'NH',start:'const legacy='},
  {directory:'AH/Maths-AH',title:'Advanced Higher Mathematics',code:'NAH',start:'const raw='}
];
const marking=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(root,'assets/js/marking-availability.js'),'utf8'),marking);
for(const level of levels){
  level.unit='Paper';level.questionColumn=[45,74];level.markingColumn=[35,65];level.questionMinimumPage=3;level.questionRight=556;level.expandQuestionTop=true;
  level.dataFile='mathematics-sources.js';level.dataGlobal='StemMathematicsSources';level.flagStackedMath=true;level.markingTables=true;
  level.explorer=fs.readdirSync(path.join(root,level.directory)).find(f=>f.endsWith('Question-Explorer.html'));
  const html=fs.readFileSync(path.join(root,level.directory,level.explorer),'utf8');
  const context=vm.createContext({});
  vm.runInContext(html.slice(html.indexOf(level.start),html.indexOf('const year=')),context);
  const items=vm.runInContext('questions',context);
  level.questions=items.map(item=>({year:item.y,part:item.p,q:item.q,page:item.pg||null,marks:item.m||null,
    pdf:level.code+'_Mathematics_Paper'+(item.p===1?'1-Non-calculator_':'2_')+item.y+'.PDF',
    marking:marking.window.StemMarkingAvailability[level.directory][item.y+':'+item.p]||null}));
  delete level.start;delete level.code;
}
process.stdout.write(JSON.stringify(levels));
