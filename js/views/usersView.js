/* ==========================================================================
   EDMRS - User Accounts & RBAC Permissions View Controller (js/views/usersView.js)
   ========================================================================== */

const usersView = {
  render() {
    const users = window.db.data.users || [];
    const roles = window.db.data.roles || [];
    const canManage = window.authSystem.hasPermission('manage_users');

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
        <div class="card-header" style="padding: 1rem 1.25rem;">
          <h3 class="card-title"><i class="fa-solid fa-users"></i> บัญชีผู้ใช้งานระบบทั้งหมด</h3>
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
              ${users.map(u => `
                <tr>
                  <td><strong>${u.username}</strong></td>
                  <td>${u.title || ''}${u.first_name} ${u.last_name}</td>
                  <td>
                    <span class="badge ${u.role_code === 'super_admin' ? 'badge-warning' : 'badge-info'}">
                      ${u.role_code.toUpperCase()}
                    </span>
                  </td>
                  <td>${u.email}</td>
                  <td><span class="badge badge-success">ใช้งานปกติ</span></td>
                  <td>${u.created_at || '-'}</td>
                  <td style="text-align: center;">
                    <div style="display: flex; gap: 0.35rem; justify-content: center;">
                      <button class="btn btn-warning btn-sm edit-user-btn" data-id="${u.id}" title="แก้ไขผู้ใช้งาน">
                        <i class="fa-solid fa-pen-to-square"></i>
                      </button>
                      ${u.username !== 'admin' ? `
                        <button class="btn btn-danger btn-sm delete-user-btn" data-id="${u.id}" data-user="${u.username}" title="ลบผู้ใช้งาน">
                          <i class="fa-solid fa-trash-can"></i>
                        </button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `).join('')}
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
              ${window.db.data.permissions.map(p => `
                <tr>
                  <td><strong>${p.name}</strong> <small style="color: var(--text-muted);">(${p.key})</small></td>
                  <td style="text-align: center;"><i class="fa-solid fa-circle-check text-success"></i></td>
                  <td style="text-align: center;"><i class="fa-solid fa-circle-check text-success"></i></td>
                  <td style="text-align: center;">
                    ${['view_students', 'create_students', 'edit_students', 'view_documents', 'create_documents', 'edit_documents', 'upload_documents', 'download_documents', 'manage_loans'].includes(p.key) ? '<i class="fa-solid fa-circle-check text-success"></i>' : '<i class="fa-solid fa-circle-minus text-muted"></i>'}
                  </td>
                  <td style="text-align: center;">
                    ${['view_students', 'view_documents', 'download_documents'].includes(p.key) ? '<i class="fa-solid fa-circle-check text-success"></i>' : '<i class="fa-solid fa-circle-minus text-muted"></i>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  initEvents() {
    const addBtn = document.getElementById('add-user-btn');
    if (addBtn) addBtn.onclick = () => this.openAddUserModal();

    const syncBtn = document.getElementById('sync-users-sheets-btn');
    if (syncBtn) {
      syncBtn.onclick = () => {
        window.utils.showToast('กำลังซิงก์ข้อมูลบัญชีผู้ใช้งานระบบลง Google Sheets...', 'info');
        window.db.syncToGoogleSheets().then(() => {
          window.utils.showToast('ซิงก์ข้อมูลผู้ใช้งานระบบลง Google Sheets (Users) สำเร็จ!', 'success');
        }).catch(err => {
          window.utils.showToast(`ซิงก์ไม่สำเร็จ: ${err.message}`, 'danger');
        });
      };
    }

    const exportBtn = document.getElementById('export-users-excel-btn');
    if (exportBtn) {
      exportBtn.onclick = () => {
        const users = window.db.data.users || [];
        const exportData = users.map(u => ({
          'ชื่อผู้ใช้งาน (Username)': u.username,
          'คำนำหน้า': u.title,
          'ชื่อ': u.first_name,
          'นามสกุล': u.last_name,
          'บทบาทหน้าที่': u.role_code,
          'อีเมล': u.email,
          'วันที่สร้าง': u.created_at || ''
        }));
        window.utils.exportToExcel('ผู้ใช้งานระบบ', 'Users', exportData);
      };
    }

    document.querySelectorAll('.edit-user-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const user = (window.db.data.users || []).find(u => u.id == id);
        if (user) this.openAddUserModal(user);
      };
    });

    document.querySelectorAll('.delete-user-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const username = btn.getAttribute('data-user');
        window.utils.confirmDialog(
          'ยืนยันการลบบัญชีผู้ใช้งาน',
          `คุณต้องการลบบัญชีผู้ใช้งาน <b>${username}</b> ใช่หรือไม่?`,
          async () => {
            window.db.deleteUser(username);
            window.utils.showToast('กำลังซิงก์การลบลง Google Sheets...', 'info');
            try {
              await window.db.syncToGoogleSheets();
              window.utils.showToast('ลบบัญชีผู้ใช้งานและซิงก์ Google Sheets เรียบร้อยแล้ว', 'success');
            } catch (err) {
              console.warn('Sync users on delete:', err);
              window.utils.showToast('ลบข้อมูลในเครื่องเรียบร้อยแล้ว', 'warning');
            }
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
              mainContent.innerHTML = this.render();
              this.initEvents();
            }
          }
        );
      };
    });
  },

  openAddUserModal(userToEdit = null) {
    const isEdit = !!userToEdit;
    const uVal = isEdit ? userToEdit.username : '';
    const tVal = isEdit ? (userToEdit.title || 'นาย') : 'นาย';
    const fnVal = isEdit ? userToEdit.first_name : '';
    const lnVal = isEdit ? userToEdit.last_name : '';
    const rVal = isEdit ? userToEdit.role_code : 'staff';
    const emVal = isEdit ? userToEdit.email : '';

    const bodyHtml = `
      <form id="add-user-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label required">ชื่อผู้ใช้งาน (Username)</label>
            <input type="text" id="modal-user-username" class="form-control" value="${uVal}" ${isEdit ? 'readonly' : 'required'} placeholder="e.g. officer01">
          </div>
          <div class="form-group">
            <label class="form-label ${isEdit ? '' : 'required'}">รหัสผ่าน ${isEdit ? '(เว้นว่างหากไม่เปลี่ยน)' : ''}</label>
            <input type="password" id="modal-user-pass" class="form-control" placeholder="รหัสผ่าน" ${isEdit ? '' : 'required'}>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label required">คำนำหน้า</label>
            <input type="text" id="modal-user-title" class="form-control" value="${tVal}" required>
          </div>
          <div class="form-group">
            <label class="form-label required">ชื่อ</label>
            <input type="text" id="modal-user-fname" class="form-control" value="${fnVal}" required>
          </div>
          <div class="form-group">
            <label class="form-label required">นามสกุล</label>
            <input type="text" id="modal-user-lname" class="form-control" value="${lnVal}" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label required">สิทธิ์การใช้งาน (Role)</label>
            <select id="modal-user-role" class="form-control" required>
              <option value="administrator" ${rVal === 'administrator' ? 'selected' : ''}>Administrator</option>
              <option value="staff" ${rVal === 'staff' ? 'selected' : ''}>Staff (เจ้าหน้าที่ทะเบียน)</option>
              <option value="viewer" ${rVal === 'viewer' ? 'selected' : ''}>Viewer (ผู้เข้าชม)</option>
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
          text: isEdit ? 'บันทึกการแก้ไข' : 'สร้างบัญชี',
          class: 'btn btn-primary',
          onClick: () => {
            const u = document.getElementById('modal-user-username').value.trim();
            const p = document.getElementById('modal-user-pass').value;
            const t = document.getElementById('modal-user-title').value;
            const fn = document.getElementById('modal-user-fname').value.trim();
            const ln = document.getElementById('modal-user-lname').value.trim();
            const r = document.getElementById('modal-user-role').value;
            const em = document.getElementById('modal-user-email').value.trim();

            if (!u || (!isEdit && !p) || !fn || !ln) {
              window.utils.showToast('กรุณากรอกข้อมูลสำคัญให้ครบถ้วน', 'danger');
              return false;
            }

            if (isEdit) {
              userToEdit.title = t;
              userToEdit.first_name = fn;
              userToEdit.last_name = ln;
              userToEdit.role_code = r;
              userToEdit.email = em;
              window.db.addAuditLog('ผู้ใช้งาน', 'แก้ไขผู้ใช้', `แก้ไขข้อมูลบัญชีผู้ใช้ ${u}`);
              window.db.save();
              window.db.syncToGoogleSheets().catch(err => console.warn('Sync users:', err));
              window.utils.showToast(`แก้ไขข้อมูลผู้ใช้งาน ${u} เรียบร้อยแล้ว`, 'success');
              window.location.reload();
              return;
            }

            window.db.data.users.push({
              id: window.db.data.users.length + 1,
              username: u,
              password_hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
              title: t,
              first_name: fn,
              last_name: ln,
              role_code: r,
              email: em,
              status: 'active',
              created_at: new Date().toISOString().slice(0, 10)
            });

            window.db.addAuditLog('ผู้ใช้งาน', 'เพิ่มผู้ใช้', `สร้างผู้ใช้งานใหม่ ${u} (${fn} ${ln}) สิทธิ์ ${r}`);
            window.db.save();
            window.db.syncToGoogleSheets().catch(err => console.warn('Sync users:', err));
            window.utils.showToast(`สร้างผู้ใช้งาน ${u} เรียบร้อยแล้ว`, 'success');
            window.location.reload();
          }
        }
      ]
    );
  }
};

window.usersView = usersView;
