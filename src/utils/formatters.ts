import { FAVORITE_SCENT_OPTIONS } from '../data/favoriteScents';

/**
 * Formats a login ID (e.g. "1234_scent-jasmine" or "1234_jasmine") into "1234(자스민)".
 * If no scent ID is attached or loginId is admin, returns the original ID or phone digits.
 */
export function formatLoginIdDisplay(loginId?: string | null): string {
  if (!loginId) return '';
  const trimmed = loginId.trim();

  if (trimmed.toLowerCase().startsWith('admin') || trimmed.toLowerCase() === 'master') {
    return trimmed;
  }

  const parts = trimmed.split('_');
  const phone = parts[0];
  if (parts.length < 2) return phone;

  const scentKey = parts[1];
  const matched = FAVORITE_SCENT_OPTIONS.find(
    s => s.id === scentKey || 
         s.id === `scent-${scentKey}` || 
         s.id.replace(/^scent-/, '') === scentKey.replace(/^scent-/, '')
  );

  if (matched) {
    return `${phone}(${matched.nameKo})`;
  }

  return phone;
}

/**
 * Returns default perfumer memo depending on selected theme type
 */
export function getDefaultMakerMemo(selectedType?: string): string {
  if (selectedType === 'name_sejong') {
    return '조향사 의견: 고객님의 이름이 가진 세련되고 맑은 음가 특성과 세종시 명소의 공간적 서사를 섬세하게 조합하여 고유한 시그니처 향으로 표현하였습니다.';
  }
  return '조향사 의견: 고객님의 한글 이름 분석을 기반으로 탑, 미들, 베이스 노트를 균형감 있게 안착시켜 개성적이면서도 은은한 조화를 이루도록 조향하였습니다.';
}
