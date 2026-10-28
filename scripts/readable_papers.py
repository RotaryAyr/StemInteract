"""Shared conversion engine; original PDFs and page images remain authoritative."""
from pathlib import Path
import argparse
import hashlib
import html
import json
import os
import re
import subprocess
import textwrap

import pdfplumber
from pdfplumber.utils import extract_text
import pypdfium2 as pdfium
from reportlab.pdfbase._fontdata_enc_symbol import SymbolEncoding
from reportlab.pdfbase._glyphlist import _glyphname2unicode

ROOT = Path(__file__).resolve().parents[1]
SUPER = str.maketrans('0123456789+-−=()ni', '⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁻⁼⁽⁾ⁿⁱ')
SUB = str.maketrans('0123456789+-−=()aehijklmnoprstuvx', '₀₁₂₃₄₅₆₇₈₉₊₋₋₌₍₎ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓ')


def clean(text):
    return re.sub(r'\n{3,}', '\n\n', textwrap.dedent('\n'.join(line.rstrip() for line in text.splitlines())).strip())


def symbol(char):
    value = char['text']
    known_math_operator = len(value)==1 and ord(value)-0xf000 in {0x28,0x29,0x2b,0x2d,0x3d,0x3c,0x3e,0x5b,0x5d,0x7b,0x7d,0xb4,0xb8,0xd6,0xa3,0xb3,0xb1,0xa5,0xf2}
    if ('Symbol' in char['fontname'] or 'CIDFont' in char['fontname'] and known_math_operator) and len(value) == 1 and 0xf000 <= ord(value) <= 0xf0ff:
        name = SymbolEncoding[ord(value)-0xf000]
        if name in _glyphname2unicode:
            value = chr(_glyphname2unicode[name])
    return value


def readable_text(page, box=None, chemistry=False):
    """Decode known fonts and local raised/lowered glyphs without inferring math.

    Retain literal spaces and correct tiny matrix rotations. Fractions, vectors
    and genuine rotated labels still require the original page image.
    """
    region = page.crop(box) if box else page
    originals=[]
    for source in region.chars:
        char=dict(source)
        a,b,c,d,_,_=char['matrix']
        if a>0 and d>0 and abs(b)<.0001 and abs(c)<.0001:
            char['upright']=True
        originals.append(char)
    buckets={}
    for char in originals:
        if char['upright'] and symbol(char).isalnum():
            buckets.setdefault((int(char['x0']//24),int(char['top']//24)),[]).append(char)
    chars=[]
    for original in originals:
        char=dict(original)
        value=symbol(char)
        candidates=[]
        if char['upright'] and not value.isspace():
            bx,by=int(char['x0']//24),int(char['top']//24)
            for dx in [-1,0]:
                for dy in [-1,0,1]:
                    for base in buckets.get((bx+dx,by+dy),[]):
                        gap=char['x0']-base['x1']
                        if not (-1.5<=gap<=base['size']*1.6 and char['size']<base['size']*.83):
                            continue
                        script=None
                        if char['bottom']<base['bottom']-1.5 and char['top']>base['top']-base['size']*.9:
                            script='super'
                        elif char['top']>base['top']+base['size']*.25 and base['bottom']+(-.5 if chemistry and value.isdigit() and gap<2 else .3)<char['bottom']<base['bottom']+base['size']*.7:
                            script='sub'
                        if script:
                            candidates.append((abs(gap)+abs(char['top']-base['top']),script,base))
        if candidates:
            _,script,base=min(candidates,key=lambda entry:entry[0])
            converted=value.translate(SUPER if script=='super' else SUB)
            value=converted if converted!=value else ('^{' if script=='super' else '_{')+value+'}'
            # The Unicode representation now carries the script semantics. Move
            # it to its base line only in this temporary text extraction view.
            for attribute in ['top','bottom','doctop']:
                char[attribute]=base[attribute]
        char['text']=value
        chars.append(char)
    return clean(extract_text(chars,layout=True,layout_bbox=region.bbox,layout_width=region.width,layout_height=region.height,x_density=7.25,y_density=13) or '')


def identify(doc, items, marking, level):
    """Question starts use the main-number column, not numbered answer steps."""
    starts = []
    sections = sorted(set(row['part'] for row in items))
    for part in sections:
        expected = sorted((r for r in items if r['part']==part), key=lambda r:r['q'])
        first_page = (expected[0]['page'] or level.get('questionMinimumPage', 2)) if not marking else 2
        if marking and not level.get('mcqTables') and (level['unit']=='Section' or level.get('combined')) and part == 1:
            # N5 has numbered general principles before its actual MCQ table.
            first_page = next(pg for pg,p in enumerate(doc.pages,1) if len({int(w['text'][:-1]) for w in p.extract_words() if re.fullmatch(r'\d{1,2}\.',w['text']) and 65<w['x0']<85}) >= len(expected))
        low, high = ((210,240) if level['unit']=='Paper' and part==1 else (65,85) if level['unit']=='Section' and part==1 else (40,60)) if marking else (55,73)
        low, high = level.get('markingColumn' if marking else 'questionColumn', (low, high))
        if marking and level.get('chemistry'):
            low,high=(65,85) if level.get('combined') and part==1 else (200,240) if part==1 else (40,65)
            if level.get('combined') and part==2:
                first_page=next(pg for pg,p in enumerate(doc.pages,1) if len({int(w['text'][:-1]) for w in p.extract_words() if re.fullmatch(r'\d{1,2}\.',w['text']) and 65<w['x0']<85})>=sum(r['part']==1 for r in items))+1
        if marking and level.get('mcqTables'):
            low,high=(200,240) if part==1 else (40,65)
            if level.get('combined'):
                mcq_count=sum(r['part']==1 for r in items)
                tables=[]
                for page_index,p in enumerate(doc.pages,1):
                    words=p.extract_words()
                    for left,right in [(65,85),(200,240)]:
                        numbers={int(w['text'][:-1]) for w in words if re.fullmatch(r'\d{1,2}\.',w['text']) and left<w['x0']<right}
                        if set(range(1,mcq_count+1))<=numbers:tables.append((page_index,left,right))
                assert tables,(level['title'],'MCQ answer table not found')
                mcq_page,left,right=tables[0]
                if part==1:first_page,low,high=mcq_page,left,right
                else:first_page=mcq_page+1
        table_guard=marking and (level.get('markingTables') or (level.get('mcqTables') and part==2))
        found = []
        for pg in range(first_page, len(doc.pages)+1):
            page = doc.pages[pg-1]
            number_cells=[]
            if table_guard:
                for table in page.find_tables():
                    for cell in table.cells:
                        # Some schemes merge the three Question subcolumns.
                        # Notes span the entire table and must not be anchors.
                        if cell[0]<=65 and cell[2]-cell[0]<=110:
                            number_cells.append(cell)
            words=page.extract_words()
            # Some PDFs split a two-digit main number into "1" and "5.".
            # Join only adjacent number fragments in the main-number column.
            joined=[]
            for index,word in enumerate(words[:-1]):
                following=words[index+1]
                if re.fullmatch(r'\d',word['text']) and re.fullmatch(r'\d\.',following['text']) and low<=word['x0']<=high and following['x0']-word['x1']<4 and abs(word['top']-following['top'])<1:
                    joined.append({**word,'text':word['text']+following['text']})
            for word in sorted(words+joined,key=lambda w:(round(w['top']),w['x0'])):
                match = re.fullmatch(r'(\d{1,2})\.?' if table_guard else r'(\d{1,2})\.',word['text'])
                if not match or not (low <= word['x0'] <= high) or word['top']>=775:
                    continue
                if table_guard:
                    cx=(word['x0']+word['x1'])/2;cy=(word['top']+word['bottom'])/2
                    if not any(x0<=cx<=x1 and y0<=cy<=y1 for x0,y0,x1,y1 in number_cells):
                        continue
                q = int(match[1])
                if q == len(found)+1 and len(found)<len(expected):
                    top=word['top']-1
                    if level.get('expandQuestionTop'):
                        # A fraction, root or integral can rise above its main
                        # number. Include glyphs overlapping that number's line
                        # before using it as the previous question's boundary.
                        overlapping=[c['top']-1 for c in page.chars if c['x0']>word['x1']+4 and c['x1']<556 and c['top']<word['bottom'] and c['bottom']>word['top'] and c['top']>word['top']-50]
                        top=min([top,*overlapping])
                    found.append({'part':part,'q':q,'page':pg,'top':top})
            if len(found)==len(expected):
                break
        assert len(found)==len(expected), (level['title'], marking, part, len(found),len(expected))
        if not marking:
            assert all(not b['page'] or a['page']==b['page'] for a,b in zip(found,expected)), (level['title'],expected[0]['year'],part,'page index mismatch',[(a['q'],a['page'],b['page']) for a,b in zip(found,expected) if b['page'] and a['page']!=b['page']])
        starts.extend(found)
    return sorted(starts,key=lambda r:(r['page'],r['top']))


def question_spans(doc, starts, marking, part, level=None):
    end_page, end_top = len(doc.pages), min(785,doc.pages[-1].height-35)
    if not marking:
        for pg,page in enumerate(doc.pages,1):
            for line in page.extract_text_lines():
                if 'END OF QUESTION PAPER' in line['text']:
                    end_page,end_top=pg,line['top']
    result = []
    for index,start in enumerate(starts):
        stop = starts[index+1] if index+1<len(starts) else {'page':end_page,'top':end_top}
        pieces = []
        for pg in range(start['page'],stop['page']+1):
            page = doc.pages[pg-1]
            if pg != start['page'] and pg == stop['page'] and stop['top']<120:
                continue
            top = start['top'] if pg==start['page'] else 28
            bottom = stop['top'] if pg==stop['page'] else min(785,page.height-35)
            if bottom<=top:
                continue
            # Physics MCQ text can use the full width. Written papers reserve a
            # right sidebar; include the marks column but exclude that sidebar.
            right = min(page.width-20,556 if marking else (level or {}).get('questionRight',556 if part==1 else 530))
            box = (40,top,right,bottom)
            text = readable_text(page,box,chemistry=(level or {}).get('chemistry',False))
            if 'DO NOT WRITE ON THIS PAGE' in text or '[BLANK PAGE]' in text:
                continue
            text = clean('\n'.join(line for line in text.splitlines() if not re.search(r'\[Turn over|\[END OF (QUESTION PAPER|MARKING INSTRUCTIONS)\]',line)))
            if text:
                piece={'page':pg,'box':list(box),'text':text}
                if (level or {}).get('flagStackedMath'):
                    # Flag geometry, rather than guessing a flattened fraction.
                    # Graph lines may also trigger this conservative image check.
                    fraction=False
                    for edge in page.edges:
                        y=edge['top'];x0=edge['x0'];x1=edge['x1']
                        if edge.get('orientation')!='h' or not (3<=x1-x0<=150 and top<y<bottom and box[0]<=x0<x1<=right):
                            continue
                        nearby=[c for c in page.chars if x0-1<=c['x0'] and c['x1']<=x1+1 and abs((c['top']+c['bottom'])/2-y)<15 and not c['text'].isspace()]
                        above=any(c['bottom']<=y+1 for c in nearby)
                        below=any(c['top']>=y-1 for c in nearby)
                        if above and below:
                            fraction=True;break
                    piece['requiresVisualMath']=fraction
                pieces.append(piece)
        assert pieces,(start,'empty source')
        result.append((start,pieces))
    return result


def build(level, no_images=False):
    source = ROOT/level['directory']
    output = source/'readable'
    output.mkdir(exist_ok=True)
    (output/'papers.css').write_text((ROOT/'Higher/HB-H/readable/human-biology.css').read_text())
    old = output/'manifest.json'
    hashes = {r['file']:r['sha256'] for r in json.loads(old.read_text())} if old.exists() else {}
    records,manifest = {},[]
    files = sorted({row['pdf'] for row in level['questions']} | {row['marking'] for row in level['questions'] if row['marking']})
    for filename in files:
        marking = filename.startswith('mi_')
        items = [r for r in level['questions'] if r['marking' if marking else 'pdf']==filename]
        year = items[0]['year']
        part = items[0]['part']
        file = source/filename
        digest = hashlib.sha256(file.read_bytes()).hexdigest()
        title = f'{year} {level["title"]}' + (f' - {level["unit"]} {part}' if level['unit'] and not (marking and (level['unit']=='Section' or level.get('combined'))) else '') + (' marking instructions' if marking else ' questions')
        with pdfplumber.open(file) as doc:
            starts = identify(doc,items,marking,level)
            page_texts = [readable_text(p,chemistry=level.get('chemistry',False)) for p in doc.pages]
            # General principles precede the first answer table. Do not include
            # N5's multiple-choice answers among the general marking principles.
            principles = '\n\n'.join(page_texts[1:starts[0]['page']-1]) if marking else ''
            for start,pieces in question_spans(doc,starts,marking,part,level):
                key=f'{year}:{start["part"]}:{start["q"]}'
                record=records.setdefault(key,{})
                record['marking' if marking else 'question']={
                    'html':f'readable/{file.stem}.html#part-{start["part"]}-q-{start["q"]}',
                    'pdf':filename,'parts':pieces,
                    'text':'\n\n'.join(f'[PDF page {p["page"]}]\n{p["text"]}' for p in pieces),
                }
                if level.get('flagStackedMath'):
                    record['marking' if marking else 'question']['requiresVisualMath']=any(p.get('requiresVisualMath') for p in pieces)
                if marking:
                    record['marking']['principles']=principles
            image_dir=output/file.stem
            image_dir.mkdir(exist_ok=True)
            if not no_images:
                rendered=pdfium.PdfDocument(str(file))
                for pg in range(len(rendered)):
                    target=image_dir/f'page-{pg+1}.png'
                    if not target.exists() or hashes.get(filename)!=digest:
                        bitmap=rendered[pg].render(scale=1.5)
                        bitmap.to_pil().save(target,optimize=True)
                        bitmap.close()
                rendered.close()
            sections=[]
            nav=[]
            for start in starts:
                label=(f'{level["unit"]} {start["part"]}, ' if level['unit'] else '')+f'Question {start["q"]}'
                nav.append(f'<a href="#part-{start["part"]}-q-{start["q"]}">{label}</a>')
            for pg,text in enumerate(page_texts,1):
                anchors=''.join(f'<span class="question-anchor" id="part-{s["part"]}-q-{s["q"]}">{level["unit"]+" "+str(s["part"])+", " if level["unit"] else ""}Question {s["q"]}</span>' for s in starts if s['page']==pg)
                sections.append(f'<section id="page-{pg}"><h2>PDF page {pg}</h2>{anchors}<figure><a href="{file.stem}/page-{pg}.png"><img src="{file.stem}/page-{pg}.png" width="893" height="1263" loading="lazy" alt="Original {html.escape(title)}, PDF page {pg}; open the image for mathematical layout and diagrams."></a><figcaption>Original page image: preserves diagrams, equations, tables and symbols.</figcaption></figure><details open><summary>Selectable page text</summary><pre>{html.escape(text)}</pre></details></section>')
            document=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(title)} | StemInteract</title><link rel="stylesheet" href="papers.css"></head><body><main><nav><a href="../{level['explorer']}">{level['title']} explorer</a> · <a href="index.html">All readable papers</a> · <a href="../{filename}">Original PDF</a></nav><h1>{html.escape(title)}</h1><p>Source: Scottish Qualifications Authority (SQA) / Qualifications Scotland. This is a StemInteract HTML companion, not an official HTML edition. Selectable text is supplied alongside original page images. Use the images or original PDF for equations, powers, fractions, vector notation, tables and diagrams; text extraction cannot fully preserve mathematical layout.</p><details><summary>Jump to a question</summary><nav class="questions">{' '.join(nav)}</nav></details>{''.join(sections)}</main></body></html>'''
            (output/(file.stem+'.html')).write_text(document)
            manifest.append({'file':filename,'sha256':digest,'pages':len(doc.pages),'questions':len(starts),'html':file.stem+'.html'})
            print(level['title'],filename,len(doc.pages),'pages',flush=True)
    assert len(records)==len(level['questions']),(level['title'],len(records),len(level['questions']))
    for row in level['questions']:
        record=records[f'{row["year"]}:{row["part"]}:{row["q"]}']
        assert 'question' in record and ('marking' in record)==bool(row['marking']),row
    data=json.dumps(records,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
    (source/level.get('dataFile','physics-sources.js')).write_text('/* Generated from official PDFs by the readable-paper converter; do not edit. */\nwindow.'+level.get('dataGlobal','StemPhysicsSources')+'='+data+';\n')
    (output/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    links=''.join(f'<li><a href="{r["html"]}">{html.escape(r["file"].removesuffix(".PDF").removesuffix(".pdf").replace("_"," "))}</a> ({r["pages"]} pages)</li>' for r in manifest)
    (output/'index.html').write_text(f'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Readable {level["title"]} papers | StemInteract</title><link rel="stylesheet" href="papers.css"><main><nav><a href="../{level["explorer"]}">{level["title"]} explorer</a></nav><h1>{level["title"]} papers and marking instructions</h1><p>HTML companions with selectable text and original page images. Source: SQA / Qualifications Scotland, 2022–2026. These are StemInteract conversions; each page links to its official PDF. Use page images for mathematical layout and diagrams.</p><ul>{links}</ul></main></html>')
    print(level['title'],len(records),'matched sources;',sum(r['pages'] for r in manifest),'pages',flush=True)


