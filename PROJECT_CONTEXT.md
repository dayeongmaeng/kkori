# 꼬리(kkori) 프로젝트 인수인계

## 프로젝트 한 줄
반려동물 일상 기록 + 건강 관리 + 메모리얼 앱. 17년 키운 말티즈를 떠나보낸 경험에서 출발.

## 저장소
- 클라이언트: https://github.com/dayeongmaeng/kkori (C:\dev\projects\kkori)
- 서버: https://github.com/dayeongmaeng/kkori-api (C:\dev\projects\kkori-api)

## 스택
- **클라이언트**: React Native + Expo, TypeScript strict, Expo Router, AsyncStorage 캐시
- **서버**: Spring Boot 3.5.14, Java 21, PostgreSQL 16, JPA, Gradle, Lombok
- **인프라**: AWS Lightsail (Seoul, Ubuntu 24.04, 1GB), Nginx, Let's Encrypt/Certbot, Docker Compose, S3
- **도구**: ClaudeCode (양쪽 저장소 각각 실행), GitHub Desktop

## 진행 상태
- ✅ Phase A: 서버 API CRUD (Device/Caregiver/Pet/DailyPhoto/DailyLog) + 디바이스 격리
- ✅ Phase B: 클라이언트 연동 (서버 우선 + AsyncStorage 캐시)
- ✅ Phase C: Lightsail Docker 배포, 도메인/API HTTPS 연결, DBeaver SSH 터널
- ✅ 도메인/HTTPS: api.kkori.co.kr, Let's Encrypt + Certbot + Nginx 적용 완료
- 🔄 Phase E: S3 사진 업로드 (medium 1080 + thumb 300) - **진행 중**
- ⬜ Phase D: 회원가입 (디바이스ID → User 전환)
- ⬜ 심박/호흡 측정, AI 리포트, 약 관리, 메모리얼, 결제

## 데이터 모델 (서버)
5개 엔티티 모두 BaseEntity 상속 (createdAt/updatedAt, KST):
- Device(externalId, platform IOS/ANDROID/WEB, userId nullable)
- Caregiver(deviceId, name, role OWNER/FAMILY/GUEST, color)
- Pet(deviceId, name, species, breed, birthDate, weightKg, neutered, medicalNotes, photoBase64)
- DailyPhoto(petId, caregiverId, date, caption, mediumUrl, thumbnailUrl) - unique(petId, date)
- DailyLog(petId, caregiverId, date, meal/water/pooCondition/urineColor enum, walkMinutes, condition 1~5, weightKg, memo) - unique(petId, date)

## 규칙
- ID: Long PK + externalId(UUID, unique) - 클라이언트 우선 + 서버 폴백
- 연관관계: 객체 참조 X, Long FK만
- 응답: ApiResponse<T> { success, data, error, timestamp } @JsonInclude(NON_NULL)
- URL: /api/v1/{resource}, X-Device-Id 헤더 필수
- 디바이스 격리: Pet.deviceId, Photo/Log는 verifyPetOwnership 통해 위반 시 404
- DTO: record, from(entity) 정적 팩토리, 엔티티 직접 노출 금지
- enum: @Enumerated(STRING), 대소문자 무시 (jackson)

## 사진 전략
- **원본**: 클라이언트 폰 (월력용)
- **서버**: medium 1080px + thumbnail 300px (S3)
- **Pet 프로필**: 로컬 base64 유지 (Phase D에 S3 이전)
- **리사이즈**: 클라이언트(expo-image-manipulator) → 서버는 받은 파일 저장
- **키**: photos/{petExternalId}/{photoExternalId}/medium.jpg, thumb.jpg

## 디자인
- 톤: 차분/모던, 토스/당근 + 일기장
- 컬러: primary #191F28, accent #E94B5A(코랄핑크), beta 주황 #E8985C
- 5탭: 홈/기록/포토/프로필/설정
- 자동저장 800ms debounce + 수동 저장 버튼
- 캘린더: react-native-calendars, KST 자정 자동 갱신
- 피드백: 카카오톡 오픈채팅 (BETA 배지 → 연결)

## 환경 정보
- 로컬 DB: docker-compose, 5432
- 서비스 도메인: kkori.co.kr
- API 도메인: api.kkori.co.kr
- DNS A 레코드: api.kkori.co.kr → 13.124.220.29
- 최종 운영 API URL: https://api.kkori.co.kr
- 클라이언트 환경변수: EXPO_PUBLIC_API_URL=https://api.kkori.co.kr
- 새 Lightsail Public IP: 13.124.220.29
- 기존 서버 IP 3.38.97.234는 이전 서버 IP이며, 현재 운영 기준 IP가 아님
- DBeaver: SSH 터널 (ssh -i C:\dev\lightsail-key.pem -L 5432:localhost:5432 ubuntu@13.124.220.29)
- HTTPS: Let's Encrypt + Certbot + Nginx 적용 완료, certbot renew --dry-run 성공
- 도메인 역할: kkori.co.kr / www.kkori.co.kr은 Vercel 웹/정책/공유 페이지, api.kkori.co.kr은 Lightsail Spring Boot API
- 서버 포트: 22 SSH, 80 HTTP/Certbot/redirect, 443 HTTPS API는 열어둠. 8080은 HTTPS 확인 후 외부 공개 닫는 방향
- S3 버킷/IAM: 생성 완료. Lightsail에 IAM Role을 따로 붙인 것이 아니라면 AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET 환경변수 필요

## 의사결정 기록
- DB ddl-auto: update (Flyway 추후 검토)
- 호스팅: Lightsail (S3 통합 위해 AWS 생태계)
- 512MB Lightsail 서버에서 Docker/Gradle 빌드가 매우 느려 1GB Lightsail 서버로 이전
- Spring Boot + PostgreSQL + Docker 운영에는 최소 1GB 이상이 필요하다고 판단
- 가능하면 추후 서버에서 직접 빌드하지 않고 로컬/GitHub Actions에서 빌드 후 배포하는 방식 검토
- 무료 HTTPS 인증서는 Let's Encrypt로 충분하다고 결정
- kkori.co.kr은 향후 가족 공유 링크/메모리얼 웹 페이지 가능성을 고려해 Vercel용 도메인으로 유지
- 회원가입 보류, X-Device-Id로 시작
- LocalDateTime 유지 + Jackson timezone Asia/Seoul
- Caregiver 데이터 모델만 도입, UI는 Phase 2+

## 🔴 현재 진행 중인 작업 (Phase E)

### 완료
- S3 버킷 + IAM 생성
- DailyPhoto에 mediumUrl/thumbnailUrl 컬럼 추가
- POST /photos/{externalId}/upload (multipart) 구현
- S3Properties @ConfigurationProperties 도입으로 버킷명 주입 문제 해결
- 클라이언트가 사진 추가 시 메타 → 업로드 API 순차 호출

### PENDING 1: Pet photoBase64 저장 안 됨
- Pet 테이블에 photo_base64 컬럼은 있는데 데이터 입력 안 됨
- 점검 필요: entity @Column / Request DTO / Service set / Response DTO 중 어디 누락
- 진단 프롬프트 마지막 메시지에 작성됨

### PENDING 2: 홈탭 사진 안 나옴
- DailyPhoto 흐름 정상화되면 해결될 가능성
- 캐시 또는 mediumUrl 매핑 점검 필요

### PENDING 3: S3 업로드 API 배포/매핑 확인
- `NoResourceFoundException: No static resource api/v1/photos/.../upload`는 access key 문제가 아니라 서버 Controller 매핑 또는 배포 코드 불일치 가능성이 높음
- 서버에 실제 배포된 코드에 POST /api/v1/photos/{externalId}/upload 매핑이 포함되어 있는지 확인 필요
- 클라이언트는 EXPO_PUBLIC_API_URL=https://api.kkori.co.kr 기준

## 작업 스타일
- 사용자: 인디 해커, Spring Boot 경험 풍부, React Native 처음
- 토큰 절약 선호 → 짧은 프롬프트 + "읽어야 할 파일" 명시 + 검증 포인트 분리
- 한국어 ~요 톤
- "프롬프트 / 검증" 두 섹션 구조
- 한 번에 한 단계, GitHub Desktop 커밋 자주

## 다음 세션 첫 작업
1. Pet photoBase64 저장 디버그 (PENDING 1)
2. 홈탭 사진 표시 (PENDING 2)
3. S3 업로드 API Controller 매핑/배포 코드 일치 여부 확인 (PENDING 3)

## 정서적 맥락
사용자는 17년 키운 말티즈를 심장병으로 떠나보낸 경험에서 이 앱을 만들기 시작함. 노령견 보호자에게 진짜 도움 되는 도구를 만들고 싶어함. 메모리얼 모드(떠난 후 사진 책자, 추모)는 단순 기능이 아니라 프로젝트의 정서적 뿌리.

## Claude/Codex 작업 규칙
- build/, node_modules/, .gradle/, dist/ 읽지 말 것
- 필요한 파일만 지정해서 읽기
- 전체 프로젝트 스캔 최소화
- 긴 로그 출력 금지, 핵심 에러만 요약
- 수정 전 영향 범위 먼저 설명

## 실행 명령

### 서버
./gradlew bootRun

### 클라이언트
npx expo start

### Docker
docker compose up -d

### 테스트
./gradlew test
