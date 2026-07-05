# 한국어 향수 조합 추천 웹앱 (name2perfume) 구현 계획서

사용자가 이름을 입력하면 이름의 느낌(어감, 자모 구조 등)을 분석하여 맞춤형 향수 콘셉트와 향수 레시피(탑, 미들, 베이스 노트 비율)를 추천하는 프리미엄 웹앱을 구현합니다.

## User Review Required

> [!IMPORTANT]
> **1. Tailwind CSS 버전 선택**
> - 기획서(`context.md`)에서 Tailwind CSS 사용을 권장하고 있습니다. Tailwind CSS v3와 v4 중 어떤 버전을 선호하시는지 확인 부탁드립니다. (별도 의견이 없으시다면 안정적인 **v3**를 사용하여 개발을 시작할 예정입니다.)
> 
> **2. 소스 코드 파일명의 `yymmdd_` 접두사 적용 범위**
> - 전역 규칙 중 "예전 파일과 최신 파일을 구분할 수 있도록 yymmdd_파일명 으로 만들기"가 존재합니다.
> - React 프로젝트의 실제 소스 코드 파일(예: `App.tsx`, `notes.ts`, `analyzeName.ts` 등)에도 이 규칙을 적용할 경우 파일 임포트 경로가 꼬이거나 번들링 설정이 복잡해질 우려가 있습니다.
> - 따라서 **결과물 및 도구 폴더 내 파일(예: `result/260705_implementation_plan.md`, `tools/...`)에만 `yymmdd_` 접두사를 적용**하고, **실제 프로젝트의 소스 코드는 기획서가 제안한 표준 파일명(예: `src/app/App.tsx`)으로 작성**하는 방안을 제안합니다. 이에 대해 확인해 주시기 바랍니다.

## Open Questions

> [!NOTE]
> **1. 한글 자모 분석 및 감성 태그 매핑 규칙**
> - 기획서의 어감 분석 기준을 바탕으로 아래와 같이 감성 이미지/키워드 매핑 로직을 구현하고자 합니다. 이에 대해 보완이나 수정하고 싶으신 부분이 있는지 검토해 주세요.
>   - **모음 계열 분석**:
>     - ㅏ, ㅑ, ㅗ (및 ㅘ, ㅛ, ㅙ 등): "밝은 이미지", "자유로운 이미지", "생동감", "산뜻함"
>     - ㅓ, ㅜ, ㅡ (및 ㅝ, ㅠ, ㅢ 등): "차분한 이미지", "따뜻한 이미지", "포근함", "편안함"
>     - ㅣ, ㅐ, ㅔ (및 ㅟ, ㅖ, ㅞ 등): "맑은 이미지", "세련된 이미지", "지적인 이미지", "깨끗함", "투명함", "고급스러움"
>   - **받침 분석**:
>     - 이름 내 글자 중 받침이 있는 글자의 비율이 높은 경우: "단단한 이미지", "안정감", "깊이감"
>     - 받침이 적거나 없는 경우: "부드러운 이미지", "우아한 이미지", "귀여운 이미지", "로맨틱한", "포근함"
>   - **글자 수 분석**:
>     - 2글자: "간결함", "또렷함"
>     - 3글자: "균형감", "자연스러움"
>     - 4글자 이상: "개성", "특별함"
> 
> **2. 향료 데이터(notes.ts)의 감성 태그 매핑**
> - Top 14개, Middle 20개, Base 14개 총 48개 향료에 대해, 이름 분석 결과로 나온 태그들과 자연스럽게 매칭될 수 있도록 고르게 감성 태그들을 사전 배치(각 향료당 최소 2개 이상)하려고 합니다. 특별히 선호하는 특정 향료의 태그 배치가 있으신지, 아니면 자체적으로 자연스러운 분포로 구성해도 괜찮은지 여쭙습니다.

## Proposed Changes

이 프로젝트는 Vite + React + TypeScript + Tailwind CSS 기반의 프론트엔드 단독 웹앱(MVP)으로 구현됩니다.

---

### [260705_name2perfume]

#### [NEW] [notes.ts](file:///c:/Users/이대경/Documents/workspace/260705_name2perfume/src/data/notes.ts)
- 48개 임시 향료(Top-01~14, Middle-01~20, Base-01~14)의 ID, 이름, 감성 태그 매핑 정의

#### [NEW] [perfume.ts](file:///c:/Users/이대경/Documents/workspace/260705_name2perfume/src/types/perfume.ts)
- 향료 데이터 타입(`PerfumeNote`), 분석 결과 타입, 레시피 결과 타입 선언

#### [NEW] [analyzeName.ts](file:///c:/Users/이대경/Documents/workspace/260705_name2perfume/src/logic/analyzeName.ts)
- 이름의 한글 유효성 검사
- 한글 음절 분해 알고리즘(초성/중성/종성 분리)을 통한 감성 태그 도출

#### [NEW] [recommendPerfume.ts](file:///c:/Users/이대경/Documents/workspace/260705_name2perfume/src/logic/recommendPerfume.ts)
- 분석된 감성 태그와 향료의 태그 매칭율 계산
- 매칭율이 높은 후보군을 우선 선별하되, "다시 추천하기" 클릭 시 약간씩 다른 조합이 나오도록 무작위성(Randomness) 부여
- 탑 2~3개, 미들 2~4개, 베이스 1~3개 추천 조건 및 중복 선택 방지 보장

#### [NEW] [calculateRatio.ts](file:///c:/Users/이대경/Documents/workspace/260705_name2perfume/src/logic/calculateRatio.ts)
- 추천된 향수 레시피의 총합이 100%가 되도록 각 노트별 기본 배분 비율(Top: 25%, Middle: 45%, Base: 30%)에 맞춰 개별 향료의 비율 계산
- 소수점 반올림 등으로 인한 비율 총합 오차(100% 미만/초과) 보정 로직 구현

#### [NEW] [App.tsx](file:///c:/Users/이대경/Documents/workspace/260705_name2perfume/src/app/App.tsx)
- 프리미엄 향수 공방의 무드를 전달하는 세련된 UI (Dark/Luxury Cream 톤, 아날로그 감성, 글라스모피즘 스타일)
- 이름 입력, 분석 중 로딩 애니메이션, 상세 결과 카드 및 인터랙티브 비율 바(Fragrance Ratio Bar) 구현

## Verification Plan

### Automated Tests
- 없음 (1차 MVP 단계에서는 브라우저 동작 검증 우선)

### Manual Verification
- **이름 입력 및 유효성 검증**: 한글이 아닌 입력이나 비정상적인 글자 수에 대한 경고 메시지 확인
- **노트 개수 조건 검증**: 추천 결과에서 항상 탑(1~5개), 미들(1~5개), 베이스(1~5개) 범위 및 중복 없음 보장
- **비율 합산 검증**: 화면에 표시되는 개별 향료의 비율 총합이 정확히 100%인지 확인
- **다시 추천하기 검증**: 동일한 이름을 재추천했을 때 조합이 유동적으로 바뀌는지 확인
