/* ==========================================================================
   EDMRS - User Accounts & RBAC Permissions View Controller (js/views/usersView.js)
   ========================================================================== */

const usersView = {
  filterState: {
    search: ''
  },

  render() {
    let users = (window.db && window.db.data && Array.isArray(window.db.data.users)) ? window.db.data.users : [];
    if (this.filterState.search) {
      const q = String(this.filterState.search).toLowerCase().trim();
      users = users.filter(u =>
        u && (
          String(u.username || '').toLowerCase().includes(q) ||
          String(u.first_name || '').toLowerCase().includes(q) ||
          String(u.last_name || '').toLowerCase().includes(q) ||
          String(u.role_code || '').toLowerCase().includes(q) ||
          String(u.email || '').toLowerCase().includes(q) ||
          `${String(u.title || '')}${String(u.first_name || '')} ${String(u.last_name || '')}`.toLowerCase().includes(q)
        )
      );
    }

    const canManage = (window.authSystem && typeof window.authSystem.hasPermission === 'function')
      ? window.authSystem.hasPermission('manage_users')
      : true;

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h2 style="font-size: 1.4rem; font-weight: 700; color: var(--primary-950);">
            <i class="fa-solid fa-user-shield text-primary"></i> การจัดการผู้ใช้งานและสิทธิ์การเข้าถึง (RBAC)
          </h2>
          <p style="font-size: 0.88rem; color: var(--text-muted);">
            บริหารจัดการบัญชีผู้ใช้งาน กำหนดบทบาทสิทธิ์ Super Admin, Administrator, Staff และ Viewer
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button id="sync-users-sheets-btn" class="btn btn-success btn-sm">
            <i class="fa-solid fa-table text-white"></i> ซิงก์ไปที่ Google Sheets
          </button>
          <button id="export-users-excel-btn" class="btn btn-secondary btn-sm">
            <i class="fa-solid fa-file-excel text-success"></i> ส่งออก Excel
          </button>
          ${canManage ? `
            <button id="add-user-btn" class="btn btn-primary btn-sm">
              <i class="fa-solid fa-user-plus"></i> เพิ่มผู้ใช้งานใหม่
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Users Data Table -->
      <div class="card" style="padding: 0; margin-bottom: 1.5rem;">
        <div class="card-header" style="padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          <h3 class="card-title" style="margin: 0;"><i class="fa-solid fa-users"></i> บัญชีผู้ใช้งานระบบทั้งหมด</h3>
          <div style="max-width: 300px; width: 100%;">
            <input type="text" id="user-search-input" class="form-control form-control-sm" placeholder="🔍 ค้นหาผู้ใช้งาน (Username, ชื่อ, บทบาท, อีเมล)..." value="${this.filterState.search}">
          </div>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>ชื่อผู้ใช้งาน (Username)</th>
                <th>ชื่อ-นามสกุล</th>
                <th>บทบาทหน้าที่ (Role)</th>
                <th>อีเมล</th>
                <th>สถานะ</th>
                <th>วันที่สร้าง</th>
                <th style="text-align: center;">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              ${users.length ? users.map(u => {
                const username = String(u.username || '');
                const fullName = `${u.title || ''}${u.first_name || ''} ${u.last_name || ''}`.trim() || 'ไม่ระบุชื่อ';
                const roleCode = String(u.role_code || 'staff').toLowerCase();
                const email = String(u.email || '-');
                const createdAt = String(u.created_at || '-');
                const isSuperAdmin = roleCode === 'super_admin';

                return `
                  <tr>
                    <td><strong>${username}</strong></td>
                    <td>${fullName}</td>
                    <td>
                      <span class="badge ${isSuperAdmin ? 'badge-warning' : 'badge-info'}">
                        ${roleCode.toUpperCase()}
                      </span>
                    </td>
                    <td>${email}</td>
                    <td><span class="badge badge-success">ใช้งานปกติ</span></td>
                    <td>${createdAt}</td>
                    <td style="text-align: center;">
                      <div style="display: flex; gap: 0.35rem; justify-content: center;">
                        <button class="btn btn-warning btn-sm edit-user-btn" data-id="${u.id || ''}" data-user="${username}" title="แก้ไขผู้ใช้งาน">
                          <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn btn-danger btn-sm delete-user-btn" data-id="${u.id || ''}" data-user="${username}" title="ลบผู้ใช้งาน">
                          <i class="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('') : `
                <tr>
                  <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    ไม่พบข้อมูลผู้ใช้งานระบบ
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Permission Matrix Inspector Card -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><i class="fa-solid fa-key"></i> ตารางสิทธิ์การใช้งานจำแนกตามสิทธิ์ (Permission Matrix)</h3>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>สิทธิ์การทำงาน (Module Permission)</th>
                <th style="text-align: center;">Super Admin</th>
                <th style="text-align: center;">Administrator</th>
                <th style="text-align: center;">Staff</th>
                <th style="text-align: center;">Viewer</th>
              </tr>
            </thead>
            <tbody>
              ${((window.db && window.db.data && Array.isArray(window.db.data.permissions)) ? window.db.data.permissions : [
                { key: 'view_students', name: 'ดูข้อมูลนักเรียน' },
                { key: 'create_students', name: 'เพิ่มข้อมูลนักเรียน' },
                { key: 'edit_students', name: 'แก้ไขข้อมูลนักเรียน' },
                { key: 'delete_students', name: 'ลบข้อมูลนักเรียน' },
                { key: 'view_documents', name: 'ดูเอกสาร ปพ.' },
                { key: 'create_documents', name: 'เพิ่มเอกสาร ปพ.' },
                { key: 'edit_documents', name: 'แก้ไขเอกสาร ปพ.' },
                { key: 'delete_documents', name: 'ลบเอกสาร ปพ.' },
                { key: 'manage_loans', name: 'จัดการคำขอสำเนาเอกสาร' },
                { key: 'manage_users', name: 'จัดการผู้ใช้และกำหนดสิทธิ์ (RBAC)' },
                { key: 'manage_settings', name: 'ตั้งค่าระบบ' }
              ]).map(p => `
                <tr>
                  <td><strong>${p.name}</strong> <small style="color: var(--text-muted);">(${p.key})</small></td>
                  <td style="text-align: center;"><i class="fa-solid fa-circle-check text-success"></i></td>
                  <td style="text-align: center;"><i class="fa-solid fa-circle-check text-success"></i></td>
                  <td style="text-align: center;">
                    ${['view_students', 'create_students', 'edit_students', 'view_documents', 'create_documents', 'edit_documents', 'manage_loans'].includes(p.key) ? '<i class="fa-solid fa-circle-check text-success"></i>' : '<i class="fa-solid fa-circle-minus text-muted"></i>'}
                  </td>
                  <td style="text-align: center;">
                    ${['view_students', 'view_documents'].includes(p.key) ? '<i class="fa-solid fa-circle-check text-success"></i>' : '<i class="fa-solid fa-circle-minus text-muted"></i>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  refreshPage() {
    const searchEl = document.getElementById('user-search-input');
    const cursorPos = searchEl ? searchEl.selectionStart : null;
    const isFocused = searchEl && document.activeElement === searchEl;

    const main = document.getElementById('main-content');
    if (main) {
      main.innerHTML = this.render();
      this.initEvents();

      if (isFocused) {
        const newSearchEl = document.getElementById('user-search-input');
        if (newSearchEl) {
          newSearchEl.focus();
          if (cursorPos !== null) {
            newSearchEl.setSelectionRange(cursorPos, cursorPos);
          }
        }
      }
    }
  },

  initEvents() {
    const searchInput = document.getElementById('user-search-input');
    if (searchInput) {
      searchInput.oninput = (e) => {
        this.filterState.search = e.target.value;
        this.refreshPage();
      };
    }

    const addBtn = document.getElementById('add-user-btn');
    if (addBtn) addBtn.onclick = () => this.openAddUserModal();

    const syncBtn = document.getElementById('sync-users-sheets-btn');
    if (syncBtn) {
      syncBtn.onclick = async () => {
        syncBtn.disabled = true;
        syncBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังซิงก์...';
        try {
          if (window.utils && window.utils.showToast) {
            window.utils.showToast('กำลังซิงก์ข้อมูลบัญชีผู้ใช้งานระบบลง Google Sheets...', 'info');
          }
          await window.db.syncToGoogleSheets();
          if (window.utils && window.utils.showToast) {
            window.utils.showToast('ซิงก์ข้อมูลผู้ใช้งานระบบลง Google Sheets สำเร็จ!', 'success');
          }
        } catch (err) {
          if (window.utils && window.utils.showToast) {
            window.utils.showToast(`ซิงก์ไม่สำเร็จ: ${err.message}`, 'danger');
          }
        } finally {
          syncBtn.disabled = false;
          syncBtn.innerHTML = '<i class="fa-solid fa-table text-white"></i> ซิงก์ไปที่ Google Sheets';
        }
      };
    }

    const exportBtn = document.getElementById('export-users-excel-btn');
    if (exportBtn) {
      exportBtn.onclick = () => {
        const users = (window.db && window.db.data && Array.isArray(window.db.data.users)) ? window.db.data.users : [];
        const exportData = users.map(u => ({
          'ชื่อผู้ใช้งาน (Username)': u.username || '',
          'คำนำหน้า': u.title || '',
          'ชื่อ': u.first_name || '',
          'นามสกุล': u.last_name || '',
          'บทบาทหน้าที่': u.role_code || '',
          'อีเมล': u.email || '',
          'วันที่สร้าง': u.created_at || ''
        }));
        if (window.utils && window.utils.exportToExcel) {
          window.utils.exportToExcel('ผู้ใช้งานระบบ', 'Users', exportData);
        }
      };
    }

    document.querySelectorAll('.edit-user-btn').forEach(btn => {
      btn.onclick = () => {
        const username = btn.getAttribute('data-user');
        const user = (window.db.data.users || []).find(u => String(u.username).toLowerCase() === String(username).toLowerCase());
        if (user) this.openAddUserModal(user);
      };
    });

    document.querySelectorAll('.delete-user-btn').forEach(btn => {
      btn.onclick = () => {
        const username = btn.getAttribute('data-user');
        window.utils.confirmDialog(
          'ยืนยันการลบบัญชีผู้ใช้งาน',
          `คุณต้องการลบบัญชีผู้ใช้งาน <b>${username}</b> ใช่หรือไม่?`,
          async () => {
            btn.disabled = true;
            try {
              await window.db.deleteUser(username);
              if (window.utils && window.utils.showToast) {
                window.utils.showToast(`ลบบัญชีผู้ใช้งาน ${username} เรียบร้อยแล้ว`, 'success');
              }
              this.refreshPage();
            } catch (err) {
              if (window.utils && window.utils.showToast) {
                window.utils.showToast(`เกิดข้อผิดพลาดในการลบ: ${err.message}`, 'danger');
              }
            }
          }
        );
      };
    });
  },

  openAddUserModal(userToEdit = null) {
    const isEdit = !!userToEdit;
    const existingUsers = (window.db && window.db.data && Array.isArray(window.db.data.users)) ? window.db.data.users : [];
    
    // Auto suggest username if adding new
    let suggestedUsername = '';
    if (!isEdit) {
      if (!existingUsers.some(u => String(u.username || '').trim().toLowerCase() === 'admin')) {
        suggestedUsername = 'admin';
      } else {
        let count = 2;
        while (existingUsers.some(u => String(u.username || '').trim().toLowerCase() === `admin${count}`)) {
          count++;
        }
        suggestedUsername = `admin${count}`;
      }
    }

    const uVal = isEdit ? (userToEdit.username || '') : suggestedUsername;
    const tVal = isEdit ? (userToEdit.title || 'นาย') : 'นาย';
    const fnVal = isEdit ? (userToEdit.first_name || '') : '';
    const lnVal = isEdit ? (userToEdit.last_name || '') : '';
    const rVal = isEdit ? (userToEdit.role_code || 'super_admin') : 'super_admin';
    const emVal = isEdit ? (userToEdit.email || '') : '';

    const bodyHtml = `
      <form id="add-user-form">
        <div style="background: var(--primary-50, #eff6ff); border: 1px solid var(--primary-200, #bfdbfe); border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1.25rem; font-size: 0.85rem; color: var(--primary-900, #1e3a8a);">
          <i class="fa-solid fa-circle-info text-primary"></i> <strong>การสร้างบัญชีผู้ใช้งานระบบ:</strong> สามารถสร้างผู้ดูแลระบบ (Super Admin / Administrator) หรือเจ้าหน้าที่ ได้หลายบัญชี โดยตั้งค่าชื่อ Username ไม่ให้ซ้ำกัน (เช่น admin, admin2, officer01)
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label required">ชื่อผู้ใช้งาน (Username)</label>
            <input type="text" id="modal-user-username" class="form-control" value="${uVal}" ${isEdit ? 'readonly' : 'required'} placeholder="เช่น admin2, officer01">
            <small style="color: var(--text-muted); font-size: 0.78rem;">ต้องไม่ซ้ำกับบัญชีอื่นในระบบ</small>
          </div>
          <div class="form-group">
            <label class="form-label ${isEdit ? '' : 'required'}">รหัสผ่าน ${isEdit ? '(เว้นว่างหากไม่ต้องการเปลี่ยน)' : ''}</label>
            <input type="password" id="modal-user-pass" class="form-control" placeholder="รหัสผ่านเข้าสู่ระบบ" ${isEdit ? '' : 'required'}>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group" style="flex: 0 0 100px;">
            <label class="form-label required">คำนำหน้า</label>
            <input type="text" id="modal-user-title" class="form-control" value="${tVal}" required placeholder="นาย">
          </div>
          <div class="form-group">
            <label class="form-label required">ชื่อ</label>
            <input type="text" id="modal-user-fname" class="form-control" value="${fnVal}" required placeholder="ชื่อผู้ใช้งาน">
          </div>
          <div class="form-group">
            <label class="form-label required">นามสกุล</label>
            <input type="text" id="modal-user-lname" class="form-control" value="${lnVal}" required placeholder="นามสกุล">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label required">สิทธิ์การใช้งาน (Role)</label>
            <select id="modal-user-role" class="form-control" required>
              <option value="super_admin" ${rVal === 'super_admin' ? 'selected' : ''}>👑 Super Admin (ผู้ดูแลระบบสูงสุด)</option>
              <option value="administrator" ${rVal === 'administrator' ? 'selected' : ''}>🛡️ Administrator (ผู้ดูแลระบบ)</option>
              <option value="staff" ${rVal === 'staff' ? 'selected' : ''}>📝 Staff (เจ้าหน้าที่ทะเบียน)</option>
              <option value="viewer" ${rVal === 'viewer' ? 'selected' : ''}>👁️ Viewer (ผู้เข้าชม)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">อีเมล</label>
            <input type="email" id="modal-user-email" class="form-control" value="${emVal}" placeholder="user@school.ac.th" required>
          </div>
        </div>
      </form>
    `;

    window.utils.openModal(
      isEdit ? `<i class="fa-solid fa-pen-to-square text-primary"></i> แก้ไขบัญชีผู้ใช้งาน` : `<i class="fa-solid fa-user-plus text-primary"></i> เพิ่มบัญชีผู้ใช้งานใหม่`,
      bodyHtml,
      [
        { text: 'ยกเลิก', class: 'btn btn-secondary' },
        {
          text: isEdit ? 'บันทึกการแก้ไข' : 'สร้างบัญชีผู้ใช้',
          class: 'btn btn-primary',
          onClick: async () => {
            const u = document.getElementById('modal-user-username').value.trim();
            const p = document.getElementById('modal-user-pass').value;
            const t = document.getElementById('modal-user-title').value.trim();
            const fn = document.getElementById('modal-user-fname').value.trim();
            const ln = document.getElementById('modal-user-lname').value.trim();
            const r = document.getElementById('modal-user-role').value;
            const em = document.getElementById('modal-user-email').value.trim();

            if (!u || (!isEdit && !p) || !fn || !ln) {
              window.utils.showToast('กรุณากรอกข้อมูลสำคัญให้ครบถ้วน (Username, ชื่อ, นามสกุล, รหัสผ่าน)', 'danger');
              return false;
            }

            if (!isEdit) {
              const duplicate = existingUsers.find(user => String(user.username || '').trim().toLowerCase() === u.toLowerCase());
              if (duplicate) {
                window.utils.showToast(`ชื่อผู้ใช้งาน "${u}" มีในระบบแล้ว กรุณาใช้ Username อื่น (เช่น ${u}2, ${u}_admin)`, 'danger');
                return false;
              }
            }

            const modalSubmitBtn = document.querySelector('.modal-footer .btn-primary');
            if (modalSubmitBtn) { modalSubmitBtn.disabled = true; modalSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...'; }

            try {
              const userData = {
                username: u,
                title: t,
                first_name: fn,
                last_name: ln,
                role_code: r,
                email: em,
                status: 'active',
                created_at: isEdit ? userToEdit.created_at : new Date().toISOString().slice(0, 10)
              };

              if (p && window.authSystem && typeof window.authSystem.hashPassword === 'function') {
                userData.password_hash = await window.authSystem.hashPassword(p);
              }

              if (isEdit) {
                await window.db.updateUser(u, userData);
                window.utils.showToast(`แก้ไขข้อมูลผู้ใช้งาน ${u} เรียบร้อยแล้ว`, 'success');
              } else {
                await window.db.addUser(userData);
                window.utils.showToast(`สร้างผู้ใช้งาน ${u} เรียบร้อยแล้ว`, 'success');
              }

              this.refreshPage();
            } catch (err) {
              window.utils.showToast(`เกิดข้อผิดพลาดในการบันทึก: ${err.message}`, 'danger');
              if (modalSubmitBtn) { modalSubmitBtn.disabled = false; modalSubmitBtn.innerHTML = isEdit ? 'บันทึกการแก้ไข' : 'สร้างบัญชีผู้ใช้'; }
              return false;
            }
          }
        }
      ]
    );
  }
};

window.usersView = usersView;
