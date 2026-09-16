/* ==========================================================================
   EDMRS - Audit Trail Log View Controller (js/views/auditLogView.js)
   Renders user security logs, timestamped actions & location changes
   ========================================================================== */

const auditLogView = {
  render() {
    const logs = window.db.data.audit_logs || [];

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h2 style="font-size: 1.4rem; font-weight: 700; color: var(--primary-950);">
            <i class="fa-solid fa-clock-rotate-left text-primary"></i> ประวัติการดำเนินงาน (Audit Log)
          </h2>
          <p style="font-size: 0.88rem; color: var(--text-muted);">
            บันทึกการเข้าสู่ระบบ เพิ่ม แก้ไข ลบ คำขอสำเนาเอกสาร และเปลี่ยนตำแหน่งจัดเก็บเอกสารเพื่อความโปร่งใส
          </p>
        </div>
        <button id="export-audit-excel-btn" class="btn btn-secondary btn-sm">
          <i class="fa-solid fa-file-excel text-success"></i> ส่งออก Audit Logs
        </button>
      </div>

      <!-- Audit Logs Table -->
      <div class="card" style="padding: 0;">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>วัน-เวลา (Timestamp)</th>
                <th>ผู้ใช้งาน</th>
                <th>โมดูล (Module)</th>
                <th>การทำงาน (Action)</th>
                <th>รายละเอียดการแก้ไข</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              ${logs.map(log => `
                <tr>
                  <td><small style="color: var(--text-muted); font-size: 0.82rem;">${log.timestamp}</small></td>
                  <td>
                    <strong>${log.user_fullname || log.username}</strong>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${log.username}</div>
                  </td>
                  <td><span class="badge badge-secondary">${log.module}</span></td>
                  <td><strong style="color: var(--primary-700);">${log.action}</strong></td>
                  <td>${log.description}</td>
                  <td><code>${log.ip_address || '127.0.0.1'}</code></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  initEvents() {
    const exportBtn = document.getElementById('export-audit-excel-btn');
    if (exportBtn) {
      exportBtn.onclick = () => {
        window.utils.exportToExcel('Audit_Logs', 'Audit', window.db.data.audit_logs);
      };
    }
  }
};

window.auditLogView = auditLogView;
