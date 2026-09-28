(() => {
  'use strict';

  const STORAGE_KEY = 'cadet_measurements_v1';
  const SETTINGS_KEY = 'cadet_measurements_settings_v1';

  const shirtFields = [
    ['shirtLength', 'লম্বা'],
    ['shirtBody', 'বডি'],
    ['shirtCuff', 'কাফ'],
    ['shirtHand', 'হাত'],
    ['shirtPet', 'পেট'],
    ['shirtHip', 'হিপ'],
    ['shirtCollar', 'কলার']
  ];

  const pantFields = [
    ['pantLength', 'লম্বা'],
    ['pantRun', 'রান'],
    ['pantHigh', 'হাই'],
    ['pantWaist', 'কোমর'],
    ['pantMuri', 'মুরি'],
    ['pantHip', 'হিপ']
  ];

  const allInputIds = [
    'name', 'cadetNumber',
    ...shirtFields.map(([id]) => id),
    ...pantFields.map(([id]) => id)
  ];

  const els = {
    form: document.getElementById('measurementForm'),
    name: document.getElementById('name'),
    cadetNumber: document.getElementById('cadetNumber'),
    submitBtn: document.getElementById('submitBtn'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),
    clearAllBtn: document.getElementById('clearAllBtn'),
    printBtn: document.getElementById('printBtn'),
    exportBtn: document.getElementById('exportBtn'),
    importBtn: document.getElementById('importBtn'),
    importFile: document.getElementById('importFile'),
    cardsPerPage: document.getElementById('cardsPerPage'),
    cadetCount: document.getElementById('cadetCount'),
    pageCount: document.getElementById('pageCount'),
    previewMeta: document.getElementById('previewMeta'),
    emptyState: document.getElementById('emptyState'),
    printArea: document.getElementById('printArea'),
    formMessage: document.getElementById('formMessage')
  };

  let cadets = loadCadets();
  let editingId = null;
  let cardsPerPage = loadCardsPerPage();

  els.cardsPerPage.value = String(cardsPerPage);

  function generateId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return `cadet_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function loadCadets() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      const source = Array.isArray(parsed) ? parsed : parsed?.cadets;
      if (!Array.isArray(source)) return [];
      return source.map(sanitizeCadet).filter(Boolean);
    } catch (error) {
      console.error('Could not load cadet data:', error);
      return [];
    }
  }

  function sanitizeCadet(item) {
    if (!item || typeof item !== 'object') return null;
    const name = String(item.name ?? '').trim();
    const cadetNumber = String(item.cadetNumber ?? '').trim();
    if (!name || !cadetNumber) return null;

    const data = { id: String(item.id || generateId()), name, cadetNumber };
    for (const [id] of [...shirtFields, ...pantFields]) {
      const value = item[id] ?? item.measurements?.[id] ?? '';
      data[id] = String(value ?? '').trim();
    }
    return data;
  }

  function persistCadets() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cadets));
      return true;
    } catch (error) {
      showMessage('ব্রাউজারে ডাটা সংরক্ষণ করা যায়নি। Local Storage সীমা বা Private Mode পরীক্ষা করুন।', 'error');
      console.error('Could not persist cadet data:', error);
      return false;
    }
  }

  function loadCardsPerPage() {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved === '9' ? 9 : 12;
    } catch {
      return 12;
    }
  }

  function persistCardsPerPage(value) {
    try { localStorage.setItem(SETTINGS_KEY, String(value)); } catch { /* non-fatal */ }
  }

  function getFormData() {
    const data = {
      id: editingId || generateId(),
      name: els.name.value.trim(),
      cadetNumber: els.cadetNumber.value.trim()
    };
    for (const id of allInputIds.slice(2)) {
      data[id] = document.getElementById(id).value.trim();
    }
    return data;
  }

  function fillForm(cadet) {
    for (const id of allInputIds) {
      const input = document.getElementById(id);
      if (input) input.value = cadet[id] || '';
    }
  }

  function clearForm() {
    els.form.reset();
    editingId = null;
    els.submitBtn.textContent = 'মাপ যোগ করুন';
    els.cancelEditBtn.classList.add('hidden');
    clearMessage();
    els.name.focus();
  }

  function showMessage(message, type = 'success') {
    els.formMessage.textContent = message;
    els.formMessage.className = `form-message ${type}`;
  }

  function clearMessage() {
    els.formMessage.textContent = '';
    els.formMessage.className = 'form-message';
  }

  function validateForm(data) {
    if (!data.name) {
      els.name.focus();
      showMessage('নাম লিখুন।', 'error');
      return false;
    }
    if (!data.cadetNumber) {
      els.cadetNumber.focus();
      showMessage('ক্যাডেট নম্বর লিখুন।', 'error');
      return false;
    }
    return true;
  }

  function toBanglaDigits(value) {
    const map = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' };
    return String(value ?? '').replace(/[0-9]/g, d => map[d]);
  }

  function displayValue(value) {
    const str = String(value ?? '').trim();
    if (!str) return '<span class="blank-value">&nbsp;</span>';
    return escapeHtml(toBanglaDigits(str));
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function buildCard(cadet, pageIndex) {
    const card = document.createElement('article');
    card.className = 'measurement-card';
    card.dataset.id = cadet.id;
    card.innerHTML = `
      <div class="card-actions no-print">
        <button class="card-action-btn edit" type="button" data-action="edit" data-id="${escapeHtml(cadet.id)}">Edit</button>
        <button class="card-action-btn delete" type="button" data-action="delete" data-id="${escapeHtml(cadet.id)}">Delete</button>
      </div>
      <div class="card-header">
        <div class="card-personal-line">
          <div><span class="label">নাম:</span> ${escapeHtml(toBanglaDigits(cadet.name))}</div>
          <div><span class="label">ক্যাডেট নম্বর:</span> ${escapeHtml(toBanglaDigits(cadet.cadetNumber))}</div>
        </div>
      </div>
      <div class="card-body">
        <table class="measurement-table" aria-label="ক্যাডেট মেজারমেন্ট কার্ড">
          <thead>
            <tr><th>শার্টের মাপ</th><th>প্যান্টের মাপ</th></tr>
          </thead>
          <tbody>
            ${buildMeasurementRows(cadet)}
          </tbody>
        </table>
      </div>
    `;

    card.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', handleCardAction);
    });

    return card;
  }

  function buildMeasurementRows(cadet) {
    const rows = [];
    const maxRows = Math.max(shirtFields.length, pantFields.length);
    for (let i = 0; i < maxRows; i += 1) {
      const shirt = shirtFields[i];
      const pant = pantFields[i];
      const shirtHtml = shirt
        ? `<span class="index">${i + 1}. ${shirt[1]}:</span> <span class="value">${displayValue(cadet[shirt[0]])}</span>`
        : '';
      const pantHtml = pant
        ? `<span class="index">${i + 1}. ${pant[1]}:</span> <span class="value">${displayValue(cadet[pant[0]])}</span>`
        : '';
      rows.push(`<tr><td>${shirtHtml}</td><td>${pantHtml}</td></tr>`);
    }
    return rows.join('');
  }

  function render() {
    const totalPages = cadets.length ? Math.ceil(cadets.length / cardsPerPage) : 0;
    els.cadetCount.textContent = toBanglaDigits(cadets.length);
    els.pageCount.textContent = toBanglaDigits(totalPages);
    els.previewMeta.textContent = `A4 • ${cardsPerPage} Cards/Page`;
    els.emptyState.classList.toggle('hidden', cadets.length > 0);
    els.printArea.innerHTML = '';

    if (!cadets.length) return;

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
      const wrapper = document.createElement('section');
      wrapper.className = 'page-wrapper';

      const start = pageIndex * cardsPerPage;
      const pageCadets = cadets.slice(start, start + cardsPerPage);
      wrapper.innerHTML = `<div class="page-label no-print">A4 PAGE ${pageIndex + 1} <span>• ${pageCadets.length} Cards</span></div>`;

      const page = document.createElement('div');
      page.className = 'a4-page';
      page.dataset.cards = String(cardsPerPage);
      page.setAttribute('aria-label', `A4 Page ${pageIndex + 1}`);

      const grid = document.createElement('div');
      grid.className = 'cards-grid';
      pageCadets.forEach(cadet => grid.appendChild(buildCard(cadet, pageIndex)));
      page.appendChild(grid);
      wrapper.appendChild(page);
      els.printArea.appendChild(wrapper);
    }
  }

  function handleCardAction(event) {
    const button = event.currentTarget;
    const id = button.dataset.id;
    const action = button.dataset.action;
    const cadet = cadets.find(item => item.id === id);
    if (!cadet) return;

    if (action === 'edit') {
      editingId = cadet.id;
      fillForm(cadet);
      els.submitBtn.textContent = 'মাপ আপডেট করুন';
      els.cancelEditBtn.classList.remove('hidden');
      showMessage(`“${cadet.name}” এডিট মোডে লোড করা হয়েছে।`, 'success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      els.name.focus();
      return;
    }

    if (action === 'delete') {
      const confirmed = window.confirm('আপনি কি এই ক্যাডেটের তথ্য মুছে ফেলতে চান?');
      if (!confirmed) return;
      cadets = cadets.filter(item => item.id !== id);
      persistCadets();
      if (editingId === id) clearForm();
      render();
      showMessage('ক্যাডেটের তথ্য মুছে ফেলা হয়েছে।', 'success');
    }
  }

  els.form.addEventListener('submit', event => {
    event.preventDefault();
    const data = getFormData();
    if (!validateForm(data)) return;

    if (editingId) {
      const index = cadets.findIndex(item => item.id === editingId);
      if (index !== -1) {
        cadets[index] = data;
        persistCadets();
        render();
        clearForm();
        showMessage('ক্যাডেটের তথ্য আপডেট হয়েছে।', 'success');
        return;
      }
    }

    cadets.push(data);
    persistCadets();
    render();
    clearForm();
    showMessage('নতুন ক্যাডেট সফলভাবে যোগ হয়েছে।', 'success');
  });

  els.cancelEditBtn.addEventListener('click', clearForm);

  els.clearAllBtn.addEventListener('click', () => {
    if (!cadets.length) {
      showMessage('মুছে ফেলার মতো কোনো তথ্য নেই।', 'error');
      return;
    }
    const confirmed = window.confirm('আপনি কি সব ক্যাডেটের তথ্য মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।');
    if (!confirmed) return;
    cadets = [];
    try { localStorage.removeItem(STORAGE_KEY); } catch (error) { console.error(error); }
    clearForm();
    render();
    showMessage('সব তথ্য মুছে ফেলা হয়েছে।', 'success');
  });

  els.cardsPerPage.addEventListener('change', () => {
    cardsPerPage = Number(els.cardsPerPage.value) === 9 ? 9 : 12;
    persistCardsPerPage(cardsPerPage);
    render();
  });

  els.printBtn.addEventListener('click', () => {
    if (!cadets.length) {
      showMessage('প্রিন্ট করার আগে অন্তত একজন ক্যাডেট যোগ করুন।', 'error');
      return;
    }
    const oldTitle = document.title;
    document.title = 'Cadet Measurement Cards';
    const restoreTitle = () => {
      document.title = oldTitle;
      window.removeEventListener('afterprint', restoreTitle);
    };
    window.addEventListener('afterprint', restoreTitle);
    window.print();
  });

  els.exportBtn.addEventListener('click', () => {
    const payload = {
      app: 'Cadet Measurement Card Generator',
      version: 1,
      exportedAt: new Date().toISOString(),
      cadets
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'cadet-measurements.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showMessage('ডাটা এক্সপোর্ট সম্পন্ন হয়েছে।', 'success');
  });

  els.importBtn.addEventListener('click', () => els.importFile.click());

  els.importFile.addEventListener('change', event => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const source = Array.isArray(parsed) ? parsed : parsed?.cadets;
        if (!Array.isArray(source)) throw new Error('Invalid JSON structure');
        const imported = source.map(sanitizeCadet).filter(Boolean);
        if (!imported.length) throw new Error('No valid cadet records');

        const replace = window.confirm('ইমপোর্ট করা ডাটা দিয়ে বর্তমান ডাটা প্রতিস্থাপন করবেন? OK = Replace, Cancel = Merge');
        if (replace) {
          cadets = imported;
        } else {
          const existingIds = new Set(cadets.map(item => item.id));
          const normalized = imported.map(item => {
            if (existingIds.has(item.id)) return { ...item, id: generateId() };
            return item;
          });
          cadets = [...cadets, ...normalized];
        }

        persistCadets();
        render();
        showMessage(`${toBanglaDigits(imported.length)}টি ক্যাডেটের ডাটা ইমপোর্ট হয়েছে।`, 'success');
      } catch (error) {
        console.error('Import failed:', error);
        showMessage('ডাটা ইমপোর্ট করা যায়নি। সঠিক JSON ফাইল ব্যবহার করুন।', 'error');
      } finally {
        els.importFile.value = '';
      }
    };
    reader.onerror = () => {
      showMessage('ফাইল পড়া যায়নি।', 'error');
      els.importFile.value = '';
    };
    reader.readAsText(file);
  });

  render();
})();
