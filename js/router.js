/* ==========================================================================
   EDMRS - SPA Hash Router & Navigation Guard Controller (js/router.js)
   Maps routes, manages auth guards, dynamically renders views & updates breadcrumbs
   ========================================================================== */

class AppRouter {
  constructor() {
    this.routes = {
      'login': window.loginView,
      'dashboard': window.dashboardView,
      'students': window.studentsView,
      'student-detail': window.studentDetailView,
      'documents': window.documentsView,
      'books': window.booksView,
      'locations': window.locationsView,
      'qr-scanner': window.qrScannerView,
      'loans': window.loansView,
      'verification': window.verificationView,
      'reports': window.reportsView,
      'import': window.importView,
      'audit-log': window.auditLogView,
      'users': window.usersView,
      'settings': window.settingsView
    };

    window.addEventListener('hashchange', () => this.handleRoute());
  }

  parseHash() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    const [routeName, queryString] = hash.split('?');
    const params = {};

    if (queryString) {
      queryString.split('&').forEach(pair => {
        const [k, v] = pair.split('=');
        params[k] = decodeURIComponent(v || '');
      });
    }

    return { routeName, params };
  }

  getRouteView(routeName) {
    const routeMap = {
      'login': window.loginView,
      'dashboard': window.dashboardView,
      'students': window.studentsView,
      'student-detail': window.studentDetailView,
      'documents': window.documentsView,
      'books': window.booksView,
      'locations': window.locationsView,
      'qr-scanner': window.qrScannerView,
      'loans': window.loansView,
      'verification': window.verificationView,
      'reports': window.reportsView,
      'import': window.importView,
      'audit-log': window.auditLogView,
      'users': window.usersView,
      'settings': window.settingsView
    };

    const targetView = routeMap[routeName] || (this.routes && this.routes[routeName]);
    if (targetView) return targetView;

    if (routeName === 'dashboard' || !routeName) {
      return window.dashboardView;
    }

    return {
      render: () => `
        <div class="card" style="border-top: 4px solid var(--danger-color); padding: 2.5rem; text-align: center; margin-top: 1rem;">
          <i class="fa-solid fa-triangle-exclamation text-danger" style="font-size: 3rem; margin-bottom: 1rem;"></i>
          <h3 style="color: var(--danger-color); font-size: 1.3rem; font-weight: 700; margin-bottom: 0.5rem;">
            ไม่พบโมดูลหรือเกิดข้อผิดพลาดในการโหลดหน้า ${routeName}
          </h3>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">
            ไม่สามารถโหลดคอนโทรลเลอร์ของหน้า '${routeName}' ได้ โปรดรีเฟรชหน้าเว็บอีกครั้ง
          </p>
          <a href="#dashboard" class="btn btn-primary btn-sm"><i class="fa-solid fa-house"></i> กลับหน้าหลักแดชบอร์ด</a>
        </div>
      `
    };
  }

  handleRoute() {
    const { routeName, params } = this.parseHash();

    // Authentication Guard
    const isAuthenticated = window.authSystem ? window.authSystem.isAuthenticated() : false;
    if (!isAuthenticated && routeName !== 'login') {
      window.location.hash = '#login';
      return;
    }
    if (isAuthenticated && routeName === 'login') {
      window.location.hash = '#dashboard';
      return;
    }

    // Toggle Login Body vs Main Dashboard App Shell UI
    const appEl = document.getElementById('app');
    if (routeName === 'login') {
      if (appEl) appEl.style.display = 'none';
      const mainContent = document.getElementById('main-content');
      document.body.className = '';
      if (window.loginView) {
        document.body.innerHTML = window.loginView.render();
        if (window.loginView.initEvents) window.loginView.initEvents();
      }
      return;
    }

    // Ensure App shell is visible for logged-in routes
    if (appEl && appEl.style.display === 'none') {
      window.location.reload();
      return;
    }

    const view = this.getRouteView(routeName);
    const mainContent = document.getElementById('main-content');

    if (mainContent && view) {
      try {
        mainContent.innerHTML = view.render(params);
        if (view.initEvents) view.initEvents(params);
      } catch (err) {
        console.error(`Error rendering view '${routeName}':`, err);
        mainContent.innerHTML = `
          <div class="card" style="border-top: 4px solid var(--danger-color); padding: 2rem; margin-top: 1rem;">
            <h3 style="color: var(--danger-color); font-size: 1.2rem; font-weight: 700; margin-bottom: 0.5rem;">
              <i class="fa-solid fa-triangle-exclamation"></i> เกิดข้อผิดพลาดในการโหลดหน้า ${routeName}
            </h3>
            <p style="color: var(--text-muted); font-size: 0.9rem;">${err.message || err}</p>
          </div>
        `;
      }
    }

    this.updateActiveNav(routeName);
    this.updateBreadcrumb(routeName, params);
  }

  updateActiveNav(routeName) {
    document.querySelectorAll('.nav-link').forEach(link => {
      const targetRoute = link.getAttribute('data-route');
      if (targetRoute === routeName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  updateBreadcrumb(routeName, params) {
    const currentEl = document.getElementById('breadcrumb-current');
    if (!currentEl) return;

    const titles = {
      'dashboard': 'แดชบอร์ด',
      'students': 'ข้อมูลนักเรียน',
      'student-detail': `รายละเอียดนักเรียน ${params.id || ''}`,
      'documents': 'ทะเบียนเอกสาร ปพ.',
      'books': 'ทะเบียนเล่มเอกสาร',
      'locations': 'สถานที่จัดเก็บ',
      'qr-scanner': 'ระบบ QR / Barcode',
      'loans': 'ระบบคำขอสำเนาเอกสารทางการศึกษา',
      'verification': 'ตรวจสอบเอกสาร',
      'reports': 'รายงาน & สถิติ',
      'import': 'นำเข้าข้อมูล Excel/CSV',
      'audit-log': 'ประวัติการแก้ไข (Audit Log)',
      'users': 'ผู้ใช้งาน & สิทธิ์',
      'settings': 'ตั้งค่าระบบ'
    };

    currentEl.textContent = titles[routeName] || 'แดชบอร์ด';
  }
}

window.router = new AppRouter();
