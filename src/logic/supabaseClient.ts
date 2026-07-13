import { createClient } from '@supabase/supabase-js';
import { FinalRecipe } from '../types/perfume';

// Load Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase configs are present
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==========================================
// 1. LocalStorage Fallback DB Layer
// ==========================================
class LocalScentDB {
  private static STORAGE_KEY = 'hunmin_scent_history_db';

  private static getRawData(): any[] {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  }

  private static saveRawData(data: any[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  // Login a guest with single loginId (4 digits + 1 char)
  static async loginGuest(loginId: string): Promise<{ success: boolean; isNewUser: boolean; error?: string }> {
    const data = this.getRawData();
    const existingRecord = data.find(r => r.password_pin === loginId.trim());

    if (!existingRecord) {
      // New login ID -> register on first submission
      return { success: true, isNewUser: true };
    }

    // Existing login ID
    return { success: true, isNewUser: false };
  }

  // Create a new record (Draft or Submitted status)
  static async createRecord(
    guestName: string,
    loginId: string,
    recipeData: any
  ): Promise<any> {
    const data = this.getRawData();
    const newId = 'local_' + Date.now();
    const today = new Date();
    const formattedDate = `${today.getFullYear()}. ${String(today.getMonth() + 1).padStart(2, '0')}. ${String(today.getDate()).padStart(2, '0')}. ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;

    const newRecord = {
      id: newId,
      guest_name: guestName,
      password_pin: loginId, // store loginId in password_pin field
      status: 'submitted',
      selected_type: recipeData.selectedType,
      perfume_name: recipeData.perfumeName || `${guestName}의 향`,
      top: recipeData.top || [],
      middle: recipeData.middle || [],
      base: recipeData.base || [],
      added_notes: recipeData.addedNotes || [],
      removed_notes: recipeData.removedNotes || [],
      modified_notes: recipeData.modifiedNotes || [],
      maker_memo: recipeData.makerMemo || '',
      analysis: recipeData.analysis || null,
      selected_story: recipeData.selectedStory || null,
      survey_answers: recipeData.surveyAnswers || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      createdDate: formattedDate
    };

    data.push(newRecord);
    this.saveRawData(data);
    return this.mapToFinalRecipe(newRecord);
  }

  // Get records for a specific loginId or all if loginId is admin
  static async getRecords(loginId?: string): Promise<FinalRecipe[]> {
    const data = this.getRawData();
    let filtered = data;

    if (loginId && loginId !== 'admin9') {
      filtered = data.filter(r => r.password_pin === loginId.trim());
    }

    // Sort by created_at descending
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return filtered.map(r => this.mapToFinalRecipe(r));
  }

  // Update a record to completed
  static async completeRecord(id: string, updates: any): Promise<void> {
    const data = this.getRawData();
    const idx = data.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('해당 기록을 찾을 수 없습니다.');

    data[idx] = {
      ...data[idx],
      status: 'completed',
      top: updates.top,
      middle: updates.middle,
      base: updates.base,
      added_notes: updates.addedNotes,
      removed_notes: updates.removedNotes,
      modified_notes: updates.modifiedNotes,
      perfume_name: updates.perfumeName,
      maker_memo: updates.makerMemo,
      selected_type: updates.selectedType,
      updated_at: new Date().toISOString()
    };

    this.saveRawData(data);
  }

  // Delete records (batch)
  static async deleteRecords(ids: string[]): Promise<void> {
    const data = this.getRawData();
    const filtered = data.filter(r => !ids.includes(r.id));
    this.saveRawData(filtered);
  }

  // Mapper helper
  private static mapToFinalRecipe(r: any): FinalRecipe {
    const today = new Date(r.created_at);
    const formattedDate = `${today.getFullYear()}. ${String(today.getMonth() + 1).padStart(2, '0')}. ${String(today.getDate()).padStart(2, '0')}. ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
    return {
      id: r.id,
      guestName: r.guest_name,
      loginId: r.password_pin,
      status: r.status,
      selectedType: r.selected_type,
      originalRecipe: {
        name: r.guest_name,
        analysis: r.analysis,
        concept: r.selected_story ? `${r.guest_name}의 이름과 세종의 이야기 중 '${r.selected_story.title}'의 조화` : `${r.guest_name}의 이름을 담은 향`,
        top: r.top,
        middle: r.middle,
        base: r.base,
        description: r.maker_memo || '',
        matchScore: 0
      },
      top: r.top,
      middle: r.middle,
      base: r.base,
      addedNotes: r.added_notes,
      removedNotes: r.removed_notes,
      modifiedNotes: r.modified_notes,
      perfumeName: r.perfume_name,
      makerMemo: r.maker_memo,
      createdDate: r.createdDate || formattedDate,
      analysis: r.analysis,
      selectedStory: r.selected_story,
      surveyAnswers: r.survey_answers
    } as unknown as FinalRecipe;
  }
}

// ==========================================
// 2. Exported Database Access Methods
// ==========================================

export async function dbLoginGuest(loginId: string): Promise<{ success: boolean; isNewUser: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    console.log('[Hunmin DB] Running in LocalStorage Fallback mode.');
    return LocalScentDB.loginGuest(loginId);
  }

  try {
    const { data, error } = await supabase
      .from('hunmin_scent_records')
      .select('password_pin')
      .eq('password_pin', loginId.trim())
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0) {
      // New user
      return { success: true, isNewUser: true };
    }

    // Existing user
    return { success: true, isNewUser: false };
  } catch (err) {
    console.error('[Hunmin DB] Supabase login error:', err);
    return { success: false, isNewUser: false, error: '서버와 연결하는 중 오류가 발생했습니다. (로컬모드로 우회 작동 중)' };
  }
}

export async function dbCreateRecord(
  guestName: string,
  loginId: string,
  recipeData: Partial<FinalRecipe>
): Promise<FinalRecipe> {
  if (!isSupabaseConfigured || !supabase) {
    return LocalScentDB.createRecord(guestName, loginId, recipeData);
  }

  const today = new Date();
  const formattedDate = `${today.getFullYear()}. ${String(today.getMonth() + 1).padStart(2, '0')}. ${String(today.getDate()).padStart(2, '0')}. ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;

  const insertData = {
    guest_name: guestName,
    password_pin: loginId, // store loginId in password_pin field
    status: 'submitted',
    selected_type: recipeData.selectedType,
    perfume_name: recipeData.perfumeName || `${guestName}의 향`,
    top: recipeData.top || [],
    middle: recipeData.middle || [],
    base: recipeData.base || [],
    added_notes: recipeData.addedNotes || [],
    removed_notes: recipeData.removedNotes || [],
    modified_notes: recipeData.modifiedNotes || [],
    maker_memo: recipeData.makerMemo || '',
    analysis: recipeData.analysis || null,
    selected_story: recipeData.selectedStory || null,
    survey_answers: recipeData.surveyAnswers || []
  };

  try {
    const { data, error } = await supabase
      .from('hunmin_scent_records')
      .insert([insertData])
      .select();

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('의뢰 생성에 실패했습니다.');

    const created = data[0];
    return {
      id: created.id,
      guestName: created.guest_name,
      loginId: created.password_pin,
      status: created.status,
      selectedType: created.selected_type,
      originalRecipe: {
        name: created.guest_name,
        analysis: created.analysis,
        concept: created.selected_story ? `${created.guest_name}의 이름과 세종의 이야기 중 '${created.selected_story.title}'의 조화` : `${created.guest_name}의 이름을 담은 향`,
        top: created.top,
        middle: created.middle,
        base: created.base,
        description: created.maker_memo || '',
        matchScore: 0
      },
      top: created.top,
      middle: created.middle,
      base: created.base,
      addedNotes: created.added_notes,
      removedNotes: created.removed_notes,
      modifiedNotes: created.modified_notes,
      perfumeName: created.perfume_name,
      makerMemo: created.maker_memo,
      createdDate: formattedDate,
      analysis: created.analysis,
      selectedStory: created.selected_story,
      surveyAnswers: created.survey_answers
    } as unknown as FinalRecipe;
  } catch (err) {
    console.error('[Hunmin DB] Supabase create error, writing to LocalStorage instead:', err);
    return LocalScentDB.createRecord(guestName, loginId, recipeData);
  }
}

export async function dbGetRecords(loginId?: string): Promise<FinalRecipe[]> {
  if (!isSupabaseConfigured || !supabase) {
    return LocalScentDB.getRecords(loginId);
  }

  try {
    let query = supabase.from('hunmin_scent_records').select('*');

    if (loginId && loginId !== 'admin9') {
      query = query.eq('password_pin', loginId.trim()); // query by loginId
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map(r => {
      const today = new Date(r.created_at);
      const formattedDate = `${today.getFullYear()}. ${String(today.getMonth() + 1).padStart(2, '0')}. ${String(today.getDate()).padStart(2, '0')}. ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
      return {
        id: r.id,
        guestName: r.guest_name,
        loginId: r.password_pin,
        status: r.status,
        selectedType: r.selected_type,
        originalRecipe: {
          name: r.guest_name,
          analysis: r.analysis,
          concept: r.selected_story ? `${r.guest_name}의 이름과 세종의 이야기 중 '${r.selected_story.title}'의 조화` : `${r.guest_name}의 이름을 담은 향`,
          top: r.top,
          middle: r.middle,
          base: r.base,
          description: r.maker_memo || '',
          matchScore: 0
        },
        top: r.top,
        middle: r.middle,
        base: r.base,
        addedNotes: r.added_notes,
        removedNotes: r.removed_notes,
        modifiedNotes: r.modified_notes,
        perfumeName: r.perfume_name,
        makerMemo: r.maker_memo,
        createdDate: formattedDate,
        analysis: r.analysis,
        selectedStory: r.selected_story,
        surveyAnswers: r.survey_answers
      } as unknown as FinalRecipe;
    });
  } catch (err) {
    console.error('[Hunmin DB] Supabase get records error, loading from LocalStorage:', err);
    return LocalScentDB.getRecords(loginId);
  }
}

export async function dbCompleteRecord(id: string, updates: Partial<FinalRecipe>): Promise<void> {
  if (!isSupabaseConfigured || !supabase || id.startsWith('local_')) {
    return LocalScentDB.completeRecord(id, updates);
  }

  try {
    const { error } = await supabase
      .from('hunmin_scent_records')
      .update({
        status: 'completed',
        top: updates.top,
        middle: updates.middle,
        base: updates.base,
        added_notes: updates.addedNotes,
        removed_notes: updates.removedNotes,
        modified_notes: updates.modifiedNotes,
        perfume_name: updates.perfumeName,
        maker_memo: updates.makerMemo,
        selected_type: updates.selectedType,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  } catch (err) {
    console.error('[Hunmin DB] Supabase complete error, writing to LocalStorage:', err);
    return LocalScentDB.completeRecord(id, updates);
  }
}

export async function dbDeleteRecords(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  
  if (!isSupabaseConfigured || !supabase || ids.some(id => id.startsWith('local_'))) {
    return LocalScentDB.deleteRecords(ids);
  }

  try {
    const { error } = await supabase
      .from('hunmin_scent_records')
      .delete()
      .in('id', ids);

    if (error) throw error;
  } catch (err) {
    console.error('[Hunmin DB] Supabase delete records error, modifying LocalStorage:', err);
    return LocalScentDB.deleteRecords(ids);
  }
}
