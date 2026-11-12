/* النواة: الحالة، التخزين المحلي، أدوات مساعدة. لا شبكة ولا API. */
(function () {
  const KEY = 'jsa_v1';
  const LEVELS = ['إدارة عليا / تنفيذي', 'مدير', 'رئيس قسم / قائد فريق', 'أخصائي أول', 'أخصائي / مسؤول', 'مبتدئ / مساعد'];
  const defaults = () => ({
    profile: { name_ar: '', name_en: '', nationality: '', city: '', phone: '', email: '', linkedin: '' },
    criteria: { levels: [], titles: '', regions: '', like: '', avoid: '', contract: 'دائم', acceptTemp: false, excluded: '', availableFrom: '', alerts: {} },
    resume: { lang: 'ar', mode: 'create', headline: '', data: { summary: '', competencies: '', experience: [], breaks: [], certs: [], systemsCore: '', systemsBasic: '', languages: [] }, file: null },
    years: [], answers: null, cover: '', jobs: [], evalDraft: null, tab: 'home', jobId: null
  });

  const App = { LEVELS, views: {}, acts: {}, state: null };
  window.App = App;

  function load() {
    let s = defaults();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const o = JSON.parse(raw); s = merge(s, o); }
    } catch (e) { /* ابدأ نظيفاً */ }
    return s;
  }
  function merge(base, o) {
    if (Array.isArray(base) || typeof base !== 'object' || base === null) return o === undefined ? base : o;
    const out = { ...base };
    for (const k of Object.keys(o || {})) out[k] = (k in base && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) ? merge(base[k], o[k]) : o[k];
    return out;
  }
  let t = null;
  function flush() { clearTimeout(t); t = null; try { localStorage.setItem(KEY, JSON.stringify(App.state)); } catch (e) { App.toast('تعذّر الحفظ: مساحة التخزين ممتلئة'); } }
  // لا نؤجّل الحفظ كلما كُتب حرف (قد يتأخر للأبد)، بل نضمن حفظاً خلال 300 مللي ثانية، وفوراً عند الخروج
  App.save = function () { if (!t) t = setTimeout(flush, 300); };
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  App.reset = function (s) { App.state = merge(defaults(), s); localStorage.setItem(KEY, JSON.stringify(App.state)); };
  App.state = load();

  App.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  App.uid = () => Math.random().toString(36).slice(2, 9);
  App.today = () => new Date().toISOString().slice(0, 10);
  App.toast = function (m) { const el = document.getElementById('toast'); el.textContent = m; el.classList.add('on'); clearTimeout(App._tt); App._tt = setTimeout(() => el.classList.remove('on'), 2600); };

  function getPath(o, p) { return p.split('.').reduce((a, k) => (a == null ? a : a[k]), o); }
  function setPath(o, p, v) { const ks = p.split('.'); const last = ks.pop(); const t = ks.reduce((a, k) => a[k], o); t[last] = v; }
  App.get = p => getPath(App.state, p);
  // حقل مرتبط بالحالة
  App.f = function (path, opt = {}) {
    const v = getPath(App.state, path);
    const type = opt.type || 'text';
    const attrs = `data-b="${path}"` + (opt.ph ? ` placeholder="${App.esc(opt.ph)}"` : '') + (opt.dir ? ` dir="${opt.dir}"` : '');
    if (type === 'textarea') return `<textarea ${attrs}>${App.esc(v)}</textarea>`;
    if (type === 'check') return `<label style="display:flex;align-items:center;margin:8px 0;color:inherit;font-size:15px"><input type="checkbox" ${attrs} ${v ? 'checked' : ''}>${opt.label || ''}</label>`;
    if (type === 'select') return `<select ${attrs}>${opt.options.map(o => { const [val, lab] = Array.isArray(o) ? o : [o, o]; return `<option value="${App.esc(val)}" ${String(v) === String(val) ? 'selected' : ''}>${App.esc(lab)}</option>`; }).join('')}</select>`;
    return `<input type="${type}" value="${App.esc(v)}" ${attrs}>`;
  };
  App.lbl = (t, html) => `<label>${t}</label>${html}`;

  document.addEventListener('input', e => {
    const p = e.target.dataset && e.target.dataset.b; if (!p) return;
    setPath(App.state, p, e.target.type === 'checkbox' ? e.target.checked : e.target.value);
    App.save(); if (App.onInput) App.onInput(p, e.target);
  });
  document.addEventListener('change', e => {
    const p = e.target.dataset && e.target.dataset.b; if (!p) return;
    setPath(App.state, p, e.target.type === 'checkbox' ? e.target.checked : e.target.value);
    App.save(); if (e.target.dataset.rr) App.render();
  });
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (el) { const f = App.acts[el.dataset.act]; if (f) f(el, e); return; }
    const tab = e.target.closest('[data-tab]'); if (tab) App.go(tab.dataset.tab);
  });

  App.go = function (tab, jobId) { App.state.tab = tab; if (jobId !== undefined) App.state.jobId = jobId; App.save(); App.render(); window.scrollTo(0, 0); };
  const TITLES = { home: 'مساعد البحث عن وظيفة', resume: 'سيرتي الذاتية', eval: 'تقييم إعلان', jobs: 'طلباتي', criteria: 'معاييري وبياناتي', job: 'تفاصيل الطلب', prep: 'تجهيز التقديم' };
  App.render = function () {
    const tab = App.state.tab; const v = App.views[tab] || App.views.home;
    document.getElementById('view').innerHTML = v();
    document.getElementById('title').textContent = TITLES[tab] || '';
    const base = (tab === 'job' || tab === 'prep') ? 'jobs' : tab;
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === base));
  };

  // ملفات كبيرة (السيرة المرفوعة) في IndexedDB
  function db() { return new Promise((res, rej) => { const r = indexedDB.open('jsa', 1); r.onupgradeneeded = () => r.result.createObjectStore('files'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
  App.idb = {
    async put(k, v) { const d = await db(); return new Promise((res, rej) => { const tx = d.transaction('files', 'readwrite'); tx.objectStore('files').put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); },
    async get(k) { const d = await db(); return new Promise((res, rej) => { const r = d.transaction('files').objectStore('files').get(k); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
    async del(k) { const d = await db(); return new Promise((res, rej) => { const tx = d.transaction('files', 'readwrite'); tx.objectStore('files').delete(k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); }
  };

  // حفظ/مشاركة ملف: في تطبيق أندرويد عبر Filesystem+Share، وفي المتصفح كتنزيل
  App.shareFile = async function (name, blob) {
    const cap = window.Capacitor;
    if (cap && cap.isNativePlatform && cap.isNativePlatform() && cap.Plugins && cap.Plugins.Filesystem && cap.Plugins.Share) {
      try {
        const data = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
        const w = await cap.Plugins.Filesystem.writeFile({ path: name, data, directory: 'CACHE' });
        await cap.Plugins.Share.share({ title: name, files: [w.uri], dialogTitle: 'حفظ أو مشاركة الملف' });
        return;
      } catch (e) { App.toast('تعذّرت المشاركة'); return; }
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };
  App.copy = async function (text) {
    try { await navigator.clipboard.writeText(text); App.toast('تم النسخ'); }
    catch (e) { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); App.toast('تم النسخ'); } catch (_) { App.toast('تعذّر النسخ'); } ta.remove(); }
  };
})();
