document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.isLoggedIn()) { window.location.href = '/login.html?redirect=notifications.html'; return; }
  renderNavbar('notifications'); renderFooter();
  const list = document.getElementById('notifications-list');
  const summary = document.getElementById('notification-summary');
  let items=[];
  const paint=()=>{
    const unread=items.filter(n=>!n.read).length;
    summary.textContent = unread ? `${unread} unread notification${unread===1?'':'s'}` : 'You’re all caught up.';
    if(!items.length){ list.innerHTML='<div class="notifications-empty"><i class="far fa-bell-slash"></i><h3>No notifications</h3><p>New account, comic, chapter and creator updates will appear here.</p></div>'; return; }
    list.innerHTML=items.map(n=>`<article class="page-notification ${n.read?'':'unread'}" data-id="${n.id}"><div class="notification-icon"><i class="fas ${notificationIcon(n.type)}"></i></div><div><h3>${escapeHtml(n.title||'Notification')}</h3><p>${escapeHtml(n.message||'')}</p><time>${notificationTime(n.createdAt||n.created_at)}</time></div><button type="button" class="notification-remove" data-delete="${n.id}" aria-label="Remove notification"><i class="fas fa-times"></i></button></article>`).join('');
  };
  const load=async()=>{try{const r=await API.get('/notifications/?limit=100');items=r.notifications||[];paint();}catch(e){list.innerHTML='<div class="notifications-empty"><i class="fas fa-circle-exclamation"></i><h3>Could not load notifications</h3><p>Please refresh and try again.</p></div>';}};
  await load();
  list.addEventListener('click',async e=>{const b=e.target.closest('[data-delete]');if(!b)return;const id=b.dataset.delete;b.disabled=true;try{await API.delete(`/notifications/${encodeURIComponent(id)}`);items=items.filter(n=>n.id!==id);paint();showToast('Notification removed.','success',2200);}catch{b.disabled=false;showToast('Could not remove notification.','error');}});
  document.getElementById('mark-all').addEventListener('click',async()=>{try{await API.put('/notifications/read-all',{});items=items.map(n=>({...n,read:true}));paint();showToast('All notifications marked as read.','success',2200);}catch{showToast('Could not update notifications.','error');}});
  document.getElementById('clear-all').addEventListener('click',async()=>{if(!items.length)return;try{await API.delete('/notifications/');items=[];paint();showToast('All notifications removed.','success',2200);}catch{showToast('Could not clear notifications.','error');}});
});
