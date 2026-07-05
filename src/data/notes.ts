import { PerfumeNote } from '../types/perfume';
import { NOTE_TAG_MAP } from './noteTagMap';

// Helper to build note
function createNote(
  id: string,
  type: 'top' | 'middle' | 'base',
  nameEn: string,
  nameKo: string,
  description: string,
  keywords: string[],
  color: string = ''
): PerfumeNote {
  const tags = NOTE_TAG_MAP[nameEn] || { moodTags: [], scentTags: [] };
  return {
    id,
    type,
    nameEn,
    nameKo,
    description,
    keywords,
    color,
    moodTags: tags.moodTags,
    scentTags: tags.scentTags,
    active: true
  };
}

export const NOTES: PerfumeNote[] = [
  // Top Notes
  createNote('top-sweet-orange', 'top', 'Sweet Orange', '스위트 오렌지', '스위한 오렌지 향으로 과일의 껍질 느낌보다 과즙이 느껴지는 향취입니다. 스파이시 노트와 잘 어울립니다.', ['Citurs', 'Sweet', 'Fresh', 'Juicy'], 'Orange'),
  createNote('top-strawberry', 'top', 'Strawberry', '스트로베리', '가벼운 딸기향으로 로즈나 뮤게와도 잘 어울리며 프루티 플로럴 노트에 추천합니다.', ['Sweet', 'Fruity', 'Zammy'], 'red'),
  createNote('top-black-tea', 'top', 'Black Tea', '블랙티', '블랙티의 떫은 취와 맑은 차의 느낌을 가진 향입니다. 대부분이 플로럴과 잘 어울리며 프루티 우디와도 잘 블랜딩 되어 트렌디한 향을 제작 하기 좋습니다.', ['Tea', 'Bitter', 'Watery'], 'brown'),
  createNote('top-eucalyptus', 'top', 'Eucalyptus', '유칼립투스', '코가 뻥 뚤리는 시원함, 청량감 우디하면서 깨끗한 잔향, 초록빛 허브향 입니다.', ['Cineolic aroma wi sweet', 'green', 'camphoraceous'], 'green'),
  createNote('top-citrus-fruit', 'top', 'Citrus fruit', '시트러스 프루트', '가벼운 프루티 노트로 블랜딩한 향입니다.', ['Sweet', 'Citrus', 'Juicy', 'Soda like'], 'Orange'),
  createNote('top-mandarine', 'top', 'Mandarine', '만다린', '오렌지 보다 쌉쌀한 향취가 있으며 잔향에 달콤함이 남는 향입니다.', ['Citrus', 'Fresh', 'Bitter'], 'Orange'),
  createNote('top-pink-peach', 'top', 'Pink Peach', '핑크 피치', '익은 복숭아와 그린 복숭아의 중간 단계의 향으로 가벼운 프루티 향입니다.', ['Sweet', 'Juicy', 'Candy like'], 'Yellow'),
  createNote('top-cheery', 'top', 'Cheery', '체리', '발사믹한 프루티로 바닐라, 발삼 노트와 잘 어울립니다.', ['Sweet', 'Heavy', 'black cherry like'], 'cherry brown'),
  createNote('top-pineapple', 'top', 'Pineapple', '파인애플', '상큼한 파인애플 향으로 탑 노트 사용합니다. 우디의 발향을 도와주고 시원한 향을 낼 수 있습니다.', ['Sweet', 'Creamy', 'Tropical'], 'Yellow'),
  createNote('top-bergamot', 'top', 'Bergamot', '베르가못', '대부분의 노트와 잘 어울립니다. 스윗하고 플로럴한 향취입니다.', ['Citrus', 'Light floral', 'tea like'], 'Yellow'),
  createNote('top-green', 'top', 'Green', '그린', '맑은 그린 노트로 티, 워터리, 퓨어한 향입니다.', ['Pure', 'Tea like', 'Watery', 'Fresh'], 'green'),
  createNote('top-green-tea', 'top', 'Green tea', '그린티', '후제르 노트의 그린감이 느껴지는 그린티로 맑은 느낌보다 아로마틱 향취가 돋보이는 향입니다.', ['Green', 'Herbal', 'Aromatic', 'Fougere', 'Fresh'], 'green'),
  createNote('top-marine', 'top', 'Marine', '마린', '워터리하고 맑은 느낌 과 시원한 향입니다. 자몽과 라임 향과 블렌딩도 잘 어울립니다.', ['Watery', 'Fresh', 'Cucumber like'], 'clear to pale yellow'),
  createNote('top-lime', 'top', 'Lime', '라임', '톡쏘는 느낌과 라임 열매의 스윗한 향취도 있습니다.', ['Citrus', 'Zesty', 'Fresh'], 'Yellow'),
  createNote('top-grapefruit', 'top', 'Grapefruit', '자몽', '핑크자몽같은 스윗함과 후반취에 쌉쌀한 향취가 있습니다.', ['Citrus', 'Zesty', 'Bitter', 'Sweet', 'Ornge like'], 'clear to pale yellow'),
  createNote('top-lemon', 'top', 'Lemon', '레몬', '상큼함과 후반취이 레몬 캔디 같은 향취가 있습니다.', ['Citrus', 'Lemon candy like', 'Zesty'], 'Pale Yellow'),
  createNote('top-apple', 'top', 'Apple', '애플', '달큰 하면서 청량감을 주는 향취 입니다.', ['Green apple', 'Sweet', 'Fresh', 'Green'], 'clean to transparent'),
  createNote('top-spearmint', 'top', 'Spearmint', '스피어민트', '활력을 주고 달큰 하면서 살짝 박하의 느낌의 취향입니다.', ['Sweet', 'Cool', 'Lively', 'Minty green'], 'clean to green'),
  createNote('top-pine', 'top', 'Pine', '파인', '강력하고, 신선하고, 숲의 상록수, 드라이 발사믹한 향입니다. 크리스마스 및 겨울 블렌드를 만드는데 잘 어울립니다.', ['Powerful', 'green', 'fresh', 'forest evergreen', 'dry balsamic', 'terpenic'], 'green'),
  createNote('top-petitgrain', 'top', 'Petitgrain', '페티그레인', '신선하고 잎이 많은 녹색이 가벼운 꽃향입니다. 감귤류 향을 가지고 있어 다양한 블렌드에 유용합니다.', ['Fresh', 'Leafy green', 'lightly floral', 'cirtus'], 'green to orange'),

  // Middle Notes
  createNote('middle-peony', 'middle', 'Peony', '피오니', '맑고 하늘거리는 플로럴 향으로 비누처럼 뽀송하면서도 수분감이 느껴집니다. 대부분 플로럴 노트와 잘 어울려 블렌딩되며 로즈, 뮤게와 블렌딩 시 풍성한 향이 되도록 도와줍니다.', ['Pure', 'Pink', 'Watery', 'Light floral', 'soapy'], 'pink'),
  createNote('middle-hyacinth', 'middle', 'Hyacinth', '하이아신스', '싱그러운 그린플로럴 향에 촉촉한 수분감과 은은한 스파이시함이 더해져 생기 있고 깨끗한 무드를 연출 합니다.', ['Green', 'Fresh', 'Floral', 'Watery', 'Slightly spicy'], 'pink to violet'),
  createNote('middle-lilac', 'middle', 'Lilac', '라일락', '파우더리 하면서 소프트한 꽃 향기로 코튼 향같은 뽀송한 향취입니다.', ['Floral', 'Powdery', 'Cotton'], 'white violet'),
  createNote('middle-violet', 'middle', 'Violet', '바이올렛', '파우더리하고 소프트한 향으로 중성적인 향에도 잘 어울립니다.', ['Powdery', 'Floral', 'Cotton like'], 'Violet'),
  createNote('middle-rose', 'middle', 'Rose', '로즈', '맑은 로즈를 연상시키며 제라늄과 블렌딩할 경우 와일드한 로즈를 만들 수 있다.', ['Floral', 'Rosy', 'Clean'], 'white yellow'),
  createNote('middle-pink-pepper', 'middle', 'Pink pepper', '핑크페퍼', '희미한 플로럴 노트, 드라이한 우디, 약간 스모키한 언더톤이 있는 밝은 페퍼콘향을 가지고 있습니다.', ['Spicy', 'Peppery'], 'red'),
  createNote('middle-rosemary', 'middle', 'Rosemary', '로즈마리', '시원하고 상쾌한 허브향으로 신선한 아로마틱한 향취입니다.', ['Herbal', 'Aromatic', 'Camphorous'], 'green'),
  createNote('middle-cheery-blossom', 'middle', 'cheery blossom', '체리블라썸', '핑크빛이 감도는 플로럴 노트로 영하고 캐주얼한 플로럴 노트로 구성하기 좋습니다. 시트러스 프로티와 잘 어울립니다.', ['Floral', 'Pink', 'Little sweet and sour', 'Ligth floral'], 'None'),
  createNote('middle-ylang-ylang', 'middle', 'Ylang Ylang', '일랑일랑', '강렬한 달콤함 높은 플로럴 과일향, 우디향 스파이시 향 약간의 발사믹 노트가 있는 향입니다.', ['Woody', 'Highly Floral', 'Fruity', 'Sightly balsamic', 'Intensely sweetf'], 'None'),
  createNote('middle-fig', 'middle', 'Fig', '무화과', '코코넛의 크리미함, 리프의 그린감, 열매의 프루티함의 복합적인 향입니다. 우디노트와 잘 어울립니다.', ['Sweet', 'Creamy', 'coconut like'], 'red'),
  createNote('middle-freesia', 'middle', 'Freesia', '프리지아', '밝은 노랑꽃의 산뜻함 따듯한 느낌의 향입니다.', ['Floral', 'Powdery', 'Yellow flower'], 'Yellow'),
  createNote('middle-jasmine', 'middle', 'Jasmine', '자스민', '관능적이고 화려한 플로럴 노트로 로즈, 오랜지블러썸, 뮤게 등 대부분의 꽃과 잘 어울립니다.', ['Floral', 'Animalic', 'Powdery', 'Powerful'], 'Pale Yellow'),
  createNote('middle-chamomile', 'middle', 'Chamomile', '캐모마일', '맑고 단아한 꽃향으로 부드러운 플로럴노트입니다.', ['Mild', 'Light floral', 'Tea like'], 'White, Yellow'),
  createNote('middle-neroli', 'middle', 'Neroli', '네롤리', '강하고 허브, 감귤류, 꽃 향이 난다.', ['Strong', 'Herbaceous', 'Citrusy', 'Floral'], 'White'),
  createNote('middle-orange-blossom', 'middle', 'Orange blossom', '오렌지 블러썸', '밝고 환한 느낌의 플로럴 향으로 관능적인 꽃보다는 어리고 톡톡튀는 이미지에 어울립니다.', ['White Floral', 'Light'], 'Yellow'),
  createNote('middle-geranium', 'middle', 'Geranium', '제라늄', '와일드한 로즈 느낌으로 중성적인 플로럴 노트를 표현하기 좋습니다.', ['Rosy', 'Floral'], 'Pink'),
  createNote('middle-korean-pear', 'middle', 'Korean Pear', '배 향', '웨스턴 페어보다 쥬시하고 플로럴한 배 향으로 플로럴 노트와 잘 어울립니다.', ['Sweet', 'Juicy', 'Light floral'], 'White brown'),
  createNote('middle-blossom-bouquet', 'middle', 'Blossom Bouquet', '블러썸 부케', '꽃다발이 하나로 뭉쳐진 듯한 풍부한 꽃향기이며 여성스럽고 화려한 프로럴 노트입니다.', ['Floral', 'Volume', 'Lily like'], 'white'),
  createNote('middle-muguet', 'middle', 'Muguet', '뮤게', '맑고 워터리한 향으로 릴리 오브 더 밸리 라고도 부릅니다.', ['Watery', 'Pink floral', 'light', 'clean'], 'white'),
  createNote('middle-juniper-berry', 'middle', 'Juniper berry', '주니퍼 베리', '밝고 숲같은 향, 나무, 침엽수, 향신료, 민트 및 꽃과 잘 어울리는 향입니다.', ['Fresh', 'Woody-balsamic', 'slightly sweet'], 'blue'),
  createNote('middle-cypress', 'middle', 'cypress', '사이프러스', '깊은 녹색, 스파이시, 드라이다운에 약간 우디한 상록숲 향입니다. 아로마틱하다.', ['fresh', 'clean', 'deep-green-balsamic'], 'green'),

  // Base Notes
  createNote('base-santal', 'base', 'santal', '상딸', '샌달우드보다 좀 더 밀키한 버전으로 샌달우드와 함께 사용하거나 코코넛과 사용해서 밀키함을 끌어올릴 수 있습니다.', ['sandalwood like', 'creamy', 'woody'], 'brown'),
  createNote('base-white-musk', 'base', 'white musk', '화이트 머스크', '뽀송뽀송하고 부드러운 라스트 향으로 가장 많이 사용되어지는 향료입니다.', ['Musky', 'Powdery', 'cotton'], 'white'),
  createNote('base-white-amber', 'base', 'white amber', '화이트 앰버', '앰버의 부드러움과 머스크 향이 적절히 조화된 향입니다.', ['light woody', 'balsamic'], 'white'),
  createNote('base-black-musk', 'base', 'black musk', '블랙 머스크', '화이트 머스크에 비해 쓴 향취를 가지며 우디함이 어우러진 머스크입니다.', ['musky', 'Cologne like', 'Soapy'], 'black'),
  createNote('base-vanilla', 'base', 'vanilla', '바닐라', '발삼노트의 대표적인 향으로 달콤하고 발사믹한 향입니다.', ['balsamic', 'sweet', 'nutty'], 'Yellow'),
  createNote('base-rosewood', 'base', 'rosewood', '로즈우드', '부드러운 우디 노트로 중성적인 우디 향을 만들 때 많이 사용됩니다.', ['mild floral', 'mild woody'], 'brown'),
  createNote('base-vetiver', 'base', 'vetiver', '베티버', '우디하고 흙의 향취가 있으며, 패출리, 시더우드 등 대부분의 우디노트와 잘 어울립니다.', ['woody', 'dry', 'earthy'], 'Yellow'),
  createNote('base-musk-t', 'base', 'Musk T', '머스크 T', '다른 머스크와 잘 어울리며 비누향, 클린한 향과 잘 어울립니다.', ['powdery', 'clean'], 'white'),
  createNote('base-amber', 'base', 'amber', '앰버', '모든향취를 부드럽게 만들어주는 어코드로 대부분의 향과 잘 어울립니다.', ['resin', 'balsamic', 'sweet', 'warm'], 'Yellow'),
  createNote('base-sandal-wood', 'base', 'sandal wood', '샌달우드', '상딸보다 가벼운 샌달우드 향취입니다.', ['woody', 'lighter than santal', 'animalic'], 'brown'),
  createNote('base-cedar-wood', 'base', 'cedar wood', '시더우드', '시더우드의 드라이함과 발사믹함을 동시에 가지고 있는 어코드입니다.', ['dry', 'woody smoky'], 'gold'),
  createNote('base-oud', 'base', 'oud', '우드', '아가우드의 고급스러움과 차분한 우디 노트를 잘 살린 어코드로 풍부한 우드향입니다.', ['woody', 'musculine'], 'brown'),
  createNote('base-coconut', 'base', 'coconut', '코코넛', '크리미하고 풍부한 코코넛 향으로 우디노트, 프루티 노트와 블렌딩에 사용해보세요.', ['sweet', 'creamy', 'lactonic'], 'white'),
  createNote('base-lychee', 'base', 'lychee', '리치', '달콤하고 풍부한 열대과일 향으로 많은 느낌을 표현할 수 있습니다.', ['sweet', 'juicy', 'pear like'], 'red'),
  createNote('base-champaca', 'base', 'champaca', '참파카', '이국적인 향취로 관능적이거나 풍부한 플로럴 노트를 만들기 좋습니다.', ['flroal', 'soapy'], 'Yellow'),
  createNote('base-leaf', 'base', 'leaf', '리프', '후제르 계열 또는 중성적 향기를 표현하기 좋은 어코드입니다. 모든 계열의 향과 잘 어울립니다.', ['green', 'fougere', 'fresh', 'masculine'], 'green'),
  createNote('base-ginger', 'base', 'ginger', '진저', '레모니한 느낌도 풍부한 생강향기로 시트러스 계열과도 잘 어울립니다.', ['spicy', 'citrus', 'ginger flower like'], 'Yellow'),
  createNote('base-brown-wood', 'base', 'brown wood', '브라운 우드', '우드와 시나몬 바크의 스파이시함이 어우러진 우디 오리엔탈 계열의 어코드입니다.', ['woody', 'warm', 'sweet balsamic'], 'brown'),
  createNote('base-leather', 'base', 'leather', '레더', '드라이하고 스모키하며 우디 노트와 플로럴은 바이올렛과 잘 어울립니다.', ['dry', 'woody', 'smoky'], 'gold'),
  createNote('base-patchouli', 'base', 'patchouli', '패출리', '얼씨하고 우디한 노트로 과량 사용시 한방 향이 날 수 있고 대부분의 향과 잘 어울립니다.', ['earthy', 'woody'], 'green')
];
