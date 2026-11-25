// public/js/app.js — BeeLab UI helpers

document.addEventListener('DOMContentLoaded', () => {
  // 1. Delete Hive Modal wiring
  const deleteModal = document.getElementById('deleteHiveModal');
  if (deleteModal) {
    deleteModal.addEventListener('show.bs.modal', (event) => {
      const btn = event.relatedTarget;
      if (!btn) return;
      const hiveId = btn.getAttribute('data-hive-id');
      const hiveNumber = btn.getAttribute('data-hive-number');
      const form = deleteModal.querySelector('#deleteHiveForm');
      const label = deleteModal.querySelector('#deleteHiveNumber');
      if (form && hiveId) {
        form.setAttribute('action', `/hive/${hiveId}/delete`);
      }
      if (label && hiveNumber) {
        label.textContent = hiveNumber;
      }
    });
  }

  // 2. Dashboard search & status filter
  const searchInput = document.getElementById('hiveSearch');
  const statusFilter = document.getElementById('hiveStatusFilter');
  const hiveRows = document.querySelectorAll('[data-hive-row]');

  function filterHives() {
    if (!hiveRows.length) return;
    const query = (searchInput?.value || '').trim().toLowerCase();
    const status = statusFilter?.value || 'all';

    hiveRows.forEach((row) => {
      const num = (row.getAttribute('data-hive-number') || '').toLowerCase();
      const species = (row.getAttribute('data-hive-species') || '').toLowerCase();
      const rowStatus = row.getAttribute('data-hive-color') || '';
      const matchesQuery = !query || num.includes(query) || species.includes(query);
      const matchesStatus = status === 'all' || rowStatus === status;
      row.style.display = matchesQuery && matchesStatus ? '' : 'none';
    });
  }

  if (searchInput) searchInput.addEventListener('input', filterHives);
  if (statusFilter) statusFilter.addEventListener('change', filterHives);

  // 3. Auto-hide flash alerts after 5 seconds
  document.querySelectorAll('.alert-dismissible[data-auto-dismiss]').forEach((el) => {
    setTimeout(() => {
      const bsAlert = window.bootstrap?.Alert?.getOrCreateInstance(el);
      if (bsAlert) bsAlert.close();
      else el.remove();
    }, 5000);
  });
});
