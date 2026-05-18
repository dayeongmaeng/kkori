# 펫케어 앱 프로젝트

## 컨셉

**앱 이름: 꼬리** - 반려동물의 모든 순간을 기록하는 앱

모든 반려동물 보호자를 위한 일상 기록 + 건강 관리 앱.

일일 기록(식사/산책/배변/컨디션), 사진 일기가 기본 기능.

차별화 기능으로 심박수/호흡수 측정, 병원 가기 전 리포트, 장기 데이터 기반 패턴 분석 제공.

모든 연령의 반려동물을 지원하지만, 노령/특수 질환 보호자에게도 깊이 있게 대응.

## 개발 환경

- OS: Windows
- 타겟: iOS 우선 (개발자는 아이폰 사용)
- 개발 중 테스트는 주로 웹 브라우저로 함
- Android는 Phase 2 이후 추가

## 기술 스택

- React Native + Expo (Managed Workflow)
- TypeScript strict 모드
- 네비게이션: Expo Router (file-based)
- 상태 관리: React Context (1주차)
- 로컬 저장: AsyncStorage (웹에선 자동으로 localStorage 사용)
- 백엔드: Spring Boot
- 데이터베이스: PostgreSQL
- 파일 저장: AWS S3
- 프론트 웹/정책/공유 페이지: Vercel 유지

## 코딩 규칙

- 컴포넌트는 함수형, hooks 사용
- 한 파일 200줄 넘으면 분리
- 색상/스타일은 constants/theme.ts에 모음
- 모든 비동기 함수는 try/catch로 에러 처리
- AsyncStorage 키는 "pet-care:" 프리픽스 사용 (마이그레이션 대비)

## 웹 호환성 주의

- 개발 중 웹 브라우저로 주로 테스트함 (npx expo start -> w)
- expo-image-picker 같은 네이티브 기능은 웹에서 fallback 필요
- 카메라 기능은 웹에선 file input으로 대체

## UI 가이드

- 모든 텍스트 한국어
- 날짜 포맷 "2026년 5월 13일"
- 시간대 KST
- 톤: 따뜻하고 부드러운 톤
- 배경 #FAF8F5, 포인트 #E8985C
- 모서리 둥글게 (border-radius 16)
- 여백 넉넉히 (padding 16 이상)

## 개발자 컨텍스트

- Spring Boot 백엔드 경험 풍부
- React Native, TypeScript는 처음
- 모르는 개념은 짧게 설명해주면 좋음
- 한 번에 한 화면씩 진행

## 도메인 및 인프라

- 서비스 도메인: kkori.co.kr
- API 서브도메인: api.kkori.co.kr
- DNS A 레코드: api.kkori.co.kr -> 13.124.220.29
- 최종 운영 API URL: https://api.kkori.co.kr
- 새 Lightsail 서버 Public IP: 13.124.220.29
- 기존 Lightsail 최저 사양 서버에서 새 1GB Lightsail 서버로 이전 완료
- 기존 서버 IP 3.38.97.234는 이전 서버 IP이며, 현재 운영 기준 IP가 아님
- HTTPS 적용 완료
- HTTPS 구성: Let's Encrypt + Certbot + Nginx
- 인증서 도메인: api.kkori.co.kr
- Certbot 인증서 발급 완료
- certbot renew --dry-run 성공
- 새 서버에서 HTTPS 직접 확인 완료
- Spring Boot API 컨테이너와 PostgreSQL 컨테이너 정상 구동 확인
- 무료 HTTPS 인증서는 Let's Encrypt로 충분하다고 결정

## 도메인 역할

- kkori.co.kr / www.kkori.co.kr: Vercel 웹 랜딩, 개인정보처리방침, 계정삭제 안내, 가족 공유/메모리얼 페이지 용도
- api.kkori.co.kr: Lightsail Spring Boot API 용도
- 향후 가족 공유 링크/메모리얼 웹 페이지 가능성을 고려해 kkori.co.kr 전용 도메인 사용
- 앱 클라이언트는 운영 API 기준으로 https://api.kkori.co.kr에 요청

## 운영 인프라 흐름

앱
-> https://api.kkori.co.kr
-> Nginx 443
-> Spring Boot 8080
-> PostgreSQL 16
-> S3

## 서버 포트

열려 있어야 하는 포트:

- 22: SSH
- 80: HTTP / Certbot 갱신 / HTTPS redirect
- 443: HTTPS API

향후 HTTPS 확인 후 닫아도 되는 포트:

- 8080: Spring Boot 직접 접근 포트. 최종적으로 외부 공개는 닫는 방향이며, 현재 닫힘 여부 확인 필요

## 서버 비용 및 배포 메모

- 512MB Lightsail 서버에서 Docker/Gradle 빌드가 매우 느렸음
- Spring Boot + PostgreSQL + Docker 운영에는 최소 1GB 이상이 필요하다고 판단
- 가능하면 추후 서버에서 직접 빌드하지 않고 로컬 또는 GitHub Actions에서 빌드 후 배포하는 방식 검토

## 서버 API

- 운영 Base URL: https://api.kkori.co.kr
- 권장 클라이언트 환경변수: EXPO_PUBLIC_API_URL=https://api.kkori.co.kr
- 과거 개발 기준의 http://localhost:8080 또는 http://IP:8080을 클라이언트 기본값으로 사용하지 않음
- 헤더: `X-Device-Id` (Device 등록 엔드포인트 외 모든 요청에 필수)
- 응답 구조: `{ success, data, error, timestamp }`
- 에러 구조: HTTP status + `ErrorResponse { code, message, fields }`

엔드포인트:

- POST /api/v1/devices/register
- GET /api/v1/devices/me
- GET/POST/PUT/DELETE /api/v1/caregivers
- GET/POST/PUT/DELETE /api/v1/pets
- GET/POST/PUT/DELETE /api/v1/photos (query: petExternalId)
- GET/POST/PUT/DELETE /api/v1/logs (query: petExternalId, date 필터)
- DELETE /api/v1/logs/{externalId}: 일일 기록 삭제, `X-Device-Id` 필수, 성공 시 204 No Content

API 코드 위치: `lib/api/` (client.ts, types.ts, device.ts, caregiver.ts, pet.ts, photo.ts, log.ts)

## 클라이언트 검증 상태

- 최종 API URL `https://api.kkori.co.kr` 기준 클라이언트 검증 완료
- 펫 조회 정상 확인
- 일일 기록 저장/조회 정상 확인
- 기록 탭 자동저장 제거 완료: 사용자가 `저장` 버튼을 눌렀을 때만 저장
- 기록 삭제 버튼 API 연동 완료: `logApi.deleteLog(externalId)` -> `DELETE /api/v1/logs/{externalId}`
- 기록 삭제 후 서버/캐시 데이터 삭제 및 화면 초기화 처리 완료
- 웹에서 기록 삭제 확인창은 `Alert.alert` 대신 `window.confirm` 사용
- 기록 삭제 성공 알림 문구는 `삭제되었습니다 ✓`, 반투명 붉은 배경 사용
- 사진 메타 생성 정상 확인
- 사진 업로드 정상 확인
- 앱 재실행 후 서버/캐시 데이터 확인 완료

## S3 및 업로드 디버깅 메모

- S3 사진 업로드 정상 동작 확인 완료
- AWS Lightsail에서 S3 접근 시 IAM Role을 따로 붙인 게 아니라면 `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET` 환경변수가 필요함
- 사진 업로드 중 `S3Exception: The specified bucket is not valid`가 발생했으며, 원인은 IAM access key 자체 문제가 아니라 Docker 컨테이너 안에 AWS/S3 환경변수가 전달되지 않던 문제였음
- `docker-compose.yml`의 `api.environment`에 아래 환경변수를 추가해 해결함
  - `AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}`
  - `AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}`
  - `AWS_REGION: ${AWS_REGION}`
  - `AWS_S3_BUCKET: ${AWS_S3_BUCKET}`
- `.env`에는 아래 값들이 필요하며, 민감정보 값은 문서에 기록하지 않음
  - `AWS_ACCESS_KEY_ID=...`
  - `AWS_SECRET_ACCESS_KEY=...`
  - `AWS_REGION=ap-northeast-2`
  - `AWS_S3_BUCKET=버킷명만`
- `AWS_S3_BUCKET`은 `s3://`, URL, 경로 없이 순수 버킷명만 넣어야 함
- `NoResourceFoundException: No static resource api/v1/photos/.../upload`는 access key 문제가 아니라 서버 Controller 매핑 또는 배포 코드 불일치 가능성이 높음

## 다음 작업 후보

- 8080 외부 포트 닫기 확인
- 업로드 실패/재시도 UX 정리
- Vercel에 kkori.co.kr / www.kkori.co.kr 연결
- 개인정보처리방침/계정삭제 안내 페이지 준비
- Phase D 로그인/회원가입 설계

## 절대 하지 말 것

- Expo eject 제안 금지 (Managed Workflow 유지)
- 사용하지 않는 의존성 추가 금지
- 영어 UI 텍스트 사용 금지
