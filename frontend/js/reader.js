document.addEventListener('DOMContentLoaded', async () => {
  document.body.classList.add('reader-page-body');

  const urlParams = new URLSearchParams(window.location.search);
  const chapterId = urlParams.get('id');
  const requestedPage = Math.max(1, parseInt(urlParams.get('page') || '1', 10));

  if (!chapterId) {
    window.location.href = '/comics.html';
    return;
  }

  const readerContainer = document.getElementById('reader-pages');
  const progressBar = document.getElementById('reader-progress');
  const pagePill = document.getElementById('page-pill');

  let currentChapter = null;
  let allChapters = [];
  let currentPageIndex = 1;
  let readerPrefs = { reading_mode:'vertical', fit_mode:'width', image_quality:'high', auto_scroll:false, auto_scroll_speed:2 };

  try {
    const res = await API.get(`/chapters/${encodeURIComponent(chapterId)}`);
    currentChapter = res.chapter;
    if (Auth.isLoggedIn()) { API.get('/platform/reader/preferences').then(x=>{ readerPrefs=x.preferences||readerPrefs; applyReaderPrefs(); }).catch(()=>{}); }
    allChapters = res.allChapters || [];

    // Count one comic view per browser session when the reader is actually opened.
    // This avoids inflating views from comic detail/catalog page visits or chapter navigation.
    const viewKey = `elder-veil-viewed-${currentChapter.comicId}`;
    const updateReaderViewCount = (viewRes) => {
      const viewEl = document.getElementById('reader-view-count');
      if (viewEl && viewRes && viewRes.views !== undefined) {
        viewEl.textContent = Number(viewRes.views).toLocaleString();
      }
    };

    if (!sessionStorage.getItem(viewKey)) {
      API.post(`/comics/${encodeURIComponent(currentChapter.comicId)}/view`, {})
        .then(viewRes => {
          sessionStorage.setItem(viewKey, '1');
          updateReaderViewCount(viewRes);
        })
        .catch(() => {});
    } else {
      // Keep the displayed count accurate without creating another view.
      API.get(`/comics/${encodeURIComponent(currentChapter.comicId)}`)
        .then(viewRes => updateReaderViewCount(viewRes.comic || viewRes))
        .catch(() => {});
    }

    document.title = `Chapter ${currentChapter.chapterNumber} — Elder's Veil Reader`;

    // Render header title & controls
    const titleEl = document.getElementById('reader-comic-title');
    const chTitleEl = document.getElementById('reader-chapter-title');
    const selectorEl = document.getElementById('chapter-selector');

    if (titleEl) titleEl.textContent = currentChapter.title || `Chapter ${currentChapter.chapterNumber}`;
    if (chTitleEl) chTitleEl.textContent = `Ch. ${currentChapter.chapterNumber}`;

    if (selectorEl) {
      selectorEl.innerHTML = allChapters.map(ch => `
        <option value="${ch.id}" ${ch.id === currentChapter.id ? 'selected' : ''}>
          Chapter ${ch.chapterNumber}: ${ch.title || ''}
        </option>
      `).join('');

      selectorEl.addEventListener('change', (e) => {
        window.location.href = `/reader.html?id=${e.target.value}`;
      });
    }

    function applyReaderPrefs(){
      const mode=document.getElementById('reader-mode'); const fit=document.getElementById('reader-fit');
      if(mode) mode.value=readerPrefs.reading_mode||'vertical'; if(fit) fit.value=readerPrefs.fit_mode||'width';
      readerContainer.classList.toggle('reader-horizontal',(readerPrefs.reading_mode||'vertical')==='horizontal');
      readerContainer.classList.toggle('reader-single',(readerPrefs.reading_mode||'vertical')==='single');
      document.querySelectorAll('.reader-image').forEach((img,i)=>{img.classList.toggle('fit-contain',readerPrefs.fit_mode==='contain');img.classList.toggle('fit-original',readerPrefs.fit_mode==='original');if(readerPrefs.reading_mode==='single')img.parentElement.classList.toggle('active',i===currentPageIndex-1);});
    }
    // Render Pages
    const pages = currentChapter.pages || [];
    if (pages.length === 0) {
      readerContainer.innerHTML = `
        <div style="text-align:center; padding:5rem 1rem;">
          <p style="color:var(--text-secondary);">No pages uploaded for this chapter yet.</p>
        </div>
      `;
    } else {
      readerContainer.innerHTML = pages.map((url, idx) => `
        <div class="reader-image-wrap" id="page-${idx + 1}" data-page="${idx + 1}">
          <img src="${API.assetUrl(url)}" class="reader-image" alt="Page ${idx + 1}" loading="${idx === 0 ? 'eager' : 'lazy'}" decoding="async" />
        </div>
      `).join('');
    }

    applyReaderPrefs();
    // Resume exact page when Continue Reading supplies a saved page.
    currentPageIndex = Math.min(requestedPage, Math.max(1, pages.length));
    applyReaderPrefs();
    if (pagePill) pagePill.textContent = `Page ${currentPageIndex} / ${pages.length}`;
    if (requestedPage > 1) { setTimeout(() => document.getElementById(`page-${currentPageIndex}`)?.scrollIntoView({ behavior: 'auto', block: 'start' }), 150); }
    // Save only when a page was explicitly requested (Continue Reading) or after scrolling.
    if (Auth.isLoggedIn() && requestedPage > 1) { API.post('/users/me/history', { comicId: currentChapter.comicId, chapterId: currentChapter.id, pageNumber: currentPageIndex }).catch(() => {}); }

    // Prev / Next Chapter Buttons
    const currIdx = allChapters.findIndex(ch => ch.id === currentChapter.id);
    const prevCh = currIdx > 0 ? allChapters[currIdx - 1] : null;
    const nextCh = currIdx < allChapters.length - 1 ? allChapters[currIdx + 1] : null;

    const prevBtn = document.getElementById('prev-ch-btn');
    const nextBtn = document.getElementById('next-ch-btn');
    const navFooter = document.getElementById('reader-nav-footer');

    if (prevBtn) {
      if (prevCh) {
        prevBtn.onclick = () => window.location.href = `/reader.html?id=${prevCh.id}`;
      } else {
        prevBtn.disabled = true;
      }
    }
    if (nextBtn) {
      if (nextCh) {
        nextBtn.onclick = () => window.location.href = `/reader.html?id=${nextCh.id}`;
      } else {
        nextBtn.disabled = true;
      }
    }

    if (navFooter) {
      navFooter.innerHTML = `
        <button class="btn btn-secondary" ${!prevCh ? 'disabled' : ''} onclick="${prevCh ? `location.href='/reader.html?id=${prevCh.id}'` : ''}">
          <i class="fas fa-chevron-left"></i> Previous Chapter
        </button>
        <button class="btn btn-primary" ${!nextCh ? 'disabled' : ''} onclick="${nextCh ? `location.href='/reader.html?id=${nextCh.id}'` : ''}">
          Next Chapter <i class="fas fa-chevron-right"></i>
        </button>
      `;
    }

    // Track scroll reading progress
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      if (progressBar) progressBar.style.width = `${Math.min(100, Math.max(0, scrollPercent))}%`;

      // Find current visible page
      const pageElements = document.querySelectorAll('.reader-image-wrap');
      pageElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
          const pageNum = parseInt(el.getAttribute('data-page'), 10);
          if (pageNum && pageNum !== currentPageIndex) {
            currentPageIndex = pageNum;
            if (pagePill) pagePill.textContent = `Page ${currentPageIndex} / ${pages.length}`;
            
            // Save progress to backend asynchronously if logged in
            if (Auth.isLoggedIn()) {
              API.post('/users/me/history', {
                comicId: currentChapter.comicId,
                chapterId: currentChapter.id,
                pageNumber: currentPageIndex
              }).catch(() => {});
            }
          }
        }
      });
    });

    const modeEl=document.getElementById('reader-mode'), fitEl=document.getElementById('reader-fit');
    if(modeEl) modeEl.onchange=async()=>{readerPrefs.reading_mode=modeEl.value;applyReaderPrefs();if(Auth.isLoggedIn())API.put('/platform/reader/preferences',{readingMode:readerPrefs.reading_mode,fitMode:readerPrefs.fit_mode,imageQuality:readerPrefs.image_quality,autoScroll:readerPrefs.auto_scroll}).catch(()=>{});};
    if(fitEl) fitEl.onchange=async()=>{readerPrefs.fit_mode=fitEl.value;applyReaderPrefs();if(Auth.isLoggedIn())API.put('/platform/reader/preferences',{readingMode:readerPrefs.reading_mode,fitMode:readerPrefs.fit_mode,imageQuality:readerPrefs.image_quality,autoScroll:readerPrefs.auto_scroll}).catch(()=>{});};
    const tools=document.getElementById('reader-tools-panel');
    async function loadMediaAndRecap(){
      if(!tools)return; tools.hidden=false; tools.innerHTML='<i class="fas fa-circle-notch fa-spin"></i> Loading reader extras...';
      const [rec,media,interactive]=await Promise.all([API.get(`/platform/chapters/${currentChapter.id}/recap`).catch(()=>({})),API.get(`/platform/chapters/${currentChapter.id}/media`).catch(()=>({})),API.get(`/platform/chapters/${currentChapter.id}/interactive`).catch(()=>({}))]);
      tools.innerHTML=`${rec.recap?.recap?`<details open><summary><strong>🧠 Chapter Recap</strong></summary><p style="margin-top:.6rem;line-height:1.7">${rec.recap.recap}</p></details>`:''}${media.audio?.audio_url?`<div style="margin-top:.8rem"><strong>🎧 Audio Mode</strong><audio controls preload="none" src="${media.audio.audio_url}" style="width:100%;margin-top:.4rem"></audio></div>`:''}${media.motion?.manifest?`<details style="margin-top:.8rem"><summary><strong>🎬 Motion Comic</strong></summary><pre style="white-space:pre-wrap">${JSON.stringify(media.motion.manifest,null,2)}</pre></details>`:''}${interactive.story?`<div style="margin-top:.8rem"><strong>🔀 ${interactive.story.title}</strong><p>${interactive.story.intro||''}</p><div style="display:flex;flex-wrap:wrap;gap:.5rem">${(interactive.story.choices||[]).map(c=>`<button class="btn btn-secondary btn-sm interactive-choice" data-next="${c.next_chapter_id||''}">${c.label}</button>`).join('')}</div></div>`:''}`;
      tools.querySelectorAll('.interactive-choice').forEach(b=>b.onclick=()=>{if(b.dataset.next)location.href='/reader.html?id='+encodeURIComponent(b.dataset.next);});
    }
    document.getElementById('recap-btn')?.addEventListener('click',loadMediaAndRecap);
    document.getElementById('offline-btn')?.addEventListener('click',async()=>{if(!Auth.isLoggedIn()){alert('Sign in to save chapters offline.');return;}try{const r=await API.get(`/platform/offline/${currentChapter.id}`);const urls=r.manifest?.pages||[];if('caches' in window){const cache=await caches.open('elders-veil-offline-v1');await cache.addAll(urls);localStorage.setItem('offline:'+currentChapter.id,'1');showToast?.('Chapter saved for offline reading.','success');}else alert('Offline cache is not supported by this browser.');}catch(e){showToast?.(e.message,'error');}});
    document.getElementById('reader-mode')?.addEventListener('change',()=>{if(readerPrefs.reading_mode==='single')document.querySelectorAll('.reader-image-wrap').forEach((el,i)=>el.classList.toggle('active',i===currentPageIndex-1));});

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' && prevCh) {
        window.location.href = `/reader.html?id=${prevCh.id}`;
      } else if (e.key === 'ArrowRight' && nextCh) {
        window.location.href = `/reader.html?id=${nextCh.id}`;
      }
    });

    // Fullscreen Toggle
    const fsBtn = document.getElementById('fullscreen-btn');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

  } catch (err) {
    const isPremiumBlock = err.message && /exclusively|premium|403/i.test(err.message);
    if (isPremiumBlock) {
      readerContainer.innerHTML = `
        <div style="max-width:550px; margin:4rem auto; text-align:center; padding:2.5rem; background:var(--bg-secondary); border:1px solid rgba(124,58,237,0.3); border-radius:16px;">
          <div style="font-size:3.5rem; color:#a855f7; margin-bottom:1rem;">
            <i class="fas fa-crown"></i>
          </div>
          <h2 style="font-size:1.6rem; font-weight:700; margin-bottom:0.75rem; color:var(--text-primary);">Premium Comic Access Required</h2>
          <p style="color:var(--text-secondary); font-size:1rem; line-height:1.6; margin-bottom:1.75rem;">
            This comic is available exclusively to Premium members.
          </p>
          <div style="display:flex; justify-content:center; gap:1rem; flex-wrap:wrap;">
            <a href="/premium-comics.html" class="btn btn-primary" style="padding:0.75rem 1.75rem;">
              <i class="fas fa-crown"></i> Browse Premium Comics
            </a>
            <a href="/comics.html" class="btn btn-secondary" style="padding:0.75rem 1.5rem;">
              Return to Catalog
            </a>
          </div>
        </div>
      `;
    } else {
      readerContainer.innerHTML = `
        <div style="text-align:center; padding:5rem 1rem;">
          <i class="fas fa-exclamation-triangle" style="font-size:3rem; color:var(--accent-pink); margin-bottom:1rem;"></i>
          <h2>Error Loading Reader</h2>
          <p style="color:var(--text-secondary); margin-bottom:1.5rem;">${err.message}</p>
          <a href="/comics.html" class="btn btn-primary">Return to Catalog</a>
        </div>
      `;
    }
  }
});
