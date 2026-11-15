import os, re, html, glob, json, subprocess
base = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(base)
css = open(os.path.join(base, 'style.css')).read(); eng = open(os.path.join(base, 'engine.js')).read()
e = html.escape
FONT = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap">'
HEAD = '<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
SECTIONS = [("headings", "Тексты с заголовками", "Задание 1 по чтению: подбери вопрос к каждому тексту."),
            ("tfns", "True / False / Not stated", "Задание 2 по чтению: верно, неверно или в тексте не сказано.")]
def slug(t): return re.sub(r'[^a-z0-9]+', '-', t.split('—')[0].strip().lower()).strip('-')
def card(href, eyebrow, title, note):
    return f'<a class="ex" style="display:block;text-decoration:none;color:inherit" href="{href}"><p class="eyebrow">{e(eyebrow)}</p><h2>{e(title)}</h2><p class="note">{e(note)}</p></a>'
for sec, sname, sdesc in SECTIONS:
    out = os.path.join(root, sec); os.makedirs(out, exist_ok=True)
    rows = []
    for n, f in enumerate(sorted(glob.glob(os.path.join(base, 'lessons', sec, '*.js'))), 1):
        src = open(f).read()
        m = json.loads(subprocess.check_output(['node', '-e', src + '\nconsole.log(JSON.stringify({id:L.id,title:L.title,sub:L.sub,n:L.words.length,img:L.img||""}))']))
        sl = slug(m['title']); eyebrow = f"ОГЭ · {sname} · Текст {n}"; short = f"{sname} · Текст {n} · {m['title'].split('—')[0].strip()}"
        img = f'<img class="cover" src="{e(m["img"])}" alt="">' if m['img'] else ''
        page = f'''{HEAD}<title>{e(m["title"].split("—")[0].strip())} · ОГЭ · слова</title>{FONT}<style>{css}</style></head><body>
<header class="hero wrap"><p class="eyebrow"><a href="./" style="color:inherit;text-decoration:none">← {e(sname)}</a> · Текст {n}</p><h1>{e(m["title"])}</h1><p class="sub">{e(m["sub"])}</p>{img}</header>
<div class="bar"><div class="wrap"><nav class="tabs" id="tabs"></nav><div class="prog"><div class="track"><div class="fill" id="fill"></div></div><span class="count" id="cnt"></span></div></div></div>
<main class="wrap" id="main"></main>
<footer class="wrap"><a href="./" style="color:inherit">Все тексты</a> · Ответы сохраняются в этом браузере</footer>
<script>
{src}
L.eyebrow = {json.dumps(eyebrow, ensure_ascii=False)}; L.short = {json.dumps(short, ensure_ascii=False)};
{eng}
</script></body></html>'''
        open(os.path.join(out, sl + '.html'), 'w').write(page)
        rows.append(card(sl + '.html', f"Текст {n}", m['title'], f"{m['n']} новых слов"))
    idx = f'''{HEAD}<title>{e(sname)} · ОГЭ · слова</title>{FONT}<style>{css}</style></head><body>
<header class="hero wrap"><p class="eyebrow"><a href="../" style="color:inherit;text-decoration:none">← ОГЭ · Чтение</a></p><h1>{e(sname)}</h1><p class="sub">{e(sdesc)} В каждом тексте 30 новых слов и задание ОГЭ.</p></header>
<main class="wrap">{''.join(rows)}</main><footer class="wrap">«Чемоданчик учителя английского»</footer></body></html>'''
    open(os.path.join(out, 'index.html'), 'w').write(idx)
    print(sec, len(rows))
home = f'''{HEAD}<title>ОГЭ · Чтение · слова по текстам</title>{FONT}<style>{css}</style></head><body>
<header class="hero wrap"><p class="eyebrow">ОГЭ · Английский</p><h1>Чтение: слова по текстам ОГЭ</h1><p class="sub">Настоящие тексты ОГЭ. К каждому — 30 новых слов, упражнения и само задание.</p></header>
<main class="wrap">{''.join(card(s + '/', 'ОГЭ · Чтение', n, d) for s, n, d in SECTIONS)}</main><footer class="wrap">«Чемоданчик учителя английского»</footer></body></html>'''
open(os.path.join(root, 'index.html'), 'w').write(home)
