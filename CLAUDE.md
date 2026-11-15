# OGE-reading — vocabulary lessons from real OGE reading texts

Site: https://elvisk2079-ux.github.io/OGE-reading/ (GitHub Pages, branch `main`, root).
Owner: Elena, an English teacher (Russian-speaking). Students are 9th-graders at roughly A2–B1 level, preparing for the OGE. Lessons are shared in a VK group.

## Layout
- `src/source/oge-reading-texts.txt` — the reading section of the FIPI OGE book (text only, no keys).
  - Every task starts with a line ending in a 6-character ID, e.g. `... - F6224C`.
  - Tasks 1–26 (in file order) are **headings** tasks (“Reading (headings)”): questions 1–7 + texts A–F.
  - Tasks 27–51 are **True / False / Not stated** tasks (“Reading (TFNS)”): a title, the text, statements 1–7 (each followed by “1) True 2) False 3) Not stated”).
- `src/lessons/headings/hNN.js` — headings task N (h01 = task 1 … h26 = task 26).
- `src/lessons/tfns/tNN.js` — TFNS task N (t01 = task 27 … t25 = task 51).
- `src/engine.js`, `src/style.css` — the shared lesson engine (do not change unless asked).
- `src/build.py` — builds `index.html`, `headings/*.html`, `tfns/*.html`. Run `python3 src/build.py`.
- `src/check.js` — validates every lesson file. Run `node src/check.js`; it must print only ✓ lines.

## Lesson file format
Copy the shape of an existing file exactly (see `src/lessons/headings/h06.js` and `src/lessons/tfns/t01.js`):
- `id` (“h11”, “t06”…), `title` (“English Title — Русское название”), `sub` (“30 новых слов из текста ОГЭ «English Title».”).
- Titles are fixed in `src/source/titles.md` (Elena has pictures made for them) — use exactly that title for each number.
- `words`: **exactly 30** words/phrases, in the order they appear in the text (the engine splits them into three parts of 10).
  - `id` (unique, short latin), `en` (dictionary form), `ru` (short Russian translation, 1–2 variants), `pos` (`v`, `n`, `adj`, `adv`, `prep`, `ph`),
  - `gap`: a sentence taken from the text with the word replaced by `___`; `ans`: the exact form that fills the gap (as it appears in the text, capitalised if sentence-initial),
  - `hl`: other forms of the word that appear in the text (for highlighting), `alt`: other accepted typed answers (e.g. phrase variants).
  - Choose words a weak A2 student may not know: A2–B1 verbs first, then useful nouns, adjectives, phrasal verbs and set phrases. Skip proper names, very easy A1 words and rare B2+ words.
- `forms`: 12–18 “choose the correct form” items about this lesson’s words (`id` must be one of the word ids): tense forms, irregular verbs, word families (-ful/-less, -ed/-ing, noun/verb/adjective), prepositions after verbs/adjectives, verb + to / verb + -ing. Add a short Russian `ru` rule where it helps. Every `a` must be one of `o`. New simple sentences, not from the text.
- `task`:
  - headings: `type: "headings"`, `questions` (7, copied exactly), `parts` (A–F texts copied exactly from the book, joined into single lines, keep ’ quotes), `key` {A..F: question number}, `extra` (the unused question).
  - tfns: `type: "tfns"`, `title`, `paras` (paragraphs copied exactly), `st` [{s: statement, a: 1 True / 2 False / 3 Not stated}].
  - The book has no answer keys — work out every answer yourself from the text, carefully. Not stated = the text says nothing about it.

## Daily routine (scheduled task: 5 lessons per day)
1. `git pull`. Look at which lesson files exist. The next lessons are the lowest missing numbers: first headings h01…h26, then tfns t01…t25.
2. Make the next **5** lessons (if fewer remain, make what is left). If all 51 exist, do nothing and report that the series is complete.
3. `node src/check.js` (fix until all ✓), then `python3 src/build.py`.
4. Commit (“Add lessons hNN–hNN”) and push to `main`.
5. Google Drive backup (Google Drive connector): upload each new lesson's built HTML as a file named like `11 Christmas Traditions.html` (two-digit number + English title, mimeType text/html, no conversion; upload via a `sha256:<hash>:<path>` file reference, never by pasting the HTML):
   - headings → folder «ОГЭ / Reading / Reading Task 1», id `1GHhDTF24oM5jdcmoYezRMj_GmamFrRaU`
   - tfns → folder «ОГЭ / Reading / True False Not Stated», id `1fi5rsqCmNhjin8xOy_wJfiaFsCsu42Qc`
   Then add the new lines (`NN Title — <link>`) to the Google Doc «Ссылки на уроки — Reading», id `1Le_BZ1YAv-SE9-ZLXdCdzxhTY2WAjCZ9y4YY3Gr7ZsU`, in the right section, keeping all existing lines.
6. Report in Russian: the titles added, their links (`https://elvisk2079-ux.github.io/OGE-reading/headings/<slug>.html`), the answer keys you used (so Elena can check them), and how many lessons remain.
