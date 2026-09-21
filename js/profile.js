/* ==========================================================================
   ComicVerse - User Profile Controller (js/profile.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const profileCard = document.getElementById('profile-card-container');
  const editProfileForm = document.getElementById('edit-profile-form');
  const avatarUploadInput = document.getElementById('avatar-file-input');
  const avatarPreviewImg = document.getElementById('avatar-preview-img');

  if (!profileCard) return; // Not on profile page

  const currentUser = Auth.getCurrentUser();
  if (!currentUser) {
    UI.showToast('Please log in to view your user profile', 'info');
    setTimeout(() => window.location.href = 'login.html', 1000);
    return;
  }

  // Calculate user stats
  const favorites = Storage.getFavorites();
  const history = Storage.getHistory();
  const totalChaptersRead = history.length;

  // 1. Populate Profile Visual Card
  profileCard.innerHTML = `
    <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 2.5rem; display: flex; align-items: center; gap: 2.5rem; flex-wrap: wrap; box-shadow: var(--shadow-lg);">
      <div style="position: relative;">
        <img src="${currentUser.avatar || 'assets/images/avatars/default.svg'}" alt="${currentUser.displayName}" id="profile-card-avatar" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 4px solid var(--accent); box-shadow: 0 0 20px var(--accent-glow);">
        <span style="position: absolute; bottom: 4px; right: 4px; width: 22px; height: 22px; background: var(--success); border: 3px solid var(--bg-card); border-radius: 50%;" title="Active Account"></span>
      </div>

      <div style="flex: 1; min-width: 250px;">
        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
          <h1 style="font-size: 2rem; margin: 0;">${currentUser.displayName}</h1>
          <span class="badge" style="background: var(--accent-light); color: var(--accent);">${currentUser.role || 'Member'}</span>
        </div>
        
        <div style="color: var(--text-secondary); font-size: 0.95rem; margin-top: 0.25rem;">
          @${currentUser.username} • ${currentUser.email}
        </div>

        <p style="color: rgba(255,255,255,0.75); font-size: 0.92rem; margin-top: 0.75rem;">
          ${currentUser.bio || 'No user bio provided yet. Add one in the profile settings below!'}
        </p>

        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem;">
          Member since ${Utils.formatDate(currentUser.createdAt || new Date().toISOString())}
        </div>
      </div>

      <!-- User Stats Grid -->
      <div style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
        <div style="background: var(--bg-secondary); padding: 1.25rem 1.75rem; border-radius: var(--radius-lg); border: 1px solid var(--border); text-align: center; min-width: 110px;">
          <div style="font-size: 1.8rem; font-weight: 800; color: var(--danger);">${favorites.length}</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Favorites</div>
        </div>

        <div style="background: var(--bg-secondary); padding: 1.25rem 1.75rem; border-radius: var(--radius-lg); border: 1px solid var(--border); text-align: center; min-width: 110px;">
          <div style="font-size: 1.8rem; font-weight: 800; color: var(--accent);">${totalChaptersRead}</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Comics Read</div>
        </div>
      </div>
    </div>
  `;

  // 2. Populate Edit Form Inputs
  const nameInput = document.getElementById('edit-display-name');
  const usernameInput = document.getElementById('edit-username');
  const bioInput = document.getElementById('edit-bio');

  if (nameInput) nameInput.value = currentUser.displayName;
  if (usernameInput) usernameInput.value = currentUser.username;
  if (bioInput) bioInput.value = currentUser.bio || '';
  if (avatarPreviewImg) avatarPreviewImg.src = currentUser.avatar || 'assets/images/avatars/default.svg';

  // 3. Local Avatar Image File Preview Handler
  if (avatarUploadInput) {
    avatarUploadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          UI.showToast('Image file size must be less than 2MB', 'error');
          return;
        }
        const reader = new FileReader();
        reader.onload = function(evt) {
          if (avatarPreviewImg) avatarPreviewImg.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // 4. Form Submit Handler
  if (editProfileForm) {
    editProfileForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const newDisplayName = nameInput.value.trim();
      const newUsername = usernameInput.value.trim().toLowerCase();
      const newBio = bioInput.value.trim();
      const newAvatarSrc = avatarPreviewImg ? avatarPreviewImg.src : currentUser.avatar;

      if (!newDisplayName || !newUsername) {
        UI.showToast('Display name and username cannot be empty.', 'error');
        return;
      }

      try {
        const updated = Auth.updateUser({
          displayName: newDisplayName,
          username: newUsername,
          bio: newBio,
          avatar: newAvatarSrc
        });

        UI.showToast('Profile updated successfully!', 'success');
        setTimeout(() => window.location.reload(), 800);
      } catch (err) {
        UI.showToast(err.message, 'error');
      }
    });
  }
});
