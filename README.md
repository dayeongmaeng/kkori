# 꼬리

반려동물의 모든 순간을 기록하는 펫케어 앱입니다.

일상 기록, 하루 한 장 사진, 반려동물 프로필을 중심으로 시작하고, 장기적으로 병원 방문 전 리포트와 패턴 분석까지 확장하는 것을 목표로 합니다.

## 현재 구현

- Google/Kakao OAuth 로그인
- 온보딩 슬라이드 (최초 실행 시)
- 반려동물 멀티 선택/추가/삭제: AppHeader 드롭다운으로 반려동물 전환 및 추가, 전환 시 전체 화면 자동 갱신
- 홈: 반려동물 프로필, 오늘 기록, 최근 7일 컨디션 차트, AI 리포트 프리뷰
- 기록(강아지): 컨디션, 식사, 산책, 배변, 물 섭취, 구토, 체중, 기록 사진, 메모
- 기록(고양이): 컨디션, 식사, 놀이, 화장실, 물 섭취, 구토, 기록 사진, 메모
- 포토: 하루 한 장 사진, 캡션, 업로드 실패/재시도, 3열 그리드
- 사진 상세: 캡션 수정, 앨범 저장, 공유, 삭제
- 공유 페이지: `/photos/:externalId` 전용 HTML/OG 메타 렌더링
- 프로필: 사진, 이름, 반려동물 종류(강아지/고양이), 성별, 품종, 생일, 생일 모름, 함께한 날, 체중, 중성화 여부, 건강 메모, 반려동물 삭제
- 설정: 권한 설정, 캐시 비우기, 정책 링크, 후원, 로그아웃, 회원 탈퇴

## 기술 스택

- React Native + Expo
- Expo Router
- TypeScript strict
- React Context
- AsyncStorage / SecureStore
- expo-camera, expo-image-picker, expo-image-manipulator
- Vercel web export/API route
- 구조적 로깅: `lib/logger.ts` (개발 debug/info/warn/error, 운영 warn/error)

## API

- 운영 API: `https://api.kkori.co.kr`
- 개발 모드 API 기본값: `http://localhost:8080`
- 운영 환경변수: `EXPO_PUBLIC_API_URL=https://api.kkori.co.kr`
- 일반 API 요청에는 `X-Device-Id` 헤더가 붙습니다.
- 응답 구조는 `{ success, data, error, timestamp }` 형식입니다.

## 실행

```bash
npm install
npx expo start
```

웹 실행:

```bash
npm run web
```

정적 웹 빌드:

```bash
npm run build
```

린트:

```bash
npm run lint
```

## 현재 주의사항

- `.env.example`에는 `EXPO_PUBLIC_SHARE_API_URL`이 없지만 코드에서 사용 중입니다.
- `WEB_BASE_URL` 기본값은 아직 `https://kkori.vercel.app` 기준입니다. 운영 도메인 `kkori.co.kr` 전환 시 갱신이 필요합니다.
- 프로필 `gender`는 현재 `male` / `female` 소문자로 전송합니다.
- `EXPO_PUBLIC_DEV_API_URL` 환경변수는 실제로 사용되지 않습니다. 개발 모드 API는 `http://localhost:8080`으로 하드코딩되어 있습니다.
- 서버 8080 포트 외부 공개 여부가 아직 확인되지 않았습니다. 운영 전 Lightsail 방화벽 설정을 확인하세요.
- AI 리포트, 포토 달력 만들기, 데이터 백업/가져오기, 알림 기능은 출시 예정입니다.
