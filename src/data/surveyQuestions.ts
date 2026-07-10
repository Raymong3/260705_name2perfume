export type SurveyOption = {
  id: number;
  text: string;
  bonusTags: string[];
  bonusNotes: string[]; // matches nameEn of the note
};

export type SurveyQuestion = {
  id: number;
  question: string;
  options: SurveyOption[];
};

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: 1,
    question: 'Q1. 평소 섬유유연제는 어떤 향을 주로 사용하시나요?',
    options: [
      {
        id: 1,
        text: '깨끗하고 포근한 코튼/다우니향',
        bonusTags: ['포근한', '깨끗한', '파우더리', '편안한'],
        bonusNotes: ['white musk', 'Musk T']
      },
      {
        id: 2,
        text: '은은하고 화사한 플로럴향',
        bonusTags: ['부드러운', '우아한', '로맨틱한', '플로럴'],
        bonusNotes: ['Peony', 'Rose', 'Freesia', 'Jasmine']
      },
      {
        id: 3,
        text: '상큼하고 시원한 시트러스향',
        bonusTags: ['산뜻한', '생동감', '시원한', '시트러스'],
        bonusNotes: ['Lemon', 'Bergamot', 'Citrus fruit', 'Lime']
      },
      {
        id: 4,
        text: '은은하고 묵직한 우디/그린향',
        bonusTags: ['차분한', '깊이감', '우디', '그린'],
        bonusNotes: ['cedar wood', 'sandal wood', 'vetiver', 'cypress']
      },
      {
        id: 5,
        text: '향이 없는 것 또는 잘 모르겠음',
        bonusTags: [],
        bonusNotes: []
      }
    ]
  },
  {
    id: 2,
    question: 'Q2. 당신이 가장 편안함을 느끼는 힐링 공간은 어디인가요?',
    options: [
      {
        id: 1,
        text: '비 온 뒤 촉촉하고 싱그러운 숲속',
        bonusTags: ['그린', '숲', '차분한', '신선한'],
        bonusNotes: ['pine', 'cypress', 'leaf', 'Juniper berry']
      },
      {
        id: 2,
        text: '따뜻한 햇살이 드는 아늑한 카페',
        bonusTags: ['따뜻한', '포근한', '달콤한', '크리미'],
        bonusNotes: ['vanilla', 'santal', 'white amber', 'coconut']
      },
      {
        id: 3,
        text: '책 냄새가 가득한 조용하고 정갈한 서재',
        bonusTags: ['지적인', '단단한', '세련된'],
        bonusNotes: ['Black Tea', 'cedar wood', 'rosewood', 'oud']
      },
      {
        id: 4,
        text: '파도가 치고 바람이 부는 시원한 바다',
        bonusTags: ['시원한', '맑은', '투명한'],
        bonusNotes: ['Marine', 'Eucalyptus', 'Spearmint']
      },
      {
        id: 5,
        text: '다양한 꽃들이 가득 핀 화려한 야외 정원',
        bonusTags: ['화려한', '관능적인', '풍성한'],
        bonusNotes: ['Blossom Bouquet', 'Ylang Ylang', 'Neroli']
      }
    ]
  },
  {
    id: 3,
    question: 'Q3. 오늘 당신이 가장 돋보이고 싶은 매력은 무엇인가요?',
    options: [
      {
        id: 1,
        text: '단정하고 맑고 깨끗한 이미지',
        bonusTags: ['깨끗한', '맑은', '또렷한', '단아한'],
        bonusNotes: ['Muguet', 'white musk', 'Lilac', 'Peony']
      },
      {
        id: 2,
        text: '활기차고 에너제틱하며 생기 넘치는 무드',
        bonusTags: ['활기찬', '자유로운', '생동감', '열대적인'],
        bonusNotes: ['Sweet Orange', 'Grapefruit', 'lychee', 'Strawberry']
      },
      {
        id: 3,
        text: '쉽게 읽히지 않는 깊이 있고 신비로운 매력',
        bonusTags: ['신비로운', '깊이감', '고급스러운', '스파이시'],
        bonusNotes: ['oud', 'black musk', 'patchouli', 'Pink pepper']
      },
      {
        id: 4,
        text: '다정하고 친근하며 부드럽고 따뜻한 인상',
        bonusTags: ['부드러운', '따뜻한', '포근한', '편안한'],
        bonusNotes: ['santal', 'Chamomile', 'vanilla', 'rosewood']
      },
      {
        id: 5,
        text: '세련되고 지적이며 자신감 넘치는 도시적인 스타일',
        bonusTags: ['세련된', '도시적인', '자신감', '지적인'],
        bonusNotes: ['Bergamot', 'Pink pepper', 'cedar wood', 'vanilla']
      }
    ]
  }
];
