# 260802 고객 메모(guestMemo)와 조향사 의견(makerMemo) 완전 분리 설계

## 1. 개요
고객이 작성한 요청 메모(`guestMemo`)와 조향사가 작성하는 전문 의견(`makerMemo`)을 데이터베이스 및 전역 UI 컴포넌트 상에서 완전히 독립된 별개의 데이터 필드로 엄격하게 분리하였습니다.

## 2. 세부 변경 사항

### 1) 데이터 생성 및 수신 로직 분리 (`GuestMainPage.tsx`)
- 고객이 Step 3에서 메모를 작성하여 조향 신청 시:
  - `guestMemo`: 고객이 입력한 요청 사항을 저장.
  - `makerMemo`: 초기 빈 값(`''`)으로 설정하여 조향사의 후속 작성 영역으로 명확히 구분.

### 2) 데이터베이스 전송 및 매핑 분리 (`supabaseClient.ts`)
- `insertData`: `guest_memo`와 `maker_memo`를 각각 독립된 데이터로 DB에 전달.
- `mapToFinalRecipe` & `dbGetRecords`: DB의 `guest_memo` ➔ `guestMemo`, `maker_memo` ➔ `makerMemo`로 1:1 직결 매핑.
- `dbCompleteRecord`: 조향사가 완료 시 `maker_memo`와 `guest_memo`를 각각 독립 수정/유지 가능하도록 분리.

### 3) UI 및 기록서 렌더링 분리 (`AdminDashboard.tsx`, `A6CertificatePrint.tsx`)
- **관리자 대시보드**:
  - `고객 작성 메모 (Read-only)` ➔ `selectedRecord.guestMemo`만 독립 표기.
  - `조향사 의견` ➔ `adminMemo` (편집 가능) 독립 저장.
- **훈민향음 기록서(A6)**:
  - `[Client Memo (고객 메모)]` ➔ 고객이 입력한 메모만 노출.
  - `[Perfumer's Touch (조향사 의견)]` ➔ 조향사의 소견만 노출.

## 3. 필수 수파베이스 DB 설정 안내
수파베이스 DB 테이블 `hunmin_scent_records`에 `guest_memo` 컬럼이 아직 등록되어 있지 않다면, 수파베이스 **SQL Editor**에서 아래 1줄을 실행해 주시면 됩니다:

```sql
ALTER TABLE hunmin_scent_records ADD COLUMN IF NOT EXISTS guest_memo text;
```
