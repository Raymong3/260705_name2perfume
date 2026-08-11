import { SejongStory } from '../types/perfume';

export const SEJONG_STORIES: SejongStory[] = [
  // 현대 세종
  {
    id: 'yung_bridge',
    category: 'modern',
    title: '이응다리',
    subtitle: '금강 위를 수놓은 원형의 아름다움',
    description: '금강의 물결 위로 펼쳐진 국내 최초의 원형 보행교, 이응다리입니다. 금강의 맑은 물빛과 현대적인 도시의 빛이 조화를 이루며 시원하고 깨끗한 이미지를 선사합니다.',
    imageDesc: '금강 위로 둥글게 빛나는 이응다리의 곡선과 푸른 강물의 조화',
    imageUrl: '/images/stories/eung_bridge.png',
    bonusTags: ['맑은', '시원한', '세련된', '도시적인', '깨끗한'],
    bonusNotes: ['Marine', 'Lime', 'Bergamot']
  },
  {
    id: 'sejong_lake',
    category: 'modern',
    title: '세종호수공원',
    subtitle: '도심 속 잔잔한 물결과 여유',
    description: '국내 최대 규모의 도심 호수공원으로, 넓게 트인 호숫바람과 따뜻한 햇살 아래 산책을 즐기며 여유를 느끼는 공간입니다. 싱그럽고 평온하며 상쾌한 바람의 느낌을 담았습니다.',
    imageDesc: '은빛 물결이 반짝이는 호수공원의 잔디밭과 맑은 하늘',
    imageUrl: '/images/stories/lake_park.png',
    bonusTags: ['편안한', '산뜻한', '맑은', '자연스러운', '시원한'],
    bonusNotes: ['Muguet', 'Eucalyptus', 'Green']
  },
  {
    id: 'sejong_arboretum',
    category: 'modern',
    title: '국립세종수목원',
    subtitle: '도심 속 초록빛 유리 온실의 싱그러움',
    description: '한국 전통 정원과 웅장한 사계절 전시온실이 어우러져 싱그러운 반려식물들의 숨결이 가득한 수목원입니다. 숲속을 걷는 듯한 풍성한 초록빛 그리너리 향과 화사한 꽃 향을 품고 있습니다.',
    imageDesc: '유리 온실 사이로 쏟아지는 햇살과 푸른 열대 식물들',
    imageUrl: '/images/stories/sejong_arboretum.png',
    bonusTags: ['숲', '그린', '신선한', '풍성한', '따뜻한'],
    bonusNotes: ['cypress', 'Peony', 'leaf']
  },
  // 시간이 쌓인 세종
  {
    id: 'jochiwon',
    category: 'historical',
    title: '조치원',
    subtitle: '조치원 전통시장과 복숭아꽃의 정겨운 향수',
    description: '백년의 역사를 가진 전통시장과 싱그러운 조치원 복숭아꽃이 피어나는 정겨운 고장입니다. 따뜻한 정이 느껴지는 포근함과 향긋하고 달콤한 복숭아 향이 가득합니다.',
    imageDesc: '따스한 햇살 아래 분홍빛으로 탐스럽게 열린 조치원 복숭아밭',
    imageUrl: '/images/stories/jochiwon_peach.png',
    bonusTags: ['달콤한', '포근한', '따뜻한', '친근한', '로맨틱한'],
    bonusNotes: ['Pink Peach', 'white musk', 'Strawberry']
  },
  {
    id: 'jeoni',
    category: 'historical',
    title: '전의',
    subtitle: '왕의 물, 전의초수와 전통의 지혜',
    description: '세종대왕의 안질을 치료했다는 전설적인 탄산 천수 \'전의초수\'와 정갈한 묘목들이 자라나는 역사와 생명의 터전입니다. 차분하고 깨끗하며 깊이 있는 지적인 무드를 선사합니다.',
    imageDesc: '이끼 낀 돌 틈 사이로 용솟음치는 맑고 차가운 탄산 약수터',
    imageUrl: '/images/stories/jeoni_water.png',
    bonusTags: ['지적인', '차분한', '정갈한', '깊이감', '안정감'],
    bonusNotes: ['Black Tea', 'cedar wood', 'Spearmint']
  },
  {
    id: 'geumnam',
    category: 'historical',
    title: '금남',
    subtitle: '유구한 역사와 금강 나루터의 깊은 숲 향기',
    description: '유유히 흐르는 금강 나루터의 옛 정취와 금남면 비학산의 고요한 산자락을 품은 전통적인 고장입니다. 세월의 흐름을 견뎌낸 단단하고 묵직한 우디 향과 대지의 흙 향이 감싸 안아줍니다.',
    imageDesc: '오래된 나무들과 흙바닥 위로 내려앉은 깊고 고요한 숲의 그늘',
    imageUrl: '/images/stories/geumnam_forest.png',
    bonusTags: ['우디', '깊이감', '차분한', '고급스러운', '안정감'],
    bonusNotes: ['sandal wood', 'oud', 'patchouli']
  }
];
