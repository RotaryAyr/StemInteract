/* Run: node tests/marking-resources.cjs (no third-party packages required). */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const shared = ['marking-availability.js', 'marking-resources.js'].map(f => fs.readFileSync(path.join(root, 'assets/js', f), 'utf8'));
function makeContext(values) {
  return vm.createContext({...values, AbortController, setTimeout, clearTimeout});
}
// Small DOM fixture: exercise page initialization and actual prompt functions,
// with link state verified independently of rendering/layout.
class Element {
  constructor() {
    this.options = []; this.value = 'all'; this.style = {}; this.attributes = {}; this.children = [];
    this.textContent = ''; this.innerHTML = '';
    const classes = new Set();
    this.classList = {add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x), toggle: (x, flag) => flag ? classes.add(x) : classes.delete(x)};
  }
  removeAttribute(x) { delete this.attributes[x]; delete this[x]; }
  setAttribute(x, value) { this.attributes[x] = value; }
  getAttribute(x) { return this.attributes[x] ?? this[x] ?? null; }
  insertAdjacentElement() {}
  addEventListener() {}
  appendChild(x) { this.children.push(x); }
  querySelector(selector) {
    const el = new Element();
    if (selector === 'h3') el.textContent = (this.innerHTML.match(/<h3>(.*?)<\/h3>/) || [,''])[1];
    return el;
  }
  querySelectorAll() { return []; }
}
async function main() {
const fetchPdf = async () => ({ok: true, body: {getReader: () => ({read: async () => ({value: Buffer.from('%PDF-'), done: false}), cancel: async () => {}})}});
let prompts = 0, links = 0, pages = 0;
const manifestContext = makeContext({window: {fetch: fetchPdf, location: {href: "https://steminteract.uk/"}}, URL});
shared.forEach(s => vm.runInContext(s, manifestContext));
const manifest = manifestContext.window.StemMarkingAvailability;
for (const [directory, files] of Object.entries(manifest)) {
  const pageFile = fs.readdirSync(path.join(root, directory)).find(f => f.endsWith('Question-Explorer.html'));
  const html = fs.readFileSync(path.join(root, directory, pageFile), 'utf8');
  const els = new Map();
  const get = id => { if (!els.has(id)) els.set(id, new Element()); return els.get(id); };
  for (const match of html.matchAll(/<select[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)) {
    const options = [...match[2].matchAll(/<option[^>]*value="([^"]+)"/g)];
    get(match[1]).value = options.length ? options[0][1] : 'all';
  }
  get('search').value = '';
  const document = {getElementById: get, createElement: () => new Element(), querySelector: () => ({textContent: html.match(/<h1>(.*?)<\/h1>/)[1]}), addEventListener() {}};
  const context = makeContext({window: {fetch: fetchPdf, location: {href: "https://steminteract.uk/"}}, URL, URLSearchParams, document, navigator: {}, location: {search: ''}, MutationObserver: class {observe() {}}, setTimeout() {}, console});
  shared.forEach(s => vm.runInContext(s, context));
  context.StemMarking = context.window.StemMarking;
  if (directory === 'Higher/HB-H') {
    for (const file of ['human-biology-sources.js', 'human-biology-prompts.js']) vm.runInContext(fs.readFileSync(path.join(root,directory,file),'utf8'), context);
  }
  if (['N5/N5-Physics','Higher/Ph-H','AH/Ph_AH'].includes(directory)) {
    vm.runInContext(fs.readFileSync(path.join(root,directory,'physics-sources.js'),'utf8'),context);
    vm.runInContext(fs.readFileSync(path.join(root,'assets/js/physics-prompts.js'),'utf8'),context);
  }
  if (['N5/N5-Maths','Higher/Maths-H','AH/Maths-AH'].includes(directory)) {
    vm.runInContext(fs.readFileSync(path.join(root,directory,'mathematics-sources.js'),'utf8'),context);
    vm.runInContext(fs.readFileSync(path.join(root,'assets/js/mathematics-prompts.js'),'utf8'),context);
  }
  if (['N5/N5-Chemistry','Higher/Ch-H','AH/Ch-AH'].includes(directory)) {
    vm.runInContext(fs.readFileSync(path.join(root,directory,'chemistry-sources.js'),'utf8'),context);
    vm.runInContext(fs.readFileSync(path.join(root,'assets/js/chemistry-prompts.js'),'utf8'),context);
  }
  if (['N5/N5-Biology','Higher/Bi-H','AH/Bi-AH'].includes(directory)) {
    vm.runInContext(fs.readFileSync(path.join(root,directory,'biology-sources.js'),'utf8'),context);
    vm.runInContext(fs.readFileSync(path.join(root,'assets/js/biology-prompts.js'),'utf8'),context);
  }
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(m => !/\bsrc=/.test(m[1]) && !/type="module"/.test(m[1]));
  try { scripts.forEach(m => vm.runInContext(m[2], context, {filename: directory + '/' + pageFile})); }
  catch (e) { throw new Error(directory + ': ' + e.stack); }
  const resource = context.StemMarking.forExplorer(directory);
  for (const [key, filename] of Object.entries(files)) {
    const pdf = path.join(root, directory, filename);
    assert.equal(fs.readFileSync(pdf).subarray(0, 5).toString(), '%PDF-', pdf);
    const [year, paper] = key.split(':');
    const link = new Element();
    await resource.updateLink(link, year, paper);
    assert.equal(link.href, filename);
    assert.equal(link.getAttribute('aria-disabled'), null);
    // Missing -> present -> all -> present must restore both link and accessibility.
    await resource.updateLink(link, '2099', paper);
    assert.equal(link.href, undefined);
    assert.equal(link.getAttribute('aria-disabled'), 'true');
    assert.match(link.textContent, /Marking instructions unavailable for this paper/);
    await resource.updateLink(link, year, paper);
    assert.equal(link.href, filename);
    assert.equal(link.style.pointerEvents, '');
    await resource.updateLink(link, 'all', 'all');
    assert.equal(link.href, undefined);
    assert.equal(link.getAttribute('aria-disabled'), 'true');
    await resource.updateLink(link, year, paper);
    assert.equal(link.href, filename);
    links++;
  }
  const items = vm.runInContext('questions', context);
  const hint = vm.runInContext('typeof hintPrompt === "function" ? hintPrompt : typeof tutorPrompt === "function" ? tutorPrompt : prompt', context);
  const explain = vm.runInContext('explainPrompt', context);
  for (const item of items) {
    const filename = resource.file(item.y || 2025, item.p || item.s);
    for (const generate of [hint, explain]) {
      const text = generate(item);
      assert.match(text, /Marking-resource guidance:/, directory);
      assert.match(text, /When official instructions are missing or unreadable, continue helping/);
      assert.match(text, /Do not claim official marking points or marks earned/);
      assert.match(text, /not an official marking scheme/);
      const source = directory.includes('English-H') ? new URL(context.questionFile(item.y) + '#page=' + item.pg, 'https://steminteract.uk/' + directory + '/').href : new URL(context.questionUrl(item), 'https://steminteract.uk/' + directory + '/').href;
      assert.ok(text.includes(source), 'Exact question PDF/page context retained: ' + directory);
      if (filename) {
        assert.ok(text.includes(new URL(filename, 'https://steminteract.uk/' + directory + '/').href));
        assert.match(text, /If the link fails/);
      } else {
        assert.match(text, /unavailable on this site for this paper/);
        assert.doesNotMatch(text, /https:\/\/\S*mi_\S*\.pdf/i);
      }
      assert.doesNotMatch(text, /following checked marking-guidance summary/);
      prompts++;
    }
  }
  // New year must fall back regardless of publication date assumptions.
  const missing = resource.prompt({...items[0], y: 2099});
  assert.match(missing, /unavailable on this site/);
  assert.doesNotMatch(missing, /not yet published|mi_.*2099/);
  pages++;
}
// Distinguish individual papers, including a missing paper in an otherwise available year.
manifestContext.window.StemMarkingAvailability.fixture = {'2030:1': 'paper1.pdf'};
const fixture = manifestContext.window.StemMarking.forExplorer('fixture');
assert.equal(fixture.file(2030, 1), 'paper1.pdf');
assert.equal(fixture.file(2030, 2), null);
assert.match(fixture.prompt({y: 2030, p: 2}), /unavailable on this site/);
// Listed file can disappear, return an HTML error page, or fail to load.
for (const failure of ['404', 'html', 'network']) {
  const ctx = makeContext({window: {location: {href: 'https://steminteract.uk/'}, fetch: async () => {
    if (failure === 'network') throw new Error('offline');
    return {ok: failure !== '404', body: {getReader: () => ({read: async () => ({value: Buffer.from('<html>'), done: false}), cancel: async () => {}})}};
  }}, URL});
  shared.forEach(source => vm.runInContext(source, ctx));
  const link = new Element();
  await ctx.window.StemMarking.forExplorer('AH/Ph_AH').updateLink(link, '2025');
  assert.equal(link.href, undefined);
  assert.equal(link.textContent, 'Marking instructions unavailable for this paper.');
}
// Changing selection during a slow request must not restore an obsolete link.
let finish;
const race = makeContext({window: {location: {href: 'https://steminteract.uk/'}, fetch: () => new Promise(resolve => { finish = () => resolve(fetchPdf()); })}, URL});
shared.forEach(source => vm.runInContext(source, race));
const raceResource = race.window.StemMarking.forExplorer('AH/Ph_AH'), raceLink = new Element();
const pending = raceResource.updateLink(raceLink, '2025');
await raceResource.updateLink(raceLink, '2099');
finish(); await pending;
assert.equal(raceLink.href, undefined);
assert.equal(raceLink.textContent, 'Marking instructions unavailable for this paper.');
console.log(`PASS: ${pages} pages initialized; ${prompts} real hint/explanation prompts; ${links} PDF links and state transitions; future-year and missing-paper fallbacks.`);

}
main().catch(error => { console.error(error); process.exitCode = 1; });
