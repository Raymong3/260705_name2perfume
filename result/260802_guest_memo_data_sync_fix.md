# 260802 고객 메모 데이터 동기화 및 기록서 출력 버그 수정

## 1. 문제 원인 분석
- 손님이 입력한 메모가 DB 전송 시 `guest_memo` 필드 미포함 및 Cloud API 매핑 누락으로 인해 관리자 대시보드 및 인쇄 화면에 로드되지 않는 현상이 있었습니다.
- 기존 기록(`maker_memo`)과 신규 기록(`guest_memo`) 사이의 호환성 매핑 로직이 부족하여 이전 데이터 조회 시 `'작성된 고객 메모가 없습니다.'`로 표시되거나 훈민향음 기록서의 `[고객 메모]` 영역이 숨겨지는 원인이었습니다.

## 2. 세부 수정 내역

### 1) DB 데이터 전송 및 조회 매핑 완비 (`supabaseClient.ts`)
- Cloud Supabase 및 LocalStorage 데이터 구조에 `guest_memo` 필드를 완전히 추가 및 동기화하였습니다.
- `dbCreateRecord`, `dbGetRecords`, `dbCompleteRecord`, `mapToFinalRecipe` 전역에 `guestMemo` 속성을 매핑하여 손님이 입력한 메모가 손실 없이 데이터베이스에 저장/조회되도록 보장했습니다.

### 2) 레거시 데이터 하위 호환성 (Fallback) 로직 구축
- `guest_memo` 필드가 없던 기존 기록에 대해서도 `maker_memo`의 내용을 분석하여 손님 작성 메모인지 자동 판단(Effective Guest Memo) 후 **`고객 작성 메모 (Read-only)`** 필드로 안전하게 복원되도록 처리했습니다.

### 3) 훈민향음 기록서(A6) [고객 메모] 조건부 출력 보장
- `A6CertificatePrint.tsx`에서 손님이 메모를 작성한 경우 기록서 상단 조향 변경 이력과 하단 조향사 의견 사이에 **`[Client Memo (고객 메모)]`** 영역이 이태릭 폰트로 깔끔하게 자동 인쇄되도록 보장하였습니다.
- 조향사 의견(`Perfumer's Touch`)은 고객 메모와 혼선되지 않도록 독립된 조향 소견으로 분리 출력됩니다.
