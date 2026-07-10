# Context: 한국어 이름 기반 향수 조합 추천 웹앱

## 0. 핵심 변경 사항

이 웹앱은 실제 운영 시 AI API를 사용하지 않는다.  
모든 추천은 브라우저에서 실행되는 정적 로직과 로컬 향료 데이터만으로 처리한다.

중요 원칙:

1. 같은 이름을 입력하면 항상 같은 향수 조합이 추천되어야 한다.
2. 다른 이름을 입력하면 가능한 한 다른 향수 조합이 추천되어야 한다.
3. 추천은 `향료.md`에 존재하는 향료만 사용한다.
4. 없는 향료를 임의로 만들지 않는다.
5. 이름 분석은 운세, 성명학, 사주처럼 보이면 안 된다.
6. 결과 문장은 “이름에서 느껴지는 이미지 기반의 향 추천”으로 표현한다.
7. 앱은 React + TypeScript + Vite 기반의 프론트엔드 단독 웹앱으로 구현한다.

---

## 1. 프로젝트 개요

사용자가 한국어 이름을 입력하면, 웹앱이 이름의 어감과 문자 구조를 분석하여 향수 조합을 추천한다.

사용 흐름:

1. 사용자가 이름 입력
2. 이름 문자열 정규화
3. 이름을 숫자 시드로 변환
4. 이름의 어감, 모음, 받침, 글자 수를 분석
5. 분석 결과를 감성 태그로 변환
6. `향료.md`에서 불러온 향료 데이터와 태그를 비교
7. Top / Middle / Base 노트를 각각 추천
8. 비율 총합 100%로 레시피 출력

---

## 2. 실제 실행 방식

### 2.1 AI 사용 금지

실제 앱 실행 시에는 OpenAI, Gemini, Claude 같은 AI API를 호출하지 않는다.

아래 기능은 모두 브라우저 내부에서 동작해야 한다.

- 이름 분석
- 감성 태그 생성
- 향료 점수 계산
- 향료 선택
- 비율 계산
- 결과 문장 생성

### 2.2 데이터 저장 방식

초기 MVP에서는 향료 데이터를 TypeScript 상수 또는 JSON으로 관리한다.

권장 파일:

```txt
src/data/notes.ts
src/data/noteTags.ts
src/logic/normalizeName.ts
src/logic/nameSeed.ts
src/logic/analyzeName.ts
src/logic/recommendPerfume.ts
src/logic/calculateRatio.ts
src/logic/generateResultText.ts
```

---

## 3. 향료 데이터 기준

향료 데이터는 `향료.md`를 기준으로 한다.

현재 `향료.md`에는 다음 구조가 있다.

- Top Notes
- Middle Notes
- Base Notes

각 향료는 다음 정보를 가진다.

```ts
type NoteType = 'top' | 'middle' | 'base';

type PerfumeNote = {
  id: string;
  type: NoteType;
  nameEn: string;
  nameKo?: string;
  description: string;
  keywords: string[];
  color?: string;
  moodTags: string[];
  scentTags: string[];
};
```

### 3.1 주의

초기 기획에서는 Top 14개, Middle 20개, Base 14개라고 했으나, 현재 업로드된 `향료.md`에는 더 많은 향료가 포함되어 있다.

개발 시에는 `향료.md`에 있는 전체 향료를 사용하되, 나중에 최종 운영 향료 수를 14 / 20 / 14로 제한해야 할 경우 `active: true | false` 필드로 제어한다.

```ts
const note = {
  id: 'top-sweet-orange',
  type: 'top',
  nameEn: 'Sweet Orange',
  active: true
};
```

추천 알고리즘은 `active === true`인 향료만 사용한다.

---

## 4. 조합 규칙

향수 조합은 반드시 다음 조건을 만족해야 한다.

1. Top Notes는 최소 1개 이상 포함한다.
2. Middle Notes는 최소 1개 이상 포함한다.
3. Base Notes는 최소 1개 이상 포함한다.
4. 각 노트 그룹별 최대 선택 개수는 3개이며, 기본적으로는 1개를 추천하는 것을 우선으로 분배한다.
5. 한 레시피 안에서 같은 향료가 중복 선택되면 안 된다.
6. 단일 조합이 아닌 서로 다른 3가지 조합(레시피)을 생성하며, 가장 점수가 높은(어울리는) 조합부터 순서대로(1순위, 2순위, 3순위) 정렬하여 제공한다.
7. 총 향료 개수는 최소 3개에서 최대 9개 사이를 만족하도록 조율한다.
8. 총 비율은 항상 100%여야 한다.

---

## 5. 같은 이름은 같은 추천이 나오게 하는 방식

### 5.1 정규화

입력 이름은 추천 전에 반드시 정규화한다.

```ts
export function normalizeName(input: string) {
  return input
    .trim()
    .replace(/\s+/g, '')
    .normalize('NFC');
}
```

예:

```txt
김 민 수 → 김민수
김민수  → 김민수
```

### 5.2 시드 생성

정규화된 이름을 숫자 시드로 변환한다.

반드시 같은 문자열은 같은 숫자를 반환해야 한다.

```ts
export function hashNameToSeed(name: string): number {
  let hash = 2166136261;

  for (let i = 0; i < name.length; i++) {
    hash ^= name.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}
```

### 5.3 시드 기반 난수 함수

Math.random()을 직접 사용하지 않는다.  
Math.random()은 실행할 때마다 값이 달라져서 같은 이름의 결과가 바뀔 수 있다.

```ts
export function seededRandom(seed: number) {
  let value = seed >>> 0;

  return function random() {
    value += 0x6D2B79F5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

이 방식으로 추천하면:

- `이해성`은 항상 같은 추천
- `이해선`은 다른 추천
- 새로고침해도 결과 유지
- 서버나 AI 없이 브라우저에서 작동

---

## 6. 이름 분석 로직

이름 분석은 확정적 규칙 기반으로 한다.

### 6.1 분석 대상

- 글자 수
- 초성
- 중성, 즉 모음
- 종성, 즉 받침
- 받침 개수
- 밝은 모음 비율
- 차분한 모음 비율
- 맑은 모음 비율
- 이름 전체의 소리감

### 6.2 한글 분해 함수

```ts
const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const JONG = ['', 'ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

export function decomposeHangul(char: string) {
  const code = char.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return null;

  const cho = Math.floor(code / 588);
  const jung = Math.floor((code % 588) / 28);
  const jong = code % 28;

  return {
    cho: CHO[cho],
    jung: JUNG[jung],
    jong: JONG[jong],
    hasFinal: jong !== 0
  };
}
```

### 6.3 감성 태그 규칙

```ts
const VOWEL_TAG_RULES = {
  bright: {
    vowels: ['ㅏ', 'ㅑ', 'ㅗ', 'ㅛ', 'ㅘ'],
    tags: ['밝은', '생동감', '산뜻한', '따뜻한']
  },
  calm: {
    vowels: ['ㅓ', 'ㅕ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅝ'],
    tags: ['차분한', '안정감', '깊이감', '부드러운']
  },
  clear: {
    vowels: ['ㅣ', 'ㅐ', 'ㅔ', 'ㅚ', 'ㅟ', 'ㅢ'],
    tags: ['맑은', '세련된', '깨끗한', '투명한', '지적인']
  }
};
```

받침 규칙:

```ts
const FINAL_SOUND_RULES = {
  manyFinals: ['단단한', '안정감', '깊이감'],
  fewFinals: ['부드러운', '산뜻한', '맑은'],
  nasalFinals: ['편안한', '포근한'], // ㄴ, ㅁ, ㅇ
  sharpFinals: ['또렷한', '개성', '자신감'] // ㄱ, ㄷ, ㅂ, ㅅ, ㅈ, ㅊ, ㅋ, ㅌ, ㅍ
};
```

글자 수 규칙:

```ts
const LENGTH_RULES = {
  2: ['간결한', '또렷한'],
  3: ['균형감', '자연스러운'],
  4: ['개성', '서사성']
};
```

---

## 7. 향료 태그 매핑 방향

향료는 `향료.md`의 설명, 키워드, 컬러를 기준으로 감성 태그를 부여한다.

예:

```ts
{
  id: 'top-bergamot',
  type: 'top',
  nameEn: 'Bergamot',
  description: '대부분의 노트와 잘 어울립니다. 스윗하고 플로럴한 향취입니다.',
  keywords: ['Citrus', 'Light floral', 'tea like'],
  color: 'Yellow',
  moodTags: ['밝은', '세련된', '산뜻한', '맑은'],
  scentTags: ['시트러스', '플로럴', '티']
}
```

### 7.1 향료별 추천 태그 예시

아래 태그는 개발 초기값으로 사용한다.  
나중에 공방 운영자가 향료 감각에 맞게 조정할 수 있어야 한다.

#### Top Notes

- Sweet Orange: 밝은, 따뜻한, 생동감, 산뜻한, 달콤한
- Strawberry: 귀여운, 로맨틱한, 달콤한, 생동감
- Black Tea: 지적인, 세련된, 차분한, 깊이감
- Eucalyptus: 깨끗한, 시원한, 맑은, 자유로운
- Citrus fruit: 밝은, 산뜻한, 생동감, 귀여운
- Mandarine: 밝은, 산뜻한, 쌉쌀한, 따뜻한
- Pink Peach: 부드러운, 귀여운, 로맨틱한, 달콤한
- Cheery: 개성, 달콤한, 깊이감, 신비로운
- Pineapple: 밝은, 자유로운, 생동감, 열대적인
- Bergamot: 세련된, 맑은, 산뜻한, 균형감
- Green: 맑은, 깨끗한, 투명한, 차분한
- Green tea: 차분한, 지적인, 아로마틱, 깨끗한
- Marine: 맑은, 투명한, 시원한, 깨끗한
- Lime: 산뜻한, 또렷한, 생동감, 시원한
- Grapefruit: 세련된, 산뜻한, 쌉쌀한, 밝은
- Lemon: 밝은, 깨끗한, 산뜻한, 또렷한
- Apple: 맑은, 귀여운, 산뜻한, 생동감
- Spearmint: 시원한, 활력, 자유로운, 깨끗한
- Pine: 단단한, 숲, 신선한, 깊이감
- Petitgrain: 그린, 세련된, 자연스러운, 산뜻한

#### Middle Notes

- Peony: 부드러운, 맑은, 우아한, 깨끗한
- Hyacinth: 생동감, 깨끗한, 그린, 세련된
- Lilac: 부드러운, 포근한, 파우더리, 깨끗한
- Violet: 중성적인, 부드러운, 파우더리, 세련된
- Rose: 우아한, 로맨틱한, 깨끗한, 여성스러운
- Pink pepper: 자신감, 개성, 세련된, 스파이시
- Rosemary: 지적인, 깨끗한, 아로마틱, 신선한
- cheery blossom: 귀여운, 로맨틱한, 밝은, 캐주얼
- Ylang Ylang: 화려한, 관능적인, 달콤한, 깊이감
- Fig: 부드러운, 크리미, 자연스러운, 개성
- Freesia: 밝은, 따뜻한, 산뜻한, 부드러운
- Jasmine: 화려한, 우아한, 관능적인, 깊이감
- Chamomile: 차분한, 부드러운, 단아한, 편안한
- Neroli: 밝은, 세련된, 허브, 플로럴
- Orange blossom: 밝은, 귀여운, 산뜻한, 플로럴
- Geranium: 중성적인, 로맨틱한, 자연스러운, 플로럴
- Korean Pear: 맑은, 산뜻한, 달콤한, 부드러운
- Blossom Bouquet: 화려한, 우아한, 풍성한, 여성스러운
- Muguet: 맑은, 깨끗한, 투명한, 부드러운
- Juniper berry: 숲, 신선한, 중성적인, 시원한
- cypress: 차분한, 숲, 아로마틱, 단단한

#### Base Notes

- santal: 부드러운, 크리미, 우디, 따뜻한
- white musk: 포근한, 깨끗한, 부드러운, 파우더리
- white amber: 부드러운, 따뜻한, 안정감, 고급스러운
- black musk: 세련된, 중성적인, 깊이감, 쌉쌀한
- vanilla: 달콤한, 따뜻한, 포근한, 부드러운
- rosewood: 부드러운, 중성적인, 우디, 안정감
- vetiver: 단단한, 차분한, 깊이감, 우디
- Musk T: 깨끗한, 포근한, 파우더리, 편안한
- amber: 따뜻한, 안정감, 깊이감, 고급스러운
- sandal wood: 우디, 차분한, 부드러운, 안정감
- cedar wood: 단단한, 우디, 드라이, 세련된
- oud: 고급스러운, 깊이감, 차분한, 단단한
- coconut: 달콤한, 크리미, 부드러운, 열대적인
- lychee: 달콤한, 생동감, 귀여운, 산뜻한
- champaca: 화려한, 관능적인, 플로럴, 고급스러운
- leaf: 중성적인, 그린, 깨끗한, 자유로운
- ginger: 스파이시, 산뜻한, 생동감, 또렷한
- brown wood: 따뜻한, 깊이감, 우디, 고급스러운
- leather: 단단한, 스모키, 개성, 고급스러운
- patchouli: 깊이감, 우디, 얼씨, 차분한

---

## 8. 추천 알고리즘

### 8.1 입력

```ts
type SurveyAnswers = {
  q1: number; // 1 ~ 5
  q2: number; // 1 ~ 5
  q3: number; // 1 ~ 5
};

type RecommendInput = {
  name: string;
  surveyAnswers: SurveyAnswers;
};
```

### 8.2 처리 단계

1. **1단계**: 이름 입력 및 정규화
2. **2단계**: 3가지 질문(5지선다)에 대한 답변 입력
3. 이름을 시드로 변환 및 시드 기반 난수 함수 생성
4. 이름 어감 분석으로 기초 감성 태그 생성
5. 설문 응답 정보를 기반으로 각 질문의 선호 향료/태그 가중치를 합산
6. 향료별 종합 점수 계산 (이름 분석 점수 + 설문 선호도 가중치)
7. 각 노트 그룹(Top, Middle, Base)에서 점수 높은 향료 후보군 추출
8. 시드 다원화(예: `seed + offset` 또는 서로 다른 난수 노이즈 적용)를 통해 3개의 고유한 대안 레시피 세트를 생성
9. 각 레시피의 총 매칭 점수 합계를 기준으로 가장 어울리는 순서(1순위, 2순위, 3순위)대로 정렬하여 3가지 조합 출력
10. 각 레시피별 최종 비율 계산 및 결과 설명 문장 생성

---

## 9. 향료 점수 계산

향료 점수는 다음 요소를 합산한다.

```ts
type ScoreInput = {
  note: PerfumeNote;
  analysisTags: string[];
  seedRandomValue: number;
};
```

점수 기준:

1. 이름 분석 태그와 향료 moodTags가 일치하면 +10
2. 이름 분석 태그와 향료 scentTags가 관련 있으면 +5
3. 이름의 대표 이미지와 향료 컬러가 어울리면 +3
4. 같은 점수끼리는 seed 기반 noise를 0~2점 더해 정렬

```ts
export function scoreNote(note: PerfumeNote, analysisTags: string[], rand: () => number) {
  let score = 0;

  for (const tag of analysisTags) {
    if (note.moodTags.includes(tag)) score += 10;
    if (note.scentTags.includes(tag)) score += 5;
  }

  score += rand() * 2;
  return score;
}
```

주의:

- `Math.random()` 사용 금지
- 같은 이름이면 rand() 순서도 같아야 함
- 정렬 전 데이터 순서를 항상 고정해야 함

---

## 10. 다른 이름이면 다른 추천이 나오게 하는 방법

이름 분석 태그만으로 추천하면 비슷한 이름이 같은 향료를 받을 가능성이 높다.  
따라서 최종 선택에는 반드시 시드를 반영한다.

### 10.1 권장 방식

1. 향료 점수 상위 30~50%를 후보군으로 만든다.
2. 후보군 안에서 시드 기반 shuffle을 한다.
3. shuffle된 후보 중 필요한 개수만 선택한다.

```ts
export function pickNotesBySeed(notes: PerfumeNote[], count: number, rand: () => number) {
  return [...notes]
    .map(note => ({ note, sort: rand() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, count)
    .map(item => item.note);
}
```

하지만 무작위만 쓰면 이름 감성과 무관해질 수 있으므로 다음처럼 한다.

```ts
const sorted = notes
  .map(note => ({ note, score: scoreNote(note, analysis.tags, rand) }))
  .sort((a, b) => b.score - a.score);

const candidateCount = Math.max(count + 3, Math.ceil(sorted.length * 0.4));
const candidates = sorted.slice(0, candidateCount);
const selected = pickNotesBySeed(candidates.map(c => c.note), count, rand);
```

이렇게 하면:

- 이름 감성에 맞는 후보군 안에서 고름
- 같은 이름은 같은 결과
- 다른 이름은 시드가 달라져 결과가 달라짐

---

## 11. 추천 개수 결정

각 노트별 추천 향료 개수는 시드 기반으로 결정한다.

범위:

```ts
const TOP_COUNT_RANGE = [1, 3];
const MIDDLE_COUNT_RANGE = [1, 3];
const BASE_COUNT_RANGE = [1, 3];
```

기본적으로는 **1개 추천**을 유도하기 위해 난수 분포의 가중치를 조절한다.
예를 들어, 난수 `r` (0~1)에 대해:
- `r < 0.65`: 1개
- `0.65 <= r < 0.90`: 2개
- `r >= 0.90`: 3개

이를 통해 대부분의 노트에서 기본 1개가 골고루 매칭되고, 간헐적으로 2~3개의 향료가 조화롭게 제안되도록 유도한다.

---

## 12. 비율 계산

기본 비율:

- Top: 25%
- Middle: 45%
- Base: 30%

향료 수에 따라 각 그룹 안에서 비율을 나눈다.

대표 향료에 조금 더 비중을 줄 수 있다.

예:

```ts
type RecipeRatio = {
  note: PerfumeNote;
  ratio: number;
};
```

권장 로직:

1. 그룹별 총 비율을 정한다.
2. 각 그룹에서 첫 번째 향료에 가중치를 1.2 부여한다.
3. 나머지는 1.0으로 둔다.
4. 정수 반올림 후 전체 합이 100이 되도록 마지막 향료에서 보정한다.

```ts
const GROUP_RATIO = {
  top: 25,
  middle: 45,
  base: 30
};
```

---

## 13. 결과 문장 생성

결과 문장도 AI 없이 템플릿 기반으로 만든다.

### 13.1 이름 분석 문장

```ts
const imageTemplates = [
  '{name}이라는 이름에서는 {tag1} 인상과 {tag2} 분위기가 먼저 느껴집니다.',
  '{name}은 {tag1} 느낌을 중심으로, 뒤에 {tag2} 결이 은은하게 남는 이름입니다.',
  '{name}이라는 소리는 {tag1} 이미지와 {tag2} 무드를 함께 가지고 있습니다.'
];
```

템플릿 선택도 시드 기반으로 한다.

### 13.2 향수 콘셉트 문장

```ts
const conceptTemplates = [
  '{topMood} 첫인상으로 시작해 {middleMood} 중심을 지나, {baseMood} 잔향으로 마무리되는 향',
  '처음에는 {topMood} 열리고, 중심에는 {middleMood} 분위기가 자리 잡으며, 마지막에는 {baseMood} 여운이 남는 향',
  '{name}의 이미지에 맞춰 {topMood} 느낌과 {middleMood} 결, {baseMood} 깊이를 함께 담은 향'
];
```

---

## 14. 출력 예시

```txt
이름: 이해성

이름 이미지
- 맑은
- 세련된
- 차분한

향수 콘셉트
맑은 첫인상으로 시작해 차분한 중심을 지나, 부드러운 우디 잔향으로 마무리되는 향

Top Notes
- Bergamot 13%
- Green 12%

Middle Notes
- Muguet 16%
- Chamomile 15%
- Rosemary 14%

Base Notes
- white amber 16%
- rosewood 15%

설명
이 이름은 맑고 지적인 인상이 먼저 느껴져, 첫 향은 투명하고 산뜻하게 열리도록 구성했습니다. 중심에는 차분한 플로럴과 허브 느낌을 두고, 마지막에는 부드러운 우디와 앰버감으로 안정감 있게 마무리합니다.
```

---

## 15. UI 구성

### 메인 화면

- 앱 제목
- 짧은 설명
- 이름 입력창
- 추천받기 버튼

### 결과 화면

- 입력한 이름
- 이름 이미지 분류 카드
- 향수 콘셉트 카드
- Top / Middle / Base 조합 카드
- 비율 표시
- 향 설명 문장
- 다시 입력하기 버튼

### 결과 카드 구성

각 향료는 다음처럼 표시한다.

```txt
Bergamot 13%
시트러스 / 라이트 플로럴 / 티 느낌
선택 이유: 이름의 맑고 세련된 이미지와 잘 어울립니다.
```

---

## 16. 파일 구조

```txt
src/
  app/
    App.tsx
  components/
    NameInput.tsx
    ResultCard.tsx
    NoteSection.tsx
    RatioBar.tsx
    TagBadge.tsx
  data/
    notes.ts
    noteTagMap.ts
    resultTemplates.ts
  logic/
    normalizeName.ts
    nameSeed.ts
    decomposeHangul.ts
    analyzeName.ts
    scoreNote.ts
    recommendPerfume.ts
    calculateRatio.ts
    generateResultText.ts
  types/
    perfume.ts
  styles/
    index.css
```

---

## 17. 주요 타입

```ts
export type NoteType = 'top' | 'middle' | 'base';

export type PerfumeNote = {
  id: string;
  type: NoteType;
  nameEn: string;
  nameKo?: string;
  description: string;
  keywords: string[];
  color?: string;
  moodTags: string[];
  scentTags: string[];
  active: boolean;
};

export type NameAnalysis = {
  normalizedName: string;
  seed: number;
  imageTags: string[];
  moodTags: string[];
  description: string;
};

export type RecommendedNote = {
  note: PerfumeNote;
  ratio: number;
  reason: string;
};

export type PerfumeRecipe = {
  name: string;
  analysis: NameAnalysis;
  concept: string;
  top: RecommendedNote[];
  middle: RecommendedNote[];
  base: RecommendedNote[];
  description: string;
};
```

---

## 18. 검증 조건

추천 결과 생성 후 반드시 검증한다.

```ts
function validateRecipe(recipe: PerfumeRecipe) {
  const topCount = recipe.top.length;
  const middleCount = recipe.middle.length;
  const baseCount = recipe.base.length;

  if (topCount < 1 || middleCount < 1 || baseCount < 1) return false;
  if (topCount > 5 || middleCount > 5 || baseCount > 5) return false;

  const total = [...recipe.top, ...recipe.middle, ...recipe.base]
    .reduce((sum, item) => sum + item.ratio, 0);

  if (total !== 100) return false;

  const ids = [...recipe.top, ...recipe.middle, ...recipe.base].map(item => item.note.id);
  if (new Set(ids).size !== ids.length) return false;

  return true;
}
```

---

## 19. 개발 시 주의사항

- 결과가 운세처럼 보이면 안 된다.
- “이 이름은 이런 사람입니다”라고 단정하지 않는다.
- “이 이름에서 이런 이미지가 느껴집니다”라고 표현한다.
- AI API 없이 완전히 정적 웹앱으로 동작해야 한다.
- `Math.random()`을 사용하지 않는다.
- 같은 이름의 추천 결과는 localStorage 저장 없이도 동일해야 한다.
- 향료 데이터는 반드시 `향료.md` 기반으로 만든다.
- 향료가 추가되거나 삭제되어도 추천 로직이 깨지지 않게 한다.
- 향료 수가 부족한 경우에도 최소 조건을 만족하도록 fallback을 둔다.

---

## 20. Antigravity 개발 지시 요약

Antigravity는 이 문서를 기준으로 웹앱을 구현한다.

핵심 구현 조건:

1. React + TypeScript + Vite 사용
2. 백엔드 없이 프론트엔드 단독 실행
3. AI API 호출 금지
4. `향료.md`를 참고하여 `src/data/notes.ts` 생성
5. 이름은 `normalizeName()`으로 정규화
6. 이름은 `hashNameToSeed()`로 숫자 시드 변환
7. 모든 랜덤성은 `seededRandom()`으로만 처리
8. 같은 이름은 항상 같은 향 추천
9. 다른 이름은 시드 차이로 다른 조합이 나오게 구현
10. Top / Middle / Base 최소 1개 이상
11. 각 그룹 최대 5개
12. 총 비율 100%
13. 추천 결과 검증 함수 포함
14. 모바일 반응형 UI 적용
15. 결과 문장은 템플릿 기반으로 생성

---

## 21. MVP 범위

1차 MVP:

- 이름 입력
- 이름 감성 분석
- 같은 이름 고정 추천
- 다른 이름 다른 추천
- Top / Middle / Base 향료 조합 출력
- 비율 출력
- 선택 이유 출력
- 모바일 반응형 UI

MVP 이후:

- 관리자 향료 편집 화면
- 향료 active on/off
- 결과 이미지 저장
- 상담 기록 저장
- 고객명별 결과 저장
- 클래스용 태블릿 모드

---

## 22. 향료.md 원본 참고

아래 파일의 정보를 기반으로 `src/data/notes.ts`를 만든다.

```md
# 향료.md


## Top Notes

### Sweet Orange
- 설명: 스위한 오렌지 향으로  과일의 껍질 느낌보다 과즙이 느껴지는 향취입니다. 스파이시 노트와 잘 어울립니다.
- 키워드: Citurs, Sweet, Fresh, Juicy
- 컬러: Orange

### Strawberry
- 설명: 가벼운 딸기향으로 로즈나 뮤게와도 잘 어울리며 프루티 플로럴 노트에 추천합니다.
- 키워드: Sweet, Fruity, Zammy
- 컬러: red

### Black Tea
- 설명: 블랙티의  떫은 취와 맑은 차의 느낌을 가진 향입니다. 대부분이 플로럴과 잘 어울리며 프루티 우디와도 잘 블랜딩 되어 트렌디한 향을 제작 하기 좋습니다.
- 키워드: Tea, Bitter, Watery
- 컬러: brown

### Eucalyptus
- 설명: 코가 뻥 뚤리는 시원함, 청량감 우디하면서 깨끗한 잔향, 초록빛 허브향 입니다. 
- 키워드: Cineolic aroma wi sweet, green, camphoraceous
- 컬러: green

### Citrus fruit
- 설명: 가벼운 프루티 노트로 블랜딩한 향입니다.
- 키워드: Sweet, Citrus, Juicy, Soda like
- 컬러: Orange

### Mandarine
- 설명: 오렌지 보다 쌉쌀한 향취가 있으며 잔향에 달콤함이 남는 향입니다.
- 키워드: Citrus, Fresh, Bitter
- 컬러: Orange

### Pink Peach
- 설명: 익은 복숭아와 그린 복숭아의 중간 단계의 향으로 가벼운 프루티 향입니다.
- 키워드: Sweet, Juicy, Candy like
- 컬러: Yellow

### Cheery
- 설명: 발사믹한 프루티로 바닐라, 발삼 노트와 잘 어울립니다.
- 키워드: Sweet, Heavy, black cherry like
- 컬러: cherry brown

### Pineapple
- 설명: 상큼한  파인애플 향으로 탑 노트 사용합니다. 우디의 발향을 도와주고 시원한 향을 낼 수 있습니다.
- 키워드: Sweet, Creamy, Tropical
- 컬러: Yellow

### Bergamot
- 설명: 대부분의 노트와 잘 어울립니다. 스윗하고 플로럴한 향취입니다.
- 키워드: Citrus, Light floral, tea like
- 컬러: Yellow

### Green
- 설명: 맑은 그린 노트로 티, 워터리, 퓨어한 향입니다.
- 키워드: Pure, Tea like, Watery, Fresh
- 컬러: green

### Green tea
- 설명: 후제르 노트의 그린감이 느껴지는 그린티로 맑은 느낌보다 아로마틱 향취가 돋보이는 향입니다.
- 키워드: Green, Herbal, Aromatic, Fougere, Fresh
- 컬러: green

### Marine
- 설명: 워터리하고 맑은 느낌 과 시원한 향입니다. 자몽과 라임 향과 블렌딩도 잘 어울립니다.
- 키워드: Watery, Fresh,  Cucumber like
- 컬러: clear to pale yellow

### Lime
- 설명: 톡쏘는 느낌과 라임 열매의 스윗한 향취도 있습니다.
- 키워드: Citrus, Zesty, Fresh
- 컬러: Yellow

### Grapefruit
- 설명: 핑크자몽같은 스윗함과 후반취에 쌉쌀한 향취가 있습니다.
- 키워드: Citrus, Zesty, Bitter, Sweet, Ornge like
- 컬러: clear to pale yellow

### Lemon
- 설명: 상큼함과 후반취이 레몬 캔디 같은 향취가 있습니다.
- 키워드: Citrus, Lemon candy like, Zesty
- 컬러: Pale Yellow

### Apple
- 설명: 달큰 하면서 청량감을 주는 향취 입니다.
- 키워드: Green apple, Sweet, Fresh, Green
- 컬러: clean to transparent

### Spearmint
- 설명: 활력을 주고 달큰 하면서 살짝 박하의 느낌의 취향입니다.
- 키워드: Sweet, Cool, Lively, Minty green
- 컬러: clean to green

### Pine 
- 설명: 강력하고, 신선하고, 숲의 상록수, 드라이 발사믹한 향입니다. 크리스마스 및 겨울 블렌드를 만드는데 잘 어울립니다.
- 키워드: Powerful, green, fresh, forest evergreen, dry balsamic, terpenic
- 컬러: green

### Petitgrain
- 설명: 신선하고 잎이 많은 녹색이 가벼운 꽃향입니다. 감귤류 향을 가지고 있어 다양한 블렌드에 유용합니다.
- 키워드: Fresh, Leafy green, lightly floral, cirtus
- 컬러: green to orange


## Middle Notes

### Peony
- 설명: 말고 하늘거리는 플로럴 향으로 비누처럼 뽀송하면서도 수분감이 느껴집니다. 대부분 플로럴 노트와 잘 어울려 블렌딩되며 로즈, 뮤게와 블렌딩 시 풍성한 향이 되도록 도와줍니다.
- 키워드: Pure, Pink, Watery, Light floral, soapy
- 컬러: pink

### Hyacinth
- 설명: 싱그러운 그린플로럴 향에 촉촉한 수분감과 은은한 스파이시함이 더해져 생기 있고 깨끗한 무드를 연출 합니다.
- 키워드: Green, Fresh, Floral, Watery, Slightly spicy
- 컬러: pink to violet

### Lilac
- 설명: 파우더리 하면서 소프트한 꽃 향기로 코튼 향같은 뽀송한 향취입니다.
- 키워드: Floral, Powdery, Cotton
- 컬러: white violet

### Violet
- 설명: 파우더리하고 소프트한 향으로 중성적인 향에도 잘 어울립니다.
- 키워드: Powdery, Floral, Cotton like
- 컬러: Violet

### Rose
- 설명: 맑은 로즈를 연상시키며 제라늄과 블렌딩할 경우 와일드한 로즈를 만들 수 있다.
- 키워드: Floral, Rosy, Clean
- 컬러: white yellow

### Pink pepper
- 설명: 희미한 플로럴 노트, 드라이한 우디, 약간 스모키한 언더톤이 있는 밝은 페퍼콘향을 가지고 있습니다.
- 키워드: Spicy Peppery
- 컬러: red

### Rosemary
- 설명: 시원하고 상쾌한 허브향으로 신선한 아로마틱한 향취입니다.
- 키워드: Herbal, Aromatic, Camphorous
- 컬러: green

### cheery blossom
- 설명: 핑크빛이 감도는 플로럴 노트로 영하고 캐주얼한 플로럴 노트로 구성하기 좋습니다. 시트러스 프로티와 잘 어울립니다.
- 키워드: Floral, Pink, Little sweet and sour, Ligth floral
- 컬러: None

### Ylang Ylang
- 설명: 강렬한 달콤함 높은 플로럴 과일향, 우디향 스파이시 향 약간의 발사믹 노트가 있는 향입니다. 
- 키워드: Woody, Highly Floral, Fruity, Sightly balsamic, Intensely sweetf
- 컬러: None

### Fig
- 설명: 코코넛의 크리미함, 리프의 그린감, 열매의 프루티함의 복합적인 향입니다. 우디노트와 잘 어울립니다.
- 키워드: Sweet, Creamy, coconut like
- 컬러: red

### Freesia
- 설명: 밝은 노랑꽃의 산뜻함 따듯한 느낌의 향입니다.
- 키워드: Floral, Powdery, Yellow flower
- 컬러: Yellow

### Jasmine
- 설명: 관능적이고 화려한 플로럴 노트로 로즈, 오랜지블러썸, 뮤게 등 대부분의 꽃과 잘 어울립니다.
- 키워드: Floral, Animalic, Powdery, Powerful
- 컬러: Pale Yellow

### Chamomile
- 설명: 맑고 단아한 꽃향으로 부드러운 플로럴노트입니다.
- 키워드: Mild, Light floral, Tea like
- 컬러: White, Yellow

### Neroli
- 설명: 강하고 허브, 감귤류, 꽃 향이 난다.
- 키워드: Strong, Herbaceous, Citrusy, Floral
- 컬러: White

### Orange blossom
- 설명: 밝고 환한 느낌의 플로럴 향으로 관능적인 꽃보다는 어리고 톡톡튀는 이미지에 어울립니다.
- 키워드: White Floral, Light
- 컬러: Yellow

### Geranium
- 설명: 와일드한 로즈 느낌으로 중성적인 플로럴 노트를 표현하기 좋습니다.
- 키워드: Rosy, Floral
- 컬러: Pink

### Korean Pear
- 설명: 웨스턴 페어보다 쥬시하고 플로럴한 배 향으로 플로럴 노트와 잘 어울립니다.
- 키워드: Sweet, Juicy, Light floral
- 컬러: White brown

### Blossom Bouquet
- 설명: 꽃다발이 하나로 뭉쳐진 듯한 풍부한 꽃향기이며 여성스럽고 화려한 프로럴 노트입니다.
- 키워드: Floral, Volume, Lily like
- 컬러: white

### Muguet
- 설명: 맑고 워터리한 향으로 릴리 오브 더 밸리 라고도 부릅니다.
- 키워드: Watery, Pink floral, light, clean
- 컬러: white

### Juniper berry
- 설명: 밝고 숲같은 향, 나무, 침엽수, 향신료, 민트 및 꽃과 잘 어울리는 향입니다.
- 키워드: Fresh, Woody-balsamic, slightly sweet
- 컬러: blue

### cypress
- 설명: 깊은 녹색, 스파이시, 드라이다운에 약간 우디한 상록숲 향입니다. 아로마틱하다.
- 키워드: fresh, clean, deep-green-balsamic
- 컬러: green


## Base Notes

### santal
- 설명: 샌달우드보다 좀 더 밀키한 버전으로 샌달우드와 함께 사용하거나 코코넛과 사용해서 밀키함을 끌어올릴 수 있습니다.
- 키워드: sandalwood like, creamy, woody
- 컬러: brown

### white musk
- 설명: 뽀송뽀송하고 부드러운 라스트 향으로 가장 많이 사용되어지는 향료입니다.
- 키워드: Musky Powery, cotton
- 컬러: white

### white amber
- 설명: 엠버의 부드러움과 머스크 향이 적절히 조화된 향입니다.
- 키워드: light woody, balsamic
- 컬러: white

### black musk 
- 설명: 화이트 머스크에 비해 쓴 향취를 가지며 우디함이 어우러진 머스크입니다.
- 키워드: musky, Cologne like, Soapy
- 컬러: black

### vanilla
- 설명: 발삼노트의 대표적인 향으로 달콤하고 발사믹한 향입니다.
- 키워드: balsamic, sweet, nutty
- 컬러: Yellow

### rosewood
- 설명: 부드러운 우디 노트로 중성적인 우디 향을 만들 때 많이 사용됩니다.
- 키워드: mild floral, mild woody
- 컬러: brown

### vetiver
- 설명: 우디하고 흙의 향취가 있으며, 패출리, 시더우드 등 대부분의 우디노트와 잘 어울립니다.
- 키워드: woody, dry, earthy
- 컬러: Yellow

### Musk T
- 설명: 다른 머스크와 잘 어울리며 비누향, 클린한 향과 잘 어울립니다.
- 키워드: powdery, clean
- 컬러: white

### amber
- 설명: 모든향취를 부드럽게 만들어주는 어코드로 대부분의 향과 잘 어울립니다.
- 키워드: resin, balsamic, sweet, warm
- 컬러: Yellow

### sandal wood
- 설명: 상딸보다 가벼운 샌달우드 향취입니다.
- 키워드: woody, lighter than santal, animalic
- 컬러: brown

### cedar wood
- 설명: 시더우드의 드라이함과 발사믹함을 동시에 가지고 있는 어코드입니다.
- 키워드: dry, woody smoky
- 컬러: gold

### oud
- 설명: 아가우드의 고급스러움과 차분한 우디 노트를 잘 살린 어코드로 풍부한 우드향입니다.
- 키워드: woody, musculine
- 컬러: brown

### coconut
- 설명: 크리미하고 풍부한 코코넛 향으로 우디노트, 프루티 노트와 블렌딩에 사용해보세요.
- 키워드: sweet, creamy, lactonic
- 컬러: white

### lychee
- 설명: 달콤하고 풍부한 열대과일 향으로 많은 느낌을 표현할 수 있습니다.
- 키워드: sweet, juicy, pear like
- 컬러: red

### champaca
- 설명: 이국적인 향취로 관능적이거나 풍부한 플로럴 노트를 만들기 좋습니다.
- 키워드: flroal, soapy
- 컬러: Yellow

### leaf
- 설명: 후제르 계열 또는 중성적 향기를 표현하기 좋은 어코드입니다. 모든 계열의 향과 잘 어울립니다.
- 키워드: green, fougere, fresh, masculine
- 컬러: green

### ginger
- 설명: 레모니한 느낌도 풍부한 생강향기로 시트러스 계열과도 잘 어울립니다.
- 키워드: spicy, citrus, ginger flower like
- 컬러: Yellow

### brown wood
- 설명: 우드와 시나몬 바크의 스파이시함이 어우러진 우디 오리엔탈 계열의 어코드입니다.
- 키워드: woody, warm, sweet balsamic
- 컬러: brown

### leather
- 설명: 드라이하고 스모키하며 우디 노트와 플로럴은 바이올렛과 잘 어울립니다.
- 키워드: dry, woody, smoky
- 컬러: gold

### patchouli
- 설명: 얼씨하고 우디한 노트로 과량 사용시 한방 향이 날 수 있고 대부분의 향과 잘 어울립니다.
- 키워드: earthy, woody
- 컬러: green

```
