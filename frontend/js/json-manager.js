document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar('admin');
  renderFooter();

  if (!Auth.isLoggedIn() || !Auth.isAdmin()) {
    showToast('Admin authorization required.', 'error');
    window.location.href = '/login.html';
    return;
  }

  const jsonTextarea = document.getElementById('json-input');
  const jsonFileInput = document.getElementById('json-file-input');
  const importBtn = document.getElementById('import-json-btn');
  const exportBtn = document.getElementById('export-json-btn');
  const validationResultBox = document.getElementById('validation-result');

  // File picker handler
  if (jsonFileInput && jsonTextarea) {
    jsonFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          jsonTextarea.value = event.target.result;
        };
        reader.readAsText(file);
      }
    });
  }

  // Import JSON Handler
  if (importBtn) {
    importBtn.addEventListener('click', async () => {
      const rawText = jsonTextarea ? jsonTextarea.value.trim() : '';
      if (!rawText) {
        showToast('Please paste or select a JSON dataset.', 'error');
        return;
      }

      let parsedJson = null;
      try {
        parsedJson = JSON.parse(rawText);
      } catch (err) {
        showToast('Invalid JSON syntax: ' + err.message, 'error');
        if (validationResultBox) {
          validationResultBox.style.display = 'block';
          validationResultBox.innerHTML = `<p style="color:var(--accent-pink);"><strong>JSON Syntax Error:</strong> ${err.message}</p>`;
        }
        return;
      }

      importBtn.disabled = true;
      importBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validating & Importing...';

      try {
        const res = await API.post('/admin/comics/import', parsedJson);
        showToast(res.message || 'JSON dataset imported successfully!', 'success');

        if (validationResultBox) {
          validationResultBox.style.display = 'block';
          validationResultBox.innerHTML = `
            <div style="background:rgba(16,185,129,0.15); border:1px solid #10b981; padding:1rem; border-radius:8px;">
              <h4 style="color:#10b981;"><i class="fas fa-check-circle"></i> Import Completed Successfully</h4>
              <p style="margin-top:0.5rem;">Imported <strong>${res.importedComicsCount}</strong> comics and <strong>${res.importedChaptersCount}</strong> chapters into PostgreSQL.</p>
            </div>
          `;
        }
      } catch (err) {
        showToast(`Import failed: ${err.message}`, 'error');
        if (validationResultBox) {
          validationResultBox.style.display = 'block';
          validationResultBox.innerHTML = `
            <div style="background:rgba(244,63,94,0.15); border:1px solid var(--accent-pink); padding:1rem; border-radius:8px;">
              <h4 style="color:var(--accent-pink);"><i class="fas fa-exclamation-triangle"></i> JSON Import Validation Failed</h4>
              <p style="margin-top:0.5rem; color:var(--text-primary);">${err.message}</p>
            </div>
          `;
        }
      } finally {
        importBtn.disabled = false;
        importBtn.innerHTML = '<i class="fas fa-file-import"></i> Import JSON Dataset';
      }
    });
  }

  // Export JSON Handler
  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      exportBtn.disabled = true;
      exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating Backup...';
      try {
        const token = Auth.getToken();
        const response = await fetch('/api/admin/comics/export', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comicverse_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        showToast('JSON backup exported successfully!', 'success');
      } catch (err) {
        showToast('Export failed: ' + err.message, 'error');
      } finally {
        exportBtn.disabled = false;
        exportBtn.innerHTML = '<i class="fas fa-file-export"></i> Export Complete JSON Backup';
      }
    });
  }
});
