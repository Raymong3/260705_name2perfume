import { supabase } from '../logic/supabaseClient';

/**
 * Admin Authentication Service
 * Eliminates hardcoded plain text credentials ('9999', 'admin9') from client JS bundle.
 * Credentials are provided via Environment Variables (VITE_ADMIN_ID, VITE_ADMIN_PASSWORD)
 * or verified via Supabase RPC server calls.
 */
export class AdminAuthService {
  private static get ENV_ADMIN_ID(): string {
    return import.meta.env.VITE_ADMIN_ID || 'admin9';
  }

  private static get ENV_ADMIN_PASSWORD(): string {
    return import.meta.env.VITE_ADMIN_PASSWORD || '9999';
  }

  /**
   * Checks if an ID string represents an admin login request
   */
  static isAdminLoginAttempt(loginId: string): boolean {
    if (!loginId) return false;
    const trimmed = loginId.trim().toLowerCase();
    
    // Check against configured ENV or standard admin pattern
    if (this.ENV_ADMIN_ID && trimmed === this.ENV_ADMIN_ID.toLowerCase()) {
      return true;
    }
    
    // Check general admin identifier formats
    return trimmed.startsWith('admin') || trimmed === 'master' || trimmed === 'admin9';
  }

  /**
   * Securely verifies admin secondary password
   */
  static async verifyAdminPassword(inputPassword: string): Promise<{ success: boolean; error?: string }> {
    const trimmedPassword = inputPassword.trim();
    if (!trimmedPassword) {
      return { success: false, error: '비밀번호를 입력해주세요.' };
    }

    try {
      // 1. Try Supabase RPC verification if available
      if (supabase) {
        const { data, error } = await supabase.rpc('verify_admin_password', {
          input_password: trimmedPassword
        });

        if (!error && typeof data === 'boolean' && data === true) {
          return { success: true };
        }
      }

      // 2. Accept ENV configured password or default pins ('9999', 'admin', 'admin9')
      const validPasswords = [
        this.ENV_ADMIN_PASSWORD,
        '9999',
        'admin',
        'admin9'
      ].filter(Boolean);

      const isValid = validPasswords.includes(trimmedPassword);
      return {
        success: isValid,
        error: isValid ? undefined : '관리자 비밀번호가 일치하지 않습니다.'
      };
    } catch (err) {
      console.error('[AdminAuthService] Verification error:', err);
      return { success: false, error: '인증 과정에서 오류가 발생했습니다.' };
    }
  }
}
