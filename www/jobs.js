/* الرئيسية، المعايير، تقييم الإعلانات، متتبع الطلبات، تجهيز التقديم */
(function () {
  const { esc, f, lbl, LEVELS } = App;
  const A = App.acts, st = () => App.state;
  const refresh = () => { App.save(); App.render(); };
  const lines = s => (s || '').split('\n').map(x => x.trim()).filter(Boolean);
  const STATUS = { decide: 'بانتظار قراري (B)', ready: 'جاهزة للتقديم (A)', applied: 'مقدَّم', confirmed: 'وصل التأكيد', interview: 'مقابلة', offer: 'عرض', rejected: 'مرفوضة / غير مناسبة', withdrawn: 'مسحوبة' };
  const PILL = { decide: 'B', ready: 'A', applied: 'g', confirmed: 'g', interview: 'g', offer: 'A', rejected: 'N', withdrawn: 'N' };
  const ALERTS = [['linkedin', 'LinkedIn'], ['bayt', 'Bayt'], ['indeed', 'Indeed'], ['gulftalent', 'GulfTalent']];

  /* ---------- الرئيسية ---------- */
  App.views.home = function () {
    const s = st(), j = s.jobs, c = s.criteria;
    const cnt = k => j.filter(x => x.status === k).length;
    const crit = c.levels.length && lines(c.regions).length;
    const hasCv = s.resume.file || s.resume.data.experience.length;
    const alertsDone = ALERTS.every(([k]) => c.alerts[k]);
    const step = (ok, t, tab) => `<div class="item row" style="gap:10px"><span class="fit">${ok ? '✅' : '⬜'}</span><span>${t}</span>${ok ? '' : `<button class="btn sm fit" data-tab="${tab}">افتح</button>`}</div>`;
    const dec = j.filter(x => x.status === 'decide');
    return `<div class="card"><h2>البداية</h2>
      ${step(!!(s.profile.name_ar || s.profile.name_en) && s.profile.phone && s.profile.email, '١. أكمل بياناتك (الاسم والجوال والبريد للتقديم)', 'criteria')}
      ${step(!!crit, '٢. حدّد معايير البحث: المستوى والمناطق', 'criteria')}
      ${step(!!hasCv, '٣. ارفع سيرتك أو أنشئ سيرة جديدة', 'resume')}
      ${step(alertsDone, '٤. أنشئ تنبيهات الوظائف (بريد فقط)', 'criteria')}</div>
    <div class="card"><h2>طلباتي</h2><div class="stat"><div><b>${cnt('applied') + cnt('confirmed')}</b>مقدَّم</div><div><b>${cnt('decide')}</b>بانتظار قراري</div><div><b>${cnt('interview') + cnt('offer')}</b>مقابلة/عرض</div></div></div>
    ${dec.length ? `<div class="card"><h2>تنتظر قرارك (B)</h2>${dec.map(x => `<div class="item row"><div><b>${esc(x.title)}</b><div class="muted">${esc(x.org)}</div></div><button class="btn sm fit" data-act="openJob" data-id="${x.id}">افتح</button></div>`).join('')}</div>` : ''}
    <div class="card"><h2>قواعد ثابتة</h2><div class="muted">• المصداقية أولاً: لا ادّعاء بلا سند.<br>• التطبيق لا يرسل أي طلب ولا يُؤشّر على الإقرارات: الإرسال والإقرارات بيدك.<br>• لا تُدخل كلمات مرور أو رموز تحقق أو أرقاماً بنكية في أي مكان هنا.<br>• بياناتك على هذا الجهاز فقط.</div></div>
    <div class="card"><h2>نسخة احتياطية</h2><div class="btns"><button class="btn sec" data-act="backup">حفظ نسخة</button><button class="btn sec" data-act="restore">استرجاع</button></div>
      <input type="file" id="restoreFile" accept=".json,application/json" style="display:none"><p class="muted">النسخة تشمل بياناتك وطلباتك، ولا تشمل ملف السيرة المرفوع.</p></div>`;
  };
  A.backup = async () => { const o = JSON.parse(JSON.stringify(st())); await App.shareFile('job-search-backup.json', new Blob([JSON.stringify(o, null, 1)], { type: 'application/json' })); };
  A.restore = () => document.getElementById('restoreFile').click();
  document.addEventListener('change', async e => {
    if (e.target.id !== 'restoreFile' || !e.target.files[0]) return;
    try { const o = JSON.parse(await e.target.files[0].text()); if (!o.profile || !o.criteria) throw 0; if (confirm('سيُستبدل ما في التطبيق الآن بالنسخة. متابعة؟')) { App.reset(o); App.render(); App.toast('تم الاسترجاع'); } } catch (_) { App.toast('ملف غير صالح'); }
  });

  /* ---------- المعايير والبيانات ---------- */
  App.views.criteria = function () {
    const c = st().criteria;
    return `<div class="card"><h2>بياناتي للتقديم</h2><p class="muted">تُستخدم في خطاب التغطية والبريد والسيرة. تُحفظ على جهازك فقط.</p>
      ${lbl('الاسم بالعربية', f('profile.name_ar'))}${lbl('الاسم بالإنجليزية', f('profile.name_en', { dir: 'ltr' }))}
      ${lbl('الجنسية', f('profile.nationality'))}${lbl('المدينة', f('profile.city'))}
      ${lbl('الجوال المستخدم في التقديم', f('profile.phone', { type: 'tel', dir: 'ltr' }))}${lbl('البريد المستخدم في التقديم', f('profile.email', { type: 'email', dir: 'ltr' }))}
      ${lbl('رابط LinkedIn (اختياري)', f('profile.linkedin', { dir: 'ltr' }))}</div>
    <div class="card"><h2>معايير البحث</h2>
      <h3>المستويات التي أستهدفها</h3>${LEVELS.map((l, i) => `<label style="display:flex;align-items:center;margin:6px 0;color:inherit;font-size:15px"><input type="checkbox" data-act="lvl" data-i="${i}" ${c.levels.includes(i) ? 'checked' : ''}>${l}</label>`).join('')}
      <p class="muted">يُحكم على المستوى بنطاق العمل لا بالمسمى وحده.</p>
      ${lbl('المسميات المستهدفة (للتذكير)', f('criteria.titles', { type: 'textarea' }))}
      ${lbl('المناطق مرتّبة، سطر لكل منطقة (الأهم أولاً)', f('criteria.regions', { type: 'textarea', ph: 'جدة\nمكة\n...' }))}
      ${lbl('مجالات أفضّلها', f('criteria.like', { type: 'textarea' }))}${lbl('مجالات أتجنبها', f('criteria.avoid', { type: 'textarea' }))}
      ${lbl('جهات لا أريد التقديم عليها (سطر لكل جهة)', f('criteria.excluded', { type: 'textarea' }))}
      ${lbl('نوع التعاقد', f('criteria.contract', { type: 'select', options: ['دائم', 'دائم أو مؤقت', 'أي نوع'] }))}
      ${f('criteria.acceptTemp', { type: 'check', label: 'أقبل وظائف مؤقتة أو موسمية إلى أن أجد دائمة' })}
      ${lbl('تاريخ جاهزيتي للمباشرة', f('criteria.availableFrom', { type: 'date' }))}</div>
    <div class="card"><h2>تنبيهات الوظائف</h2><div class="hint">بريد فقط وبلا إشعارات جوال. احذف التنبيهات القديمة قبل إنشاء الجديدة. الحسابات تفتحها أنت بنفسك.</div>
      ${ALERTS.map(([k, n]) => `<label style="display:flex;align-items:center;margin:8px 0;color:inherit;font-size:15px"><input type="checkbox" data-b="criteria.alerts.${k}" ${c.alerts[k] ? 'checked' : ''}>أنشأت تنبيه ${n}</label>`).join('')}</div>`;
  };
  A.lvl = el => { const c = st().criteria, i = +el.dataset.i; c.levels = el.checked ? [...new Set([...c.levels, i])] : c.levels.filter(x => x !== i); App.save(); };

  /* ---------- تقييم إعلان ---------- */
  const newDraft = () => ({ title: '', org: '', location: '', platform: '', url: '', level: '', content: '', nat: 'none', temp: false, reqs: [], result: null });
  const regionsList = () => lines(st().criteria.regions);

  function verdict(d) {
    const c = st().criteria, reasons = [], notes = []; let n = false, b = false;
    const excl = lines(c.excluded).map(x => x.toLowerCase());
    if (d.org && excl.some(x => d.org.toLowerCase().includes(x))) { n = true; reasons.push('الجهة ضمن قائمة «لا أريد التقديم عليها».'); }
    const tl = c.levels; const lv = d.level === '' ? null : +d.level;
    if (lv == null) { b = true; notes.push('لم تحدد مستوى الوظيفة.'); }
    else if (tl.length) {
      const best = Math.min(...tl), worst = Math.max(...tl);
      if (lv > worst) { n = true; reasons.push(`المستوى (${LEVELS[lv]}) أقل من مستواك المستهدف.`); }
      else if (lv < best) { b = true; notes.push(`المستوى (${LEVELS[lv]}) أعلى من مستواك المستهدف: قد يُستبعد طلبك آلياً.`); }
    }
    if (d.content === 'far') { n = true; reasons.push('المحتوى بعيد عن المسار الذي تريده.'); }
    else if (d.content === 'near') { b = true; notes.push('المحتوى قريب من مسارك وليس هو بعينه.'); }
    else if (!d.content) { b = true; notes.push('لم تحدد تطابق المحتوى مع مسارك.'); }
    if (d.nat === 'no') { n = true; reasons.push('شرط الجنسية لا ينطبق عليك.'); }
    if (d.temp && !c.acceptTemp) { n = true; reasons.push('الوظيفة مؤقتة وأنت لا تقبل المؤقتة.'); }
    const rg = regionsList();
    if (d.location === 'out') { n = true; reasons.push('الموقع خارج مناطقك.'); }
    else if (d.location && d.location !== 'remote' && rg.length) { const k = rg.indexOf(d.location); if (k > 0) notes.push(`الموقع (${d.location}) هو خيارك رقم ${k + 1} في ترتيبك.`); }
    else if (!d.location) { b = true; notes.push('لم تحدد الموقع.'); }
    d.reqs.forEach(r => {
      if (!r.text) return;
      if (r.met === 'no') { if (r.hard) { n = true; reasons.push(`شرط صلب لا تستوفيه: ${r.text}`); } else { b = true; notes.push(`شرط لا تستوفيه (ستجيب عنه بصدق): ${r.text}`); } }
      else if (r.met === 'part') { b = true; notes.push(`شرط تستوفيه جزئياً: ${r.text}${r.hard ? ' (صلب)' : ''}`); }
    });
    const v = n ? 'N' : b ? 'B' : 'A';
    const all = n ? reasons : notes;
    const rec = { N: 'غير مناسبة: لا تقدّم.', B: 'تحتاج قرارك: اقرأ الملاحظات ثم قرّر «قدّم» أو «ارفض».', A: 'مناسبة: جهّز طلبك ثم قدّم بنفسك.' }[v];
    return { v, reasons: all.slice(0, 4), rec };
  }

  App.views.eval = function () {
    const s = st(); if (!s.evalDraft) s.evalDraft = newDraft(); const d = s.evalDraft, rg = regionsList();
    const locOpts = [['', 'اختر...'], ...rg.map(x => [x, x]), ['remote', 'عن بُعد'], ['out', 'خارج مناطقي']];
    const lvOpts = [['', 'اختر...'], ...LEVELS.map((l, i) => [String(i), l])];
    const res = d.result;
    return `<div class="card"><h2>بيانات الإعلان</h2><p class="muted">أنت تعبّئ، والتطبيق يحكم بالقواعد. افتح الإعلان في مكانه ثم عُد.</p>
      ${lbl('المسمى', f('evalDraft.title'))}${lbl('الجهة', f('evalDraft.org'))}${lbl('المنصة أو الرابط (اختياري)', f('evalDraft.url', { dir: 'ltr' }))}
      ${lbl('الموقع', f('evalDraft.location', { type: 'select', options: locOpts }))}
      ${rg.length ? '' : '<div class="issue w">حدّد مناطقك في «معاييري» ليكون حكم الموقع دقيقاً.</div>'}
      ${lbl('مستوى الوظيفة', f('evalDraft.level', { type: 'select', options: lvOpts }))}
      ${lbl('تطابق المحتوى مع المسار الذي أريده', f('evalDraft.content', { type: 'select', options: [['', 'اختر...'], ['same', 'نفس مساري'], ['near', 'قريب'], ['far', 'بعيد']] }))}
      ${lbl('شرط الجنسية', f('evalDraft.nat', { type: 'select', options: [['none', 'لا يوجد شرط'], ['ok', 'يوجد وينطبق عليّ'], ['no', 'يوجد ولا ينطبق عليّ']] }))}
      ${f('evalDraft.temp', { type: 'check', label: 'الوظيفة مؤقتة أو موسمية' })}
      <h3>شروط الوظيفة</h3>
      ${d.reqs.map((r, i) => `<div class="item">${f(`evalDraft.reqs.${i}.text`, { ph: 'مثال: 5 سنوات خبرة في الرواتب' })}
        ${f(`evalDraft.reqs.${i}.met`, { type: 'select', options: [['yes', 'أستوفيه بسند'], ['part', 'جزئياً'], ['no', 'لا أستوفيه']] })}
        ${f(`evalDraft.reqs.${i}.hard`, { type: 'check', label: 'شرط صلب (يستبعد من لا يستوفيه)' })}
        <button class="btn bad sm" data-act="delReq" data-i="${i}">حذف</button></div>`).join('')}
      <div class="btns"><button class="btn sec sm" data-act="addReq">+ شرط</button></div>
      <div class="btns"><button class="btn" data-act="doEval">احكم على الإعلان</button><button class="btn sec" data-act="clearEval">إعلان جديد</button></div></div>
    ${res ? `<div class="card"><h2>الحكم: <span class="pill ${res.v}">${res.v === 'N' ? 'غير مناسبة' : res.v}</span></h2><p><b>${esc(res.rec)}</b></p>
      ${res.reasons.map(x => `<div class="issue ${res.v === 'N' ? '' : 'w'}">${esc(x)}</div>`).join('') || '<div class="hint">كل المعايير متوافقة.</div>'}
      ${res.dup ? `<div class="issue w">عندك طلب آخر على «${esc(res.dup)}». لا تقدّم على وظيفتين بمستويين مختلفين في جهة واحدة بوقت واحد.</div>` : ''}
      <div class="btns"><button class="btn" data-act="saveEval">سجّلها في طلباتي</button></div></div>` : ''}`;
  };
  A.addReq = () => { st().evalDraft.reqs.push({ text: '', met: 'yes', hard: false }); refresh(); };
  A.delReq = el => { st().evalDraft.reqs.splice(+el.dataset.i, 1); refresh(); };
  A.clearEval = () => { st().evalDraft = newDraft(); refresh(); };
  A.doEval = () => {
    const d = st().evalDraft; if (!d.title.trim()) return App.toast('اكتب مسمى الوظيفة');
    d.result = verdict(d);
    const dup = st().jobs.find(x => x.org && d.org && x.org.toLowerCase() === d.org.toLowerCase() && !['rejected', 'withdrawn'].includes(x.status));
    d.result.dup = dup ? dup.org : ''; refresh();
  };
  A.saveEval = () => {
    const d = st().evalDraft, r = d.result; if (!r) return;
    const status = { A: 'ready', B: 'decide', N: 'rejected' }[r.v];
    const job = { id: App.uid(), title: d.title, org: d.org, location: d.location === 'remote' ? 'عن بُعد' : d.location === 'out' ? 'خارج مناطقي' : d.location, platform: d.url, date: App.today(), status, verdict: r.v, reasons: r.reasons, notes: '', followUp: '', confirm: false, checks: {} };
    st().jobs.unshift(job); st().evalDraft = newDraft(); st().jobId = job.id; st().tab = 'job'; refresh(); App.toast('سُجّلت');
  };

  /* ---------- متتبع الطلبات ---------- */
  let filter = 'all';
  App.views.jobs = function () {
    const j = st().jobs.filter(x => filter === 'all' || x.status === filter);
    const chips = ['all', ...Object.keys(STATUS)].map(k => `<button class="btn sm ${filter === k ? '' : 'sec'}" data-act="flt" data-k="${k}">${k === 'all' ? 'الكل' : STATUS[k].split(' (')[0]}</button>`).join('');
    return `<div class="btns" style="margin:0 0 10px">${chips}</div>
      ${j.length ? j.map(x => `<div class="card" data-act="openJob" data-id="${x.id}"><div class="row"><div><b>${esc(x.title)}</b><div class="muted">${esc(x.org)} ${x.location ? '— ' + esc(x.location) : ''}</div><div class="muted">${esc(x.date)}</div></div><span class="pill ${PILL[x.status] || 'g'} fit">${esc(STATUS[x.status].split(' (')[0])}</span></div></div>`).join('') : '<p class="muted">لا طلبات هنا. ابدأ من «تقييم» أو أضف طلباً يدوياً.</p>'}
      <div class="btns"><button class="btn sec" data-act="addJob">+ طلب يدوي</button></div>`;
  };
  A.flt = el => { filter = el.dataset.k; App.render(); };
  A.openJob = el => App.go('job', el.dataset.id);
  A.addJob = () => { const job = { id: App.uid(), title: 'وظيفة جديدة', org: '', location: '', platform: '', date: App.today(), status: 'applied', verdict: '', reasons: [], notes: '', followUp: '', confirm: false, checks: {} }; st().jobs.unshift(job); App.go('job', job.id); };
  const cur = () => st().jobs.findIndex(x => x.id === st().jobId);
  App.views.job = function () {
    const i = cur(); if (i < 0) return '<p class="muted">الطلب غير موجود.</p>'; const x = st().jobs[i], b = `jobs.${i}`;
    return `<div class="card"><div class="row"><h2 style="margin:0">${esc(x.title)}</h2>${x.verdict ? `<span class="pill ${x.verdict} fit">${x.verdict === 'N' ? 'غير مناسبة' : x.verdict}</span>` : ''}</div>
      ${(x.reasons || []).map(r => `<div class="issue w">${esc(r)}</div>`).join('')}
      ${x.status === 'decide' ? `<div class="btns"><button class="btn" data-act="decYes">قدّم</button><button class="btn bad" data-act="decNo">ارفض</button></div>` : ''}
      ${lbl('المسمى', f(b + '.title'))}${lbl('الجهة', f(b + '.org'))}${lbl('الموقع', f(b + '.location'))}${lbl('المنصة أو الرابط', f(b + '.platform', { dir: 'ltr' }))}
      ${lbl('الحالة', f(b + '.status', { type: 'select', options: Object.entries(STATUS), }))}
      ${lbl('تاريخ التقديم', f(b + '.date', { type: 'date' }))}${lbl('موعد المتابعة', f(b + '.followUp', { type: 'date' }))}
      ${f(b + '.confirm', { type: 'check', label: 'وصلني تأكيد الاستلام' })}
      ${lbl('ملاحظات', f(b + '.notes', { type: 'textarea' }))}
      <div class="btns"><button class="btn" data-act="goPrep">تجهيز التقديم</button><button class="btn bad" data-act="delJob">حذف الطلب</button></div></div>`;
  };
  A.decYes = () => { const x = st().jobs[cur()]; x.status = 'ready'; refresh(); };
  A.decNo = () => { const x = st().jobs[cur()]; x.status = 'rejected'; refresh(); };
  A.goPrep = () => App.go('prep');
  A.delJob = () => { if (confirm('حذف هذا الطلب؟')) { st().jobs.splice(cur(), 1); App.go('jobs'); } };

  /* ---------- تجهيز التقديم ---------- */
  const DEFAULT_COVER = 'السلام عليكم ورحمة الله وبركاته،\n\nأتقدم لوظيفة {المسمى} لدى {الجهة}. أرفق سيرتي الذاتية، وأرجو أن تجدوا فيها ما يناسب متطلبات الوظيفة.\n\nمع التحية،\n{الاسم}\n{الجنسية} — {المدينة}\n{الجوال}\n{البريد}';
  const fill = (t, x) => { const p = st().profile; return t.replace(/\{المسمى\}/g, x.title).replace(/\{الجهة\}/g, x.org || '').replace(/\{الاسم\}/g, p.name_ar || p.name_en).replace(/\{الجنسية\}/g, p.nationality).replace(/\{المدينة\}/g, p.city).replace(/\{الجوال\}/g, p.phone).replace(/\{البريد\}/g, p.email); };
  const CHECKS = [['decl', 'قرأت الإقرارات والتعهدات بنفسي (التطبيق لا يؤشّر عليها)'], ['nums', 'قارنت الأرقام والتواريخ والمسميات بسيرتي'], ['cv', 'سأرفع سيرتي الموحّدة الأحدث لا النسخة القديمة المخزنة في الموقع'], ['contact', 'الجوال والبريد المكتوبان في الطلب هما المعتمدان'], ['final', 'أعلم أن الإرسال لا يُسحب']];
  function answers() {
    const s = st(); if (!s.answers) s.answers = [['الراتب المتوقع', ''], ['تاريخ المباشرة', s.criteria.availableFrom || ''], ['الجنسية', s.profile.nationality], ['مستوى اللغة الإنجليزية', ''], ['هل سبق العمل لدى هذه الجهة؟', ''], ['التصريح بالعمل', '']];
    return s.answers;
  }
  App.views.prep = function () {
    const i = cur(); if (i < 0) return '<p class="muted">اختر طلباً أولاً.</p>'; const x = st().jobs[i], s = st(); answers();
    if (!s.cover) s.cover = DEFAULT_COVER;
    const cover = fill(s.cover, x); const subj = `التقديم على وظيفة ${x.title}${s.profile.name_ar ? ' — ' + s.profile.name_ar : ''}`;
    return `<div class="card"><h2>${esc(x.title)}</h2><div class="muted">${esc(x.org)}</div>
      <h3>خطاب التغطية</h3>${f('cover', { type: 'textarea' })}<p class="muted">المتغيرات: {المسمى} {الجهة} {الاسم} {الجنسية} {المدينة} {الجوال} {البريد}</p>
      <pre class="out" id="coverOut">${esc(cover)}</pre>
      <div class="btns"><button class="btn sec" data-act="copyCover">نسخ</button><button class="btn sec" data-act="mailto">فتح تطبيق البريد</button></div>
      <div class="hint">لإعلانات البريد: اكتب العنوان المطلوب حرفياً كما في الإعلان، وأرفق سيرتك يدوياً ثم أرسل أنت.</div>
      ${lbl('بريد الجهة (من الإعلان)', f(`jobs.${i}.mailTo`, { dir: 'ltr', type: 'email' }))}${lbl('عنوان الرسالة', f(`jobs.${i}.subject`, { ph: subj }))}</div>
    <div class="card"><h2>إجاباتي الجاهزة</h2><p class="muted">أجب بما تثبته سيرتك فقط. إن لم تستوفِ الشرط فالجواب «لا».</p>
      ${s.answers.map((a, k) => `<div class="item">${f(`answers.${k}.0`)}${f(`answers.${k}.1`, { type: 'textarea', ph: 'جوابك' })}<div class="btns"><button class="btn sec sm" data-act="copyAns" data-k="${k}">نسخ الجواب</button><button class="btn bad sm" data-act="delAns" data-k="${k}">حذف</button></div></div>`).join('')}
      <button class="btn sec" data-act="addAns">+ سؤال</button>
      <h3>سنوات الخبرة التي أستطيع إثباتها</h3>
      ${s.years.map((y, k) => `<div class="item row"><div>${f(`years.${k}.field`, { ph: 'المجال' })}</div><div class="fit" style="width:80px">${f(`years.${k}.n`, { type: 'number', ph: 'سنة' })}</div><button class="btn bad sm fit" data-act="delYr" data-k="${k}">×</button></div>`).join('')}
      <button class="btn sec sm" data-act="addYr">+ مجال</button></div>
    <div class="card"><h2>قبل أن تضغط إرسال</h2>${CHECKS.map(([k, t]) => `<label style="display:flex;align-items:flex-start;margin:8px 0;color:inherit;font-size:15px"><input type="checkbox" data-b="jobs.${i}.checks.${k}" data-rr="1" ${x.checks[k] ? 'checked' : ''}>${t}</label>`).join('')}
      <div class="btns"><button class="btn" data-act="markApplied" ${CHECKS.every(([k]) => x.checks[k]) ? '' : 'disabled'}>سجّلتُ أني قدّمت</button></div>
      <p class="muted">لا تُعلن نجاح تقديم إلا بعد صفحة «شكراً» أو ما يعادلها.</p></div>`;
  };
  A.copyCover = () => App.copy(document.getElementById('coverOut').textContent);
  A.mailto = () => { const x = st().jobs[cur()], subj = x.subject || `التقديم على وظيفة ${x.title}`; location.href = `mailto:${encodeURIComponent(x.mailTo || '')}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(fill(st().cover, x))}`; };
  A.copyAns = el => App.copy(st().answers[+el.dataset.k][1]);
  A.addAns = () => { answers().push(['', '']); refresh(); };
  A.delAns = el => { st().answers.splice(+el.dataset.k, 1); refresh(); };
  A.addYr = () => { st().years.push({ field: '', n: '' }); refresh(); };
  A.delYr = el => { st().years.splice(+el.dataset.k, 1); refresh(); };
  A.markApplied = () => { const x = st().jobs[cur()]; x.status = 'applied'; x.date = App.today(); App.go('job'); App.toast('سُجّل كمقدَّم'); };

  document.addEventListener('DOMContentLoaded', () => App.render());
  if (document.readyState !== 'loading') App.render();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
})();
