/* ==========================================================================
   EDMRS - Global Configuration & Constants Manager (js/config.js)
   Centralized source of truth for Google Apps Script Web App URL and System Config
   ========================================================================== */

const CONFIG = {
  // Primary Central Web App URL (Google Apps Script)
  GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxBJ-fRIiU0T8BqyAlZS5xrO8x5N6niAxQLkkKiAKCMCDZoaoAImKhKWHaFLn8TxEYs/exec',
  
  // Application Details
  APP_NAME_TH: 'ระบบจัดเก็บเอกสาร ปพ.',
  APP_NAME_EN: 'EDMRS Portal',
  VERSION: '3.0.0 Enterprise',

  /**
   * Helper: Resolves active Web App URL from Database Settings or default Config
   */
  getWebAppUrl() {
    if (window.db && window.db.data && window.db.data.settings && window.db.data.settings.sheets_url) {
      const customUrl = String(window.db.data.settings.sheets_url).trim();
      if (customUrl && this.validateWebAppUrl(customUrl)) {
        return customUrl;
      }
    }
    return this.GOOGLE_APPS_SCRIPT_URL;
  },

  /**
   * Strict Validation for Google Apps Script Web App URL
   * Must:
   * 1) Start with https://
   * 2) Contain script.google.com
   * 3) Contain /macros/s/
   * 4) End with /exec
   * 5) NOT contain /dev or script.googleusercontent.com/macros/echo
   */
  validateWebAppUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const clean = url.trim();
    if (!clean.startsWith('https://')) return false;
    if (!clean.includes('script.google.com')) return false;
    if (!clean.includes('/macros/s/')) return false;
    if (!clean.endsWith('/exec')) return false;
    if (clean.includes('/dev') || clean.includes('script.googleusercontent.com/macros/echo')) return false;
    return true;
  }
};

window.CONFIG = CONFIG;
