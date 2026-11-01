"""Build required AH supplementary sheets without altering their official PDFs."""
import hashlib,html,json
from pathlib import Path
import pdfplumber,pypdfium2 as pdfium
from readable_papers import ROOT,readable_text

def build_supplements(level,no_images=False):
    rows=[r for r in level['questions'] if r.get('supplement')]
    if not rows:return
    source=ROOT/level['directory'];output=source/'readable'
    manifest_file=output/'supplements-manifest.json'
    old={r['file']:r['sha256'] for r in json.loads(manifest_file.read_text())} if manifest_file.exists() else {}
    data_file=source/level['dataFile'];data=data_file.read_text();records=json.loads(data[data.index('=')+1:].rstrip().rstrip(';'))
    manifest=[]
    for row in rows:
        name=row['supplement'];file=source/name;digest=hashlib.sha256(file.read_bytes()).hexdigest();image_dir=output/file.stem;image_dir.mkdir(exist_ok=True)
        title=f'{row["year"]} Advanced Higher Biology supplementary sheet'
        with pdfplumber.open(file) as doc:
            pieces=[{'page':i,'text':readable_text(p)} for i,p in enumerate(doc.pages,1)]
        if not no_images:
            rendered=pdfium.PdfDocument(str(file))
            for i in range(len(rendered)):
                target=image_dir/f'page-{i+1}.png'
                if not target.exists() or old.get(name)!=digest:
                    bitmap=rendered[i].render(scale=1.5);bitmap.to_pil().save(target,optimize=True);bitmap.close()
            rendered.close()
        sections=''.join(f'<section id="page-{p["page"]}"><h2>PDF page {p["page"]}</h2><figure><a href="{file.stem}/page-{p["page"]}.png"><img src="{file.stem}/page-{p["page"]}.png" width="893" height="1263" loading="lazy" alt="Original {title}, page {p["page"]}"></a></figure><details open><summary>Selectable page text</summary><pre>{html.escape(p["text"])}</pre></details></section>' for p in pieces)
        target=file.stem+'.html'
        (output/target).write_text(f'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title} | StemInteract</title><link rel="stylesheet" href="papers.css"><main><nav><a href="../{level["explorer"]}">Advanced Higher Biology explorer</a> · <a href="index.html">All readable papers</a> · <a href="../{name}">Original PDF</a></nav><h1>{title}</h1><p>Source: SQA / Qualifications Scotland. This is a StemInteract HTML companion, not an official HTML edition. Use the original images for figures, graphs and table layout.</p>{sections}</main></html>')
        records[f'{row["year"]}:2:1']['supplement']={'pdf':name,'html':'readable/'+target,'parts':pieces,'text':'\n\n'.join(f'[Supplement PDF page {p["page"]}]\n{p["text"]}' for p in pieces)}
        manifest.append({'file':name,'sha256':digest,'pages':len(pieces),'html':target})
    data_file.write_text('/* Generated from official PDFs; do not edit. */\nwindow.'+level['dataGlobal']+'='+json.dumps(records,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')+';\n')
    manifest_file.write_text(json.dumps(manifest,indent=2)+'\n')
    archive=output/'index.html';text=archive.read_text();links=''.join(f'<li><a href="{r["html"]}">{r["file"]}</a> ({r["pages"]} pages)</li>' for r in manifest)
    archive.write_text(text.replace('</main>','<h2>Required supplementary sheets</h2><ul>'+links+'</ul></main>'))
    print('Advanced Higher Biology',len(manifest),'supplementary sheets;',sum(r['pages'] for r in manifest),'pages',flush=True)
