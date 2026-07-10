# 이름 & 설문 기반 3대 레시피 추천 개선 계획서

이름 분석(1단계)과 개인 향 선호도 설문(2단계)을 결합하여, 각 노트당 1~3개(기본 1개)의 향료로 구성된 3가지 대안 레시피를 매칭 점수 순으로 제안하도록 시스템을 전면 고도화합니다.

## User Review Required

> [!IMPORTANT]
> **주요 변경 규칙**
> 1. **노트별 추천 개수 단축**: 기존 1~5개 추천에서 **최대 3개, 기본 1개** 추천으로 제한합니다. 시드 난수 분포 상 1개 추천이 가장 높은 확률을 갖게 하고, 최대 3개까지 선택됩니다.
> 2. **2단계 설문 추가**: 3개 문항의 5지선다 설문 조사를 화면에 추가하여 이름 분석 점수 위에 선호 가중치(특정 향료 ID 혹은 태그 일치 시 가산점)를 결합합니다.
> 3. **3개 추천 레시피 제안**: 단일 레시피 대신 서로 다른 3가지 조합을 도출한 후, 매칭 점수 합계가 높은 순서대로 1순위, 2순위, 3순위를 정렬하여 화면에 노출합니다.

## Proposed Changes

### [Context & Specifications]

#### [MODIFY] [context.md](file:///c:/Users/이대경/Documents/workspace/260705_name2perfume/context/context.md)
- 노트별 추천 개수를 1~3개(기본 1개)로 명세를 업데이트합니다.
- 2단계 설문과 3순위 다중 레시피 제안 흐름을 기획 내용에 맞게 추가합니다.

### [Data & Types]

#### [NEW] [surveyQuestions.ts](file:///c:/Users/이대경/Documents/workspace/260705_name2perfume/src/data/surveyQuestions.ts)
- 3개 설문 문항 및 5지선다 선택지, 각 선택지별 보너스 태그/향료 매핑 정의.

#### [MODIFY] [perfume.ts](file:///c:/Users/이대경/Documents/workspace/260705_name2perfume/src/types/perfume.ts)
- `PerfumeRecipe` 구조를 단일 레시피에서 3개 레시피를 포함하는 구조로 확장하거나, 다중 레시피 반환을 지원하도록 변경합니다.
- 설문 응답 상태 타입(`SurveyAnswers`) 정의.

### [Logic Components]

#### [MODIFY] [scoreNote.ts](file:///c:/Users/이대경/Documents/workspace/260705_name2perfume/src/logic/scoreNote.ts)
- 설문 응답 정보를 수신하여 선택한 설문에 부합하는 향료 및 태그에 보너스 가중치(+5 ~ +10)를 추가 반영합니다.

#### [MODIFY] [recommendPerfume.ts](file:///c:/Users/이대경/Documents/workspace/260705_name2perfume/src/logic/recommendPerfume.ts)
- 시드 다원화(예: `seed + offset`)를 통해 3개의 서로 다른 고유 레시피 세트를 생성합니다.
- 생성된 3개 레시피의 누적 점수를 계산하여 가장 매칭 점수가 높은 순으로 1, 2, 3순위를 매깁니다.
- 노트별 선택 개수를 1~3개(기본 1개 분포)로 제한하는 로직을 적용합니다.

### [UI Components]

#### [MODIFY] [App.tsx](file:///c:/Users/이대경/Documents/workspace/260705_name2perfume/src/app/App.tsx)
- 1단계(이름 입력) ➔ 2단계(설문 진행) ➔ 3단계(결과 화면: 3가지 레시피 카드 슬라이드 또는 탭 뷰) 형태로 화면 흐름을 수정합니다.
- 3가지 조합을 쉽게 비교해볼 수 있는 세련된 탭/카드 인터페이스를 구축합니다.

---

## Verification Plan

### Automated Tests
- `npm run build`를 실행하여 컴파일 오류가 없는지 검증합니다.

### Manual Verification
- 브라우저에서 이름 입력 후 2단계 설문을 완료했을 때 3개의 정렬된 레시피 카드가 정상적으로 노출되는지 확인합니다.
- 질문 답변 선택에 따라 최종 추천되는 향료 조합과 비율이 유기적으로 변경되는지 검증합니다.
