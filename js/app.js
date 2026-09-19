/* ==========================================================================
   EDMRS - Application Master Controller & Initializer (js/app.js)
   Single Initialization, UI Event Bindings & Clock
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const isAuthenticated = window.authSystem && window.authSystem.isAuthenticated();

  if (isAuthenticated) {
    initAppShell();
    // Perform Single Flight Initial Load from Google Sheets
    window.db.initializeDatabase().finally(() => {
      if (window.router) window.router.handleRoute();
    });
  } else {
    if (window.router) window.router.handleRoute();
  }
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

  // Manual Refresh Data from Google Sheets
  const fetchSheetsBtn = document.getElementById('fetch-sheets-data-btn');
  if (fetchSheetsBtn) {
    fetchSheetsBtn.onclick = async () => {
      try {
        if (window.utils && window.utils.showToast) {
          window.utils.showToast('กำลังดึงข้อมูลล่าสุดจาก Google Sheets...', 'info');
        }
        await window.db.syncFromGoogleSheets();
        if (window.utils && window.utils.showToast) {
          window.utils.showToast('ดึงข้อมูลจาก Google Sheets สำเร็จ!', 'success');
        }
        if (window.router) window.router.handleRoute();
      } catch (err) {
        if (window.utils && window.utils.showToast) {
          window.utils.showToast(`ไม่สามารถดึงข้อมูลได้: ${err.message}`, 'danger');
        }
      }
    };
  }

  // Manual Push Data to Google Sheets
  const pushSheetsBtn = document.getElementById('push-sheets-data-btn');
  if (pushSheetsBtn) {
    pushSheetsBtn.onclick = async () => {
      try {
        if (window.utils && window.utils.showToast) {
          window.utils.showToast('กำลังบันทึกและส่งข้อมูลลง Google Sheets...', 'info');
        }
        pushSheetsBtn.disabled = true;
        await window.db.syncToGoogleSheets(null, 'sync');
        if (window.utils && window.utils.showToast) {
          window.utils.showToast('บันทึกข้อมูลลง Google Sheets สำเร็จเรียบร้อย!', 'success');
        }
      } catch (err) {
        if (window.utils && window.utils.showToast) {
          window.utils.showToast(`ไม่สามารถบันทึกข้อมูลลง Google Sheets ได้: ${err.message}`, 'danger');
        }
      } finally {
        pushSheetsBtn.disabled = false;
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

  // Background Auto-Sync Poll (Check Google Sheets for live edits/adds/deletes every 30 seconds)
  setInterval(async () => {
    if (window.authSystem && window.authSystem.isAuthenticated()) {
      if (window.db && !window.db.DB_STATE.saving && !window.db.DB_STATE.fetching && !window.db.googleSyncDisabled) {
        try {
          const res = await window.db.syncFromGoogleSheets(null, true);
          if (res && res.hasChanges) {
            console.log('[AUTO-SYNC] Google Sheets data updated live - updating active view');
            const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
            if (activeTag !== 'input' && activeTag !== 'select' && activeTag !== 'textarea' && window.router) {
              const { routeName, params } = window.router.parseHash();
              const view = window.router.getRouteView(routeName);
              const mainContent = document.getElementById('main-content');
              if (mainContent && view) {
                mainContent.innerHTML = view.render(params);
                if (view.initEvents) view.initEvents(params);
              }
            }
          }
        } catch (e) {
          // silent background poll catch
        }
      }
    }
  }, 30000);

  // Instant Auto-Sync on Tab Focus / Visibility Change
  const triggerInstantSync = async () => {
    if (window.authSystem && window.authSystem.isAuthenticated() && window.db && !window.db.DB_STATE.fetching && !window.db.DB_STATE.saving && !window.db.googleSyncDisabled) {
      try {
        const res = await window.db.syncFromGoogleSheets(null, true);
        if (res && res.hasChanges && window.router) {
          const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
          if (activeTag !== 'input' && activeTag !== 'select' && activeTag !== 'textarea') {
            const { routeName, params } = window.router.parseHash();
            const view = window.router.getRouteView(routeName);
            const mainContent = document.getElementById('main-content');
            if (mainContent && view) {
              mainContent.innerHTML = view.render(params);
              if (view.initEvents) view.initEvents(params);
            }
          }
        }
      } catch (e) {}
    }
  };

  window.addEventListener('focus', triggerInstantSync);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') triggerInstantSync();
  });
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
