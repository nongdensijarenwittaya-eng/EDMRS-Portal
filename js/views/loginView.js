/* ==========================================================================
   EDMRS - Login View Controller (js/views/loginView.js)
   ========================================================================== */

const loginView = {
  render() {
    const settings = window.db.data.settings || {};
    const orgName = settings.org_name_th || 'โรงเรียนหนองเดิ่นศรีเจริญวิทยา';

    return `
      <div class="login-body">
        <div class="login-card">
          <div class="login-header">
            <img src="${settings.logo_url || 'assets/logo.png'}" alt="School Logo" class="login-logo" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2248%22 fill=%22%231e3a8a%22/><text x=%2250%22 y=%2265%22 font-size=%2245%22 fill=%22white%22 text-anchor=%22middle%22 font-weight=%22bold%22 font-family=%22sans-serif%22>ปพ.</text></svg>'">
            <h2 class="login-title">${orgName}</h2>
            <p class="login-subtitle">ระบบจัดเก็บและสืบค้นข้อมูลเอกสารทางการศึกษา (ปพ.) - EDMRS</p>
          </div>

          <div id="login-alert-container"></div>

          <form id="login-form">
            <div class="form-group">
              <label class="form-label required" for="login-username"><i class="fa-solid fa-user"></i> ชื่อผู้ใช้งาน</label>
              <input type="text" id="login-username" class="form-control" placeholder="กรอกชื่อผู้ใช้งาน" required autocomplete="username">
            </div>

            <div class="form-group">
              <label class="form-label required" for="login-password"><i class="fa-solid fa-lock"></i> รหัสผ่าน</label>
              <div style="position: relative;">
                <input type="password" id="login-password" class="form-control" placeholder="กรอกรหัสผ่าน" required autocomplete="current-password">
                <button type="button" id="toggle-password-btn" style="position: absolute; right: 0.8rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer;" aria-label="Toggle password visibility">
                  <i class="fa-solid fa-eye" id="eye-icon"></i>
                </button>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
              <label style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; cursor: pointer;">
                <input type="checkbox" id="login-remember"> จดจำฉันในระบบ
              </label>
              <button type="button" id="forgot-password-btn" class="btn-text" style="font-size: 0.82rem;">ลืมรหัสผ่าน?</button>
            </div>

            <button type="submit" id="login-submit-btn" class="btn btn-primary btn-lg" style="width: 100%;">
              <i class="fa-solid fa-arrow-right-to-bracket"></i> เข้าสู่ระบบ
            </button>
          </form>
        </div>
      </div>
    `;
  },

  initEvents() {
    const form = document.getElementById('login-form');
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const togglePasswordBtn = document.getElementById('toggle-password-btn');
    const eyeIcon = document.getElementById('eye-icon');
    const alertContainer = document.getElementById('login-alert-container');
    const forgotBtn = document.getElementById('forgot-password-btn');

    if (togglePasswordBtn) {
      togglePasswordBtn.onclick = () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        eyeIcon.className = type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
      };
    }

    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        alertContainer.innerHTML = '';
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const rememberMe = document.getElementById('login-remember').checked;

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังตรวจสอบสิทธิ์...';
        }

        try {
          const result = await window.authSystem.login(username, password, rememberMe);
          if (result.success) {
            sessionStorage.removeItem('has_loaded_initial');
            window._initialAppLoaded = false;
            window.location.hash = '#dashboard';
            window.location.reload();
          } else {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = originalBtnHtml;
            }
            alertContainer.innerHTML = `
              <div class="toast toast-danger" style="margin-bottom: 1rem; width: 100%;">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <span>${result.message}</span>
              </div>
            `;
          }
        } catch (err) {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
          }
          alertContainer.innerHTML = `
            <div class="toast toast-danger" style="margin-bottom: 1rem; width: 100%;">
              <i class="fa-solid fa-triangle-exclamation"></i>
              <span>${err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'}</span>
            </div>
          `;
        }
      };
    }

    if (forgotBtn) {
      forgotBtn.onclick = () => {
        window.utils.openModal(
          '<i class="fa-solid fa-key text-warning"></i> คำแนะนำในการลืมรหัสผ่าน',
          `<p>หากท่านลืมรหัสผ่านเข้าใช้งานระบบ EDMRS กรุณาติดต่อ <b>ผู้ดูแลระบบสูงสุด (Super Admin)</b> หรือ <b>งานฝ่ายทะเบียนและประมวลผล</b> เพื่อดำเนินการรีเซ็ตรหัสผ่านของท่าน</p>
           <div style="background: var(--bg-app); padding: 1rem; border-radius: var(--radius-md); margin-top: 1rem;">
             <p style="margin-bottom: 0.3rem;"><b>เบอร์โทรศัพท์:</b> 02-555-1234 ต่อ 102</p>
             <p><b>อีเมล:</b> registrar@school.ac.th</p>
           </div>`,
          [{ text: 'รับทราบ', class: 'btn btn-primary' }]
        );
      };
    }
  }
};

window.loginView = loginView;
