/* ==========================================================================
   EDMRS - Dashboard View Controller (js/views/dashboardView.js)
   Renders statistics KPIs, deep search bar, Chart.js graphs & activity tables
   ========================================================================== */

const dashboardView = {
  render() {
    const students = window.db.data.students || [];
    const docs = window.db.data.documents || [];
    const books = window.db.data.books || [];
    const locations = window.db.data.storage_locations || [];
    const loans = window.db.data.loans || [];

    // Calculated metrics
    const totalStudents = students.length;
    const totalDocs = docs.length;
    const p1Count = docs.filter(d => d.doc_type_code === 'ปพ.1').length;
    const p2Count = docs.filter(d => d.doc_type_code === 'ปพ.2').length;
    const p3Count = docs.filter(d => d.doc_type_code === 'ปพ.3').length;
    const p6Count = docs.filter(d => d.doc_type_code === 'ปพ.6').length;
    const p7Count = docs.filter(d => d.doc_type_code === 'ปพ.7').length;

    const storedCount = docs.filter(d => d.status === 'stored').length;
    const pendingCount = docs.filter(d => d.status === 'pending').length;
    const missingCount = docs.filter(d => d.status === 'missing').length;
    const borrowedCount = docs.filter(d => d.status === 'borrowed').length;

    const totalBooks = books.length;
    const totalCabinets = new Set(locations.map(l => l.cabinet)).size;

    return `
      <!-- Dashboard Page Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--primary-950);">
            <i class="fa-solid fa-gauge-high text-primary"></i> แดชบอร์ดภาพรวมระบบ
          </h2>
          <p style="font-size: 0.88rem; color: var(--text-muted);">
            สรุปข้อมูลสถิติเอกสาร ปพ. นักเรียน ตำแหน่งจัดเก็บ และสถานะคำขอสำเนาเอกสารประจำสถานศึกษา
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
          <span class="badge ${(window.db && window.db.currentSource === window.db.DATA_SOURCE.GOOGLE && !window.db.googleSyncDisabled) ? 'badge-success' : 'badge-warning'}" style="padding: 0.45rem 0.75rem; font-size: 0.8rem; border-radius: 6px;">
            <i class="fa-solid ${(window.db && window.db.currentSource === window.db.DATA_SOURCE.GOOGLE && !window.db.googleSyncDisabled) ? 'fa-cloud-check' : 'fa-database'}"></i>
            ${(window.db && window.db.currentSource === window.db.DATA_SOURCE.GOOGLE && !window.db.googleSyncDisabled) ? 'ซิงก์ข้อมูลสดจาก Google Sheets' : 'ข้อมูลแคชในเครื่อง (Local Storage)'}
          </span>
          <button id="refresh-dashboard-btn" class="btn btn-secondary btn-sm">
            <i class="fa-solid fa-rotate"></i> รีเฟรช & ดึงข้อมูลสด
          </button>
          <a href="#locations" class="btn btn-primary btn-sm">
            <i class="fa-solid fa-boxes-stacked"></i> สถานที่จัดเก็บ
          </a>
        </div>
      </div>

      <!-- Central Search Block -->
      <div class="card" style="background: linear-gradient(135deg, #1e3a8a, #0f172a); color: white; border: none;">
        <div class="card-body" style="padding: 1.5rem;">
          <h3 style="font-size: 1.15rem; font-weight: 600; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.6rem;">
            <i class="fa-solid fa-magnifying-glass text-warning"></i> ระบบค้นหาข้อมูลเอกสารและนักเรียนแบบรวมศูนย์ (Central Deep Search)
          </h3>
          <p style="font-size: 0.85rem; color: var(--primary-200); margin-bottom: 1rem;">
            ค้นหาทันทีด้วย: รหัสนักเรียน, เลขประจำตัวประชาชน, ชื่อ-นามสกุล, รหัสเอกสาร, เลขที่เอกสาร, รหัสเล่ม หรือ Location Code (เช่น LOC-A03-02-04)
          </p>

          <div style="display: flex; gap: 0.75rem;">
            <div style="position: relative; flex: 1;">
              <input type="text" id="dashboard-search-input" class="form-control form-control-lg" placeholder="พิมพ์คำค้นหาที่นี่... (เช่น 65001234, สมชาย, LOC-A03-02-04)..." style="padding-left: 2.8rem; font-size: 1rem; border-radius: var(--radius-md); border: none;">
              <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 1.1rem;"></i>
            </div>
            <button id="dashboard-search-btn" class="btn btn-warning btn-lg">
              <i class="fa-solid fa-search"></i> ค้นหาทันที
            </button>
          </div>
        </div>
      </div>

      <!-- Live Search Results Container -->
      <div id="central-search-results-container"></div>

      <!-- KPI Summary Cards Grid -->
      <div class="kpi-grid">
        <a href="#students" class="kpi-card" title="คลิกเพื่อไปที่ระบบข้อมูลนักเรียน">
          <div class="kpi-icon blue"><i class="fa-solid fa-user-graduate"></i></div>
          <div class="kpi-info">
            <span class="kpi-label">นักเรียนทั้งหมด</span>
            <span class="kpi-value">${totalStudents.toLocaleString()}</span>
            <span class="kpi-subtext">คนในฐานข้อมูล</span>
          </div>
        </a>

        <a href="#documents" class="kpi-card" title="คลิกเพื่อไปที่ทะเบียนเอกสาร ปพ. ทั้งหมด">
          <div class="kpi-icon emerald"><i class="fa-solid fa-file-invoice"></i></div>
          <div class="kpi-info">
            <span class="kpi-label">เอกสาร ปพ. ทั้งหมด</span>
            <span class="kpi-value">${totalDocs.toLocaleString()}</span>
            <span class="kpi-subtext">รายการเอกสารในระบบ</span>
          </div>
        </a>

        <a href="#documents?status=stored" class="kpi-card" title="คลิกเพื่อกรองเอกสารสถานะจัดเก็บแล้ว">
          <div class="kpi-icon purple"><i class="fa-solid fa-box-archive"></i></div>
          <div class="kpi-info">
            <span class="kpi-label">จัดเก็บแล้ว</span>
            <span class="kpi-value">${storedCount.toLocaleString()}</span>
            <span class="kpi-subtext">พร้อมสืบค้น</span>
          </div>
        </a>

        <a href="#loans" class="kpi-card" title="คลิกเพื่อไปที่ระบบคำขอสำเนาเอกสาร ปพ.">
          <div class="kpi-icon amber"><i class="fa-solid fa-file-signature"></i></div>
          <div class="kpi-info">
            <span class="kpi-label">คำขอสำเนาเอกสาร</span>
            <span class="kpi-value">${loans.length.toLocaleString()}</span>
            <span class="kpi-subtext">รายการคำขอสำเนา ปพ.</span>
          </div>
        </a>

        <a href="#documents?status=missing" class="kpi-card" title="คลิกเพื่อกรองเอกสารสถานะไม่พบเอกสาร">
          <div class="kpi-icon rose"><i class="fa-solid fa-triangle-exclamation"></i></div>
          <div class="kpi-info">
            <span class="kpi-label">ไม่พบเอกสาร</span>
            <span class="kpi-value">${missingCount.toLocaleString()}</span>
            <span class="kpi-subtext">ต้องติดตาม</span>
          </div>
        </a>

        <a href="#books" class="kpi-card" title="คลิกเพื่อไปที่ทะเบียนเล่มเอกสาร">
          <div class="kpi-icon cyan"><i class="fa-solid fa-book-bookmark"></i></div>
          <div class="kpi-info">
            <span class="kpi-label">จำนวนเล่ม / ตู้</span>
            <span class="kpi-value">${totalBooks} / ${totalCabinets}</span>
            <span class="kpi-subtext">เล่มเอกสาร / ตู้จัดเก็บ</span>
          </div>
        </a>
      </div>

      <!-- Secondary Breakdown Pills -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem;">
        <a href="#documents?doc_type_code=ปพ.1" class="kpi-pill-card" title="กรองเอกสารประเภท ปพ.1">
          <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">ปพ.1 (ระเบียน)</span>
          <strong style="font-size: 1.2rem; color: var(--primary-700);">${p1Count}</strong>
        </a>
        <a href="#documents?doc_type_code=ปพ.2" class="kpi-pill-card" title="กรองเอกสารประเภท ปพ.2">
          <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">ปพ.2 (ใบจบ)</span>
          <strong style="font-size: 1.2rem; color: var(--primary-700);">${p2Count}</strong>
        </a>
        <a href="#documents?doc_type_code=ปพ.3" class="kpi-pill-card" title="กรองเอกสารประเภท ปพ.3">
          <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">ปพ.3 (รายงาน)</span>
          <strong style="font-size: 1.2rem; color: var(--primary-700);">${p3Count}</strong>
        </a>
        <a href="#documents?doc_type_code=ปพ.6" class="kpi-pill-card" title="กรองเอกสารประเภท ปพ.6">
          <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">ปพ.6 (สมุดรายงาน)</span>
          <strong style="font-size: 1.2rem; color: var(--primary-700);">${p6Count}</strong>
        </a>
        <a href="#documents?doc_type_code=ปพ.7" class="kpi-pill-card" title="กรองเอกสารประเภท ปพ.7">
          <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">ปพ.7 (ใบรับรอง)</span>
          <strong style="font-size: 1.2rem; color: var(--primary-700);">${p7Count}</strong>
        </a>
        <a href="#documents?status=pending" class="kpi-pill-card" title="กรองเอกสารสถานะรอตรวจสอบ">
          <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">รอตรวจสอบ</span>
          <strong style="font-size: 1.2rem; color: var(--warning-color);">${pendingCount}</strong>
        </a>
      </div>

      <!-- Charts Section Grid -->
      <div class="charts-grid">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><i class="fa-solid fa-chart-pie"></i> จำนวนเอกสารแยกตามประเภท ปพ.</h3>
          </div>
          <div class="chart-container">
            <canvas id="doc-type-chart"></canvas>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><i class="fa-solid fa-chart-column"></i> สถิติเอกสารแยกตามปีการศึกษา</h3>
          </div>
          <div class="chart-container">
            <canvas id="doc-year-chart"></canvas>
          </div>
        </div>
      </div>

      <!-- Recent Documents & Audit Activity Table -->
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem;">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><i class="fa-solid fa-clock"></i> เอกสารที่เพิ่มล่าสุด</h3>
            <a href="#documents" class="btn btn-secondary btn-sm">ดูทั้งหมด</a>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>รหัสเอกสาร</th>
                  <th>ประเภท</th>
                  <th>เล่ม/เลขที่</th>
                  <th>สถานะ</th>
                  <th>ตำแหน่งจัดเก็บ</th>
                </tr>
              </thead>
              <tbody>
                ${docs.slice(0, 6).map(d => `
                  <tr>
                    <td><a href="#documents?search=${d.doc_code}" style="color: var(--primary-700); font-weight: 700;">${d.doc_code}</a></td>
                    <td><a href="#documents?doc_type_code=${encodeURIComponent(d.doc_type_code)}" class="badge badge-secondary" style="text-decoration: none;">${d.doc_type_code}</a></td>
                    <td>เล่ม ${d.book_number || '-'} / เลขที่ ${d.doc_number}</td>
                    <td>${window.utils.getStatusBadge(d.status)}</td>
                    <td><a href="#locations" style="font-weight: 600; color: var(--primary-700); text-decoration: none;"><code>${d.location_code || '-'}</code></a></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><i class="fa-solid fa-bolt"></i> ประวัติกิจกรรมล่าสุด</h3>
            <a href="#audit-log" class="btn btn-secondary btn-sm">ดูทั้งหมด</a>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.85rem;">
            ${(window.db.data.audit_logs || []).slice(0, 5).map(log => `
              <div style="padding: 0.65rem; background: var(--bg-app); border-radius: var(--radius-md); border-left: 3px solid var(--primary-500); font-size: 0.82rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                  <strong style="color: var(--primary-900);">${log.action}</strong>
                  <span style="font-size: 0.72rem; color: var(--text-muted);">${log.timestamp}</span>
                </div>
                <p style="color: var(--text-main); margin-bottom: 2px;">${log.description}</p>
                <span style="font-size: 0.72rem; color: var(--text-muted);">โดย: ${log.username}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  initEvents() {
    const searchInput = document.getElementById('dashboard-search-input');
    const searchBtn = document.getElementById('dashboard-search-btn');
    const resultsContainer = document.getElementById('central-search-results-container');
    const refreshBtn = document.getElementById('refresh-dashboard-btn');

    if (refreshBtn) {
      refreshBtn.onclick = async () => {
        if (window.utils && window.utils.showToast) {
          window.utils.showToast('กำลังซิงก์ดึงข้อมูลล่าสุดจาก Google Sheets...', 'info');
        }
        try {
          window.db.googleSyncDisabled = false;
          const counts = await window.db.syncFromGoogleSheets();
          if (counts && window.utils && window.utils.showToast) {
            window.utils.showToast(`ซิงก์ข้อมูลสดสำเร็จ! (นักเรียน ${counts.studentCount} คน, เอกสาร ${counts.docCount} ฉบับ)`, 'success');
          } else if (window.utils && window.utils.showToast) {
            window.utils.showToast('อัปเดตข้อมูลแดชบอร์ดเรียบร้อยแล้ว', 'success');
          }
        } catch (err) {
          if (window.utils && window.utils.showToast) {
            window.utils.showToast(`แสดงข้อมูลจาก Local Cache (${err.message})`, 'warning');
          }
        }
        if (window.router && typeof window.router.handleRoute === 'function') {
          window.router.handleRoute();
        }
      };
    }

    const performSearch = () => {
      const q = searchInput ? searchInput.value.trim() : '';
      if (!q) {
        resultsContainer.innerHTML = '';
        return;
      }
      const results = window.db.globalSearch(q);
      this.renderSearchResults(results, resultsContainer);
    };

    if (searchBtn) searchBtn.onclick = performSearch;
    if (searchInput) {
      searchInput.oninput = performSearch;
      searchInput.onkeyup = (e) => {
        if (e.key === 'Enter') performSearch();
      };
    }

    this.renderCharts();
  },

  renderSearchResults(results, container) {
    if (!results) return;

    const totalMatches = results.students.length + results.documents.length + results.books.length + results.locations.length;
    if (totalMatches === 0) {
      container.innerHTML = `
        <div class="search-results-panel" style="border-color: var(--danger-color);">
          <div class="search-header-info">
            <h4 style="color: var(--danger-color);"><i class="fa-solid fa-circle-xmark"></i> ไม่พบข้อมูลที่ตรงกับคำค้นหา: "${results.query}"</h4>
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('central-search-results-container').innerHTML=''">&times; ปิด</button>
          </div>
          <p style="font-size: 0.88rem; color: var(--text-muted);">โปรดตรวจสอบคำค้นหา เช่น รหัสนักเรียน (65001234), เลข ปพ. หรือ Location Code</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="search-results-panel">
        <div class="search-header-info">
          <h4><i class="fa-solid fa-check-double text-success"></i> ผลการค้นหาสำหรับ: "${results.query}" (พบทั้งหมด ${totalMatches} รายการ)</h4>
          <button class="btn btn-secondary btn-sm" onclick="document.getElementById('central-search-results-container').innerHTML=''">&times; ปิดผลการค้นหา</button>
        </div>

        ${results.students.length ? `
          <div style="margin-bottom: 1.25rem;">
            <h5 style="color: var(--primary-800); margin-bottom: 0.5rem;"><i class="fa-solid fa-user-graduate"></i> นักเรียน (${results.students.length} รายการ)</h5>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr><th>รหัสนักเรียน</th><th>ชื่อ-นามสกุล</th><th>ระดับชั้น</th><th>ปีการศึกษา</th><th>สถานะ</th><th>การทำงาน</th></tr>
                </thead>
                <tbody>
                  ${results.students.map(s => `
                    <tr>
                      <td><strong>${s.student_id}</strong></td>
                      <td>${s.prefix}${s.first_name} ${s.last_name}</td>
                      <td>${s.grade_level || '-'}</td>
                      <td>${s.academic_year || '-'}</td>
                      <td>${window.utils.getStatusBadge(s.status)}</td>
                      <td><a href="#student-detail?id=${s.student_id}" class="btn btn-primary btn-sm"><i class="fa-solid fa-id-card"></i> ดู Profile เอกสาร</a></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}

        ${results.documents.length ? `
          <div>
            <h5 style="color: var(--primary-800); margin-bottom: 0.5rem;"><i class="fa-solid fa-file-invoice"></i> เอกสาร ปพ. (${results.documents.length} รายการ)</h5>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr><th>รหัสเอกสาร</th><th>ชื่อนักเรียน</th><th>ประเภท</th><th>เล่ม/เลขที่</th><th>สถานะ</th><th>ตำแหน่งจัดเก็บ (Location)</th><th>เส้นทางจัดเก็บ</th></tr>
                </thead>
                <tbody>
                  ${results.documents.map(d => `
                    <tr>
                      <td><strong>${d.doc_code}</strong></td>
                      <td>${d.student_name}</td>
                      <td><span class="badge badge-secondary">${d.doc_type_code}</span></td>
                      <td>เล่ม ${d.book_number} / เลขที่ ${d.doc_number}</td>
                      <td>${window.utils.getStatusBadge(d.status)}</td>
                      <td><code style="font-weight: 600; color: var(--primary-700);">${d.location_code || '-'}</code></td>
                      <td><a href="#locations" class="btn btn-secondary btn-sm"><i class="fa-solid fa-boxes-stacked"></i> ดูสถานที่</a></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  },

  renderCharts() {
    const docs = window.db.data.documents || [];

    // 1. Doc Types Doughnut Chart
    const docTypeCounts = {};
    docs.forEach(d => {
      docTypeCounts[d.doc_type_code] = (docTypeCounts[d.doc_type_code] || 0) + 1;
    });

    const ctxType = document.getElementById('doc-type-chart');
    if (ctxType && window.Chart) {
      new Chart(ctxType, {
        type: 'doughnut',
        data: {
          labels: Object.keys(docTypeCounts),
          datasets: [{
            data: Object.values(docTypeCounts),
            backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#06b6d4', '#a855f7', '#f43f5e', '#64748b']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } }
        }
      });
    }

    // 2. Doc Academic Years Bar Chart
    const yearCounts = {};
    docs.forEach(d => {
      yearCounts[d.academic_year] = (yearCounts[d.academic_year] || 0) + 1;
    });

    const ctxYear = document.getElementById('doc-year-chart');
    if (ctxYear && window.Chart) {
      new Chart(ctxYear, {
        type: 'bar',
        data: {
          labels: Object.keys(yearCounts).map(y => `ปี ${y}`),
          datasets: [{
            label: 'จำนวนเอกสาร (ฉบับ)',
            data: Object.values(yearCounts),
            backgroundColor: '#3b82f6',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });
    }
  }
};

window.dashboardView = dashboardView;
