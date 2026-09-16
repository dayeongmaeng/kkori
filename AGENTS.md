# kkori 저장소 작업 가이드

이 문서는 `kkori` 저장소 전체에 적용되는 단일 에이전트 가이드다. Claude를 포함한 모든 코딩 에이전트는 이 문서를 먼저 읽고 따른다. `CLAUDE.md`는 이 문서를 불러오는 진입점일 뿐이며, 프로젝트 규칙을 중복 작성하지 않는다.

## 1. 문서와 작업 원칙

- 사실의 우선순위는 현재 코드와 설정 파일, 이 문서, `README.md` 순이다. 문서와 코드가 다르면 코드를 확인하고 같은 작업에서 문서도 갱신한다.
- 이 저장소는 Expo 클라이언트와 Vercel 공유 페이지를 담는다. Spring Boot 백엔드는 별도 저장소(`kkori-api`)이므로 명시적 요청 없이 변경하지 않는다.
- 요청 범위 밖의 대규모 리팩터링, 의존성 교체, 네이티브 워크플로 전환을 하지 않는다.
- 기존 작업 트리 변경은 사용자 소유다. 관련 없는 변경을 되돌리거나 정리하지 않는다.
- `.gitignore`에 포함된 `.env*`, 인증서, 키, 빌드 산출물은 읽거나 커밋하지 않는다. 공개 가능한 변수 이름과 예시는 `.env.example`에만 둔다.
- `EXPO_PUBLIC_*` 값은 앱 번들에 포함되어 사용자에게 노출된다. OAuth client ID처럼 공개 가능한 식별자만 넣고 서버 비밀키나 토큰은 절대 넣지 않는다.
- 변경 이력을 이 문서에 계속 쌓지 않는다. 반복될 가능성이 높은 제약만 `회귀 방지 규칙`에 남기고 일반 이력은 Git을 사용한다.

## 2. 제품 개요

- 앱 이름: `꼬리` (`kkori`)
- 목적: 반려동물의 일상·건강 기록과 하루 한 장 사진 일기
- 현재 지원 동물: 강아지와 고양이. 최대 3마리까지 등록 가능하다.
- 핵심 기능: OAuth 로그인, 반려동물 프로필, 일일 기록, 기록 사진, 하루 한 장, 한달 한장 월력, 로컬 알림, 사진 공유, 로그아웃과 회원 탈퇴
- 제품 방향: 병원 방문 전 리포트, 장기 패턴 분석, 가족 공유 등으로 확장
- iOS App Store 출시 기록: 2026-07-08. 출시 상태나 스토어 메타데이터는 저장소만으로 확정하지 말고 배포 작업 전에 다시 확인한다.
- iOS가 우선 대상이고 웹을 개발·확인에 적극 사용한다. Android 네이티브 프로젝트와 인증 코드도 존재하지만 릴리스 준비 상태는 별도로 검증해야 한다.

## 3. 기술 스택과 식별자

- Expo SDK 54, React Native 0.81.5, React 19, TypeScript 5.9 strict
- Expo Router 6의 파일 기반 라우팅과 typed routes
- React Context: 인증, KST 기준 날짜, 현재 반려동물
- AsyncStorage: 일반 상태와 서버 캐시
- SecureStore: iOS/Android 인증 토큰
- 이미지: `expo-image`, `expo-image-picker`, `expo-camera`, `expo-image-manipulator`, `expo-media-library`, `react-native-view-shot`, `html2canvas`
- 알림: `expo-notifications`
- 에러 추적: `@sentry/react-native`
- Web export와 공유 페이지: Vercel
- 백엔드: Spring Boot + PostgreSQL + S3, `https://api.kkori.co.kr`
- 앱 scheme: `kkori`
- iOS bundle ID / Android application ID: `com.kkutudio.kkori`
- 새 아키텍처와 Hermes 활성화
- Expo managed/config-plugin 흐름을 유지한다. `android/`, `ios/`는 커밋된 prebuild 결과이므로 eject를 제안하지 않는다.

## 4. 저장소 지도

| 경로 | 역할 |
| --- | --- |
| `app/_layout.tsx` | Sentry, 스플래시, 온보딩, 앱 초기화, Provider, 루트 Stack |
| `app/(tabs)/` | 홈, 기록, 하루한장, 프로필, 설정 탭 |
| `app/photo/[id].tsx` | 인증 사용자용 사진 상세·캡션·공유·삭제 |
| `app/photos/[externalId].tsx` | Expo 기반 공개 사진 화면. Vercel 운영 경로에서는 API route가 우선한다. |
| `app/oauth/kakao.tsx` | 웹 Kakao callback과 네이티브 deep link 연결 |
| `components/` | 화면 조각, 입력기, 인증 UI, 월력 캔버스 |
| `contexts/` | `AuthContext`, `DateContext`, `PetContext` |
| `lib/api/` | HTTP client, DTO, 도메인 API, 로그인 후 세션 동기화 |
| `lib/cache/` | 서버 응답의 AsyncStorage 캐시 |
| `lib/auth/tokenStorage.ts` | 플랫폼별 토큰 저장과 세션 캐시 정리 |
| `lib/notifications.ts` | 일일 기록 알림 저장·스케줄링 |
| `lib/storage.ts` | v1 로컬 데이터와 마이그레이션용 레거시 계층. 새 서버 기능의 저장소로 사용하지 않는다. |
| `constants/theme.ts` | 색상, 간격, radius, shadow, typography의 기준 |
| `api/share-photo.js` | Vercel 서버리스 공유 HTML과 OG/Twitter 메타 |
| `assets/` | 실제 사용 자산과 원본/백업 브랜드 자산 |
| `android/`, `ios/` | Expo prebuild 네이티브 프로젝트 |
| `app.config.js`, `app.json`, `eas.json` | Expo 동적 설정, 공통 앱 설정, EAS 프로필 |
| `vercel.json` | 정적 export와 `/photos/:id` 공유 route 우선순위 |

주의할 루트 파일:

- `scripts/reset-project.js`는 Expo 템플릿 잔재이며 `app`, `components`, `hooks`, `constants`, `scripts`를 이동하거나 삭제한다. `npm run reset-project`를 실행하지 않는다.
- `er.name`은 앱 런타임 설정이 아닌 Git 설정 덤프 형태의 파일이다. 명시적 요청 없이 사용하거나 수정하지 않는다.
- `assets/resources/`와 `assets/tabs/backup/`은 원본·변형·백업 자산을 포함한다. 중복처럼 보여도 임의 삭제하지 않는다.

## 5. 실행과 검증 명령

```bash
npm ci
npm start
npm run web
npm run android
npm run ios
npm run build
npm run lint
npx tsc --noEmit
```

- 잠금 파일이 있으므로 깨끗한 설치는 `npm ci`를 우선한다.
- Windows에서는 iOS 로컬 빌드를 직접 검증할 수 없다. iOS 네이티브 확인은 macOS/Xcode 또는 EAS Build가 필요하다.
- 자동 테스트 스크립트나 테스트 프레임워크는 현재 없다. 최소 검증은 변경 파일 확인, `npm run lint`, `npx tsc --noEmit`이다.
- 웹 동작 변경은 가능하면 `npm run build`도 수행한다.
- 네이티브 권한, OAuth callback, 알림, 사진 저장은 웹 검증만으로 완료 처리하지 않는다.
- `app.config.js` 또는 네이티브 plugin 설정을 바꾸면 필요한 플랫폼에 `npx expo prebuild --platform <ios|android>`를 적용하고 생성 diff를 검토한다. 무관한 네이티브 변경은 포함하지 않는다.

## 6. 앱 시작과 전역 상태

시작 순서는 다음과 같다.

1. `app/_layout.tsx`가 Sentry를 초기화하고 스플래시 이미지를 preload한다.
2. `migrateLegacyData()`가 레거시 로컬 데이터 보정을 시도한다. 실패는 앱 시작을 막지 않는다.
3. `initApp()`이 `expo-crypto` UUID 기반 device ID를 만들고 `/api/v1/devices/register`에 등록한다.
4. OAuth callback이 아니고 토큰도 없는 최초 사용자에게 온보딩을 보여준다.
5. `AuthProvider`가 첫 네이티브 실행 여부를 확인하고 토큰을 복원한다.
6. 인증되면 `syncServerSessionData()`가 caregiver, pets, 각 pet의 logs/photos를 서버에서 받아 캐시한다.
7. `PetProvider`가 캐시된 현재 pet을 복원한다.

Provider 중첩 순서는 `AuthProvider > DateProvider > PetProvider`다.

- `DateProvider`는 `YYYY-MM-DD` 형식의 KST 오늘 날짜를 제공하며 KST 자정과 앱 활성화 시 갱신한다.
- pet 전환 시 각 탭은 이전 pet의 화면 상태를 즉시 비우고 캐시/서버를 다시 읽는다.
- 목록 화면의 기본 전략은 cache-first, server-refresh다. 네트워크 실패 시 기존 캐시를 유지한다.

## 7. 라우트와 화면 상태

### 홈 `app/(tabs)/index.tsx`

- 현재 pet 프로필, 오늘 기록 요약, 최근 7일 컨디션, AI 리포트 preview를 표시한다.
- AI 리포트 카드는 현재 `출시 예정`이다.
- 네이티브 최초 홈 진입 시 알림 권한을 한 번 요청하고 `kkori:notification-permission-requested`로 기록한다.

### 기록 `app/(tabs)/log.tsx`

- 날짜 이동과 기록일 표시 달력, 명시적 저장/삭제를 제공한다. 자동 저장이 아니다.
- 공통 항목: 컨디션, 식사, 물, 배변, 구토, 메모, 최대 3장의 기록 사진
- 강아지: 산책, 소변 색, 체중
- 고양이: 놀이, 소변 양. species가 없거나 알 수 없으면 강아지 UI가 기본이다.
- 신규 기록과 사진은 `POST /api/v1/logs/with-photos` multipart로 한 번에 생성한다.
- 기존 기록은 먼저 `PUT /api/v1/logs/{id}` 후 대기 중인 사진을 순차 업로드한다. 성공한 사진은 즉시 상태를 바꿔 중간 실패 때 중복 업로드하지 않는다.
- 서버에 이미 저장된 기록 사진 삭제는 즉시 API를 호출한다.
- `pet-care:log-extras:*`는 이전 메모 필드의 읽기 폴백이다. 새 값은 API 필드에 저장한다.

### 하루한장 `app/(tabs)/photo.tsx`

- 오늘 사진, 캡션, 압축/업로드, 실패 재시도, 과거 사진 3열 grid를 제공한다.
- 하루 한 장 메타를 먼저 만들거나 같은 날짜의 기존 `externalId`를 재사용한 뒤 medium 1080px와 thumbnail 300px을 업로드한다.
- 로컬 원본은 `pet-care:photo-data:{externalId}`에 보조 캐시한다.
- 웹은 파일 input을 사용한다. 네이티브 camera/gallery 흐름은 `TodayPhotoCard`와 `ImagePickerSheet`에 있다.
- `한달 한장` 월력 preview와 웹 다운로드/네이티브 앨범 저장이 구현되어 있다.

### 사진 상세와 공개 공유

- `app/photo/[id].tsx`: 세로 feed, 100자 캡션 수정, 공유 preview, 삭제
- 사진을 앨범에 저장하는 구현은 존재하지만 `components/PhotoActionSheet.tsx`의 메뉴가 주석 처리되어 현재 UI에서는 진입할 수 없다.
- 공유 URL은 `${EXPO_PUBLIC_WEB_URL}/photos/{externalId}`다.
- `vercel.json`은 `/photos/:externalId`를 `api/share-photo.js`로 먼저 보내 정적 HTML과 OG 메타를 생성한다. Expo의 `app/photos/[externalId].tsx`는 별도 fallback/개발 화면이다.
- 공개 공유 응답의 `petSpecies`가 없으면 강아지 로고가 기본이다.

### 프로필 `app/(tabs)/profile.tsx`

- 생성/수정/삭제와 최대 3마리 전환을 지원한다.
- 필수: 이름, 품종, 성별, 생일 또는 생일 모름, 체중 또는 체중 모름
- 선택: 함께한 날, 중성화, 건강 메모, 프로필 사진
- API species는 `DOG | CAT`, gender는 `male | female` 소문자다.
- 프로필 이미지는 512px JPEG/base64로 준비해 pet 요청에 포함한다.
- 저장 후 pet 목록/current pet/사진 캐시와 context를 함께 갱신한다.

### 설정 `app/(tabs)/settings.tsx`

- 네이티브 일일 기록 알림 시간 지정과 알림 없음, 권한 설정 이동이 구현되어 있다. 웹의 일일 알림 스케줄링은 비활성이다.
- 데이터 백업/내보내기와 가져오기는 `출시 예정`이다.
- 캐시 비우기는 지정된 API/photo/log 캐시만 삭제한 뒤 세션을 다시 동기화한다. `AsyncStorage.clear()`로 전체 데이터를 지우지 않는다.
- 정책/문의/업데이트/후원, 로그아웃, 회원 탈퇴가 구현되어 있다.
- 리뷰 row는 현재 주석 처리되어 있다.

## 8. API, 인증, 세션

### HTTP client

- 기본 API URL은 개발/운영 모두 `https://api.kkori.co.kr`이다. 로컬 백엔드는 `EXPO_PUBLIC_API_URL=http://localhost:8080`처럼 명시해야 한다.
- 일반 요청은 `X-Device-Id`와 가능한 경우 Bearer access token을 붙인다.
- 응답 계약은 `{ success, data, error, timestamp }`, 오류는 `ApiError(statusCode, { code, message, fields })`다.
- 204와 `Content-Length: 0`은 정상 empty 응답으로 처리한다.
- 401 발생 시 refresh 요청 Promise를 공유해 동시 갱신을 한 번만 수행하고 원 요청을 재시도한다. refresh 실패 시 인증 토큰을 지운다.
- JSON API는 `lib/api/client.ts`, multipart 구성은 각 도메인 API에 둔다.

주요 API 그룹:

- `/api/v1/devices`: 등록과 현재 기기
- `/api/v1/auth`: OAuth login, refresh, logout
- `/api/v1/users/me`: 회원 탈퇴
- `/api/v1/caregivers`: 보호자 CRUD
- `/api/v1/pets`: pet 조회/생성/수정/삭제
- `/api/v1/logs`: 기록 CRUD, with-photos 생성, 기록 사진 업로드/삭제
- `/api/v1/photos`: 하루한장 CRUD, 이미지 업로드, 공개 share 조회

### OAuth

- Google과 Kakao 로그인을 Web/iOS/Android로 분기한다.
- Google Web은 `id_token token`, iOS/Android는 authorization code + PKCE 흐름을 사용한다.
- Google native callback은 각 client ID를 뒤집은 URL scheme을 사용한다. Android에서 `kkori://`를 Google callback으로 사용하지 않는다.
- Kakao Web은 redirect URL로 이동하고, native는 `openAuthSessionAsync`와 `kkori://oauth/kakao` 복귀를 사용한다.
- 로그인 성공 직전 `clearAuthSessionCache()`로 이전 사용자 캐시를 비운 뒤 새 토큰을 저장한다.
- 네이티브 토큰은 SecureStore, 웹 토큰은 AsyncStorage에 저장한다.
- iOS Keychain은 앱 삭제 뒤에도 남을 수 있어 `pet-care:app-installed`가 없는 첫 실행에서 토큰을 초기화한다.
- 로그아웃은 서버 호출 실패 여부와 관계없이 로컬 인증/세션 캐시를 정리한다. 회원 탈퇴는 서버 성공 후에만 로컬 세션을 정리한다.

## 9. 로컬 저장 키

새 키는 `pet-care:` prefix를 사용한다. 기존 `kkori:notification-permission-requested`는 호환을 위해 유지한다.

| 키/접두사 | 용도 |
| --- | --- |
| `pet-care:device-id` | 설치 기기 UUID. 로그아웃 시 보존 |
| `pet-care:auth:*` | access/refresh token과 사용자 |
| `pet-care:api:pets` | pet 목록 |
| `pet-care:api:current-pet-id` | 현재 pet |
| `pet-care:api:current-caregiver-id` | 현재 caregiver |
| `pet-care:api:logs:{petId}` | pet별 기록 |
| `pet-care:api:photos:{petId}` | pet별 하루한장 |
| `pet-care:api:pet-photo:{petId}` | 프로필 사진 base64 |
| `pet-care:photo-data:{photoId}` | 하루한장 로컬 원본 보조 캐시 |
| `pet-care:log-extras:{logId}` | 레거시 메모 폴백 |
| `pet-care:log-photos:{logId}` | 기록 사진 캐시 |
| `pet-care:notification-time` | 알림 시간 |
| `pet-care:notification-enabled` | 알림 사용 여부 |
| `pet-care:onboarding:completed` | 온보딩 완료 |
| `pet-care:hint:*` | 화면별 1회 hint |

캐시 변경 시 다음을 지킨다.

- 서버 mutation 성공 후 관련 캐시와 context/UI 상태를 함께 갱신한다.
- pet 전환, 로그아웃, 회원 탈퇴, 캐시 비우기의 삭제 범위를 각각 구분한다.
- device ID, 온보딩, 알림 설정까지 세션 캐시와 함께 지우지 않는다.
- `lib/storage.ts`의 `pet-care:*:v1` 데이터는 레거시다. 서버 캐시 계층과 섞지 않는다.

## 10. 환경변수와 배포 설정

| 변수 | 용도 | 기본/주의 |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | 앱과 Vercel share proxy의 API | 기본 `https://api.kkori.co.kr` |
| `EXPO_PUBLIC_API_BASE_URL` | share proxy의 레거시 fallback | 앱 client는 사용하지 않음 |
| `EXPO_PUBLIC_WEB_URL` | 공유 링크와 callback base | 기본 `https://kkori.vercel.app` |
| `EXPO_PUBLIC_SHARE_API_URL` | 공개 사진 JSON 조회 base | 기본 `https://api.kkori.co.kr` |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google Web OAuth | 플랫폼별 ID를 섞지 않음 |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Google iOS OAuth | reverse client ID scheme 생성 |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Google Android OAuth | reverse client ID scheme 생성 |
| `EXPO_PUBLIC_KAKAO_REST_API_KEY` | Kakao authorize/code 교환 식별자 | 공개 REST API key |
| `EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY` | Kakao native scheme 구성 | 현재 `.env.example`에 없음 |
| `EXPO_PUBLIC_KAKAO_REDIRECT_URI` | Kakao redirect override | client/server 등록 값이 일치해야 함 |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry 활성화 | 값이 없으면 disabled |
| `EXPO_PUBLIC_SENTRY_ENVIRONMENT` | Sentry environment | dev/prod fallback 존재 |

- `EXPO_PUBLIC_*`는 Metro build-time 치환이다. Vercel/EAS 값을 바꾸면 재빌드해야 한다.
- `.env.example`과 실제 코드 사용 목록이 현재 완전히 일치하지 않는다. 환경변수를 추가·삭제할 때 `.env.example`, `eas.json`, Vercel/EAS 설정을 함께 점검한다.
- `app.config.js`는 Google reverse scheme과 Kakao scheme/query scheme을 생성한다.
- `eas.json`은 `appVersionSource: remote`다. 출시 버전은 EAS 원격 값과 native/app 설정을 함께 확인한다.
- 운영 개념 구조는 `앱/Web -> Nginx 443 -> Spring Boot 8080 -> PostgreSQL/S3`다. DNS, IP, 방화벽, 인증서 상태는 이 클라이언트 저장소의 사실로 간주하지 말고 운영 환경에서 확인한다.
- S3 access key, secret, region, bucket은 백엔드 서버 변수다. 이 저장소의 `EXPO_PUBLIC_*`에 넣지 않는다.

## 11. 플랫폼별 주의점

### Web

- native API를 그대로 호출하지 말고 파일 input, DOM download, `window.confirm/alert`, browser permission 같은 fallback을 유지한다.
- `lib/dialog.ts`를 우선 사용해 native `Alert`와 웹 dialog를 통일한다.
- 원격 이미지 캡처는 CORS의 영향을 받는다.
- 월력 다운로드는 raw `div/span`의 inline style, CSS `background-image`, `html2canvas({ useCORS: true, scale: 10 })`에 의존한다. react-native-web style class나 `<img object-fit>`로 단순 치환하지 않는다.

### iOS

- 주 대상 플랫폼이며 카메라·사진첩·알림 권한 문구와 OAuth URL scheme을 보존한다.
- SecureStore/Keychain 최초 설치 정리 로직을 제거하지 않는다.
- iPad 지원이 켜져 있으므로 phone width만 가정하지 않는다.

### Android

- Google OAuth callback intent filter, 알림 channel, edge-to-edge/new architecture/Hermes 설정이 있다.
- 현재 `android/app/build.gradle`의 release build가 debug signing config를 사용한다. 실제 배포 전에 production signing 구성이 필요하다.
- 기능 코드가 있다는 이유만으로 Play Store 배포 준비 완료로 간주하지 않는다.

## 12. 코딩 규칙

- 함수형 컴포넌트와 hooks를 사용하고 TypeScript strict를 유지한다.
- alias `@/* -> ./*`가 있지만 기존 파일의 상대 import 스타일을 불필요하게 일괄 변경하지 않는다.
- 새 UI 문구는 한국어, 따뜻하고 간결한 톤을 사용한다.
- 색상, spacing, radius, shadow, typography는 `constants/theme.ts`를 우선한다.
- 서버 날짜는 `YYYY-MM-DD` 문자열을 유지하고 오늘 기준 로직은 KST를 사용한다. 임의의 `new Date('YYYY-MM-DD')` 변환으로 날짜를 밀리게 하지 않는다.
- API DTO의 대소문자를 임의 정규화하지 않는다. 특히 API species `DOG/CAT`, gender `male/female`, 레거시 `lib/types.ts` species `dog/cat`의 경계를 구분한다.
- 비동기 mutation은 중복 실행 방지, loading/error 상태, 캐시 동기화, 재시도 가능성을 함께 고려한다.
- 기존 화면은 큰 파일이 많다. 새 복잡도를 더할 때는 컴포넌트/도메인 helper 분리를 우선 검토하되, 요청과 무관한 분할 리팩터링은 하지 않는다.
- 웹/native 분기는 기존 `Platform.OS` 패턴을 따른다.
- dependency를 추가하기 전에 Expo SDK 54/RN 0.81 호환성과 기존 도구로 해결 가능한지 확인한다.
- `package-lock.json`, Podfile.lock, native 생성 파일을 수동으로 부분 편집하지 않는다. 해당 도구로 갱신하고 diff를 검토한다.

## 13. 로깅과 개인정보

- 앱 코드에서 `console.log/info/warn/error`를 직접 호출하지 않는다. `lib/logger.ts`의 `logger.debug/info/warn/error`를 사용한다. logger 내부 console 위임은 예외다.
- 이벤트명은 `도메인.행위.결과` 형식을 사용한다. 예: `photo.upload.request.failed`.
- error payload는 `toLogError(error)`를 사용해 `status`, `errorCode`, `message` 수준만 남긴다.
- access token, refresh token, id token, OAuth code, 비밀번호, 사용자 입력 전문, API 응답 전문, query가 포함된 URL을 로그에 남기지 않는다.
- warn/error는 Sentry message로 전송된다. 디버깅 편의를 이유로 민감 값을 payload에 추가하지 않는다.

## 14. 변경별 검증 체크리스트

### 공통

1. 변경 범위와 관련 캐시/API/context를 확인한다.
2. loading, empty, offline/cache, error, retry 상태를 확인한다.
3. 현재 pet 전환과 앱 background -> active 복귀를 확인한다.
4. `npm run lint`와 `npx tsc --noEmit`을 실행한다.

### 기록/프로필

- 강아지와 고양이 양쪽을 확인한다.
- 신규 생성, 기존 수정, 삭제, 서버 실패를 확인한다.
- 날짜 이동 중 이전 비동기 응답이 새 화면 상태를 덮지 않는지 확인한다.
- 사진 0장/1장/3장, 압축 중 저장 방지, 일부 업로드 성공 후 재시도를 확인한다.

### 하루한장/월력

- local base64, remote medium/thumbnail, 이미지 로드 실패를 확인한다.
- 같은 날짜 사진 교체가 새 metadata를 중복 생성하지 않는지 확인한다.
- 웹 다운로드와 네이티브 앨범 저장을 별도로 확인한다.
- 4주/5주/6주 달, 사진이 없는 달, 미래 달, 연도 경계를 확인한다.

### 인증/설정

- Web/iOS/Android의 client ID와 redirect URI를 혼용하지 않는다.
- 로그인, 앱 재실행 복원, 401 refresh, 로그아웃, 회원 탈퇴를 구분해 확인한다.
- 알림 허용/거부/미결정, 알림 없음 -> 다시 활성화, 앱 설정 복귀를 확인한다.

## 15. 현재 코드에서 확인된 주의/후속 항목

- `api/share-photo.js`의 `formatDateKorean()`에 `Numbe1r(month)` 오타가 있다. 유효한 공유 응답 렌더링이 실패할 수 있으므로 공유 기능 작업 시 최우선 확인 대상이다.
- `.env.example`에는 코드가 사용하는 `EXPO_PUBLIC_SHARE_API_URL`, `EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY`, Sentry 변수가 없다.
- `WEB_BASE_URL` 기본값/EAS 값은 `https://kkori.vercel.app`이지만 root web meta는 `https://kkori.co.kr`을 사용한다. 운영 도메인 전환 상태를 확인한 뒤 한 기준으로 맞춰야 한다.
- 앱 버전 표기가 `app.json`, native 프로젝트, fallback 문자열 사이에서 다르다. EAS remote version을 포함해 출시 전에 검증한다.
- 리뷰 URL은 placeholder이고 설정 화면의 리뷰 row도 주석 처리되어 있다.
- Android release는 debug key로 서명하도록 되어 있다.
- AI 리포트와 데이터 backup/import는 아직 출시 예정이다. 반면 한달 한장과 네이티브 일일 알림은 구현 완료이므로 오래된 문서의 `출시 예정` 표현을 되살리지 않는다.
- 자동화 테스트가 없다. 회귀 위험이 큰 로직을 수정할 때는 가능한 범위에서 테스트 기반을 추가하되, 별도 요청 없이 전체 테스트 체계를 도입하지 않는다.

## 16. 회귀 방지 규칙

### 설정의 일일 기록 알림

- `일일 기록 알림` row는 항상 탭 가능하다.
- `기록 알림 없음`은 독립 row가 아니라 시간 선택 modal 내부 checkbox다.
- 알림 없음일 때 picker wheel은 `opacity: 0.3`, `pointerEvents="none"`이다.
- 알림이 꺼진 상태에서는 권한 확인 없이 modal을 열어 다시 켤 수 있어야 한다.
- 완료 시 `pickerNoAlarm=true`면 저장된 알림을 비활성화하고 예약을 취소한다. false면 시간을 저장하고 예약하며 활성화를 복원한다.
- `expo-notifications`의 권한 요청과 schedule/cancel 순서를 변경할 때 실제 iOS/Android를 검증한다.

### 한달 한장 월력

- 월 이동 UI는 grid 위의 `‹ YYYY년 M월 ›` header다. 이전 범위는 가장 오래된 사진 연도의 1월, 다음 범위는 현재 연도 + 1년의 12월까지다.
- preview의 사진 cell은 컨테이너와 동일한 명시 크기 `dp(115)`와 `overflow: hidden`을 유지한다.
- 캡처 전용 hidden view는 rounded `sheet` 안이 아니라 radius가 없는 `backdrop` level에 둔다. iOS layer mask가 offscreen canvas를 자를 수 있다.
- preview와 download canvas의 기준 높이는 `1500 / 1080`, 상단 padding은 `dp(120)`이다. 둘 중 하나만 바꾸지 않는다.
- 화면 preview와 실제 저장 이미지는 별도 renderer다. `MonthlyCalendarModal.tsx`와 `MonthlyCalendarDownloadCanvas.tsx`를 함께 확인한다.
- 웹 download renderer의 raw DOM/inline style/background-image 방식은 html2canvas 제약을 우회하기 위한 것이므로 근거 없이 RN `View/Text/Image`로 통합하지 않는다.

## 17. 협업 방식

- 사용자는 Spring Boot 경험이 많고 React Native/TypeScript는 학습 중이다. 생소한 RN/Expo 개념은 짧게 설명한다.
- 결과를 먼저 말하고 변경 파일, 검증 결과, 남은 위험을 구체적으로 전달한다.
- 화면 확인이 필요한 경우 재현 단계보다 기대 동작과 확인 포인트를 우선 제시한다.
- 한 번에 요청된 화면과 흐름에 집중하고, 발견한 별도 문제는 무단 수정하지 말고 명확히 보고한다.
