/* ==========================================================================
   EDMRS - Application Master Controller & Initializer (js/app.js)
   Handles sidebar toggle, user dropdowns, global search shortcuts & clock
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Always auto-fetch database & settings from Google Sheets on app load (even on login screen)
  autoFetchFromGoogleSheets(false);

  // Check if authenticated
  if (window.authSystem && window.authSystem.isAuthenticated()) {
    initAppShell();
  }

  // Initial Route Trigger
  if (window.router) window.router.handleRoute();

  // Auto-fetch on window focus (when returning to browser tab)
  window.addEventListener('focus', () => {
    autoFetchFromGoogleSheets(true);
  });

  // Background real-time polling every 15 seconds
  setInterval(() => {
    autoFetchFromGoogleSheets(true);
  }, 15000);
});

function initAppShell() {
  const user = window.authSystem.getCurrentUser();
  const settings = window.db.data.settings || {};

  // Populate User Info in Sidebar & Topbar
  if (user) {
    const userAvatarEl = document.getElementById('user-avatar');
    const userAvatarTop = document.getElementById('user-avatar-top');
    const nameEl = document.getElementById('user-display-name');
    const roleBadgeEl = document.getElementById('user-role-badge');
    const usernameTop = document.getElementById('username-top');
    const fullNameDropdown = document.getElementById('user-full-name-dropdown');
    const roleDropdown = document.getElementById('user-role-dropdown');

    const firstChar = (user.first_name || user.username).charAt(0).toUpperCase();

    if (userAvatarEl) userAvatarEl.textContent = firstChar;
    if (userAvatarTop) userAvatarTop.textContent = firstChar;
    if (nameEl) nameEl.textContent = `${user.title || ''}${user.first_name} ${user.last_name}`;
    if (roleBadgeEl) roleBadgeEl.textContent = user.role_code.toUpperCase();
    if (usernameTop) usernameTop.textContent = user.username;
    if (fullNameDropdown) fullNameDropdown.textContent = `${user.title || ''}${user.first_name} ${user.last_name}`;
    if (roleDropdown) roleDropdown.textContent = user.role_code;
  }

  // Populate Organization Info
  const orgNameEl = document.getElementById('topbar-org-name');
  if (orgNameEl && settings.org_name_th) {
    orgNameEl.textContent = settings.org_name_th;
  }

  const logoEl = document.getElementById('app-logo');
  const topbarLogoEl = document.getElementById('topbar-logo');
  const faviconEl = document.getElementById('app-favicon');
  if (settings.logo_url) {
    if (logoEl) logoEl.src = settings.logo_url;
    if (topbarLogoEl) topbarLogoEl.src = settings.logo_url;
    if (faviconEl) faviconEl.href = settings.logo_url;
  }

  // Sidebar Toggle for Mobile & Desktop
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const toggleBtn = document.getElementById('sidebar-toggle-btn');
  const closeBtn = document.getElementById('sidebar-close-btn');

  if (toggleBtn) {
    toggleBtn.onclick = () => {
      sidebar.classList.toggle('open');
      if (sidebarOverlay) sidebarOverlay.classList.toggle('show');
    };
  }

  if (closeBtn) {
    closeBtn.onclick = () => {
      sidebar.classList.remove('open');
      if (sidebarOverlay) sidebarOverlay.classList.remove('show');
    };
  }

  if (sidebarOverlay) {
    sidebarOverlay.onclick = () => {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('show');
    };
  }

  // User Dropdown Menu Toggle
  const userMenuBtn = document.getElementById('user-menu-btn');
  const userDropdown = document.getElementById('user-dropdown');
  if (userMenuBtn && userDropdown) {
    userMenuBtn.onclick = (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('show');
    };
  }

  // Notification Dropdown Toggle
  const notifBtn = document.getElementById('notification-btn');
  const notifDropdown = document.getElementById('notification-dropdown');
  if (notifBtn && notifDropdown) {
    notifBtn.onclick = (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('show');
    };
  }

  // Close Dropdowns on Click Outside
  document.addEventListener('click', () => {
    if (userDropdown) userDropdown.classList.remove('show');
    if (notifDropdown) notifDropdown.classList.remove('show');
  });

  // Logout Buttons
  const logoutBtn = document.getElementById('logout-btn');
  const dropdownLogoutBtn = document.getElementById('user-logout-dropdown-btn');

  if (logoutBtn) logoutBtn.onclick = () => window.authSystem.logout();
  if (dropdownLogoutBtn) dropdownLogoutBtn.onclick = () => window.authSystem.logout();

  // Quick Camera Scan Button in Topbar
  const quickScanBtn = document.getElementById('quick-scan-btn');
  if (quickScanBtn) {
    quickScanBtn.onclick = () => {
      window.location.hash = '#qr-scanner';
    };
  }

  // Scanner Modal Close Button
  const scannerCloseBtn = document.getElementById('scanner-modal-close-btn');
  const scannerContainer = document.getElementById('scanner-modal-container');
  if (scannerCloseBtn && scannerContainer) {
    scannerCloseBtn.onclick = () => scannerContainer.classList.remove('show');
    scannerContainer.onclick = (e) => {
      if (e.target === scannerContainer) scannerContainer.classList.remove('show');
    };
  }

  // Fetch All Real Data from Google Sheets
  const fetchSheetsBtn = document.getElementById('fetch-sheets-data-btn');
  if (fetchSheetsBtn) {
    fetchSheetsBtn.onclick = async () => {
      try {
        if (window.utils && window.utils.showLoadingModal) {
          window.utils.showLoadingModal(
            'กำลังเชื่อมต่อและโหลดข้อมูลสด...',
            'ระบบกำลังดึงข้อมูลนักเรียน เอกสาร ปพ. และทะเบียนจาก<br><strong style="color: #334155;">Google Sheets</strong>'
          );
          if (window.utils.updateLoadingModalProgress) window.utils.updateLoadingModalProgress(40);
        }
        const counts = await window.db.syncFromGoogleSheets();
        if (window.utils && window.utils.updateLoadingModalProgress) {
          window.utils.updateLoadingModalProgress(100, 'ดึงข้อมูลสำเร็จ!', `โหลดนักเรียน ${counts.studentCount} คน, เอกสาร ${counts.docCount} ฉบับ, เล่ม ${counts.bookCount} เล่ม`);
        }
        setTimeout(() => {
          if (window.utils && window.utils.hideLoadingModal) window.utils.hideLoadingModal();
          if (window.router) window.router.handleRoute();
        }, 500);
      } catch (err) {
        if (window.utils && window.utils.hideLoadingModal) window.utils.hideLoadingModal();
        window.utils.showToast(`ไม่สามารถดึงข้อมูลได้: ${err.message}`, 'danger', 5000);
      }
    };
  }

  // Push Data to Google Sheets
  const pushSheetsBtn = document.getElementById('push-sheets-data-btn');
  if (pushSheetsBtn) {
    pushSheetsBtn.onclick = async () => {
      try {
        window.utils.showToast('กำลังส่งข้อมูลทั้งหมดลง Google Sheets...', 'info');
        await window.db.syncToGoogleSheets();
        window.utils.showToast('บันทึกข้อมูลลง Google Sheets สำเร็จ!', 'success', 5000);
      } catch (err) {
        window.utils.showToast(`ไม่สามารถบันทึกลงชีทได้: ${err.message}`, 'danger', 5000);
      }
    };
  }

  // Global Search Shortcut Listener (Ctrl+K)
  const globalSearchInput = document.getElementById('global-search-input');
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (globalSearchInput) globalSearchInput.focus();
    }
  });

  if (globalSearchInput) {
    globalSearchInput.onkeyup = (e) => {
      if (e.key === 'Enter') {
        const query = globalSearchInput.value.trim();
        if (query) {
          window.location.hash = '#dashboard';
          setTimeout(() => {
            const dashInput = document.getElementById('dashboard-search-input');
            const dashBtn = document.getElementById('dashboard-search-btn');
            if (dashInput && dashBtn) {
              dashInput.value = query;
              dashBtn.click();
            }
          }, 100);
        }
      }
    };
  }

  // Update Live Clock
  updateLiveClock();
  setInterval(updateLiveClock, 1000);

  // Auto-fetch real database from Google Sheets on app load
  autoFetchFromGoogleSheets(false);
}

function updateLiveClock() {
  const clockEl = document.getElementById('current-time-display');
  if (clockEl) {
    const now = new Date();
    const thaiDate = window.utils.formatThaiDate(now.toISOString().slice(0, 10));
    const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    clockEl.textContent = `${thaiDate} | ${timeStr} น.`;
  }
}

function autoFetchFromGoogleSheets(silent = false) {
  const settings = (window.db && window.db.data && window.db.data.settings) ? window.db.data.settings : {};
  const sheetsUrl = settings.sheets_url || 'https://script.google.com/macros/s/AKfycbxBJ-fRIiU0T8BqyAlZS5xrO8x5N6niAxQLkkKiAKCMCDZoaoAImKhKWHaFLn8TxEYs/exec';
  
  if (!sheetsUrl || !sheetsUrl.includes('script.google.com')) return;

  const currentStudentCount = (window.db.data.students || []).length;
  const currentDocCount = (window.db.data.documents || []).length;

  if (!silent) {
    console.log('Auto-fetching database from Google Sheets & Drive...');
  }

  window.db.syncFromGoogleSheets(sheetsUrl).then(counts => {
    const hasChanged = (counts.studentCount !== currentStudentCount || counts.docCount !== currentDocCount);
    if (!silent) {
      console.log('Auto fetched from Google Sheets successfully:', counts);
      if (currentStudentCount === 0 && window.utils && window.utils.showToast) {
        window.utils.showToast(`⚡ ซิงก์ดึงข้อมูลจริงจาก Google Sheets & Drive อัตโนมัติสำเร็จ (${counts.studentCount} นักเรียน, ${counts.docCount} เอกสาร)`, 'success', 3500);
      }
    }
    // Auto-update UI if data changed or initial fetch
    if (hasChanged || (!silent && currentStudentCount === 0)) {
      if (window.router && typeof window.router.handleRoute === 'function') {
        window.router.handleRoute();
      }
    }
  }).catch(err => {
    if (!silent) console.warn('Auto fetch from Google Sheets skipped:', err.message);
  });
}
window.autoFetchFromGoogleSheets = autoFetchFromGoogleSheets;
