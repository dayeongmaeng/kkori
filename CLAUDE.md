# 펫케어 앱 프로젝트

## 컨셉

**앱 이름: 꼬리** - 반려동물의 모든 순간을 기록하는 앱

반려동물 보호자를 위한 일상 기록 + 건강 관리 앱이다.
일일 기록(식사/산책/배변/컨디션), 하루 한 장 사진 일기, 반려동물 프로필 관리가 현재 MVP의 중심 기능이다.

차별화 방향은 심박수/호흡수 측정, 병원 방문 전 리포트, 장기 데이터 기반 패턴 분석이다.
모든 연령의 반려동물을 지원하되, 노령/특수 질환 보호자에게도 깊이 있게 대응하는 방향을 유지한다.
현재 MVP 타겟은 강아지만 유지한다.

## 개발 환경

- OS: Windows
- 타겟: iOS 우선
- 개발 중 테스트는 주로 웹 브라우저로 진행
- Android는 Phase 2 이후 추가

## 기술 스택

- React Native + Expo Managed Workflow
- Expo SDK 54, React Native 0.81
- TypeScript strict 모드
- 네비게이션: Expo Router file-based routing, typed routes
- 상태 관리: React Context
- 로컬 저장/캐시: AsyncStorage, 네이티브 인증 토큰은 SecureStore
- 이미지: expo-camera, expo-image-picker, expo-image-manipulator, expo-image
- 백엔드: Spring Boot
- 데이터베이스: PostgreSQL
- 파일 저장: AWS S3
- 웹/정책/공유 페이지: Vercel

## 현재 앱 구조

- 앱 이름/slug: `꼬리` / `kkori`
- 앱 스킴: `kkori`
- 번들 ID/패키지: `com.anonymous.kkori`
- 주요 탭: 홈, 기록, 포토, 프로필, 설정
- 루트 Provider: `AuthProvider`, `DateProvider`, `PetProvider`
- `DateProvider`는 KST 기준 날짜를 관리하며 자정과 앱 활성화 시 갱신한다.
- 로그인 전에는 `AuthGate`가 로그인 화면을 표시한다.
- 이 저장소는 Expo 앱과 Vercel 공유 페이지/API 프록시 코드를 포함한다. Spring Boot 백엔드 코드는 별도 저장소에 있다.

## 코딩 규칙

- 컴포넌트는 함수형과 hooks를 사용한다.
- 한 파일이 200줄을 넘으면 분리를 우선 검토한다.
- 색상/스타일 토큰은 `constants/theme.ts`를 기준으로 한다.
- 모든 비동기 함수는 try/catch로 에러 처리를 고려한다.
- AsyncStorage 키는 `pet-care:` 프리픽스를 사용한다.
- 불필요한 리팩터링과 사용하지 않는 의존성 추가를 피한다.
- Expo eject 제안 금지. Managed Workflow를 유지한다.
- UI 텍스트는 한국어를 사용한다.

## 웹 호환성 주의

- 개발 중 웹 브라우저로 주로 테스트한다.
- `expo-image-picker` 같은 네이티브 기능은 웹 fallback이 필요하다.
- 카메라 기능은 웹에서 file input 기반 갤러리 선택으로 대체한다.
- 웹 삭제/탈퇴 확인은 `Alert.alert` 대신 `window.confirm`을 사용한 구현이 있다.
- 권한 안내(알림/카메라/사진 접근)는 웹에서 별도 대응이 적용되어 있다.
- 설정탭 외부 링크는 웹 환경에서 `Linking.openURL`로 처리한다.
- 출시 예정 UI는 웹/native 모두 대응되어 있다.
- 사진 업로드: Web 이미지 크기 계산 수정, base64 처리 보완, 업로드 중 중복 실행 방지 적용.

## UI 가이드

- 모든 텍스트는 한국어 기준.
- 날짜 포맷: `2026년 5월 13일`
- 시간대: KST
- 톤: 따뜻하고 부드러운 톤
- 기존 테마 기준 색상은 `constants/theme.ts`를 따른다.
- 모서리는 둥글게, 여백은 넉넉하게 유지한다.

## 작업 스타일

- 사용자는 Spring Boot 경험이 풍부하고 React Native, TypeScript는 학습 중이다.
- 모르는 개념은 짧게 설명하면 좋다.
- 한 번에 한 화면씩 진행한다.
- 화면 확인은 사용자가 직접 진행한다.
- 검증 포인트/기대 동작 중심으로 안내한다.
- 불필요한 리팩터링은 하지 않는다.
- React Native + Expo + TypeScript strict를 유지한다.

## 인증/세션

- Google OAuth, Kakao OAuth 로그인 화면이 구현되어 있다.
- 로그인 성공 시 `/api/v1/auth/oauth/login`으로 서버 로그인 요청을 보내고 access/refresh token을 저장한다.
- Google 로그인 시 OAuth access token을 서버로 함께 전달한다. 서버는 이를 `UserOAuthToken`에 암호화 저장해 탈퇴 시 revoke에 사용한다.
- 네이티브는 `expo-secure-store`, 웹은 AsyncStorage 기반으로 토큰을 저장한다.
- API 요청에서 401이 발생하면 `/api/v1/auth/refresh`로 access token 갱신 후 원 요청을 재시도한다.
- 로그아웃은 `/api/v1/auth/logout` 호출 후 인증 토큰과 세션 캐시를 정리한다.
- 로그인 후 `syncServerSessionData()`가 보호자, 반려동물, 기록, 사진 데이터를 서버에서 가져와 로컬 캐시에 동기화한다.

## 서버 API

- 운영 Base URL: `https://api.kkori.co.kr`
- 개발 모드 API 기본값은 코드상 `http://localhost:8080`
- 권장 운영 환경변수: `EXPO_PUBLIC_API_URL=https://api.kkori.co.kr`
- 모든 일반 API 요청은 AsyncStorage에 저장된 `pet-care:device-id`를 읽어 `X-Device-Id` 헤더를 붙인다.
- 최초 실행 시 `expo-crypto`로 UUID를 생성하고 `/api/v1/devices/register`에 등록한다.
- 응답 구조: `{ success, data, error, timestamp }`
- 에러 구조: HTTP status + `ErrorResponse { code, message, fields }`
- 204 응답도 정상 처리한다.

엔드포인트:

- `POST /api/v1/devices/register`
- `GET /api/v1/devices/me`
- `GET/POST/PUT/DELETE /api/v1/caregivers`
- `GET/POST/PUT /api/v1/pets`
- `DELETE /api/v1/pets/{externalId}` — 204. cascade soft delete + S3 비동기 삭제는 API 내부 처리.
- `GET/POST/PUT/DELETE /api/v1/photos`
- `PATCH /api/v1/photos/{externalId}`
- `POST /api/v1/photos/{externalId}/upload`
- `GET /api/v1/photos/{externalId}/share`
- `GET/POST/PUT/DELETE /api/v1/logs`
- `POST /api/v1/logs/{externalId}/photos/upload`
- `DELETE /api/v1/logs/{logExternalId}/photos/{photoExternalId}`
- `POST /api/v1/auth/oauth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `DELETE /api/v1/users/me` — 회원 탈퇴 (JWT 필수, 204 반환)

API 코드 위치: `lib/api/`

## 캐시/오프라인 UX

- 서버 데이터를 AsyncStorage 캐시에 저장하고, 화면에서는 캐시를 먼저 보여준 뒤 서버 데이터를 백그라운드로 갱신하는 구조가 여러 화면에 적용되어 있다.
- 주요 캐시:
  - `pet-care:api:pets`
  - `pet-care:api:current-pet-id`
  - `pet-care:api:current-caregiver-id`
  - `pet-care:api:logs:{petExternalId}`
  - `pet-care:api:photos:{petExternalId}`
  - `pet-care:photo-data:{externalId}`
  - `pet-care:log-extras:{logExternalId}`
  - `pet-care:log-photos:{logExternalId}`
- 설정 탭의 캐시 비우기는 `AsyncStorage.clear()`가 아니라 지정된 캐시 키/프리픽스만 선별 삭제한다.

## 화면별 구현 상태

### 홈 탭

- 반려동물 프로필 카드, 오늘 기록 카드, 최근 7일 컨디션 차트, AI 리포트 프리뷰 구현.
- 오늘 기록이 없으면 기록 추가 CTA를 보여주고, 기록이 있으면 요약 문구를 보여준다.
- AI 리포트는 병원 방문용 리포트/주간 리포트 카드가 있으나 현재 출시 예정 상태다.

### 기록 탭

- 날짜 이동, 캘린더 모달, 기록 있는 날짜 표시 구현.
- 기록 항목: 컨디션, 식사, 산책, 배변, 물 섭취, 기록 사진, 메모.
- 자동저장은 제거되어 있고 사용자가 저장 버튼을 눌러야 서버에 저장된다.
- 기존 기록은 `PUT /api/v1/logs/{externalId}`, 신규 기록은 `POST /api/v1/logs`를 호출한다.
- 기록 삭제는 `DELETE /api/v1/logs/{externalId}` 호출 후 캐시 삭제와 화면 초기화를 함께 수행한다.
- 기록 사진은 DailyLog별 최대 3장까지 첨부 가능하다.
- 기록 사진 선택 후 압축/리사이즈, medium/thumbnail 생성, 서버 업로드, 재시도, 삭제, 큰 이미지 미리보기가 구현되어 있다.
- 식사/산책/배변/물 섭취의 세부 메모는 서버 필드가 아니라 로컬 `log-extras` 캐시에 저장된다.

### 포토 탭

- 하루 한 장 사진 기능 구현.
- 오늘 날짜 기준 사진 카드, 촬영/갤러리 선택, 캡션 입력 모달, 업로드 상태 표시 구현.
- 웹에서는 카메라 대신 file input 기반 갤러리 선택으로 동작한다.
- 네이티브에서는 `expo-camera`로 촬영 가능하며 카메라 권한 요청/설정 이동 UX가 있다.
- 사진은 업로드 전 1080px 기준으로 압축하고, medium 1080px / thumbnail 300px 파일을 생성해 서버/S3 업로드 API로 보낸다.
- 같은 날짜에 기존 사진이 있으면 새 메타를 만들지 않고 기존 `externalId`를 재사용한다.
- 업로드 실패 상태 보존과 재시도 UI가 구현되어 있다.
- 과거 사진은 3열 그리드로 표시하고 pull-to-refresh를 지원한다.

### 사진 상세/공유

- 사진 상세 화면은 세로 paging FlatList로 사진을 넘겨 볼 수 있다.
- 상세 화면에서 캡션 수정, 앨범 저장, 공유 미리보기, 공유하기, 삭제가 가능하다.
- 캡션은 최대 100자이며 `PATCH /api/v1/photos/{externalId}`로 저장한다.
- 사진 삭제는 `DELETE /api/v1/photos/{externalId}` 호출 후 로컬 사진 캐시와 API 캐시를 삭제한다.
- 공유 URL은 `{WEB_BASE_URL}/photos/{externalId}` 형태로 생성된다.
- Vercel 설정에서 `/photos/:externalId`는 Expo 페이지보다 먼저 `api/share-photo.js`로 라우팅된다.
- `api/share-photo.js`는 백엔드 공유 API를 호출해 정적 HTML 형태의 공유 페이지와 OG/Twitter 메타 태그를 렌더링한다.

### 프로필 탭

- 반려동물 프로필 생성/수정 화면 구현.
- 필드: 사진, 이름, 성별, 견종, 생일, 생일 모름, 함께한 날, 체중, 중성화 여부, 건강 메모.
- 현재 species는 저장 시 `"dog"`로 고정된다.
- 견종은 클라이언트 상수 기반 자동완성 + 자유입력 구조다.
- 생일/함께한 날은 네이티브 DateTimePicker와 웹용 select picker를 분기 처리한다.
- 프로필 사진은 512px 기준으로 압축하고 base64로 저장/전송한다.
- 저장 후 pet 캐시와 current pet 상태를 갱신한다.
- 반려동물 삭제 버튼 추가 방향 확정. `DELETE /api/v1/pets/{externalId}` 호출 후 로컬 캐시 정리. API 연동 예정.

### 설정 탭

- 권한 섹션: 알림, 카메라, 사진 접근 권한 설정 열기.
- 데이터 섹션: 데이터 백업/내보내기, 데이터 가져오기는 출시 예정. 캐시 비우기는 구현 완료.
- 정보 섹션: 개인정보처리방침, 이용약관, 버전 정보.
- 지원 섹션: 문의하기, 업데이트 소식, 리뷰 남기기, 후원하기, 꼬리 흔들게 하기.
- 계정 섹션: 로그아웃 구현 완료. **회원 탈퇴 UI 구현 완료** (탈퇴 전 안내, Web/native 확인 모달, 성공 시 세션 정리 + 로그인 화면 이동).
- 리뷰 남기기는 앱 출시 후 실제 App Store ID로 교체해야 하는 TODO가 남아 있다.

## 도메인 및 인프라

- 서비스 도메인: `kkori.co.kr`
- API 서브도메인: `api.kkori.co.kr`
- DNS A 레코드: `api.kkori.co.kr -> 13.124.220.29`
- 최종 운영 API URL: `https://api.kkori.co.kr`
- 새 Lightsail 서버 Public IP: `13.124.220.29`
- 기존 서버 IP `3.38.97.234`는 이전 서버 IP이며 현재 운영 기준 IP가 아니다.
- HTTPS 적용 완료.
- HTTPS 구성: Let's Encrypt + Certbot + Nginx
- certbot renew --dry-run 성공.
- Spring Boot API 컨테이너와 PostgreSQL 컨테이너 정상 구동 확인.

도메인 역할:

- `kkori.co.kr` / `www.kkori.co.kr`: Vercel 웹 랜딩, 개인정보처리방침, 계정삭제 안내, 가족 공유/메모리얼 페이지 용도
- `api.kkori.co.kr`: Lightsail Spring Boot API 용도

운영 인프라 흐름:

```text
앱
-> https://api.kkori.co.kr
-> Nginx 443
-> Spring Boot 8080
-> PostgreSQL 16
-> S3
```

서버 포트:

- 22: SSH
- 80: HTTP / Certbot 갱신 / HTTPS redirect
- 443: HTTPS API
- 8080: Spring Boot 직접 접근 포트. 최종적으로 외부 공개는 닫는 방향이며 현재 닫힘 여부 확인 필요.

## S3 및 업로드 메모

- S3 사진 업로드 정상 동작 확인 완료.
- Lightsail에 IAM Role을 붙인 것이 아니라면 `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET` 환경변수가 필요하다.
- 과거 `S3Exception: The specified bucket is not valid` 원인은 IAM access key 자체가 아니라 Docker 컨테이너에 AWS/S3 환경변수가 전달되지 않던 문제였다.
- `AWS_S3_BUCKET`은 `s3://`, URL, 경로 없이 순수 버킷명만 넣어야 한다.

## 현재 코드 기준 주의/갱신 필요

- `.env.example`에는 `EXPO_PUBLIC_SHARE_API_URL`이 없지만 `photoApi.getSharedPhoto()`에서 사용 중이다.
- 문서에는 `EXPO_PUBLIC_DEV_API_URL` 언급이 있으나 현재 `lib/api/client.ts`는 개발 모드에서 항상 `http://localhost:8080`을 사용한다.
- `WEB_BASE_URL` 기본값과 `.env.example`은 아직 `https://test-kkori.vercel.app` 기준이다. 운영 도메인 `kkori.co.kr` 전환 시 갱신 필요하다.
- 프로필 `gender` 요청 타입은 코드상 `male` / `female` 소문자로 전송한다. 서버 문서가 `MALE` / `FEMALE` 기준이면 정합성 확인이 필요하다.
- AI 리포트, 반려동물 추가/전환, 포토 달력 만들기, 데이터 백업/가져오기, 알림 기능은 아직 출시 예정 상태다.
- 번들 ID/패키지가 `com.anonymous.kkori`로 되어 있다. App Store 제출 전 실제 번들 ID로 교체해야 한다.

## 다음 작업 후보

- 반려동물 삭제 버튼 API 연동 (프로필 탭 → `DELETE /api/v1/pets/{externalId}` + 로컬 캐시 정리)
- 8080 외부 포트 닫기 확인
- Vercel에 `kkori.co.kr` / `www.kkori.co.kr` 연결
- 개인정보처리방침/계정삭제 안내 페이지 준비
- `.env.example`과 실제 사용 환경변수 정합성 정리
- Phase D 회원가입/계정 모델 고도화 설계
