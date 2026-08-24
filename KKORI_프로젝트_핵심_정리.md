# 꼬리(KKORI) 프로젝트 핵심 정리

> 기준: 2026-08-24 코드베이스 실사 (클라이언트 `C:\dev\projects\kkori`, 서버 `C:\dev\projects\kkori-api`)
> 참고: 두 저장소 모두 마지막 코드 커밋은 2026-07-07(기능)/07-13(문서 갱신)이며, 그 이후 코드 변경은 없다. 즉 기존 `CLAUDE.md`/`PROJECT_CONTEXT.md`는 코드와 날짜상 어긋나지 않으나, 세부 항목 중 실제 구현 상태와 다르게 적힌 부분이 있어 아래에서 교정했다.

---

## 0. 기존 문서 대비 달라진 점 (요약)

| 항목 | 기존 문서 | 실제 코드 확인 결과 | 조치 |
|---|---|---|---|
| 알림 기능 | "아직 출시 예정" | `lib/notifications.ts` + 설정 탭에 **로컬 일일 리마인더 알림이 실제로 구현되어 있음** (`expo-notifications`, 시간 선택 UI, 권한 요청/재확인 포함). 단 서버 푸시 토큰 등록 코드는 없음(로컬 알림만) | "예정" → "지원(로컬 알림만)" 으로 수정 |
| 데이터 백업/내보내기, 데이터 가져오기 | "출시 예정" | 설정 탭에 `ComingSoonBadge` 그대로 남아있음, 구현 없음 | 기존 기술 유지 (변경 없음) |
| AI 리포트 | "출시 예정" | `components/AiReportPreview.tsx` 카드 탭 시 "곧 출시될 기능이에요" 알림만 뜸. 실제 리포트 로직 없음 | 기존 기술 유지 (변경 없음) |
| 프로필 `gender` 소문자 전송 관련 "정합성 확인 필요" | "서버 문서가 MALE/FEMALE 기준이면 확인 필요" | 서버 `application.yaml`에 `jackson.deserialization.accept-case-insensitive-enums: true` 설정 확인. 클라이언트가 보내는 `male`/`female` 소문자가 서버 `Gender.MALE`/`FEMALE`로 정상 매핑됨 | "확인 필요" 항목에서 제거, "확인됨(문제없음)"으로 표기 |
| 사진 상세 액션 시트 | "저장하기(앨범 저장) 메뉴만 주석 처리" | `PhotoActionSheet.tsx`에서 `onSaveToAlbum` **뿐 아니라 `onShare` 메뉴 항목도 함께 주석 처리**되어 있음. 다만 공유 기능 자체는 별도 공유 미리보기 모달(`openSharePreview` → `Share.share()`)로 살아있어 기능 손실은 아님 | 세부 서술 보강 |
| Google Android Client ID | 문서에 명시 없음 | `components/googleAuthConfig.ts`에 `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` 분기 코드가 이미 존재함(리다이렉트 URI 구성 로직 포함). 다만 Android 앱 자체는 아직 미출시이며 실기기 검증 없음 | 신규 항목으로 추가, "코드상 준비/미검증"으로 표기 |
| 반려동물 최대 등록 수 안내 | 서버 정책만 문서화 | 클라이언트 `AppHeader.tsx`가 `PET_003` 상황을 별도 안내 모달("반려동물은 최대 3마리까지 등록할 수 있어요")로 처리하는 코드까지 확인됨 | 클라이언트 처리 흐름 보강 |

이 외 항목(기술 스택 버전, 기록 DTO 필드, OAuth redirect 구조, soft delete/회원탈퇴/S3 정책, 하루 한 장 UI 구조)은 기존 문서 내용과 실제 코드가 **일치**함을 확인했다.

---

## 1. 기술 스택 (버전 확인)

### 클라이언트 (`package.json` 기준)

| 구분 | 값 |
|---|---|
| Expo SDK | `~54.0.35` |
| React Native | `0.81.5` |
| React | `19.1.0` |
| TypeScript | `~5.9.2` |
| Expo Router | `~6.0.24` |
| Sentry (`@sentry/react-native`) | `^8.15.1` |
| expo-camera | `~17.0.10` |
| expo-image-picker | `~17.0.11` |
| expo-image-manipulator | `~14.0.8` |
| expo-image | `~3.0.11` |
| expo-notifications | `~0.32.17` |
| expo-secure-store | `~15.0.8` |
| react-native-calendars | `^1.1314.0` |

### 서버 (`kkori-api/PROJECT_CONTEXT.md` + `build.gradle` 기준)

| 구분 | 값 |
|---|---|
| Spring Boot | 3.5.14 |
| Java | 21 |
| DB | PostgreSQL 16 |
| ORM | JPA/Hibernate |
| 빌드 도구 | Gradle |
| 기타 | Lombok, springdoc-openapi |

### 인프라

- AWS Lightsail (Seoul, `ap-northeast-2a`), Ubuntu 24.04 LTS, Docker Compose, Nginx, Let's Encrypt, S3
- 운영 API: `https://api.kkori.co.kr` (Public IP `13.124.220.29`)

---

## 2. 반려동물 등록 로직

- **최대 등록 수**: 사용자(또는 디바이스)당 **최대 3마리**. `PetService`에 `MAX_PETS_PER_USER = 3` 상수로 구현 (2026-06-05 적용).
- **초과 시 에러코드**: `PET_003` (HTTP 400, "반려동물은 최대 3마리까지 등록할 수 있습니다.")
- **클라이언트 처리**: `components/AppHeader.tsx`가 이 상황을 감지해 "반려동물은 최대 3마리까지 등록할 수 있어요" 안내 모달을 별도로 띄운다. 서버 에러 메시지를 그대로 노출하지 않고 UX용 문구로 감싼다.
- **소유권 판단**: `userId` 우선, 없으면 `deviceId` fallback.
- **삭제**: `DELETE /api/v1/pets/{externalId}` → 204. Pet 삭제 시 DailyLog → DailyLogPhoto, DailyPhoto까지 cascade soft delete. S3 이미지 삭제는 `PetImageCleanupEvent`/`PetImageCleanupListener`로 트랜잭션 커밋 후(`AFTER_COMMIT`) 비동기 처리.

### 관련 에러코드 전체 목록 (`ErrorCode.java`)

| 코드 | HTTP | 의미 |
|---|---|---|
| PET_001 | 404 | 반려동물을 찾을 수 없음 |
| PET_002 | 409 | 이미 존재하는 반려동물 ID |
| PET_003 | 400 | 최대 3마리 초과 |
| USER_001 | 404 | 사용자를 찾을 수 없음 |
| USER_002 | 409 | 이미 탈퇴한 사용자 |
| AUTH_001~004 | 400/401 | OAuth 미지원 제공자 / 토큰 검증 실패 / 유효하지 않은 토큰 / 토큰 만료 |
| PHOTO_001~006 | 404/409/500/400 | 사진 없음 / 날짜 중복 / 업로드 실패 / 파일형식·용량 초과 |
| LOG_001~003 | 404/409 | 기록 없음 / 날짜 중복 / ID 중복 |
| LOG_PHOTO_001~002 | 404/409 | 기록 사진 없음 / 최대 3장 초과 |
| CAREGIVER_001~002 | 404/409 | 보호자 없음 / ID 중복 |
| DEVICE_001~002 | 400/404 | Device-Id 헤더 누락 / 디바이스 없음 |
| VALIDATION_001 | 400 | 입력값 오류 |

---

## 3. 기록(DailyLog) 데이터 구조

`currentPet.species` 기준으로 강아지/고양이 UI를 분기한다 (`dog`/`DOG` → 강아지, `cat`/`CAT` → 고양이, 미설정 시 강아지 기본값). 서버 DTO(`kkori-api` DailyLog 엔티티)와 클라이언트 `lib/api/log.ts` 타입이 실제로 동일한 필드셋을 사용함을 확인했다.

| 항목 | 강아지 | 고양이 | 필드명 |
|---|:---:|:---:|---|
| 컨디션 | ✅ | ✅ | `condition` |
| 식사 | ✅ | ✅ | `meal`, `mealNote` |
| 산책 | ✅ | – | `walkMinutes`, `walkNote` |
| 놀이 | – | ✅ | `playMinutes`, `playNote` |
| 배변(대변) | ✅ | ✅ | `pooCondition`, `pooNote` |
| 배변(소변, 색) | ✅ | – | `urineColor`, `urineNote` |
| 배변(소변, 양) | – | ✅ | `urineAmount`(enum: `LITTLE`/`NORMAL`/`MUCH`), `urineNote` |
| 물 섭취 | ✅ | ✅ | `water`, `waterNote` |
| 구토 | ✅ | ✅ | `vomitCount`, `vomitNote` |
| 체중 | ✅ | – | `weightKg` |
| 기록 사진 | ✅ (최대 3장) | ✅ (최대 3장) | `DailyLogPhoto` |
| 메모 | ✅ | ✅ | `memo` |

- `unique(petId, date)` 제약 — 반려동물당 하루 1개 기록.
- 저장 방식: 자동저장 없음, 저장 버튼 클릭 시 신규는 `POST /api/v1/logs`, 기존은 `PUT /api/v1/logs/{externalId}`.
- **사진 저장 시점**: 사진 선택 시 로컬 압축까지만 처리. 저장 버튼 클릭 시 로그 저장과 함께 사진을 순차 업로드하며, 성공한 사진은 즉시 상태 반영해 재업로드하지 않음. 서버에는 `POST /api/v1/daily-logs/with-photos`(기록 등록+사진 업로드 통합 API, 2026-07-07 추가)도 존재.
- 레거시 로컬 캐시 `pet-care:log-extras:{logExternalId}`는 구버전 데이터 폴백 읽기 전용으로만 남아있고, 세부 메모 필드는 모두 서버 API 필드로 저장된다.

---

## 4. 로그인 방식 (OAuth)

이메일/비밀번호 가입 없음. OAuth 전용(`GOOGLE`, `KAKAO`, `APPLE` enum 존재하나 실제 구현은 Google/Kakao만, Apple은 enum만 준비).

### Google

| 플랫폼 | 흐름 | Redirect URI                                                                                            |
|---|---|---------------------------------------------------------------------------------------------------------|
| Web | `response_type=id_token token` (implicit) | `{origin}/oauth/google`                                                                                 |
| iOS | native OAuth, idToken 기반 | reverse client id 스킴 (`{역순 iOS Client ID}:/`)                                                           |
| Android | 코드상 분기는 존재하나 미출시/미검증 | reverse client id 스킴 (`{역순 Android Client ID}:/`) — `kkori://`    커스텀 스킴은 Google이 Error 400 반환하므로 사용 불가 |

- 서버는 Google access token을 `UserOAuthToken`에 AES-256-GCM 암호화 저장, 탈퇴 시 revoke에 사용.

### Kakao

| 플랫폼 | Redirect URI |
|---|---|
| Web (개발) | `http://localhost:8081/oauth/kakao` |
| Web (운영) | `https://api.kkori.co.kr/oauth/kakao` |
| iOS (인앱 로그인) | `kakao{NATIVE_APP_KEY}://oauth` (Kakao Developers 등록 필요) |
| iOS (웹뷰 fallback, 실기기) | `https://api.kkori.co.kr/oauth/kakao` (localhost는 실기기 접근 불가라 항상 운영 URL 사용) |

- Kakao authorization code redirect는 정적 페이지 `/oauth/kakao`(`static/oauth/kakao.html`)를 거쳐 `kkori://oauth/kakao` 딥링크로 앱에 포워딩됨.
- 서버는 로그인 성공 시 `/api/v1/auth/oauth/login`으로 access/refresh 토큰 발급, 401 발생 시 `/api/v1/auth/refresh`로 자동 재시도.
- OAuth 로그인 성공 시 기존 `deviceExternalId`의 `userId` 없는 Pet 데이터를 User에 연결(디바이스 → 계정 전환).

---

## 5. 하루 한 장 UI 구현 방식

**피드형(그리드) + 상세는 스와이프(세로 페이징) 혼합 구조**로 확인됨.

- **메인 탭(`app/(tabs)/photo.tsx`)**: `FlatList` + `numColumns={3}` — 과거 사진을 3열 그리드(피드형)로 표시, pull-to-refresh 지원. 오늘 날짜 사진은 별도 카드로 상단 표시.
- **상세 화면(`app/photo/[id].tsx`)**: 세로 `FlatList`(paging) 기반 — 사진 간 세로 스와이프로 이동. 캡션 수정, 공유 미리보기, 삭제 지원.
- 같은 날짜에 기존 사진이 있으면 새 메타를 만들지 않고 기존 `externalId`를 재사용.

---

## 6. 사진 업로드 구현

| 항목 | 내용 |
|---|---|
| 촬영(네이티브) | `expo-camera` 기반, 카메라 권한 요청/설정 이동 UX 포함 |
| 갤러리 선택 | `expo-image-picker`, `lib/imagePickerHelper.ts`가 권한 요청까지 래핑 |
| 웹 | 카메라 대신 file input 기반 갤러리 선택으로 대체 |
| 압축/리사이즈 | 클라이언트에서 1080px 기준 medium, 300px thumbnail 생성 (`expo-image-manipulator`) |
| 서버 저장 | 원본은 클라이언트 폰 보관, 서버는 medium+thumbnail만 S3 저장 |
| 서버 파일 제한 | JPEG/PNG만 허용, medium 1MB, thumbnail 200KB (`PHOTO_005`, `PHOTO_006`) |
| S3 key 구조 | `photos/{petExternalId}/{photoExternalId}/medium.jpg`, `.../thumb.jpg` |
| 제한된 접근 권한(Limited Photo Library) | 대응 범위 확대 완료 |
| 업로드 실패 처리 | 실패 상태 보존 + 재시도 UI |

- 반려동물 프로필 사진은 예외적으로 `photoBase64`로 저장(S3 미사용), 512px 기준 압축.

---

## 7. 프로필 기능 구현 상태

전체 구현 완료. 필드: 사진, 이름, 종류(강아지/고양이, `species`: `DOG`/`CAT`), 성별(`gender`: 클라이언트 `male`/`female` 소문자 → 서버 `accept-case-insensitive-enums: true`로 정상 매핑 확인됨), 품종(자유입력 + species별 자동완성), 생일/생일 모름, 함께한 날, 체중/체중 모름(`weightKgUnknown`), 중성화 여부, 건강 메모.

- 생일/함께한 날: 네이티브 `DateTimePicker` / 웹 select picker 분기.
- 반려동물 추가: `AppHeader` 드롭다운 하단 버튼 → 기존 프로필 입력 폼을 생성 모드로 재사용.
- 반려동물 삭제: `DELETE /api/v1/pets/{externalId}` → 로컬 캐시 정리, 폼 초기화, 다음 반려동물로 자동 전환.
- `breed`는 서버에서 enum/코드 테이블이 아니라 문자열 저장만 담당(자유 입력 허용).

---

## 8. 서버 정책

### Soft Delete

- `SoftDeletableEntity`(`deletedAt`) 상속: User, Pet, Caregiver, DailyLog, DailyPhoto, DailyLogPhoto.
- `UserOAuthToken`, `RevokedRefreshToken`은 soft delete 미적용.
- Pet 삭제 시 DailyLog → DailyLogPhoto, DailyPhoto까지 cascade soft delete.

### 회원 탈퇴 (`DELETE /api/v1/users/me`, JWT 필수, 204)

| 항목 | 정책 |
|---|---|
| access token | 탈퇴 후 최대 1시간 유효(JWT 필터가 DB 상태를 조회하지 않는 stateless 구조상 허용 범위로 설계 결정) |
| refresh token | 탈퇴 즉시 차단 (`isDeleted \|\| isWithdrawn` 체크 → `AUTH_003`) |
| 개인정보 처리 | provider/providerUserId/email/profileImageUrl → null, nickname → "탈퇴한 사용자", status → `WITHDRAWN` |
| 재가입 | provider+providerUserId가 null 처리되므로 동일 OAuth 계정으로 재가입 가능. 단 신규 User row 생성, 이전 데이터 복구 불가 |
| OAuth 연결 해제 | Kakao(Admin Key 기반 unlink), Google(저장된 access token으로 revoke) 모두 구현됨. `AFTER_COMMIT` 비동기 처리, 실패해도 탈퇴 결과에는 영향 없음 |

### S3 이미지 삭제 방식

- **이벤트 기반 비동기 삭제**: 트랜잭션 커밋 이후(`AFTER_COMMIT`)에 실행되어 삭제 실패가 본 트랜잭션(반려동물 삭제 등)에 영향을 주지 않는 구조.
- Pet 삭제 → `PetImageCleanupEvent` → `PetImageCleanupListener`가 관련 S3 오브젝트 정리.
- OAuth 연결 해제도 같은 `AFTER_COMMIT` 비동기 패턴(`OAuthDisconnectListener`) 사용.

---

## 9. 화면별 구현 상태 (갱신)

| 화면 | 상태 |
|---|---|
| 홈 | 반려동물 프로필 카드, 오늘 기록 카드, 최근 7일 컨디션 차트 — **지원**. AI 리포트(병원 방문용/주간) — **출시 예정** (탭 시 안내 알림만) |
| 기록 | 강아지/고양이 분기, 수동 저장, 사진 최대 3장, 사진 저장 시점(로그 저장 시 업로드) — **지원** |
| 포토 | 하루 한 장, 3열 그리드 + 세로 스와이프 상세, 캡션, 공유, 업로드 실패/재시도 — **지원** |
| 프로필 | 생성/수정/삭제, species별 품종 자동완성, 체중 모름 — **지원** |
| 설정 - 알림 | 일일 기록 로컬 리마인더(시간 설정, 권한 요청) — **지원 (로컬 알림만, 서버 푸시 미구현)** |
| 설정 - 데이터 백업/가져오기 | **출시 예정** (배지만 존재, 로직 없음) |
| 설정 - 캐시 비우기 | 선별 삭제 + 구버전 캐시 정리 패치 — **지원** |
| 설정 - 회원 탈퇴 | 안내 → 확인 모달 → `DELETE /api/v1/users/me` → 세션 정리 — **지원** |
| 설정 - 리뷰 남기기 | `IOS_REVIEW_URL`이 `itms-apps://itunes.apple.com/app/id`(빈 App Store ID) 상태로 **아직 TODO** (`app/(tabs)/settings.tsx:33`) |
| 사진 상세 액션 시트 | "저장하기"(앨범 저장), "공유하기" 메뉴 항목 모두 주석 처리 — 공유는 별도 공유 미리보기 모달로 대체 동작 중 |

---

## 10. 확인 필요 (추측 배제, 미검증 항목)

- 서버 8080 포트 외부 공개 차단 여부 — 백엔드 문서는 "127.0.0.1 바인딩 적용(2026-05-31)"으로 기록되어 있으나, 운영 Lightsail 방화벽/Nginx 설정 자체는 이번 코드 리딩 범위에서 직접 확인하지 못함.
- `kkori.co.kr` / `www.kkori.co.kr`의 Vercel 연결 완료 여부 — 코드 내 `WEB_BASE_URL` 기본값이 여전히 `https://kkori.vercel.app`이고, 공유 URL 오류 안내 문구도 이를 의심하는 문구를 유지 중이라 실제 연결 상태는 별도 확인 필요.
- Google/Kakao 실기기 로그인 및 Google revoke 실기기 QA 완료 여부 — 코드상 구현은 확인되나 실기기 검증 결과는 문서화되어 있지 않음.
- Android 앱: `googleAuthConfig.ts`에 Android 분기 코드는 있으나, 앱 자체가 아직 Phase 2로 출시 전이라 end-to-end 동작은 미검증.
