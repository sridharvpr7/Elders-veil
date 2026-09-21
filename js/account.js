/* ==========================================================================
   ComicVerse - Account Settings & Security Controller (js/account.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const currentUser = Auth.getCurrentUser();

  if (!currentUser && window.location.pathname.includes('account.html')) {
    UI.showToast('Please log in to manage your account settings', 'info');
    setTimeout(() => window.location.href = 'login.html', 1000);
    return;
  }

  // 1. Password Change Form Handler
  const changePasswordForm = document.getElementById('change-password-form');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const currentPass = document.getElementById('acc-current-password').value;
      const newPass = document.getElementById('acc-new-password').value;
      const confirmPass = document.getElementById('acc-confirm-password').value;

      if (newPass !== confirmPass) {
        UI.showToast('New passwords do not match.', 'error');
        return;
      }

      try {
        Auth.changePassword(currentPass, newPass);
        UI.showToast('Password changed successfully!', 'success');
        changePasswordForm.reset();
      } catch (err) {
        UI.showToast(err.message, 'error');
      }
    });
  }

  // 2. Reading History Reset
  const clearHistoryBtn = document.getElementById('acc-clear-history-btn');
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear your reading history?')) {
        Storage.clearHistory();
        UI.showToast('Reading history and progress cleared', 'success');
      }
    });
  }

  // 3. Delete Account Modal Trigger & Action
  const deleteModal = document.getElementById('delete-account-modal');
  const openDeleteModalBtn = document.getElementById('acc-open-delete-modal-btn');
  const cancelDeleteBtn = document.getElementById('cancel-delete-account-btn');
  const confirmDeleteBtn = document.getElementById('confirm-delete-account-btn');

  if (openDeleteModalBtn && deleteModal) {
    openDeleteModalBtn.addEventListener('click', () => deleteModal.classList.add('active'));
  }
  if (cancelDeleteBtn && deleteModal) {
    cancelDeleteBtn.addEventListener('click', () => deleteModal.classList.remove('active'));
  }
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', () => {
      Auth.deleteAccount();
      UI.showToast('Account deleted permanently.', 'info');
    });
  }
});
