/* Read the existing authored indexes without running their page/UI scripts. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const levels = [
  {directory:'N5/N5-Physics',title:'National 5 Physics',unit:'Section'},
  {directory:'Higher/Ph-H',title:'Higher Physics',unit:'Paper'},
  {directory:'AH/Ph_AH',title:'Advanced Higher Physics',unit:''}
];
const context = vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(root,'assets/js/marking-availability.js'),'utf8'),context);
for (const level of levels) {
  level.explorer = fs.readdirSync(path.join(root,level.directory)).find(f=>f.endsWith('Question-Explorer.html'));
  const html = fs.readFileSync(path.join(root,level.directory,level.explorer),'utf8');
  const items = vm.runInNewContext(html.match(/const questions\s*=\s*(\[[\s\S]*?\]);/)[1]);
  level.questions = items.map(item=>{
    const year=item.y||2025,part=level.unit==='Section'?item.s:level.unit==='Paper'?item.p:0;
    const filename=part ? (level.unit==='Section'?'N5_Physics_Section'+part+'_':'NH_Physics_Paper'+(part===1?'1-Multiple-choice_':'2_'))+year+'.pdf':'NAH_Physics_QP_'+year+'.pdf';
    const catalogue=context.window.StemMarkingAvailability[level.directory];
    return {year,part,q:item.q,page:level.unit==='Section'?item.p:item.pg,marks:item.m,pdf:filename,marking:catalogue[year+(level.unit==='Paper'?':'+part:'')]||null};
  });
}
process.stdout.write(JSON.stringify(levels));
