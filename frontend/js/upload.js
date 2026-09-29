document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar((Auth.getUser() || {}).role === 'admin' ? 'admin' : 'creator');
  renderFooter();

  const currentUser = Auth.getUser();
  if (!currentUser || !['admin', 'creator'].includes(currentUser.role)) {
    showToast('Become a Comic Writer first.', 'error');
    location.href = '/dashboard.html';
    return;
  }

  if (!Auth.isLoggedIn()) {
    showToast('Please sign in first.', 'error');
    window.location.href = '/login.html';
    return;
  }

  // Genre dropdown "Others" toggle
  const genreSelect = document.getElementById('comic-genre-select');
  const customGenreGroup = document.getElementById('custom-genre-group');
  const customGenreInput = document.getElementById('comic-custom-genre');
  if (genreSelect && customGenreGroup) {
    genreSelect.addEventListener('change', () => {
      customGenreGroup.style.display = genreSelect.value === 'Others' ? 'block' : 'none';
      if (genreSelect.value === 'Others') customGenreInput?.focus();
    });
  }

  // Comic creation
  const comicForm = document.getElementById('create-comic-form');
  const coverFileInput = document.getElementById('cover-file');
  const bannerFileInput = document.getElementById('banner-file');

  // Show an immediate local preview/selection state so users can confirm that
  // the browser actually picked the file before submitting the comic.
  function bindFileSelection(input, label) {
    if (!input) return;
    const update = () => {
      const file = input.files?.[0];
      const existing = input.parentElement?.querySelector('.file-selection-status');
      if (existing) existing.remove();
      if (!file) return;
      const status = document.createElement('div');
      status.className = 'file-selection-status';
      status.innerHTML = `<i class="fas fa-circle-check"></i><span>${label}: <strong>${String(file.name).replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}</strong> <small>(${formatBytes(file.size)})</small></span>`;
      input.insertAdjacentElement('afterend', status);
    };
    input.addEventListener('change', update);
  }
  const formatBytes = n => n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`;
  bindFileSelection(coverFileInput, 'Cover selected');
  bindFileSelection(bannerFileInput, 'Banner selected');

  if (comicForm) {
    comicForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const selectedGenre = genreSelect?.value || 'Action';
      let finalGenre = selectedGenre;
      let customGenreVal = '';
      if (selectedGenre === 'Others') {
        customGenreVal = customGenreInput?.value.trim() || '';
        if (!customGenreVal) return showToast('Please enter your custom genre.', 'error');
        finalGenre = customGenreVal;
      }

      const submitBtn = comicForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading & Submitting...';
      try {
        let coverUrl = '/uploads/covers/default.jpg';
        let bannerUrl = '/uploads/banners/default.jpg';
        if (coverFileInput?.files[0]) {
          const fd = new FormData(); fd.append('cover', coverFileInput.files[0]);
          coverUrl = (await API.upload('/uploads/cover', fd)).url;
        }
        if (bannerFileInput?.files[0]) {
          const fd = new FormData(); fd.append('banner', bannerFileInput.files[0]);
          bannerUrl = (await API.upload('/uploads/banner', fd)).url;
        }

        const isPremium = document.getElementById('comic-is-premium')?.checked || false;
        const payload = {
          title: document.getElementById('comic-title').value.trim(),
          description: document.getElementById('comic-desc').value.trim(),
          author: document.getElementById('comic-author').value.trim(),
          artist: document.getElementById('comic-artist').value.trim(),
          status: document.getElementById('comic-status').value,
          type: document.getElementById('comic-type').value,
          rating: parseFloat(document.getElementById('comic-rating').value) || 4.5,
          genre: selectedGenre,
          customGenre: customGenreVal,
          genres: [finalGenre],
          is_premium: isPremium,
          isPremium,
          coverImage: coverUrl,
          bannerImage: bannerUrl
        };
        const res = await API.post('/comics', payload);
        showToast(res.message || 'Comic submitted for admin review.', 'success');
        setTimeout(() => window.location.href = currentUser.role === 'admin' ? '/admin/comics.html' : '/creator/dashboard.html', 700);
      } catch (err) {
        showToast(`Creation failed: ${err.message}`, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Comic for Review';
      }
    });
  }

  // Chapter / PDF upload
  const selectComicDropdown = document.getElementById('select-comic-id');
  if (selectComicDropdown) {
    try {
      const r = await API.get(currentUser.role === 'admin' ? '/comics?limit=100' : '/comics?mine=true&limit=100');
      if (r.comics) selectComicDropdown.innerHTML = r.comics.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
    } catch (_) {}
  }

  const chapterForm = document.getElementById('upload-chapter-form');
  const pagesInput = document.getElementById('pages-file');
  const dropzone = document.getElementById('pages-dropzone');
  const preview = document.getElementById('page-preview-list');
  const summary = document.getElementById('page-upload-summary');
  const MAX_PAGE = 1024 * 1024; // 1 MB per image page
  const MAX_PDF = 50 * 1024 * 1024; // PDF chapters can be larger than individual image pages
  const MAX_PAGES = 50;
  let queue = [];
  let draftIndex = 0;

  const bytes = (n) => n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`;
  const cleanupQueueUrls = () => queue.forEach(x => x.url && URL.revokeObjectURL(x.url));

  // Draft reader: lets creators/admins inspect the exact chapter order before any upload.
  const draft = document.createElement('div');
  draft.className = 'draft-preview-modal';
  draft.innerHTML = `
    <div class="draft-preview-backdrop" data-draft-close></div>
    <section class="draft-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="draft-preview-title">
      <header class="draft-preview-header">
        <div><span class="draft-preview-kicker"><i class="fas fa-eye"></i> Draft Preview</span><h3 id="draft-preview-title">Chapter preview</h3></div>
        <button type="button" class="draft-preview-close" data-draft-close aria-label="Close draft preview"><i class="fas fa-times"></i></button>
      </header>
      <div class="draft-preview-body">
        <div class="draft-reader-stage" id="draft-reader-stage"></div>
        <div class="draft-preview-controls">
          <button type="button" class="btn btn-secondary btn-sm" id="draft-prev"><i class="fas fa-chevron-left"></i> Previous</button>
          <span id="draft-counter">Page 1 / 1</span>
          <button type="button" class="btn btn-secondary btn-sm" id="draft-next">Next <i class="fas fa-chevron-right"></i></button>
        </div>
        <div class="draft-thumb-strip" id="draft-thumb-strip"></div>
      </div>
    </section>`;
  document.body.appendChild(draft);
  const draftStage = draft.querySelector('#draft-reader-stage');
  const draftCounter = draft.querySelector('#draft-counter');
  const draftThumbs = draft.querySelector('#draft-thumb-strip');
  const draftPrev = draft.querySelector('#draft-prev');
  const draftNext = draft.querySelector('#draft-next');
  const closeDraft = () => { draft.classList.remove('show'); document.body.classList.remove('draft-preview-open'); };
  draft.querySelectorAll('[data-draft-close]').forEach(el => el.addEventListener('click', closeDraft));
  document.addEventListener('keydown', e => {
    if (!draft.classList.contains('show')) return;
    if (e.key === 'Escape') closeDraft();
    if (e.key === 'ArrowLeft') draftPrev.click();
    if (e.key === 'ArrowRight') draftNext.click();
  });

  function showDraftPage(index) {
    if (!queue.length) return;
    draftIndex = Math.max(0, Math.min(index, queue.length - 1));
    const item = queue[draftIndex];
    if (item.kind === 'pdf') {
      draftStage.innerHTML = `<iframe src="${item.url}#toolbar=1&navpanes=0" title="PDF draft preview"></iframe>`;
    } else {
      draftStage.innerHTML = `<img src="${item.url}" alt="Draft page ${draftIndex + 1}">`;
    }
    draftCounter.textContent = item.kind === 'pdf' ? 'PDF chapter' : `Page ${draftIndex + 1} / ${queue.length}`;
    draftPrev.disabled = draftIndex === 0;
    draftNext.disabled = draftIndex === queue.length - 1;
    draftThumbs.querySelectorAll('.draft-thumb').forEach((el, i) => el.classList.toggle('active', i === draftIndex));
  }

  function openDraft() {
    if (!queue.length) return showToast('Select chapter pages first.', 'error');
    draftThumbs.innerHTML = queue.map((x, i) => x.kind === 'pdf'
      ? `<button type="button" class="draft-thumb" data-draft-index="${i}" aria-label="Preview PDF"><i class="fas fa-file-pdf"></i><small>PDF</small></button>`
      : `<button type="button" class="draft-thumb" data-draft-index="${i}" aria-label="Preview page ${i + 1}"><img src="${x.url}" alt=""><small>${i + 1}</small></button>`).join('');
    draftThumbs.querySelectorAll('[data-draft-index]').forEach(el => el.addEventListener('click', () => showDraftPage(Number(el.dataset.draftIndex))));
    draft.classList.add('show');
    document.body.classList.add('draft-preview-open');
    showDraftPage(draftIndex);
  }
  draftPrev.addEventListener('click', () => showDraftPage(draftIndex - 1));
  draftNext.addEventListener('click', () => showDraftPage(draftIndex + 1));

  function ensureDraftButton() {
    if (!summary || document.getElementById('draft-preview-btn')) return;
    const row = document.createElement('div');
    row.className = 'draft-preview-action-row';
    row.innerHTML = `<button type="button" class="btn btn-secondary btn-sm" id="draft-preview-btn"><i class="fas fa-eye"></i> Preview Draft Before Upload</button>`;
    summary.insertAdjacentElement('afterend', row);
    row.querySelector('button').addEventListener('click', openDraft);
  }
  ensureDraftButton();

  function renderQueue() {
    if (!preview || !summary) return;
    const total = queue.reduce((sum, x) => sum + x.file.size, 0);
    const hasPdf = queue.some(x => x.kind === 'pdf');
    summary.innerHTML = queue.length
      ? `<strong>${queue.length}</strong> ${hasPdf ? 'PDF chapter' : 'page(s)'} • ${bytes(total)} total • <span>${hasPdf ? 'max 50 MB PDF' : 'max 1 MB/page'}</span>`
      : '<span style="color:var(--text-muted)">No pages selected yet.</span>';
    const draftBtn = document.getElementById('draft-preview-btn');
    if (draftBtn) draftBtn.disabled = !queue.length;

    preview.innerHTML = queue.map((x, i) => {
      const media = x.kind === 'pdf'
        ? '<div class="pdf-preview-icon"><i class="fas fa-file-pdf"></i></div>'
        : `<img src="${x.url}" alt="Page ${i + 1}" loading="lazy">`;
      return `<div class="page-preview-item ${x.kind === 'pdf' ? 'pdf-preview-item' : ''}" draggable="${x.kind !== 'pdf'}" data-index="${i}">
        <span class="drag-handle"><i class="fas ${x.kind === 'pdf' ? 'fa-file-pdf' : 'fa-grip-vertical'}"></i></span>
        <b class="page-number">${i + 1}</b>
        ${media}
        <div class="page-preview-meta"><strong>${x.file.name}</strong><small>${bytes(x.file.size)}${x.kind === 'pdf' ? ' • PDF document' : ''}</small></div>
        <button type="button" class="btn btn-secondary btn-sm page-remove" data-index="${i}" aria-label="Remove ${x.file.name}"><i class="fas fa-times"></i></button>
      </div>`;
    }).join('');

    preview.querySelectorAll('.page-remove').forEach(btn => btn.addEventListener('click', () => {
      const i = Number(btn.dataset.index);
      if (queue[i]?.url) URL.revokeObjectURL(queue[i].url);
      queue.splice(i, 1);
      renderQueue();
    }));

    let from = null;
    preview.querySelectorAll('.page-preview-item:not(.pdf-preview-item)').forEach(el => {
      el.addEventListener('dragstart', () => { from = Number(el.dataset.index); el.classList.add('dragging'); });
      el.addEventListener('dragend', () => el.classList.remove('dragging'));
      el.addEventListener('dragover', e => e.preventDefault());
      el.addEventListener('drop', e => {
        e.preventDefault();
        const to = Number(el.dataset.index);
        if (from === null || from === to) return;
        const moved = queue.splice(from, 1)[0];
        queue.splice(to, 0, moved);
        from = null;
        renderQueue();
      });
    });
  }

  function addFiles(files) {
    const arr = Array.from(files || []);
    if (!arr.length) return;
    const pdfs = arr.filter(f => f.type === 'application/pdf' || /\.pdf$/i.test(f.name));
    const images = arr.filter(f => f.type.startsWith('image/'));

    if (pdfs.length) {
      if (pdfs.length !== 1 || images.length || queue.length) {
        return showToast('Upload one PDF chapter by itself. Remove other pages first.', 'error');
      }
      const pdf = pdfs[0];
      if (pdf.size > MAX_PDF) return showToast(`${pdf.name} is ${bytes(pdf.size)}. PDF chapters must be 50 MB or smaller.`, 'error');
      queue = [{ file: pdf, kind: 'pdf', url: URL.createObjectURL(pdf) }];
      renderQueue();
      return;
    }

    if (!images.length) return showToast('Only JPG, PNG, WEBP, GIF images or one PDF are supported.', 'error');
    if (queue.some(x => x.kind === 'pdf')) return showToast('Remove the PDF before selecting image pages.', 'error');
    if (queue.length + images.length > MAX_PAGES) return showToast(`Maximum ${MAX_PAGES} pages per chapter.`, 'error');

    for (const f of images) {
      if (!/^image\/(jpeg|png|webp|gif)$/.test(f.type)) return showToast(`${f.name}: unsupported image format.`, 'error');
      if (f.size > MAX_PAGE) return showToast(`${f.name} is ${bytes(f.size)}. Every image page must be 1 MB or smaller.`, 'error');
    }
    images.forEach(f => queue.push({ file: f, kind: 'image', url: URL.createObjectURL(f) }));
    renderQueue();
  }

  // Always bind the hidden file input. This fixes the admin upload page where
  // the dropzone existed without the expected id, so file selection was ignored.
  if (pagesInput) {
    pagesInput.onchange = () => { addFiles(pagesInput.files); pagesInput.value = ''; };
  }
  if (dropzone && pagesInput) {
    const openPicker = () => pagesInput.click();
    dropzone.onclick = openPicker;
    dropzone.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPicker(); } };
    dropzone.ondragover = e => { e.preventDefault(); dropzone.classList.add('drag-active'); };
    dropzone.ondragleave = () => dropzone.classList.remove('drag-active');
    dropzone.ondrop = e => { e.preventDefault(); dropzone.classList.remove('drag-active'); addFiles(e.dataTransfer.files); };
  }

  if (chapterForm) chapterForm.onsubmit = async e => {
    e.preventDefault();
    const btn = chapterForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    try {
      const comicId = selectComicDropdown?.value;
      if (!comicId) throw new Error('Please select a comic.');
      if (!queue.length) throw new Error('Add at least one chapter page or a PDF.');
      const n = parseFloat(document.getElementById('chapter-number').value);
      if (!Number.isFinite(n) || n <= 0) throw new Error('Enter a valid chapter number.');
      const title = document.getElementById('chapter-title').value.trim() || `Chapter ${n}`;
      let pages;

      if (queue[0].kind === 'pdf') {
        const fd = new FormData();
        fd.append('comicId', comicId);
        fd.append('chapterId', `ch-${Date.now()}`);
        fd.append('pdf', queue[0].file);
        const up = await API.upload('/uploads/chapter-pdf', fd);
        pages = [up.url];
      } else {
        const fd = new FormData();
        fd.append('comicId', comicId);
        fd.append('chapterId', `ch-${Date.now()}`);
        queue.forEach(x => fd.append('pages', x.file));
        const up = await API.upload('/uploads/chapter-pages', fd);
        if ((up.urls || []).length !== queue.length) throw new Error('Some pages failed to upload. Please try again.');
        pages = up.urls;
      }

      const r = await API.post('/chapters', { comicId, chapterNumber: n, title, pages });
      showToast(r.message || 'Chapter submitted for admin review.', 'success');
      cleanupQueueUrls();
      queue = [];
      renderQueue();
      setTimeout(() => location.href = currentUser.role === 'admin' ? '/admin/chapters.html' : '/creator/dashboard.html', 700);
    } catch (err) {
      showToast(`Publishing failed: ${err.message}`, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Chapter for Review';
    }
  };
});
