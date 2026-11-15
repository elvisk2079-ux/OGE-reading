// Validate lesson data: node src/check.js
const fs = require("fs"), path = require("path");
let bad = 0;
for (const sec of ["headings", "tfns"]) {
  const dir = path.join(__dirname, "lessons", sec);
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith(".js")).sort()) {
    const L = new Function(fs.readFileSync(path.join(dir, f), "utf8") + "\nreturn L;")();
    const errs = [];
    if (L.words.length < 20 || L.words.length > 30) errs.push("words: " + L.words.length);
    const ids = L.words.map(w => w.id); ids.forEach((x, i) => { if (ids.indexOf(x) !== i) errs.push("dup id " + x); });
    L.words.forEach(w => { ["id","en","ru","pos","gap","ans"].forEach(k => { if (!w[k]) errs.push(w.id + " missing " + k); });
      if (w.gap && !w.gap.includes("___")) errs.push(w.id + " gap has no ___"); });
    (L.forms || []).forEach(x => { if (!x.o.includes(x.a)) errs.push("form answer not in options: " + x.s); if (!ids.includes(x.id)) errs.push("form id unknown: " + x.id); });
    const T = L.task; const text = (T.parts ? T.parts.map(p => p.t) : T.paras).join(" ").replace(/’/g, "'").toLowerCase();
    L.words.forEach(w => { const forms = [w.en, w.ans, ...(w.hl || [])].map(s => s.toLowerCase().replace(/’/g, "'"));
      if (!forms.some(s => new RegExp("\\b" + s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b").test(text))) errs.push(w.id + " not found in text"); });
    if (T.type === "headings") { if (Object.keys(T.key).length !== T.parts.length || T.questions.length !== 7 || !T.extra) errs.push("bad headings task");
      const used = Object.values(T.key); if (new Set(used).size !== used.length || used.includes(T.extra)) errs.push("key duplicates/extra"); }
    else if (!T.st || T.st.some(s => ![1,2,3].includes(s.a))) errs.push("bad tfns task");
    console.log((errs.length ? "✗ " : "✓ ") + sec + "/" + f + " — " + L.title + (errs.length ? "\n   " + errs.join("\n   ") : ""));
    bad += errs.length;
  }
}
process.exit(bad ? 1 : 0);
