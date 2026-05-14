\# 펫케어 앱 프로젝트



\## 컨셉

**앱 이름: 꼬리** — 반려동물의 모든 순간을 기록하는 앱

모든 반려동물 보호자를 위한 일상 기록 + 건강 관리 앱.

일일 기록(식사/산책/배변/컨디션), 사진 일기가 기본 기능.

차별화 기능으로 심박수/호흡수 측정, 병원 가기 전 리포트, 

장기 데이터 기반 패턴 분석 제공.

모든 연령의 반려동물 지원하지만, 노령/특수 질환 보호자에게도 깊이 있게 대응.



\## 개발 환경

\- OS: Windows

\- 타겟: iOS 우선 (개발자는 아이폰 사용)

\- 개발 중 테스트는 주로 웹 브라우저로 함

\- Android는 Phase 2 이후 추가



\## 기술 스택

\- React Native + Expo (Managed Workflow)

\- TypeScript strict 모드

\- 네비게이션: Expo Router (file-based)

\- 상태 관리: React Context (1주차)

\- 로컬 저장: AsyncStorage (웹에선 자동으로 localStorage 사용)

\- 백엔드: 3주차부터 Spring Boot 붙일 예정. 1주차엔 백엔드 없음.



\## 코딩 규칙

\- 컴포넌트는 함수형, hooks 사용

\- 한 파일 200줄 넘으면 분리

\- 색상/스타일은 constants/theme.ts에 모음

\- 모든 비동기 함수는 try/catch로 에러 처리

\- AsyncStorage 키는 "pet-care:" 프리픽스 사용 (마이그레이션 대비)



\## 웹 호환성 주의

\- 개발 중 웹 브라우저로 주로 테스트함 (npx expo start → w)

\- expo-image-picker 같은 네이티브 기능은 웹에서 fallback 필요

\- 카메라 기능은 웹에선 file input으로 대체



\## UI 가이드

\- 모든 텍스트 한국어

\- 날짜 포맷 "2026년 5월 13일"

\- 시간대 KST

\- 톤: 따뜻하고 부드러운 톤

\- 배경 #FAF8F5, 포인트 #E8985C

\- 모서리 둥글게 (border-radius 16)

\- 여백 넉넉히 (padding 16 이상)



\## 개발자 컨텍스트

\- Spring Boot 백엔드 경험 풍부

\- React Native, TypeScript는 처음

\- 모르는 개념은 짧게 설명해주면 좋음

\- 한 번에 한 화면씩 진행



\## 절대 하지 말 것

\- Expo eject 제안 금지 (Managed Workflow 유지)

\- 사용하지 않는 의존성 추가 금지

\- 영어 UI 텍스트 사용 금지

