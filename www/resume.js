/* السيرة: رفع سيرة جاهزة أو إنشاء سيرة بقواعد المصداقية، وتصدير Word */
(function () {
  const { esc, f, lbl } = App;
  const STRONG = /(قدت|قاد |نفّذت|نفذت|أصدرت|اصدرت|أنشأت|انشأت|حققت|أدرت|ادرت|طبّقت|طبقت|صممت|صمّمت|أطلقت|اطلقت|\b(led|lead|executed|issued|achieved|managed|delivered|implemented|designed|launched|built|owned|drove)\b)/i;
  const DIGIT = /[0-9٠-٩]/;
  const LANG_LEVELS = ['لغة أم (Native)', 'محترف (Professional Working Proficiency)', 'محادثة (Conversational)', 'أساسي (Basic)'];
  const D = () => App.state.resume.data;

  function validate() {
    const d = D(), r = App.state.resume, p = App.state.profile, out = [];
    const E = m => out.push({ t: 'e', msg: m }), W = m => out.push({ t: 'w', msg: m });
    if (!p.name_ar && !p.name_en) E('اكتب اسمك في «معاييري وبياناتي».');
    if (!p.phone || !p.email) E('الجوال والبريد مطلوبان في «معاييري وبياناتي».');
    if (!d.summary.trim()) W('الملخص المهني فارغ.');
    if (!d.experience.length) E('أضف خبرة واحدة على الأقل.');
    d.experience.forEach((x, i) => {
      const n = `الخبرة ${i + 1}`;
      if (!x.title || !x.org || !x.city || !x.start) E(`${n}: المسمى والجهة والمدينة وتاريخ البدء مطلوبة (المسمى كما في العقد).`);
      if (!x.current && !x.end) E(`${n}: اكتب تاريخ الانتهاء أو علّم «ما زلت أعمل هنا».`);
      (x.bullets || []).forEach((b, j) => {
        const m = `${n} / نقطة ${j + 1}`;
        if (!b.text.trim()) { E(`${m}: فارغة.`); return; }
        if (DIGIT.test(b.text) && !(b.numberSource || '').trim()) E(`${m}: فيها رقم بلا مصدر. اكتب من أين الرقم.`);
        if (STRONG.test(b.text) && !b.confirm) E(`${m}: فيها فعل قوي (قدت/نفّذت/أصدرت...). أكّد أنك فعلاً قمت بهذا الدور، أو غيّر الفعل (مثل: نسّقت، ساهمت، اقترحت).`);
        if (b.status === 'pending' && !/بانتظار|قيد|مراجعة|pending|under review|awaiting/i.test(b.text)) W(`${m}: حالتها «لم يُعتمد بعد» فاكتب ذلك في النص، مثل «(بانتظار اعتماد الإدارة)».`);
      });
    });
    d.breaks.forEach((x, i) => { if (!x.from || !x.to || !(x.what || '').trim()) E(`فترة الانقطاع ${i + 1}: اكتب التواريخ وماذا فعلت فيها.`); });
    d.certs.forEach((x, i) => { if (!x.name || !x.body || !x.date || !x.level) E(`الشهادة ${i + 1}: الاسم والجهة والتاريخ والمستوى الحقيقي مطلوبة.`); });
    d.languages.forEach((x, i) => { if (!x.lang || !x.level) E(`اللغة ${i + 1}: اكتب اللغة والمستوى.`); });
    if (!d.languages.length) W('لم تضف لغات.');
    return out;
  }

  const H = {
    ar: { summary: 'الملخص المهني', comp: 'الجدارات الأساسية', exp: 'الخبرة المهنية', sys: 'الأنظمة والمنصات', sysCore: 'أساسية', sysBasic: 'إلمام أساسي (Basic)', edu: 'التعليم والشهادات', lang: 'اللغات', brk: 'فترة انقطاع عن العمل', present: 'حتى الآن' },
    en: { summary: 'Professional Summary', comp: 'Core Competencies', exp: 'Professional Experience', sys: 'Systems & Platforms', sysCore: 'Proficient', sysBasic: 'Basic familiarity', edu: 'Education & Certifications', lang: 'Languages', brk: 'Career Break', present: 'Present' }
  };
  const lines = s => (s || '').split('\n').map(x => x.trim()).filter(Boolean);
  const fmtM = m => m ? m.slice(5, 7) + '/' + m.slice(0, 4) : '';

  function model() {
    const d = D(), r = App.state.resume, p = App.state.profile, h = H[r.lang];
    const name = r.lang === 'en' ? (p.name_en || p.name_ar) : (p.name_ar || p.name_en);
    const blocks = [];
    blocks.push({ k: 'title', t: name });
    if (r.headline) blocks.push({ k: 'sub', t: r.headline });
    blocks.push({ k: 'sub', t: [p.city, p.phone, p.email, p.linkedin].filter(Boolean).join('  |  ') });
    if (d.summary.trim()) { blocks.push({ k: 'h', t: h.summary }); blocks.push({ k: 'p', t: d.summary.trim() }); }
    const comp = lines(d.competencies);
    if (comp.length) { blocks.push({ k: 'h', t: h.comp }); comp.forEach(c => blocks.push({ k: 'b', t: c })); }
    const entries = [
      ...d.experience.map(x => ({ s: x.start, x, type: 'job' })),
      ...d.breaks.map(x => ({ s: x.from, x, type: 'brk' }))
    ].sort((a, b) => (b.s || '').localeCompare(a.s || ''));
    if (entries.length) {
      blocks.push({ k: 'h', t: h.exp });
      entries.forEach(({ x, type }) => {
        if (type === 'brk') {
          blocks.push({ k: 'role', t: `${h.brk} | ${fmtM(x.from)} - ${fmtM(x.to)}` }); blocks.push({ k: 'b', t: x.what.trim() });
        } else {
          blocks.push({ k: 'role', t: `${x.title} | ${x.org}${x.city ? '، ' + x.city : ''}` });
          blocks.push({ k: 'dates', t: `${fmtM(x.start)} - ${x.current ? h.present : fmtM(x.end)}` });
          (x.bullets || []).forEach(b => blocks.push({ k: 'b', t: b.text.trim() }));
        }
      });
    }
    const sc = lines(d.systemsCore), sb = lines(d.systemsBasic);
    if (sc.length || sb.length) {
      blocks.push({ k: 'h', t: h.sys });
      if (sc.length) blocks.push({ k: 'p', t: `${h.sysCore}: ${sc.join('، ')}` });
      if (sb.length) blocks.push({ k: 'p', t: `${h.sysBasic}: ${sb.join('، ')}` });
    }
    if (d.certs.length) {
      blocks.push({ k: 'h', t: h.edu });
      [...d.certs].sort((a, b) => (b.date || '').localeCompare(a.date || '')).forEach(c => blocks.push({ k: 'b', t: `${c.name} — ${c.body} (${fmtM(c.date)}) — ${c.level}` }));
    }
    if (d.languages.length) { blocks.push({ k: 'h', t: h.lang }); d.languages.forEach(l => blocks.push({ k: 'b', t: `${l.lang}: ${l.level}` })); }
    return blocks;
  }

  const X = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  async function buildDocx() {
    const rtl = App.state.resume.lang === 'ar';
    const run = (t, o = {}) => `<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>${o.b ? '<w:b/><w:bCs/>' : ''}${o.c ? `<w:color w:val="${o.c}"/>` : ''}<w:sz w:val="${o.s || 21}"/><w:szCs w:val="${o.s || 21}"/>${rtl ? '<w:rtl/>' : ''}</w:rPr><w:t xml:space="preserve">${X(t)}</w:t></w:r>`;
    const para = (inner, o = {}) => `<w:p><w:pPr>${rtl ? '<w:bidi/>' : ''}<w:spacing w:before="${o.before || 0}" w:after="${o.after == null ? 60 : o.after}"/>${o.ind ? `<w:ind w:start="${o.ind}" w:hanging="${o.hang || 0}"/>` : ''}${o.center ? '<w:jc w:val="center"/>' : ''}</w:pPr>${inner}</w:p>`;
    const body = model().map(b => {
      switch (b.k) {
        case 'title': return para(run(b.t, { b: 1, s: 36, c: '0F4C5C' }), { center: 1, after: 40 });
        case 'sub': return para(run(b.t, { s: 20, c: '444444' }), { center: 1, after: 40 });
        case 'h': return para(run(b.t, { b: 1, s: 24, c: '0F4C5C' }), { before: 200, after: 80 });
        case 'role': return para(run(b.t, { b: 1, s: 22 }), { before: 120, after: 0 });
        case 'dates': return para(run(b.t, { s: 19, c: '666666' }), { after: 40 });
        case 'b': return para(run('• ' + b.t), { ind: 360, hang: 220, after: 40 });
        default: return para(run(b.t));
      }
    }).join('');
    const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="850" w:right="900" w:bottom="850" w:left="900" w:header="400" w:footer="400" w:gutter="0"/>${rtl ? '<w:bidi/>' : ''}</w:sectPr></w:body></w:document>`;
    const z = new JSZip();
    z.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
    z.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
    z.file('word/document.xml', doc);
    return z.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }
  App.resumeModel = model; App.resumeValidate = validate; App.buildDocx = buildDocx;

  const bulletHtml = (i, j) => {
    const b = D().experience[i].bullets[j], base = `resume.data.experience.${i}.bullets.${j}`;
    App._need[base + '.text'] = DIGIT.test(b.text) || STRONG.test(b.text);
    return `<div class="item">
      ${f(base + '.text', { type: 'textarea', ph: 'نقطة تبدأ بفعل يطابق دورك الحقيقي' })}
      <div class="row" style="margin-top:6px">${f(base + '.status', { type: 'select', options: [['done', 'منجز'], ['pending', 'لم يُعتمد بعد']] })}
      <button class="btn bad sm fit" data-act="delBullet" data-i="${i}" data-j="${j}">حذف</button></div>
      ${DIGIT.test(b.text) ? lbl('مصدر الرقم', f(base + '.numberSource', { ph: 'من أين هذا الرقم؟' })) : ''}
      ${STRONG.test(b.text) ? f(base + '.confirm', { type: 'check', label: 'أؤكد أنني قمت بهذا الدور فعلاً' }) : ''}
    </div>`;
  };
  App._need = {};
  App.onInput = function (p, el) { // أظهر خانات الرقم/التأكيد عند الحاجة دون إعادة رسم كل ضغطة
    if (/\.bullets\.\d+\.text$/.test(p)) { const b = App.get(p); const need = DIGIT.test(b) || STRONG.test(b); if (need !== App._need[p]) { App._need[p] = need; clearTimeout(App._rr); App._rr = setTimeout(() => { const pos = el.selectionStart; App.render(); const n = document.querySelector(`[data-b="${p}"]`); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { } } }, 500); } }
  };

  const expHtml = (x, i) => { const b = `resume.data.experience.${i}`; return `<div class="item"><b>خبرة ${i + 1}</b>
    ${lbl('المسمى الرسمي كما في العقد', f(b + '.title'))}${lbl('الجهة', f(b + '.org'))}${lbl('المدينة', f(b + '.city'))}
    <div class="row"><div>${lbl('من', f(b + '.start', { type: 'month' }))}</div><div>${lbl('إلى', x.current ? '<input disabled value="الآن">' : f(b + '.end', { type: 'month' }))}</div></div>
    ${f(b + '.current', { type: 'check', label: 'ما زلت أعمل هنا', })}
    <h3>نقاط الخبرة</h3>${(x.bullets || []).map((_, j) => bulletHtml(i, j)).join('')}
    <div class="btns"><button class="btn sec sm" data-act="addBullet" data-i="${i}">+ نقطة</button><button class="btn bad sm" data-act="delExp" data-i="${i}">حذف الخبرة</button></div></div>`; };

  App.views.resume = function () {
    const r = App.state.resume, d = r.data;
    const seg = `<div class="seg"><button class="${r.mode === 'create' ? 'on' : ''}" data-act="rmode" data-m="create">إنشاء سيرة</button><button class="${r.mode === 'upload' ? 'on' : ''}" data-act="rmode" data-m="upload">رفع سيرة جاهزة</button></div>`;
    if (r.mode === 'upload') {
      const fl = r.file;
      return seg + `<div class="card"><h2>سيرتي الجاهزة</h2>
        ${fl ? `<div class="item"><b>${esc(fl.name)}</b><div class="muted">${Math.round(fl.size / 1024)} KB — حُفظت ${esc(fl.at)}</div>
        <div class="btns"><button class="btn sm" data-act="shareCv">فتح / مشاركة</button><button class="btn bad sm" data-act="delCv">حذف</button></div></div>` : '<p class="muted">لم ترفع سيرة بعد.</p>'}
        <label>اختر ملف PDF أو Word</label><input type="file" id="cvfile" accept=".pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document">
        <div class="hint">الملف يبقى على جهازك فقط. التطبيق لا يقرأ محتواه تلقائياً. وحتى تُجيب أسئلة نماذج التقديم بصدق، أدخل بياناتك المنظمة (خبرات، شهادات، لغات) من «إنشاء سيرة»، فتخرج منها نسخة موحّدة وتُراجع الأرقام والتواريخ.</div>
        <div class="btns"><button class="btn sec" data-act="rmode" data-m="create">أدخل بياناتي المنظمة</button></div></div>`;
    }
    const iss = validate();
    return seg + `<div class="hint"><b>قواعد المصداقية:</b> لا مهارة ولا رقم ولا إنجاز بلا سند. ما لم يُعتمد بعد يُكتب كذلك. افعل يطابق دورك الحقيقي. فترة الانقطاع تُذكر. والشهادة والمهارة واللغة بمستواها الدقيق.</div>
    <div class="card"><h2>الأساسيات</h2>
      <div class="seg"><button class="${r.lang === 'ar' ? 'on' : ''}" data-act="rlang" data-l="ar">سيرة عربية</button><button class="${r.lang === 'en' ? 'on' : ''}" data-act="rlang" data-l="en">English CV</button></div>
      <p class="muted">الاسم والجوال والبريد من «معاييري وبياناتي».</p>
      ${lbl('سطر العنوان المهني', f('resume.headline', { ph: 'مثال: Strategic HR Leader' }))}
      ${lbl('الملخص المهني (4 إلى 5 أسطر)', f('resume.data.summary', { type: 'textarea' }))}
      ${lbl('الجدارات الأساسية (سطر لكل جدارة)', f('resume.data.competencies', { type: 'textarea' }))}</div>
    <div class="card"><h2>الخبرة المهنية</h2>${d.experience.map(expHtml).join('')}<div class="btns"><button class="btn sec" data-act="addExp">+ خبرة</button></div></div>
    <div class="card"><h2>فترات الانقطاع</h2><p class="muted">تُذكر ولا تُخفى، مع ما فعلته فيها (دراسة، شهادة...).</p>
      ${d.breaks.map((x, i) => `<div class="item"><div class="row"><div>${lbl('من', f(`resume.data.breaks.${i}.from`, { type: 'month' }))}</div><div>${lbl('إلى', f(`resume.data.breaks.${i}.to`, { type: 'month' }))}</div></div>${lbl('ماذا فعلت فيها', f(`resume.data.breaks.${i}.what`))}<div class="btns"><button class="btn bad sm" data-act="delBrk" data-i="${i}">حذف</button></div></div>`).join('')}
      <button class="btn sec" data-act="addBrk">+ فترة</button></div>
    <div class="card"><h2>الشهادات والتعليم</h2>
      ${d.certs.map((x, i) => `<div class="item">${lbl('اسم الشهادة بدقة', f(`resume.data.certs.${i}.name`))}${lbl('الجهة المانحة', f(`resume.data.certs.${i}.body`))}${lbl('التاريخ', f(`resume.data.certs.${i}.date`, { type: 'month' }))}${lbl('المستوى الحقيقي (مثل: دبلوم المستوى 5 المشارك، لا ماجستير)', f(`resume.data.certs.${i}.level`))}<div class="btns"><button class="btn bad sm" data-act="delCert" data-i="${i}">حذف</button></div></div>`).join('')}
      <button class="btn sec" data-act="addCert">+ شهادة</button></div>
    <div class="card"><h2>الأنظمة والمنصات</h2>
      ${lbl('أتقنها (سطر لكل نظام)', f('resume.data.systemsCore', { type: 'textarea' }))}
      ${lbl('إلمام أساسي فقط (تُكتب بند منفصل)', f('resume.data.systemsBasic', { type: 'textarea' }))}</div>
    <div class="card"><h2>اللغات</h2>
      ${d.languages.map((x, i) => `<div class="item">${lbl('اللغة', f(`resume.data.languages.${i}.lang`))}${lbl('المستوى', f(`resume.data.languages.${i}.level`, { type: 'select', options: [['', 'اختر...'], ...LANG_LEVELS] }))}<div class="btns"><button class="btn bad sm" data-act="delLang" data-i="${i}">حذف</button></div></div>`).join('')}
      <button class="btn sec" data-act="addLang">+ لغة</button>
      <p class="muted">لا تكتب مستوى أعلى من اختبار يثبته.</p></div>
    <div class="card"><h2>الفحص والتصدير</h2>
      ${iss.length ? iss.map(x => `<div class="issue ${x.t === 'w' ? 'w' : ''}">${esc(x.msg)}</div>`).join('') : '<div class="hint">لا ملاحظات. السيرة جاهزة للتصدير.</div>'}
      <div class="btns"><button class="btn" data-act="exportDocx" ${iss.some(x => x.t === 'e') ? 'disabled' : ''}>تصدير Word</button><button class="btn sec" data-act="copyCv" ${iss.some(x => x.t === 'e') ? 'disabled' : ''}>نسخ كنص</button></div>
      <p class="muted">التصدير يتوقف حتى تُحل الأخطاء الحمراء. بعد التصدير راجع الملف بعينك قبل إرساله.</p></div>`;
  };

  const A = App.acts, S = App.state, refresh = () => { App.save(); App.render(); };
  A.rmode = el => { App.state.resume.mode = el.dataset.m; refresh(); };
  A.rlang = el => { App.state.resume.lang = el.dataset.l; refresh(); };
  A.addExp = () => { D().experience.push({ title: '', org: '', city: '', start: '', end: '', current: false, bullets: [{ text: '', status: 'done', numberSource: '', confirm: false }] }); refresh(); };
  A.delExp = el => { if (confirm('حذف هذه الخبرة؟')) { D().experience.splice(+el.dataset.i, 1); refresh(); } };
  A.addBullet = el => { D().experience[+el.dataset.i].bullets.push({ text: '', status: 'done', numberSource: '', confirm: false }); refresh(); };
  A.delBullet = el => { D().experience[+el.dataset.i].bullets.splice(+el.dataset.j, 1); refresh(); };
  A.addBrk = () => { D().breaks.push({ from: '', to: '', what: '' }); refresh(); };
  A.delBrk = el => { D().breaks.splice(+el.dataset.i, 1); refresh(); };
  A.addCert = () => { D().certs.push({ name: '', body: '', date: '', level: '' }); refresh(); };
  A.delCert = el => { D().certs.splice(+el.dataset.i, 1); refresh(); };
  A.addLang = () => { D().languages.push({ lang: '', level: '' }); refresh(); };
  A.delLang = el => { D().languages.splice(+el.dataset.i, 1); refresh(); };
  A.exportDocx = async () => { const blob = await buildDocx(); const n = (App.state.profile.name_en || App.state.profile.name_ar || 'CV').replace(/\s+/g, '_'); await App.shareFile(`${n}_Resume.docx`, blob); };
  A.copyCv = () => App.copy(model().map(b => (b.k === 'h' ? '\n' + b.t : b.k === 'b' ? '• ' + b.t : b.t)).join('\n'));
  A.shareCv = async () => { const b = await App.idb.get('cv'); if (b) await App.shareFile(App.state.resume.file.name, b); };
  A.delCv = async () => { if (confirm('حذف الملف المرفوع؟')) { await App.idb.del('cv'); App.state.resume.file = null; refresh(); } };
  document.addEventListener('change', async e => {
    if (e.target.id !== 'cvfile' || !e.target.files[0]) return;
    const fl = e.target.files[0]; await App.idb.put('cv', fl);
    App.state.resume.file = { name: fl.name, size: fl.size, at: App.today() }; refresh(); App.toast('حُفظت السيرة على جهازك');
  });
})();
