# 꼬리(kkori) 프로젝트 인수인계

## 프로젝트 한 줄

반려동물의 일상 기록, 건강 관리, 하루 한 장 사진을 관리하는 펫케어 앱이다.
17년 키운 말티즈를 떠나보낸 경험에서 출발했으며, 장기적으로 노령견 보호자에게도 실질적으로 도움이 되는 도구를 목표로 한다.

## 저장소

- 클라이언트: `C:\dev\projects\kkori`
- 서버: `C:\dev\projects\kkori-api`
- 현재 저장소에는 Expo 앱과 Vercel 공유 페이지/API 프록시 코드가 포함되어 있다.
- Spring Boot 백엔드 코드는 별도 서버 저장소에 있다.

## 클라이언트 스택

- React Native + Expo Managed Workflow
- Expo SDK 54, React Native 0.81
- TypeScript strict
- Expo Router file-based routing, typed routes
- React Context 기반 상태 관리
- AsyncStorage 캐시
- SecureStore 기반 네이티브 인증 토큰 저장
- expo-camera, expo-image-picker, expo-image-manipulator, expo-image
- Vercel 웹 export 및 공유 페이지

## 현재 클라이언트 구조

- 앱 이름/slug: `꼬리` / `kkori`
- 앱 스킴: `kkori`
- 번들 ID/패키지: `com.anonymous.kkori`
- 주요 탭: 홈, 기록, 포토, 프로필, 설정
- 루트 Provider: `AuthProvider`, `DateProvider`, `PetProvider`
- 로그인 전에는 `AuthGate`가 로그인 화면을 보여준다.
- KST 기준 날짜는 `DateProvider`에서 관리하며 자정과 앱 활성화 시 갱신한다.

## 진행 상태

- 서버 CRUD 및 디바이스 기반 격리 연동 완료.
- 운영 API `https://api.kkori.co.kr` 기준 클라이언트 검증 완료.
- S3 사진 업로드 연동 완료.
- OAuth 기반 로그인 화면과 세션 저장/갱신/로그아웃 구현 완료. 로그인/로그아웃 안정성 개선 완료.
- Google OAuth access token 전달 구조 추가. 서버 측 `UserOAuthToken` 암호화 저장 연동.
- 로그인 후 서버 세션 데이터 동기화 구현 완료.
- 기록 탭 자동저장 제거 완료. 사용자가 저장 버튼을 눌렀을 때만 저장한다.
- 기록 삭제 API 연동 완료.
- 기록 사진 기능 구현 완료. DailyLog별 최대 3장, 업로드/실패/재시도/삭제/큰 이미지 미리보기 지원.
- 사진 업로드 안정성 개선: Web 이미지 크기 계산 수정, base64 처리 보완, 중복 실행 방지, 업로드 후 즉시 반영.
- 하루 한 장 사진 업로드, 캡션 수정, 상세 보기, 공유 링크, 공유 전용 HTML 페이지 구현 완료.
- 프로필 탭 고도화 진행 완료. 성별, 생일 모름, 함께한 날, 견종 자동완성, 프로필 사진 압축 저장 구현.
- 기록/프로필 저장 버튼 스크롤 반응형 개선 완료.
- 설정 탭 캐시 비우기 선별 삭제, 정책 링크, 후원 UI, 로그아웃, **회원 탈퇴 UI** 구현 완료.
- Web 환경 개선: 캐시 비우기, 권한 안내(알림/카메라/사진 접근), 외부 링크, 출시 예정 UI 모두 Web 대응 완료.
- 개인정보처리방침/이용약관/초기 릴리즈노트 초안 작성 완료.
- **반려동물 멀티 선택/추가 기능 구현 완료** (AppHeader 드롭다운): 반려동물 전환, 추가, currentPet 기반 전역 화면 갱신.

## 인증/세션

- Google OAuth, Kakao OAuth 로그인 화면이 구현되어 있다.
- 로그인 성공 시 `/api/v1/auth/oauth/login`으로 서버 로그인 요청을 보내고 access/refresh token을 저장한다.
- Google 로그인 시 OAuth access token을 서버로 함께 전달한다. 서버는 이를 `UserOAuthToken`에 AES-256-GCM 암호화로 저장해 탈퇴 시 revoke에 사용한다.
- 네이티브는 `expo-secure-store`, 웹은 AsyncStorage 기반으로 토큰을 저장한다.
- API 요청에서 401이 발생하면 `/api/v1/auth/refresh`로 access token 갱신 후 원 요청을 재시도한다.
- 로그아웃은 `/api/v1/auth/logout` 호출 후 인증 토큰과 세션 캐시를 정리한다.
- 로그인 후 `syncServerSessionData()`가 보호자, 반려동물, 기록, 사진 데이터를 서버에서 가져와 로컬 캐시에 동기화한다.

## API 연동

- 운영 API: `https://api.kkori.co.kr`
- 개발 모드 API 기본값: `http://localhost:8080`
- 권장 운영 환경변수: `EXPO_PUBLIC_API_URL=https://api.kkori.co.kr`
- 웹 URL 기본값: `https://kkori.vercel.app`
- 모든 일반 API 요청은 AsyncStorage의 `pet-care:device-id`를 읽어 `X-Device-Id` 헤더를 붙인다.
- 최초 실행 시 `expo-crypto`로 UUID를 생성하고 `/api/v1/devices/register`에 등록한다.
- 응답 구조는 `{ success, data, error, timestamp }` 형태로 처리한다.
- 204 응답도 정상 처리한다.

주요 클라이언트 API 파일:

- `lib/api/client.ts`
- `lib/api/auth.ts`
- `lib/api/device.ts`
- `lib/api/caregiver.ts`
- `lib/api/pet.ts`
- `lib/api/photo.ts`
- `lib/api/log.ts`
- `lib/api/sessionSync.ts`

## 캐시 구조

서버 데이터를 AsyncStorage 캐시에 저장하고, 화면에서는 캐시를 먼저 보여준 뒤 서버 데이터를 백그라운드로 갱신하는 패턴을 사용한다.

주요 캐시:

- `pet-care:api:pets`
- `pet-care:api:current-pet-id`
- `pet-care:api:current-caregiver-id`
- `pet-care:api:logs:{petExternalId}`
- `pet-care:api:photos:{petExternalId}`
- `pet-care:photo-data:{externalId}`
- `pet-care:log-extras:{logExternalId}`
- `pet-care:log-photos:{logExternalId}`

설정 탭의 캐시 비우기는 `AsyncStorage.clear()`가 아니라 지정된 캐시 키/프리픽스만 삭제한다.

## 화면별 상태

### 홈

- 현재 반려동물 프로필 카드 구현.
- 오늘 기록 카드 구현.
- 최근 7일 컨디션 차트 구현.
- AI 리포트 프리뷰 구현. 실제 리포트 기능은 출시 예정.
- `AppHeader` 드롭다운으로 반려동물 전환 시 이름, 나이, 함께한 날, 최근 7일 컨디션이 자동 갱신된다.

### 기록

- 날짜 이동, 캘린더 모달, 기록 있는 날짜 표시 구현.
- 기록 항목: 컨디션, 식사, 산책, 배변, 물 섭취, 기록 사진, 메모.
- 수동 저장 방식.
- `AppHeader` 반려동물 전환 시 기록 목록, 상태, 첨부 사진이 currentPet 기준으로 자동 갱신된다.
- `POST /api/v1/logs`, `PUT /api/v1/logs/{externalId}`, `DELETE /api/v1/logs/{externalId}` 연동.
- 기록 사진 업로드는 `POST /api/v1/logs/{externalId}/photos/upload` 사용.
- 기록 사진 삭제는 `DELETE /api/v1/logs/{logExternalId}/photos/{photoExternalId}` 사용.
- 식사/산책/배변/물 섭취의 세부 메모는 서버 필드가 아니라 로컬 `log-extras` 캐시에 저장된다.

### 포토

- 하루 한 장 사진 기능 구현.
- 오늘 사진 카드, 촬영/갤러리 선택, 캡션 입력 모달, 업로드 상태 표시 구현.
- 웹은 file input 기반 선택, 네이티브는 `expo-camera` 촬영 지원.
- `AppHeader` 반려동물 전환 시 하루한장 데이터가 currentPet 기준으로 자동 갱신된다.
- 사진 업로드 전 1080px 기준 압축.
- medium 1080px / thumbnail 300px 생성 후 서버/S3 업로드.
- 같은 날짜에 기존 사진이 있으면 기존 `externalId`를 재사용한다.
- 업로드 실패 상태 보존과 재시도 UI 구현.
- 과거 사진 3열 그리드와 pull-to-refresh 구현.

### 사진 상세/공유

- 세로 paging FlatList 상세 보기 구현.
- 캡션 수정, 앨범 저장, 공유 미리보기, 공유하기, 삭제 구현.
- 캡션은 최대 100자이며 `PATCH /api/v1/photos/{externalId}`로 저장.
- 삭제는 `DELETE /api/v1/photos/{externalId}` 호출 후 로컬/API 캐시 삭제.
- 공유 URL은 `{WEB_BASE_URL}/photos/{externalId}`.
- Vercel 라우팅에서 `/photos/:externalId`는 `api/share-photo.js`로 먼저 연결된다.
- 공유 페이지는 백엔드 공유 API 응답으로 HTML과 OG/Twitter 메타 태그를 렌더링한다.

### 프로필

- 반려동물 프로필 생성/수정 화면 구현.
- 필드: 사진, 이름, 성별, 견종, 생일, 생일 모름, 함께한 날, 체중, 중성화 여부, 건강 메모.
- 저장 시 species는 `"dog"`로 고정.
- 견종은 클라이언트 상수 기반 자동완성 + 자유입력.
- 생일/함께한 날은 네이티브 DateTimePicker와 웹용 select picker를 분기 처리.
- 프로필 사진은 512px 기준 압축 후 base64로 저장/전송.
- 저장 후 pet 캐시와 current pet 상태 갱신.
- `AppHeader` 반려동물 전환 시 프로필 탭이 currentPet 기준으로 자동 갱신된다.
- `AppHeader` 드롭다운 하단 "반려동물 추가" 버튼 → 기존 프로필 입력 UI를 생성 모드로 재사용. 생성 성공 시 pet 목록 캐시 갱신 + 신규 pet을 currentPet으로 설정.
- 반려동물 삭제 버튼 추가 방향 확정. API 연동 예정 (`DELETE /api/v1/pets/{externalId}` 호출 후 로컬 캐시 정리).

### 설정

- 권한 섹션: 알림, 카메라, 사진 접근 권한 설정 열기.
- 데이터 섹션: 데이터 백업/내보내기, 데이터 가져오기는 출시 예정. 캐시 비우기는 구현 완료.
- 정보 섹션: 개인정보처리방침, 이용약관, 버전 정보.
- 지원 섹션: 문의하기, 업데이트 소식, 리뷰 남기기, 후원하기, 꼬리 흔들게 하기.
- 계정 섹션: 로그아웃 구현 완료. **회원 탈퇴 UI 구현 완료** (탈퇴 전 안내, Web/native 확인 모달, `DELETE /api/v1/users/me` 호출, 성공 시 세션 정리 + 로그인 화면 이동).
- 리뷰 남기기는 앱 출시 후 실제 App Store ID로 교체 필요.

## 인프라

- 서비스 도메인: `kkori.co.kr`
- API 도메인: `api.kkori.co.kr`
- DNS A 레코드: `api.kkori.co.kr -> 13.124.220.29`
- 최종 운영 API URL: `https://api.kkori.co.kr`
- 새 Lightsail Public IP: `13.124.220.29`
- 기존 서버 IP `3.38.97.234`는 이전 서버 IP.
- HTTPS: Let's Encrypt + Certbot + Nginx 적용 완료.
- Certbot 인증서 발급 완료, `certbot renew --dry-run` 성공.
- Spring Boot API 컨테이너와 PostgreSQL 컨테이너 정상 구동 확인.

운영 흐름:

```text
앱
-> https://api.kkori.co.kr
-> Nginx 443
-> Spring Boot 8080
-> PostgreSQL 16
-> S3
```

도메인 역할:

- `kkori.co.kr` / `www.kkori.co.kr`: Vercel 웹 랜딩, 개인정보처리방침, 계정삭제 안내, 가족 공유/메모리얼 페이지
- `api.kkori.co.kr`: Lightsail Spring Boot API

서버 포트:

- 22 SSH
- 80 HTTP / Certbot / HTTPS redirect
- 443 HTTPS API
- 8080은 최종적으로 외부 공개를 닫는 방향이며 현재 닫힘 여부 확인 필요

## S3 업로드 메모

- S3 사진 업로드 정상 동작 확인 완료.
- Lightsail에 IAM Role을 따로 붙인 것이 아니라면 아래 환경변수가 필요하다.
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_REGION`
  - `AWS_S3_BUCKET`
- `AWS_S3_BUCKET`은 `s3://`, URL, 경로 없이 순수 버킷명만 넣어야 한다.
- 과거 `S3Exception: The specified bucket is not valid` 원인은 Docker 컨테이너에 AWS/S3 환경변수가 전달되지 않던 문제였다.

## 현재 주의사항

- `.env.example`에는 `EXPO_PUBLIC_SHARE_API_URL`이 없지만 `photoApi.getSharedPhoto()`에서 사용 중이다.
- 문서에는 `EXPO_PUBLIC_DEV_API_URL` 언급이 있으나 현재 `lib/api/client.ts`는 개발 모드에서 항상 `http://localhost:8080`을 사용한다.
- `WEB_BASE_URL` 기본값과 `.env.example`은 아직 `https://kkori.vercel.app` 기준이다. 운영 도메인 `kkori.co.kr` 전환 시 갱신 필요하다.
- 프로필 `gender` 요청 타입은 코드상 `male` / `female` 소문자로 전송한다. 서버 문서가 `MALE` / `FEMALE` 기준이면 정합성 확인이 필요하다.
- AI 리포트, 포토 달력 만들기, 데이터 백업/가져오기, 알림 기능은 아직 출시 예정 상태다.

## 다음 작업 후보

1. **[배포 전 필수]** 운영 DB 마이그레이션 — `user-withdrawal-migration.sql` + `user_oauth_token` DDL 수동 실행
2. 반려동물 삭제 버튼 API 연동 (프로필 탭 → `DELETE /api/v1/pets/{externalId}` + 로컬 캐시 정리)
3. 8080 외부 포트 닫기 확인
4. Vercel에 `kkori.co.kr` / `www.kkori.co.kr` 연결 및 개인정보처리방침/이용약관/계정삭제 안내 페이지 배포
5. `.env.example`과 실제 사용 환경변수 정합성 정리
6. Google revoke 실기기 QA
7. Phase F AI 리포트 설계

## 작업 스타일

- 사용자는 Spring Boot 경험이 풍부하고 React Native, TypeScript는 학습 중이다.
- 모르는 개념은 짧게 설명하면 좋다.
- 한 번에 한 화면씩 진행한다.
- 화면 확인은 사용자가 직접 진행한다.
- 프롬프트의 검증은 검증 포인트/기대 동작 중심으로 작성한다.
- 불필요한 리팩터링은 하지 않는다.
- React Native + Expo + TypeScript strict를 유지한다.

## 실행 명령

```bash
npx expo start
npm run web
npm run lint
```
