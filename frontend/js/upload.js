document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar('admin');
  renderFooter();

  if (!Auth.isLoggedIn() || !Auth.isAdmin()) {
    showToast('Admin authorization required.', 'error');
    window.location.href = '/login.html';
    return;
  }

  // Comic Creation Form
  const comicForm = document.getElementById('create-comic-form');
  const coverFileInput = document.getElementById('cover-file');
  const bannerFileInput = document.getElementById('banner-file');

  if (comicForm) {
    comicForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = comicForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading & Publishing...';

      try {
        let coverUrl = '/uploads/covers/default.jpg';
        let bannerUrl = '/uploads/banners/default.jpg';

        // Upload cover image if selected
        if (coverFileInput && coverFileInput.files[0]) {
          const formData = new FormData();
          formData.append('cover', coverFileInput.files[0]);
          const coverRes = await API.upload('/uploads/cover', formData);
          coverUrl = coverRes.url;
        }

        // Upload banner image if selected
        if (bannerFileInput && bannerFileInput.files[0]) {
          const formData = new FormData();
          formData.append('banner', bannerFileInput.files[0]);
          const bannerRes = await API.upload('/uploads/banner', formData);
          bannerUrl = bannerRes.url;
        }

        const genresVal = document.getElementById('comic-genres').value;
        const genres = genresVal ? genresVal.split(',').map(s => s.trim()).filter(Boolean) : ['Action'];

        const payload = {
          title: document.getElementById('comic-title').value.trim(),
          description: document.getElementById('comic-desc').value.trim(),
          author: document.getElementById('comic-author').value.trim(),
          artist: document.getElementById('comic-artist').value.trim(),
          status: document.getElementById('comic-status').value,
          type: document.getElementById('comic-type').value,
          rating: parseFloat(document.getElementById('comic-rating').value) || 4.5,
          genres,
          coverImage: coverUrl,
          bannerImage: bannerUrl
        };

        const res = await API.post('/comics', payload);
        showToast('Comic created successfully!', 'success');
        setTimeout(() => window.location.href = `/comic.html?slug=${res.comic.slug}`, 1000);

      } catch (err) {
        showToast(`Creation failed: ${err.message}`, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Create Comic';
      }
    });
  }

  // Populate Select Comic dropdown for Chapter Upload
  const selectComicDropdown = document.getElementById('select-comic-id');
  if (selectComicDropdown) {
    try {
      const res = await API.get('/comics?limit=100');
      if (res.comics) {
        selectComicDropdown.innerHTML = res.comics.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
      }
    } catch (err) {}
  }

  // Chapter Creation & Multi-Page Upload Form
  const chapterForm = document.getElementById('upload-chapter-form');
  const pagesFileInput = document.getElementById('pages-file');

  if (chapterForm) {
    chapterForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = chapterForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading Pages...';

      try {
        const comicId = selectComicDropdown ? selectComicDropdown.value : '';
        if (!comicId) throw new Error('Please select a comic.');

        let pageUrls = [];

        if (pagesFileInput && pagesFileInput.files.length > 0) {
          const formData = new FormData();
          formData.append('comicId', comicId);
          formData.append('chapterId', `ch-${Date.now()}`);
          for (let i = 0; i < pagesFileInput.files.length; i++) {
            formData.append('pages', pagesFileInput.files[i]);
          }
          const uploadRes = await API.upload('/uploads/chapter-pages', formData);
          pageUrls = uploadRes.urls || [];
        }

        const payload = {
          comicId,
          chapterNumber: parseFloat(document.getElementById('chapter-number').value),
          title: document.getElementById('chapter-title').value.trim() || `Chapter ${document.getElementById('chapter-number').value}`,
          pages: pageUrls
        };

        const res = await API.post('/chapters', payload);
        showToast('Chapter published successfully!', 'success');
        setTimeout(() => window.location.href = `/reader.html?id=${res.chapter.id}`, 1000);

      } catch (err) {
        showToast(`Publishing failed: ${err.message}`, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-upload"></i> Publish Chapter';
      }
    });
  }
});
