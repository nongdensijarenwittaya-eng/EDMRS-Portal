/* ==========================================================================
   EDMRS - Helper Utilities (js/utils.js)
   Toast notifications, modals, QR/Barcode generators, Excel & PDF exporters
   ========================================================================== */

const utils = {
  // Toast Notification System
  showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'danger') iconClass = 'fa-triangle-exclamation';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';

    toast.innerHTML = `
      <i class="fa-solid ${iconClass}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // Modal Dialog Manager
  openModal(title, bodyHtml, footerButtons = [], onClose = null) {
    const container = document.getElementById('modal-container');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    const footerEl = document.getElementById('modal-footer');
    const closeBtn = document.getElementById('modal-close-btn');

    if (!container) return;

    this._activeOnClose = onClose;

    titleEl.innerHTML = title;
    bodyEl.innerHTML = bodyHtml;

    footerEl.innerHTML = '';
    footerButtons.forEach(btnConfig => {
      const button = document.createElement('button');
      button.className = btnConfig.class || 'btn btn-secondary';
      button.innerHTML = btnConfig.text;
      button.onclick = (e) => {
        if (btnConfig.onClick) btnConfig.onClick(e);
        if (btnConfig.closeOnClick !== false) utils.closeModal();
      };
      footerEl.appendChild(button);
    });

    if (closeBtn) {
      closeBtn.onclick = () => {
        utils.closeModal();
      };
    }

    container.onclick = (e) => {
      if (e.target === container) {
        utils.closeModal();
      }
    };

    container.classList.add('show');
  },

  closeModal() {
    const container = document.getElementById('modal-container');
    if (container) container.classList.remove('show');
    if (this._activeOnClose) {
      try { this._activeOnClose(); } catch (e) {}
      this._activeOnClose = null;
    }
  },

  // Confirmation Dialog
  confirmDialog(title, message, onConfirm) {
    this.openModal(
      `<i class="fa-solid fa-circle-question text-warning"></i> ${title}`,
      `<p style="font-size: 1rem; color: var(--text-main);">${message}</p>`,
      [
        { text: 'ยกเลิก', class: 'btn btn-secondary' },
        {
          text: 'ยืนยัน',
          class: 'btn btn-danger',
          onClick: () => {
            if (onConfirm) onConfirm();
          }
        }
      ]
    );
  },

  // QR Code Renderer
  generateQRCode(elementOrId, text, width = 120, height = 120) {
    const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
    if (!el) return;
    el.innerHTML = '';
    const cleanText = String(text || '').trim();
    if (!cleanText) return;

    if (window.QRCode) {
      try {
        new QRCode(el, {
          text: cleanText,
          width: width,
          height: height,
          colorDark: "#0f172a",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.M
        });
      } catch (err) {
        try {
          new QRCode(el, {
            text: cleanText,
            width: width,
            height: height,
            colorDark: "#0f172a",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.L
          });
        } catch (e2) {
          console.warn('QR Code generation overflow fallback:', e2);
          el.innerHTML = `<div style="font-size:0.75rem; color:#666; padding: 4px; word-break: break-all;">QR: ${cleanText}</div>`;
        }
      }
    } else {
      el.innerHTML = `<div style="font-size:0.75rem; color:#666;">QR: ${cleanText}</div>`;
    }
  },

  // Barcode Renderer
  generateBarcode(svgId, code) {
    if (window.JsBarcode) {
      try {
        JsBarcode(`#${svgId}`, code, {
          format: "CODE128",
          width: 1.8,
          height: 45,
          displayValue: true,
          font: "Kanit",
          fontSize: 12,
          margin: 5
        });
      } catch (e) {
        console.warn('Barcode render warning:', e);
      }
    }
  },

  // Thai Date Formatter
  formatThaiDate(dateStr) {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const monthNames = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const month = parseInt(parts[1]);
        const day = parseInt(parts[2]);
        const thaiYear = year > 2500 ? year : year + 543;
        return `${day} ${monthNames[month]} ${thaiYear}`;
      }
    } catch (e) {
      return dateStr;
    }
    return dateStr;
  },

  // Status Badge Generator
  getStatusBadge(status) {
    const map = {
      'stored': '<span class="badge badge-success status-stored"><i class="fa-solid fa-box-archive"></i> จัดเก็บแล้ว</span>',
      'found': '<span class="badge badge-success status-found"><i class="fa-solid fa-check"></i> พบเอกสาร</span>',
      'pending': '<span class="badge badge-warning status-pending"><i class="fa-solid fa-hourglass-half"></i> รอตรวจสอบ</span>',
      'missing': '<span class="badge badge-danger status-missing"><i class="fa-solid fa-triangle-exclamation"></i> ไม่พบเอกสาร</span>',
      'borrowed': '<span class="badge badge-info status-borrowed"><i class="fa-solid fa-file-signature"></i> มีคำขอสำเนา</span>',
      'lost': '<span class="badge badge-danger status-lost"><i class="fa-solid fa-circle-xmark"></i> สูญหาย</span>',
      'graduated': '<span class="badge badge-success"><i class="fa-solid fa-user-graduate"></i> สำเร็จการศึกษา</span>',
      'studying': '<span class="badge badge-info"><i class="fa-solid fa-user-clock"></i> กำลังศึกษา</span>'
    };
    return map[status] || `<span class="badge badge-secondary">${status}</span>`;
  },

  // Excel (.xlsx) Exporter
  exportToExcel(filename, sheetName, dataArray) {
    if (!window.XLSX) {
      this.showToast('ไม่พบไลบรารี XLSX', 'danger');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(dataArray);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName || 'Data');
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    this.showToast(`ส่งออกไฟล์ Excel (${filename}.xlsx) เรียบร้อยแล้ว`, 'success');
  },

  // CSV Exporter
  exportToCSV(filename, dataArray) {
    if (!dataArray || !dataArray.length) return;
    const headers = Object.keys(dataArray[0]);
    const csvRows = [headers.join(',')];

    dataArray.forEach(row => {
      const values = headers.map(header => {
        const escaped = ('' + (row[header] || '')).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    });

    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast(`ส่งออก CSV (${filename}.csv) เรียบร้อยแล้ว`, 'success');
  },

  // Smart Por.Por. Document Scan Reader & OCR Extractor
  scanAndExtractPorPorDocument(file, onComplete) {
    const fileName = file ? (file.name || '' + file) : 'Document.pdf';
    const fileSizeStr = file && file.size ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : '1.5 MB';
    
    let extracted = {
      student_id: '',
      student_name: '',
      graduation_year: '',
      set_number: '',
      doc_number: '',
      file_name: fileName,
      file_size: fileSizeStr,
      confidence: 90
    };

    // 1. Try Filename & Regex Pattern Extraction
    const stdIdMatch = fileName.match(/\b(6[5-9]\d{6})\b/) || fileName.match(/\b(\d{8})\b/);
    if (stdIdMatch) {
      extracted.student_id = stdIdMatch[1];
    }

    const yearMatch = fileName.match(/\b(25[5-7]\d)\b/);
    if (yearMatch) {
      extracted.graduation_year = yearMatch[1];
    }

    const setMatch = fileName.match(/(?:ชุด|เล่ม|SET|BOOK)[_\s-]*(\d{1,2})/i);
    if (setMatch) {
      extracted.set_number = setMatch[1].padStart(2, '0');
    }

    const numMatch = fileName.match(/(?:เลขที่|NO|DOC)[_\s-]*(\d{1,4})/i);
    if (numMatch) {
      extracted.doc_number = numMatch[1].padStart(3, '0');
    }

    // Match with real student database if student ID is found
    if (extracted.student_id && window.db) {
      const matchStd = window.db.getStudentById(extracted.student_id);
      if (matchStd) {
        extracted.student_name = `${matchStd.prefix}${matchStd.first_name} ${matchStd.last_name}`;
        extracted.graduation_year = matchStd.academic_year || extracted.graduation_year;
      }
    }

    // 2. Perform Client-Side Tesseract OCR for image files if available
    const ext = fileName.split('.').pop().toLowerCase();
    if (window.Tesseract && ['jpg', 'jpeg', 'png'].includes(ext) && file instanceof File) {
      Tesseract.recognize(file, 'tha+eng', {
        logger: m => console.log(m)
      }).then(({ data: { text } }) => {
        console.log('Tesseract OCR Result:', text);
        if (text) {
          const idM = text.match(/\b(6[5-9]\d{6})\b/) || text.match(/\b(\d{8})\b/);
          if (idM) extracted.student_id = idM[1];

          const nameM = text.match(/(นาย|นางสาว|เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.)\s*([ก-๙]+)\s+([ก-๙]+)/);
          if (nameM) extracted.student_name = `${nameM[1]}${nameM[2]} ${nameM[3]}`;

          const yearM = text.match(/(25[5-7]\d)/);
          if (yearM) extracted.graduation_year = yearM[1];

          const setM = text.match(/(ชุดที่|เล่มที่)\s*:?\s*(\d+)/);
          if (setM) extracted.set_number = setM[2].padStart(2, '0');

          const numM = text.match(/(เลขที่)\s*:?\s*(\d+)/);
          if (numM) extracted.doc_number = numM[2].padStart(3, '0');
        }
        if (onComplete) onComplete(extracted);
      }).catch(err => {
        console.warn('Tesseract OCR fallback to pattern extractor:', err);
        if (onComplete) onComplete(extracted);
      });
    } else {
      // Simulate fast OCR processing delay for smooth UI experience
      setTimeout(() => {
        if (onComplete) onComplete(extracted);
      }, 600);
    }
  },

  // Google Drive Link Helper Utilities
  getDriveFileId(url) {
    if (!url) return null;
    const trimmed = ('' + url).trim();
    // Pattern 1: https://drive.google.com/file/d/FILE_ID/view...
    const match1 = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match1) return match1[1];
    // Pattern 2: https://drive.google.com/open?id=FILE_ID or uc?id=FILE_ID
    const match2 = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match2) return match2[1];
    // Pattern 3: https://lh3.googleusercontent.com/d/FILE_ID
    const match3 = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match3) return match3[1];
    // If it looks like a raw Google Drive ID (e.g. 25+ chars alphanum)
    if (/^[a-zA-Z0-9_-]{25,}$/.test(trimmed)) return trimmed;
    return null;
  },

  isDriveUrl(url) {
    if (!url) return false;
    const str = ('' + url).trim();
    return str.includes('drive.google.com') || str.includes('googleusercontent.com') || !!this.getDriveFileId(str);
  },

  getDriveEmbedUrl(urlOrId) {
    const fileId = this.getDriveFileId(urlOrId);
    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    return urlOrId;
  },

  getDriveThumbnailUrl(urlOrId) {
    const fileId = this.getDriveFileId(urlOrId);
    if (fileId) {
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
    return urlOrId;
  },

  getDriveViewUrl(urlOrId) {
    const fileId = this.getDriveFileId(urlOrId);
    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
    }
    return urlOrId;
  },

  // Digital File Preview Modal (Google Drive, Image, or Local PDF)
  // Digital File Preview Modal (Google Drive, Image, or Local PDF) with Front/Back support
  openFilePreviewModal(fileUrl, fileName, docCode, fileUrlBack = '') {
    const defaultSampleUrl = 'https://drive.google.com/file/d/1SIu3JfivV9RnCOW2xkzb30x_A16q0MGU/view?usp=sharing';
    const targetUrlFront = (fileUrl && fileUrl.trim() && fileUrl !== 'assets/sample_porpor.pdf' && fileUrl !== 'assets/sample_porpor.png') ? fileUrl.trim() : defaultSampleUrl;
    const targetUrlBack = (fileUrlBack && fileUrlBack.trim() && fileUrlBack !== 'assets/sample_porpor.pdf' && fileUrlBack !== 'assets/sample_porpor.png') ? fileUrlBack.trim() : '';

    const renderSingleViewer = (url, sideTitle) => {
      const isDrive = this.isDriveUrl(url);
      const driveId = this.getDriveFileId(url);
      const embedUrl = isDrive ? this.getDriveEmbedUrl(url) : url;
      const viewUrl = isDrive ? this.getDriveViewUrl(url) : url;

      const isPdf = /\.pdf/i.test(sideTitle || '') || 
                    /\.pdf/i.test(url) || 
                    url.startsWith('data:application/pdf');

      const isImage = !isPdf && (
                        /\.(jpg|jpeg|png|webp|gif)$/i.test(sideTitle || '') || 
                        /\.(jpg|jpeg|png|webp|gif)$/i.test(url) || 
                        url.startsWith('data:image') ||
                        (url.startsWith('blob:') && !/\.pdf/i.test(sideTitle || ''))
                      );

      if (isDrive) {
        return `
          <div style="margin-bottom: 0.5rem;">
            <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.75rem 1rem; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <strong style="color: var(--primary-900); font-size: 0.95rem;">
                  <i class="fa-brands fa-google-drive text-success" style="font-size: 1.2rem;"></i> ไฟล์ Google Drive (${sideTitle})
                </strong>
                <div style="font-size: 0.78rem; color: var(--text-muted); word-break: break-all;">Drive File ID: <code>${driveId || 'Direct URL'}</code></div>
              </div>
              <a href="${viewUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-success btn-sm" style="font-weight: 600;">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> คลิกเข้าดูไฟล์ใน Google Drive
              </a>
            </div>
            <div style="position: relative; width: 100%; height: 440px; background: #0f172a; border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-md);">
              <iframe src="${embedUrl}" width="100%" height="100%" style="border: 0;" allow="autoplay"></iframe>
            </div>
          </div>
        `;
      } else if (isImage) {
        return `
          <div style="text-align: center; padding: 0.5rem;">
            <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.75rem 1rem; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
              <strong style="color: var(--primary-900); font-size: 0.95rem;">
                <i class="fa-solid fa-file-image text-primary"></i> ${sideTitle}
              </strong>
              <a href="${viewUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="font-weight: 600;">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> คลิกดูรูปภาพขนาดเต็ม
              </a>
            </div>
            <div style="background: #0f172a; padding: 1rem; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; max-height: 440px; overflow: auto;">
              <img src="${url}" alt="${sideTitle}" style="max-width: 100%; max-height: 400px; object-fit: contain; border-radius: 4px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);"
                   onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\\'color:#cbd5e1; padding:2.5rem 1rem; text-align:center;\\'><i class=\\'fa-solid fa-file-pdf text-danger\\' style=\\'font-size:3.5rem; margin-bottom:0.75rem; display:block;\\'></i><div style=\\'font-size:1rem; font-weight:600; font-family:sans-serif; color:#f8fafc;\\'>${sideTitle}</div><div style=\\'font-size:0.85rem; color:#94a3b8; margin-top:4px;\\'>ไฟล์เอกสาร ปพ.ดิจิทัล</div><a href=\\'${viewUrl}\\' target=\\'_blank\\' class=\\'btn btn-primary btn-sm\\' style=\\'margin-top:1rem; display:inline-block; font-weight:600;\\'><i class=\\'fa-solid fa-arrow-up-right-from-square\\'></i> เปิดดูไฟล์ในหน้าต่างใหม่</a></div>';">
            </div>
          </div>
        `;
      } else {
        return `
          <div style="margin-bottom: 0.5rem;">
            <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.75rem 1rem; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <strong style="color: var(--primary-900); font-size: 0.95rem;">
                  <i class="fa-solid fa-file-pdf text-danger" style="font-size: 1.2rem;"></i> ${sideTitle}
                </strong>
                <div style="font-size: 0.78rem; color: var(--text-muted);">ไฟล์เอกสารสแกนดิจิทัล ปพ.</div>
              </div>
              <a href="${viewUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="font-weight: 600;">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> คลิกเปิดดูไฟล์ในหน้าต่างใหม่
              </a>
            </div>
            <div style="position: relative; width: 100%; height: 440px; background: #0f172a; border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-md);">
              <iframe src="${embedUrl}" width="100%" height="100%" style="border: 0;" allow="autoplay"></iframe>
            </div>
          </div>
        `;
      }
    };

    const cleanTitle = (fileName || 'เอกสาร ปพ.ดิจิทัล').replace(/^สำเนา\s*ปพ\.\s*-\s*$/, 'สำเนา ปพ. ดิจิทัล');
    const hasBack = Boolean(targetUrlBack);

    let htmlContent = '';
    if (hasBack) {
      htmlContent = `
        <div style="margin-bottom: 1rem; display: flex; gap: 0.5rem; justify-content: center; background: #e2e8f0; padding: 6px; border-radius: var(--radius-md);">
          <button type="button" id="preview-tab-front" class="btn btn-primary btn-sm" style="flex: 1; font-weight: 700;">
            <i class="fa-solid fa-file-lines"></i> เอกสารด้านหน้า
          </button>
          <button type="button" id="preview-tab-back" class="btn btn-light btn-sm" style="flex: 1; font-weight: 700;">
            <i class="fa-solid fa-file-invoice"></i> เอกสารด้านหลัง (มีไฟล์)
          </button>
        </div>
        <div id="preview-container-front">
          ${renderSingleViewer(targetUrlFront, `${cleanTitle} (ด้านหน้า)`)}
        </div>
        <div id="preview-container-back" style="display: none;">
          ${renderSingleViewer(targetUrlBack, `${cleanTitle} (ด้านหลัง)`)}
        </div>
      `;
    } else {
      htmlContent = renderSingleViewer(targetUrlFront, cleanTitle);
    }

    const isDrive = this.isDriveUrl(targetUrlFront);
    const viewUrl = isDrive ? this.getDriveViewUrl(targetUrlFront) : targetUrlFront;

    const modalButtons = [
      { text: 'ปิด', class: 'btn btn-secondary' },
      {
        text: isDrive ? '<i class="fa-brands fa-google-drive"></i> เปิดดูไฟล์ใน Google Drive' : '<i class="fa-solid fa-arrow-up-right-from-square"></i> เปิดดูไฟล์ในหน้าต่างใหม่',
        class: isDrive ? 'btn btn-success' : 'btn btn-primary',
        onClick: () => window.open(viewUrl, '_blank')
      }
    ];

    this.openModal(
      `<i class="fa-solid fa-file-lines text-primary"></i> แสดงไฟล์สแกนดิจิทัล ${docCode || ''}`,
      htmlContent,
      modalButtons
    );

    if (hasBack) {
      setTimeout(() => {
        const btnFront = document.getElementById('preview-tab-front');
        const btnBack = document.getElementById('preview-tab-back');
        const boxFront = document.getElementById('preview-container-front');
        const boxBack = document.getElementById('preview-container-back');

        if (btnFront && btnBack && boxFront && boxBack) {
          btnFront.onclick = () => {
            btnFront.className = 'btn btn-primary btn-sm';
            btnBack.className = 'btn btn-light btn-sm';
            boxFront.style.display = 'block';
            boxBack.style.display = 'none';
          };
          btnBack.onclick = () => {
            btnBack.className = 'btn btn-primary btn-sm';
            btnFront.className = 'btn btn-light btn-sm';
            boxFront.style.display = 'none';
            boxBack.style.display = 'block';
          };
        }
      }, 50);
    }
  },

  // Real WebRTC Live Camera Photo Capture Utility (High-Z-Index Independent Overlay)
  openLiveCameraModal(onCaptured) {
    let container = document.getElementById('camera-modal-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'camera-modal-container';
      container.className = 'modal-overlay';
      container.style.cssText = 'position: fixed; inset: 0; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(4px); display: none; align-items: center; justify-content: center; z-index: 10005; padding: 1rem;';
      document.body.appendChild(container);
    }

    let activeStream = null;
    let useFacingMode = 'environment';

    const stopStream = () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
        activeStream = null;
      }
      container.classList.remove('show');
      container.style.display = 'none';
    };

    container.innerHTML = `
      <div class="modal-card" style="width: 100%; max-width: 580px; background: white; border-radius: var(--radius-lg); overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4); border-top: 5px solid var(--warning-color);">
        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; border-bottom: 1px solid var(--border-color);">
          <h3 class="modal-title" style="font-size: 1.15rem; font-weight: 700; color: var(--primary-950); margin: 0;">
            <i class="fa-solid fa-camera text-warning"></i> กล้องถ่ายสแกนเอกสาร ปพ. (WebRTC Live)
          </h3>
          <button type="button" id="camera-modal-close-x" class="modal-close" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted);">&times;</button>
        </div>
        <div class="modal-body" style="padding: 1.25rem; text-align: center;">
          <div style="position: relative; width: 100%; height: 320px; background: #0f172a; border-radius: var(--radius-md); overflow: hidden; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
            <video id="live-camera-feed" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
            
            <div id="camera-loading-overlay" style="position: absolute; inset: 0; background: #0f172a; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; z-index: 5;">
              <i class="fa-solid fa-spinner fa-spin text-warning" style="font-size: 2.5rem; margin-bottom: 0.75rem;"></i>
              <span style="font-size: 0.9rem;">กำลังเปิดกล้องถ่ายภาพ...</span>
              <small style="color: #94a3b8; font-size: 0.75rem; margin-top: 4px;">โปรดอนุญาตสิทธิ์ใช้งานกล้องในเบราว์เซอร์</small>
            </div>

            <div style="position: absolute; inset: 15px; border: 2px dashed rgba(245, 158, 11, 0.85); border-radius: 8px; pointer-events: none; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 8px;">
              <span style="background: rgba(15, 23, 42, 0.8); color: #f59e0b; padding: 3px 12px; border-radius: 12px; font-size: 0.75rem; font-weight: 500;">
                <i class="fa-solid fa-crop-simple"></i> จัดกรอบเอกสารให้ตรง
              </span>
            </div>
          </div>

          <div style="display: flex; gap: 0.75rem; justify-content: center; align-items: center;">
            <button type="button" id="take-photo-btn" class="btn btn-warning btn-lg" style="flex: 1; font-weight: 700;">
              <i class="fa-solid fa-camera"></i> ถ่ายภาพเอกสาร
            </button>
            <button type="button" id="switch-camera-btn" class="btn btn-secondary">
              <i class="fa-solid fa-camera-rotate"></i> สลับกล้อง
            </button>
          </div>
        </div>
        <div class="modal-footer" style="padding: 0.75rem 1.25rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end;">
          <button type="button" id="camera-modal-cancel-btn" class="btn btn-secondary">ยกเลิก / ปิดกล้อง</button>
        </div>
      </div>
    `;

    container.style.display = 'flex';
    container.classList.add('show');

    const startCamera = (facingMode = 'environment') => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
        activeStream = null;
      }
      const videoEl = document.getElementById('live-camera-feed');
      const loaderEl = document.getElementById('camera-loading-overlay');
      if (!videoEl) return;

      const constraints = { video: { facingMode: facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } } };

      navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
          activeStream = stream;
          videoEl.srcObject = stream;
          videoEl.onloadedmetadata = () => {
            if (loaderEl) loaderEl.style.display = 'none';
          };
        })
        .catch(err => {
          console.warn('FacingMode fallback attempt:', err);
          navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
              activeStream = stream;
              videoEl.srcObject = stream;
              if (loaderEl) loaderEl.style.display = 'none';
            })
            .catch(e => {
              if (loaderEl) {
                loaderEl.innerHTML = `
                  <i class="fa-solid fa-video-slash text-danger" style="font-size: 2.5rem; margin-bottom: 0.5rem;"></i>
                  <span style="color: var(--danger-color); font-weight: 600;">ไม่สามารถเข้าถึงกล้องถ่ายรูปได้</span>
                  <small style="color: var(--text-muted); font-size: 0.75rem; margin-top: 4px; padding: 0 1rem;">โปรดอนุญาตสิทธิ์ใช้งานกล้อง (Camera Permission) ในเบราว์เซอร์</small>
                `;
              }
            });
        });
    };

    setTimeout(() => {
      startCamera(useFacingMode);

      const closeX = document.getElementById('camera-modal-close-x');
      const cancelBtn = document.getElementById('camera-modal-cancel-btn');
      if (closeX) closeX.onclick = () => stopStream();
      if (cancelBtn) cancelBtn.onclick = () => stopStream();

      const switchBtn = document.getElementById('switch-camera-btn');
      if (switchBtn) {
        switchBtn.onclick = (e) => {
          if (e) e.preventDefault();
          useFacingMode = useFacingMode === 'environment' ? 'user' : 'environment';
          startCamera(useFacingMode);
        };
      }

      const takePhotoBtn = document.getElementById('take-photo-btn');
      if (takePhotoBtn) {
        takePhotoBtn.onclick = (e) => {
          if (e) e.preventDefault();
          const videoEl = document.getElementById('live-camera-feed');
          if (!videoEl || !activeStream) return;

          const canvas = document.createElement('canvas');
          canvas.width = videoEl.videoWidth || 1280;
          canvas.height = videoEl.videoHeight || 720;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

          canvas.toBlob((blob) => {
            if (blob) {
              const fileName = `Scan_Camera_${Date.now()}.png`;
              const file = new File([blob], fileName, { type: 'image/png' });
              stopStream();
              this.showToast('ถ่ายภาพเอกสารจากกล้องสำเร็จ!', 'success');
              if (onCaptured) onCaptured(file);
            }
          }, 'image/png', 0.95);
        };
      }
    }, 100);
  }
};

window.utils = utils;
