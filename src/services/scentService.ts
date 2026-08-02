import {
  dbLoginGuest,
  dbCreateRecord,
  dbGetRecords,
  dbCompleteRecord,
  dbDeleteRecords
} from '../logic/supabaseClient';
import { FinalRecipe } from '../types/perfume';
import { AdminAuthService } from './adminAuthService';

export class ScentService {
  /**
   * Guest Login Verification
   */
  static async loginGuest(loginId: string): Promise<{ success: boolean; isNewUser: boolean; isMaster: boolean; error?: string }> {
    try {
      const isMaster = AdminAuthService.isAdminLoginAttempt(loginId);
      if (isMaster) {
        return { success: true, isNewUser: false, isMaster: true };
      }

      const res = await dbLoginGuest(loginId);
      return { ...res, isMaster: false };
    } catch (err) {
      console.error('[ScentService] Guest login error:', err);
      return {
        success: false,
        isNewUser: false,
        isMaster: false,
        error: '로그인 도중 네트워크 오류가 발생했습니다. 다시 시도해 주세요.'
      };
    }
  }

  /**
   * Submit new perfume recipe record
   */
  static async createRecipeRecord(
    guestName: string,
    loginId: string,
    recipeData: Partial<FinalRecipe>
  ): Promise<{ success: boolean; data?: FinalRecipe; error?: string }> {
    try {
      const record = await dbCreateRecord(guestName, loginId, recipeData);
      return { success: true, data: record };
    } catch (err) {
      console.error('[ScentService] Create record error:', err);
      return {
        success: false,
        error: '레시피 저장 도중 오류가 발생했습니다. 로컬에 저장되었습니다.'
      };
    }
  }

  /**
   * Retrieve records (Guest gets own record, Admin gets full list)
   */
  static async getRecords(loginId?: string, isAdmin: boolean = false): Promise<{ success: boolean; data: FinalRecipe[]; error?: string }> {
    try {
      const queryId = isAdmin ? 'admin_mode' : loginId;
      const records = await dbGetRecords(queryId);
      return { success: true, data: records };
    } catch (err) {
      console.error('[ScentService] Get records error:', err);
      return {
        success: false,
        data: [],
        error: '기록을 불러오는 도중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * Complete perfume record
   */
  static async completeRecord(id: string, updates: Partial<FinalRecipe>): Promise<{ success: boolean; error?: string }> {
    try {
      await dbCompleteRecord(id, updates);
      return { success: true };
    } catch (err) {
      console.error('[ScentService] Complete record error:', err);
      return {
        success: false,
        error: '완료 처리 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * Batch delete records
   */
  static async deleteRecords(ids: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      await dbDeleteRecords(ids);
      return { success: true };
    } catch (err) {
      console.error('[ScentService] Delete records error:', err);
      return {
        success: false,
        error: '삭제 처리 중 오류가 발생했습니다.'
      };
    }
  }
}
