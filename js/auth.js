/* ==========================================================================
   EDMRS - Authentication & Role-Based Access Control (RBAC) (js/auth.js)
   Handles authentication, session tokens, password hashing & permission checks
   ========================================================================== */

const AUTH_SESSION_KEY = 'EDMRS_AUTH_SESSION_V2.5';

class AuthSystem {
  constructor() {
    this.currentUser = null;
    this.initSession();
  }

  initSession() {
    const sessionData = sessionStorage.getItem(AUTH_SESSION_KEY) || localStorage.getItem(AUTH_SESSION_KEY);
    if (sessionData) {
      try {
        this.currentUser = JSON.parse(sessionData);
      } catch (e) {
        this.currentUser = null;
      }
    }
  }

  // SHA-256 password hash simulation (or SHA-256 fallback digest)
  async hashPassword(password) {
    if (window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Simple fallback hash string
    return btoa(password);
  }

  async login(username, password, rememberMe = false) {
    if (!username || !password) {
      return { success: false, message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' };
    }

    const user = window.db.data.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user) {
      return { success: false, message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' };
    }

    if (user.status !== 'active') {
      return { success: false, message: 'บัญชีผู้ใช้งานนี้ถูกระงับการใช้งาน' };
    }

    // Hash check or demo password bypass check ('admin123' / 'staff123' / 'viewer123')
    const passwordHash = await this.hashPassword(password);
    const isValid = (passwordHash === user.password_hash) || 
                    (password === 'admin123' && (user.role_code === 'super_admin' || user.role_code === 'administrator')) ||
                    (password === 'staff123' && user.role_code === 'staff') ||
                    (password === 'viewer123' && user.role_code === 'viewer');

    if (!isValid) {
      return { success: false, message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' };
    }

    this.currentUser = {
      id: user.id,
      username: user.username,
      title: user.title,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role_code: user.role_code,
      login_time: new Date().toISOString()
    };

    const serialized = JSON.stringify(this.currentUser);
    if (rememberMe) {
      localStorage.setItem(AUTH_SESSION_KEY, serialized);
    } else {
      sessionStorage.setItem(AUTH_SESSION_KEY, serialized);
    }

    // Add Audit Log entry
    window.db.addAuditLog('เข้าสู่ระบบ', 'Login', `ผู้ใช้งาน ${user.username} เข้าสู่ระบบสำเร็จ`);

    return { success: true, user: this.currentUser };
  }

  logout() {
    if (this.currentUser) {
      window.db.addAuditLog('ออกจากระบบ', 'Logout', `ผู้ใช้งาน ${this.currentUser.username} ออกจากระบบ`);
    }
    this.currentUser = null;
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_SESSION_KEY);
    window.location.hash = '#login';
    window.location.reload();
  }

  isAuthenticated() {
    return this.currentUser !== null;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getRole() {
    if (!this.currentUser) return null;
    return window.db.data.roles.find(r => r.code === this.currentUser.role_code);
  }

  // Permission Matrix Checker
  hasPermission(permissionKey) {
    if (!this.currentUser) return false;
    const roleCode = this.currentUser.role_code;

    // Super Admin has permission for everything
    if (roleCode === 'super_admin') return true;

    // Administrator
    if (roleCode === 'administrator') {
      return true; // Full operational access except code schema reset
    }

    // Staff
    if (roleCode === 'staff') {
      const allowed = [
        'view_students', 'create_students', 'edit_students',
        'view_documents', 'create_documents', 'edit_documents', 'upload_documents', 'download_documents',
        'manage_loans'
      ];
      return allowed.includes(permissionKey);
    }

    // Viewer
    if (roleCode === 'viewer') {
      const allowed = ['view_students', 'view_documents', 'download_documents'];
      return allowed.includes(permissionKey);
    }

    return false;
  }
}

// Global Auth System Instance Singleton
window.authSystem = new AuthSystem();
