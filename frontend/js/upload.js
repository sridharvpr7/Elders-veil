document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar((Auth.getUser() || {}).role === 'admin' ? 'admin' : 'creator');
  renderFooter();

  const currentUser=Auth.getUser();
  const isAdmin=currentUser?.role==='admin';
  if(!currentUser||!['admin','creator'].includes(currentUser.role)){showToast('Become a Comic Writer first.','error');location.href=sitePath('dashboard.html');return;}

  if (!Auth.isLoggedIn()) {
    showToast('Please sign in first.', 'error');
    window.location.href=sitePath('login.html');
    return;
  }

  // Comic Creation Form
  const comicForm = document.getElementById('create-comic-form');
  const coverFileInput = document.getElementById('cover-file');
  const bannerFileInput = document.getElementById('banner-file');

  let saveDraft=false;document.getElementById('save-comic-draft')?.addEventListener('click',()=>{saveDraft=true;comicForm?.requestSubmit()});
  if (comicForm) {
    comicForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = comicForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading & Submitting...';

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
          bannerImage: bannerUrl,
          scheduledPublishAt: isAdmin ? (document.getElementById('comic-schedule')?.value || null) : null,
          saveDraft
        };

        const res = await API.post('/comics', payload);
        showToast(res.message || (saveDraft?'Draft saved.':'Comic submitted for admin review.'), 'success');
        setTimeout(() => window.location.href=sitePath('creator/dashboard.html'), 700);

      } catch (err) {
        showToast(`Creation failed: ${err.message}`, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Comic for Review';
        saveDraft=false;
      }
    });
  }

  // Chapter upload: preview, 150 KB/page validation, drag-to-reorder.
  const selectComicDropdown=document.getElementById('select-comic-id');
  if(selectComicDropdown){try{const r=await API.get(currentUser.role==='admin'?'/comics?limit=100':'/comics?mine=true&limit=100');if(r.comics)selectComicDropdown.innerHTML=r.comics.map(c=>`<option value="${c.id}">${c.title}</option>`).join('')}catch(e){}}
  const chapterForm=document.getElementById('upload-chapter-form'),pagesInput=document.getElementById('pages-file'),dropzone=document.getElementById('pages-dropzone'),preview=document.getElementById('page-preview-list'),summary=document.getElementById('page-upload-summary');
  const MAX_PAGE=150*1024;let queue=[];
  async function compressToLimit(file,maxBytes){if(file.size<=maxBytes)return file;return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{let w=img.naturalWidth,h=img.naturalHeight,quality=.86;const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,w,h);const attempt=()=>canvas.toBlob(blob=>{if(!blob)return reject(Error('Could not compress image.'));if(blob.size<=maxBytes||quality<=.35){resolve(new File([blob],file.name,{type:'image/jpeg'}));return;}quality-=.08;attempt();},'image/jpeg',quality);attempt();};img.onerror=()=>reject(Error('Invalid image.'));img.src=URL.createObjectURL(file);});}

  const bytes=n=>n<1024?`${n} B`:`${(n/1024).toFixed(1)} KB`;
  function render(){if(!preview||!summary)return;summary.innerHTML=queue.length?`<strong>${queue.length}</strong> page(s) • ${bytes(queue.reduce((a,x)=>a+x.file.size,0))} total • max 150 KB/page`:'<span style="color:var(--text-muted)">No pages selected yet.</span>';preview.innerHTML=queue.map((x,i)=>`<div class="page-preview-item" draggable="true" data-index="${i}"><span class="drag-handle"><i class="fas fa-grip-vertical"></i></span><b class="page-number">${i+1}</b><img src="${x.url}" alt="Page ${i+1}"><div class="page-preview-meta"><strong>${x.file.name}</strong><small>${bytes(x.file.size)}</small></div><button type="button" class="btn btn-secondary btn-sm page-remove" data-index="${i}"><i class="fas fa-times"></i></button></div>`).join('');preview.querySelectorAll('.page-remove').forEach(b=>b.onclick=()=>{const i=+b.dataset.index;URL.revokeObjectURL(queue[i].url);queue.splice(i,1);render()});let from=null;preview.querySelectorAll('.page-preview-item').forEach(el=>{el.ondragstart=()=>{from=+el.dataset.index;el.classList.add('dragging')};el.ondragend=()=>el.classList.remove('dragging');el.ondragover=e=>e.preventDefault();el.ondrop=e=>{e.preventDefault();const to=+el.dataset.index;if(from===null||from===to)return;const m=queue.splice(from,1)[0];queue.splice(to,0,m);from=null;render()}})}
  async function addFiles(files){const arr=Array.from(files||[]);if(queue.length+arr.length>50)return showToast('Maximum 50 pages per chapter.','error');for(let f of arr){if(!/^image\/(jpeg|png|webp|gif)$/.test(f.type))return showToast(`${f.name}: unsupported image format.`,'error');try{if(f.size>MAX_PAGE){showToast(`${f.name} is being compressed to 150 KB...`,'info');f=await compressToLimit(f,MAX_PAGE);if(f.size>MAX_PAGE)return showToast(`${f.name} could not be compressed below 150 KB.`,'error');}}catch(e){return showToast(`${f.name}: ${e.message}`,'error')}queue.push({file:f,url:URL.createObjectURL(f)})}render()}
  if(dropzone){dropzone.onclick=()=>pagesInput?.click();dropzone.ondragover=e=>{e.preventDefault();dropzone.classList.add('drag-active')};dropzone.ondragleave=()=>dropzone.classList.remove('drag-active');dropzone.ondrop=e=>{e.preventDefault();dropzone.classList.remove('drag-active');addFiles(e.dataTransfer.files)}}if(pagesInput)pagesInput.onchange=()=>{addFiles(pagesInput.files);pagesInput.value=''};
  const cs=document.getElementById('comic-schedule'), chs=document.getElementById('chapter-schedule'); if(!isAdmin){if(cs){cs.disabled=true;cs.title='Scheduling is available to administrators after review.';} if(chs){chs.disabled=true;chs.title='Scheduling is available to administrators after review.';}}
  if(chapterForm)chapterForm.onsubmit=async e=>{e.preventDefault();const btn=chapterForm.querySelector('button[type="submit"]');btn.disabled=true;btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Uploading Pages...';try{const comicId=selectComicDropdown?.value;if(!comicId)throw Error('Please select a comic.');if(!queue.length)throw Error('Add at least one chapter page.');const fd=new FormData();fd.append('comicId',comicId);fd.append('chapterId',`ch-${Date.now()}`);queue.forEach(x=>fd.append('pages',x.file));const up=await API.upload('/uploads/chapter-pages',fd);if((up.urls||[]).length!==queue.length)throw Error('Some pages failed to upload. Please try again.');const n=parseFloat(document.getElementById('chapter-number').value);if(!Number.isFinite(n)||n<=0)throw Error('Enter a valid chapter number.');const schedule=document.getElementById('chapter-schedule')?.value || null; const r=await API.post('/chapters',{comicId,chapterNumber:n,title:document.getElementById('chapter-title').value.trim()||`Chapter ${n}`,pages:up.urls,scheduledPublishAt:isAdmin?schedule:null});showToast(r.message||'Chapter submitted for admin review.','success');setTimeout(()=>location.href=sitePath('creator/dashboard.html'),700)}catch(err){showToast(`Publishing failed: ${err.message}`,'error')}finally{btn.disabled=false;btn.innerHTML='<i class="fas fa-paper-plane"></i> Submit Chapter for Review'}};
});
