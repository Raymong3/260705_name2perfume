# 훈민향음 기록서(A6) 및 Step 1 문구 & QR 코드 업데이트 보고서

- **작업 일자**: 2026년 8월 5일 (260805)
- **작업 내용**:
  1. Step 1 타이틀 문구 '의뢰 대상자 성함 입력' ➔ **'이름을 담다'**로 변경.
  2. A6 기록서 뒷면 QR 코드를 전달해주신 **더알(DEORAL) 가게 명함 QR 코드(`images/qrcode.jpg`)**로 교체 및 설명 문구 수정.

---

## 주요 변경 내역

### 1) Step 1 타이틀 문구 수정 (`GuestMainPage.tsx`)
- 기존: `STEP 1 · NAME ATELIER` / `의뢰 대상자 성함 입력`
- 변경: `STEP 1 · NAME ATELIER` / **`이름을 담다`**

### 2) A6 기록서 뒷면 더알(DEORAL) QR 코드 및 안내 문구 반영 (`A6CertificatePrint.tsx`)
- 원본 `images/qrcode.jpg` ➔ `public/images/qrcode.png`로 내장.
- 영문 엠블럼: `DEORAL SHOP & ARCHIVE`
- 안내 멘트:
  > *"스마트폰 카메라로 QR 코드를 스캔하시면<br />훈민향음과 더알(DEORAL)의 브랜드 소식을 확인하실 수 있습니다."*
