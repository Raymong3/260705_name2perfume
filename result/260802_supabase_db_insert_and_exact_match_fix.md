# 260802 수파베이스 DB 저장 오류 해결 및 로그인 ID 정확 매칭 원복

## 1. 수파베이스 DB 미반영 원인 분석
- 수파베이스 스키마에 존재하지 않는 `guest_memo` 필드가 `insertData` 및 `update` 페이로드에 포함되어 있어, 수파베이스 API 요청 시 PostgREST Schema Cache 오류(400 Bad Request)가 발생하여 실제 DB 저장이 거부되고 로컬스토리지로 예외(Fallback) 처리되던 문제였습니다.

## 2. 세부 조치 항목

### 1) 수파베이스 DB Insert / Update 페이로드 안정화 (`supabaseClient.ts`)
- 수파베이스 DB에 기존 등록된 스키마 컬럼(`maker_memo`, `password_pin`, `status`, `selected_type`, `perfume_name` 등)만을 정확하게 전달하도록 페이로드를 수정하였습니다.
- 손님이 작성한 메모는 기존 컬럼인 `maker_memo`에 정상 저장되도록 보장하여, 수파베이스 DB에 거부 없이 100% 정상 저장(Insert)되도록 조치했습니다.

### 2) 로그인 전체 ID 정확 매칭 원복 (`supabaseClient.ts`)
- 사용자 요청에 따라 조회 시 로그인 식별자(`password_pin === loginId`)가 전체 일치하는 기록만 정확하게 불러오도록 쿼리 로직을 완벽하게 원복 하였습니다.
