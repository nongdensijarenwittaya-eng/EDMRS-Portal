/* ==========================================================================
   EDMRS - Special Visual Location Finder (js/views/locationFinderView.js)
   Visual route layout step tracer: Building -> Room -> Cabinet -> Shelf -> Folder -> Book -> Doc No.
   ========================================================================== */

const locationFinderView = {
  render(params = {}) {
    const codeParam = params.code || 'LOC-A03-02-04';
    const docParam = params.doc || 'DOC-P1-65001234';

    const location = window.db.getLocationByCode(codeParam) || window.db.data.storage_locations[3];
    const doc = window.db.data.documents.find(d => d.doc_code === docParam || d.location_code === location.code) || window.db.data.documents[0];
    const book = window.db.data.books.find(b => b.book_code === doc.book_code) || window.db.data.books[1];

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h2 style="font-size: 1.4rem; font-weight: 700; color: var(--primary-950);">
            <i class="fa-solid fa-compass text-primary"></i> ค้นหาตำแหน่งจัดเก็บเอกสาร (Visual Location Route Finder)
          </h2>
          <p style="font-size: 0.88rem; color: var(--text-muted);">
            แสดงแผนผังเส้นทางระบุตำแหน่งจัดเก็บเอกสาร ปพ. ตั้งแต่อาคารจนถึงเลขที่เอกสารในเล่ม
          </p>
        </div>
        <div>
          <button onclick="window.print()" class="btn btn-secondary btn-sm">
            <i class="fa-solid fa-print"></i> พิมพ์แผนผังนำทาง
          </button>
        </div>
      </div>

      <!-- Quick Finder Search Header Card -->
      <div class="card" style="background: white; border-top: 4px solid var(--primary-600);">
        <div style="display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 280px;">
            <label class="form-label font-weight-bold">เลือกตำแหน่ง Location Code หรือระบุรหัสเอกสาร</label>
            <select id="finder-location-select" class="form-control">
              ${window.db.data.storage_locations.map(l => `<option value="${l.code}" ${l.code === location.code ? 'selected' : ''}>${l.code} - ${l.building} (${l.room} / ${l.cabinet})</option>`).join('')}
            </select>
          </div>
          <button id="finder-trace-btn" class="btn btn-primary">
            <i class="fa-solid fa-route"></i> แสดงแผนผังนำทาง
          </button>
        </div>
      </div>

      <!-- Main Visual Map Route Flow Diagram -->
      <div class="card" style="box-shadow: var(--shadow-lg);">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fa-solid fa-map-location-dot"></i> แผนผังเส้นทางสถานที่จัดเก็บจริง (Storage Hierarchy Route)
          </h3>
          <span class="badge badge-success" style="font-size: 0.9rem; padding: 0.4rem 0.8rem;">
            Location Code: <strong id="location-code-display">${location.code}</strong>
          </span>
        </div>

        <div class="location-flow-tree">
          <div class="flow-step">
            <div class="flow-step-icon" style="background: #dbeafe; color: #1e40af;"><i class="fa-solid fa-building"></i></div>
            <div class="flow-step-content">
              <span class="flow-step-title">1. อาคาร (Building)</span>
              <span class="flow-step-value">${location.building}</span>
            </div>
          </div>

          <div class="flow-arrow"><i class="fa-solid fa-down-long"></i></div>

          <div class="flow-step">
            <div class="flow-step-icon" style="background: #e0e7ff; color: #3730a3;"><i class="fa-solid fa-door-open"></i></div>
            <div class="flow-step-content">
              <span class="flow-step-title">2. ห้องจัดเก็บ (Room)</span>
              <span class="flow-step-value">${location.room}</span>
            </div>
          </div>

          <div class="flow-arrow"><i class="fa-solid fa-down-long"></i></div>

          <div class="flow-step">
            <div class="flow-step-icon" style="background: #fae8ff; color: #86198f;"><i class="fa-solid fa-box-archive"></i></div>
            <div class="flow-step-content">
              <span class="flow-step-title">3. ตู้จัดเก็บ (Cabinet)</span>
              <span class="flow-step-value">${location.cabinet}</span>
            </div>
          </div>

          <div class="flow-arrow"><i class="fa-solid fa-down-long"></i></div>

          <div class="flow-step">
            <div class="flow-step-icon" style="background: #fef3c7; color: #92400e;"><i class="fa-solid fa-layer-group"></i></div>
            <div class="flow-step-content">
              <span class="flow-step-title">4. ชั้นที่ (Shelf)</span>
              <span class="flow-step-value">${location.shelf}</span>
            </div>
          </div>

          <div class="flow-arrow"><i class="fa-solid fa-down-long"></i></div>

          <div class="flow-step">
            <div class="flow-step-icon" style="background: #dcfce7; color: #166534;"><i class="fa-solid fa-folder-closed"></i></div>
            <div class="flow-step-content">
              <span class="flow-step-title">5. แฟ้ม / กล่อง (Folder/Box)</span>
              <span class="flow-step-value">${location.folder}</span>
            </div>
          </div>

          <div class="flow-arrow"><i class="fa-solid fa-down-long"></i></div>

          <div class="flow-step">
            <div class="flow-step-icon" style="background: #fee2e2; color: #991b1b;"><i class="fa-solid fa-book"></i></div>
            <div class="flow-step-content">
              <span class="flow-step-title">6. เล่มเอกสาร (Book Code)</span>
              <span class="flow-step-value">${book ? `${book.book_code} (เล่มที่ ${book.book_number})` : 'เล่ม ปพ.1/2565/03'}</span>
            </div>
          </div>

          <div class="flow-arrow"><i class="fa-solid fa-down-long"></i></div>

          <div class="flow-step" style="border-left-color: var(--success-color); background: #f0fdf4;">
            <div class="flow-step-icon" style="background: #10b981; color: white;"><i class="fa-solid fa-file-circle-check"></i></div>
            <div class="flow-step-content">
              <span class="flow-step-title" style="color: #047857;">7. เอกสารและนักเรียนเจ้าของเอกสาร</span>
              <span class="flow-step-value" style="color: #065f46;">
                เอกสารเลขที่ ${doc ? doc.doc_number : '087'} - ${doc ? doc.student_name : 'นายสมชาย ใจดี'} (${doc ? doc.student_id : '65001234'})
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  initEvents() {
    const traceBtn = document.getElementById('finder-trace-btn');
    const selectEl = document.getElementById('finder-location-select');

    if (traceBtn && selectEl) {
      traceBtn.onclick = () => {
        const code = selectEl.value;
        window.location.hash = `#location-finder?code=${code}`;
        window.location.reload();
      };
    }
  }
};

window.locationFinderView = locationFinderView;
