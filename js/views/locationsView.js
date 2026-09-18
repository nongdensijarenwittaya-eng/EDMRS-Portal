/* ==========================================================================
   EDMRS - Physical Storage Locations View Controller (js/views/locationsView.js)
   Hierarchy: Building -> Room -> Cabinet -> Shelf -> Folder -> Code Generator
   ========================================================================== */

const locationsView = {
  filterState: {
    search: ''
  },

  render() {
    let locations = window.db.getLocations();
    if (this.filterState.search) {
      const q = String(this.filterState.search).toLowerCase().trim();
      locations = locations.filter(l =>
        l && (
          String(l.code || '').toLowerCase().includes(q) ||
          String(l.building || '').toLowerCase().includes(q) ||
          String(l.room || '').toLowerCase().includes(q) ||
          String(l.cabinet || '').toLowerCase().includes(q) ||
          String(l.shelf || '').toLowerCase().includes(q) ||
          String(l.folder || '').toLowerCase().includes(q)
        )
      );
    }

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h2 style="font-size: 1.4rem; font-weight: 700; color: var(--primary-950);">
            <i class="fa-solid fa-boxes-stacked text-primary"></i> โครงสร้างสถานที่จัดเก็บเอกสาร
          </h2>
          <p style="font-size: 0.88rem; color: var(--text-muted);">
            บริหารจัดการตำแหน่งจัดเก็บ 6 ระดับ: อาคาร → ห้อง → ตู้ → ชั้น → แฟ้ม/กล่อง → เล่ม
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button id="sync-locations-sheets-btn" class="btn btn-success btn-sm">
            <i class="fa-solid fa-table text-white"></i> ซิงก์ไปที่ Google Sheets
          </button>
          <button id="export-locations-excel-btn" class="btn btn-secondary btn-sm">
            <i class="fa-solid fa-file-excel text-success"></i> ส่งออก Excel
          </button>
          <button id="add-location-btn" class="btn btn-primary btn-sm">
            <i class="fa-solid fa-plus"></i> เพิ่มตำแหน่งจัดเก็บใหม่
          </button>
        </div>
      </div>

      <!-- Filter Controls -->
      <div class="card" style="padding: 0.85rem 1.25rem; margin-bottom: 1.25rem;">
        <input type="text" id="loc-search-input" class="form-control" placeholder="🔍 ค้นหาตำแหน่งจัดเก็บ (Location Code, อาคาร, ห้อง, ตู้, ชั้น, แฟ้ม)..." value="${this.filterState.search}">
      </div>

      <!-- Locations Table -->
      <div class="card" style="padding: 0;">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Location Code</th>
                <th>อาคาร (Building)</th>
                <th>ห้อง (Room)</th>
                <th>ตู้ (Cabinet)</th>
                <th>ชั้น (Shelf)</th>
                <th>แฟ้ม (Folder)</th>
                <th>เอกสารที่จัดเก็บ</th>
                <th style="text-align: center;">จัดการ / ผังเส้นทาง</th>
              </tr>
            </thead>
            <tbody>
              ${locations.length ? locations.map(l => {
                const docCount = window.db.getDocuments({ location_code: l.code }).length;
                return `
                  <tr>
                    <td><code style="font-weight: 700; font-size: 0.95rem; color: var(--primary-800);">${l.code}</code></td>
                    <td><i class="fa-solid fa-building text-muted"></i> ${l.building}</td>
                    <td><i class="fa-solid fa-door-closed text-muted"></i> ${l.room}</td>
                    <td><i class="fa-solid fa-box text-muted"></i> ${l.cabinet}</td>
                    <td><i class="fa-solid fa-layer-group text-muted"></i> ${l.shelf}</td>
                    <td><i class="fa-solid fa-folder text-muted"></i> ${l.folder}</td>
                    <td><span class="badge badge-info">${docCount} ฉบับ</span></td>
                    <td style="text-align: center;">
                      <div style="display: flex; gap: 0.35rem; justify-content: center; align-items: center;">
                        <button class="btn btn-warning btn-sm edit-loc-btn" data-code="${l.code}" title="แก้ไขตำแหน่ง">
                          <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn btn-danger btn-sm delete-loc-btn" data-code="${l.code}" title="ลบตำแหน่ง">
                          <i class="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('') : `
                <tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">ไม่พบตำแหน่งจัดเก็บที่ตรงกับคำค้นหา</td></tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  refreshPage() {
    const searchEl = document.getElementById('loc-search-input');
    const cursorPos = searchEl ? searchEl.selectionStart : null;
    const isFocused = searchEl && document.activeElement === searchEl;

    const main = document.getElementById('main-content');
    if (main) {
      main.innerHTML = this.render();
      this.initEvents();

      if (isFocused) {
        const newSearchEl = document.getElementById('loc-search-input');
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
    const searchInput = document.getElementById('loc-search-input');
    if (searchInput) {
      searchInput.oninput = (e) => {
        this.filterState.search = e.target.value;
        this.refreshPage();
      };
    }
    const addBtn = document.getElementById('add-location-btn');
    if (addBtn) addBtn.onclick = () => this.openAddLocationModal();

    const syncBtn = document.getElementById('sync-locations-sheets-btn');
    if (syncBtn) {
      syncBtn.onclick = () => {
        window.utils.showToast('กำลังซิงก์ข้อมูลโครงสร้างสถานที่จัดเก็บลง Google Sheets...', 'info');
        window.db.syncToGoogleSheets().then(() => {
          window.utils.showToast('ซิงก์ข้อมูลสถานที่จัดเก็บลง Google Sheets (Storage_Locations) สำเร็จ!', 'success');
        }).catch(err => {
          window.utils.showToast(`ซิงก์ไม่สำเร็จ: ${err.message}`, 'danger');
        });
      };
    }

    const exportBtn = document.getElementById('export-locations-excel-btn');
    if (exportBtn) {
      exportBtn.onclick = () => {
        const locs = window.db.getLocations();
        const exportData = locs.map(l => ({
          'Location Code': l.code,
          'อาคาร': l.building,
          'ห้อง': l.room,
          'ตู้': l.cabinet,
          'ชั้น': l.shelf,
          'แฟ้ม': l.folder,
          'คำอธิบาย': l.description || ''
        }));
        window.utils.exportToExcel('โครงสร้างสถานที่จัดเก็บ', 'Locations', exportData);
      };
    }

    document.querySelectorAll('.edit-loc-btn').forEach(btn => {
      btn.onclick = () => {
        const code = btn.getAttribute('data-code');
        const loc = (window.db.data.storage_locations || []).find(l => l.code === code);
        if (loc) this.openAddLocationModal(loc);
      };
    });

    document.querySelectorAll('.delete-loc-btn').forEach(btn => {
      btn.onclick = () => {
        const code = btn.getAttribute('data-code');
        window.utils.confirmDialog(
          'ยืนยันการลบตำแหน่งจัดเก็บ',
          `คุณต้องการลบตำแหน่งจัดเก็บ <b>${code}</b> ใช่หรือไม่?`,
          async () => {
            window.db.deleteLocation(code);
            window.utils.showToast('กำลังซิงก์การลบลง Google Sheets...', 'info');
            try {
              await window.db.syncToGoogleSheets();
              window.utils.showToast('ลบตำแหน่งจัดเก็บและซิงก์ Google Sheets เรียบร้อยแล้ว', 'success');
            } catch (err) {
              console.warn('Sync locations on delete:', err);
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

  openAddLocationModal(locToEdit = null) {
    const isEdit = !!locToEdit;
    const bVal = isEdit ? locToEdit.building : 'อาคารสำนักงาน';
    const rVal = isEdit ? locToEdit.room : 'ห้องทะเบียน 101';
    const cVal = isEdit ? locToEdit.cabinet : '';
    const sVal = isEdit ? locToEdit.shelf : '';
    const fVal = isEdit ? locToEdit.folder : '';
    const descVal = isEdit ? (locToEdit.description || '') : '';

    const bodyHtml = `
      <form id="add-location-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label required">อาคาร</label>
            <input type="text" id="loc-building" class="form-control" value="${bVal}" required>
          </div>
          <div class="form-group">
            <label class="form-label required">ห้อง</label>
            <input type="text" id="loc-room" class="form-control" value="${rVal}" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label required">ตู้ (Cabinet)</label>
            <input type="text" id="loc-cabinet" class="form-control" value="${cVal}" placeholder="e.g. ตู้ A-04" required>
          </div>
          <div class="form-group">
            <label class="form-label required">ชั้น (Shelf)</label>
            <input type="text" id="loc-shelf" class="form-control" value="${sVal}" placeholder="e.g. ชั้น 02" required>
          </div>
          <div class="form-group">
            <label class="form-label required">แฟ้ม (Folder)</label>
            <input type="text" id="loc-folder" class="form-control" value="${fVal}" placeholder="e.g. แฟ้ม 01" required>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">คำอธิบายเพิ่มเติม</label>
          <input type="text" id="loc-desc" class="form-control" value="${descVal}" placeholder="รายละเอียดจุดจัดเก็บ">
        </div>
      </form>
    `;

    window.utils.openModal(
      isEdit ? `<i class="fa-solid fa-pen-to-square text-primary"></i> แก้ไขตำแหน่งจัดเก็บ` : `<i class="fa-solid fa-boxes-stacked text-primary"></i> เพิ่มตำแหน่งจัดเก็บใหม่`,
      bodyHtml,
      [
        { text: 'ยกเลิก', class: 'btn btn-secondary' },
        {
          text: isEdit ? 'บันทึกการแก้ไข' : 'สร้าง Location Code',
          class: 'btn btn-primary',
          onClick: () => {
            const b = document.getElementById('loc-building').value.trim();
            const r = document.getElementById('loc-room').value.trim();
            const c = document.getElementById('loc-cabinet').value.trim();
            const s = document.getElementById('loc-shelf').value.trim();
            const f = document.getElementById('loc-folder').value.trim();
            const desc = document.getElementById('loc-desc').value.trim();

            if (isEdit) {
              locToEdit.building = b;
              locToEdit.room = r;
              locToEdit.cabinet = c;
              locToEdit.shelf = s;
              locToEdit.folder = f;
              locToEdit.description = desc;
              locToEdit.updated_at = new Date().toISOString();
              window.db.addAuditLog('สถานที่จัดเก็บ', 'แก้ไขตำแหน่ง', `แก้ไขตำแหน่ง ${locToEdit.code}`);
              window.db.save();
              window.db.syncToGoogleSheets().catch(err => console.warn('Sync locations:', err));
              window.utils.showToast('แก้ไขข้อมูลตำแหน่งจัดเก็บเรียบร้อยแล้ว', 'success');
              if (window.router) window.router.handleRoute();
              return;
            }

            const cClean = c.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'A01';
            const sClean = s.replace(/[^0-9]/g, '').padStart(2, '0') || '01';
            const fClean = f.replace(/[^0-9]/g, '').padStart(2, '0') || '01';
            const code = `LOC-${cClean}-${sClean}-${fClean}`;

            window.db.data.storage_locations.push({
              id: window.db.data.storage_locations.length + 1,
              code: code,
              building: b,
              room: r,
              cabinet: c,
              shelf: s,
              folder: f,
              description: desc,
              updated_at: new Date().toISOString()
            });

            window.db.addAuditLog('สถานที่จัดเก็บ', 'เพิ่มตำแหน่ง', `เพิ่มตำแหน่งใหม่ ${code}`);
            window.db.save();
            window.db.syncToGoogleSheets().catch(err => console.warn('Sync locations:', err));
            window.utils.showToast(`สร้าง Location Code: ${code} สำเร็จ`, 'success');
            if (window.router) window.router.handleRoute();
          }
        }
      ]
    );
  }
};

window.locationsView = locationsView;
