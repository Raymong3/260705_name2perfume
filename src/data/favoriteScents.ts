export interface FavoriteScentOption {
  id: string;
  nameKo: string;
  nameEn: string;
  tag: string;
  desc: string;
  category: 'Citrus' | 'Floral' | 'Herbal' | 'Woody' | 'Musk';
}

export const FAVORITE_SCENT_OPTIONS: FavoriteScentOption[] = [
  { id: 'scent-bergamot', nameKo: '베르가못', nameEn: 'Bergamot', tag: '#상큼청량', desc: '밝고 맑은 시트러스', category: 'Citrus' },
  { id: 'scent-sweet-orange', nameKo: '스위트 오렌지', nameEn: 'Sweet Orange', tag: '#달콤상큼', desc: '싱그러운 과즙 향', category: 'Citrus' },
  { id: 'scent-eucalyptus', nameKo: '유칼립투스', nameEn: 'Eucalyptus', tag: '#피톤치드', desc: '코끝이 시원한 허브', category: 'Herbal' },
  { id: 'scent-green-tea', nameKo: '그린티', nameEn: 'Green Tea', tag: '#싱그러움', desc: '은은하고 차분한 차 향', category: 'Herbal' },
  { id: 'scent-rose', nameKo: '로즈', nameEn: 'Rose', tag: '#우아함', desc: '풍성한 클래식 생화 로즈', category: 'Floral' },
  { id: 'scent-peony', nameKo: '피오니', nameEn: 'Peony', tag: '#순수함', desc: '뽀송하고 수분감 있는 꽃', category: 'Floral' },
  { id: 'scent-jasmine', nameKo: '자스민', nameEn: 'Jasmine', tag: '#관능적', desc: '매혹적이고 화려한 플로럴', category: 'Floral' },
  { id: 'scent-rosemary', nameKo: '로즈마리', nameEn: 'Rosemary', tag: '#아로마', desc: '마음을 편안하게 해주는 허브', category: 'Herbal' },
  { id: 'scent-white-musk', nameKo: '화이트 머스크', nameEn: 'White Musk', tag: '#포근함', desc: '부드러운 살결 잔향', category: 'Musk' },
  { id: 'scent-sandalwood', nameKo: '샌달우드', nameEn: 'Sandalwood', tag: '#우디깊이', desc: '차분하고 고요한 나무', category: 'Woody' },
  { id: 'scent-cedarwood', nameKo: '시더우드', nameEn: 'Cedarwood', tag: '#클래식', desc: '드라이하고 세련된 목재', category: 'Woody' },
  { id: 'scent-white-amber', nameKo: '화이트 앰버', nameEn: 'White Amber', tag: '#따스함', desc: '은은하고 오묘한 앰버', category: 'Musk' },
];
