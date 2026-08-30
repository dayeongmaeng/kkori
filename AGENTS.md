# 변경 이력

## 2026-08-30 (2차)

### 설정 화면 알림 섹션 — "기록 알림 없음" UI를 시간 선택 모달 내부로 통합

- **파일**: `app/(tabs)/settings.tsx`
- **변경 내용**:
  - "기록 알림 없음" 독립 Row(BellOff 아이콘 + 체크박스) 제거
  - "일일 기록 알림" Row의 `disabled`/조건부 `onPress` 제거 → 항상 탭 가능
  - 시간 선택 모달 내부에 "기록 알림 없음" 체크박스 행 추가 (헤더와 휠 사이)
  - `pickerNoAlarm=true` 시 DateTimePicker 영역 dimmed(opacity 0.3) + `pointerEvents="none"` 처리
  - `handleNotifTimePress`: `notifEnabled=false`이면 권한 확인 없이 모달 열기, `setPickerNoAlarm(!notifEnabled)` 초기화
  - `handleTimeConfirm`: `pickerNoAlarm` 분기 — true이면 알림 취소/비활성화 저장, false이면 시간 저장 + 스케줄링 + 활성화 복원
  - `handleToggleNotifEnabled` 함수 제거 (로직이 `handleTimeConfirm`으로 통합됨)
  - `BellOff` lucide import 제거 (미사용)
  - 신규 스타일 추가: `timePickerNoAlarmRow`, `timePickerNoAlarmLabel`, `timePickerWheelDimmed`
- **알림/권한 연동 로직**: expo-notifications 호출 순서·내용 동일 유지. 권한 요청 흐름 무변경.
- **영향 범위**: `settings.tsx` 단독. 시간 선택 컴포넌트는 settings.tsx 전용이며 다른 화면에서 공유되지 않음.

## 2026-08-30

### 한달 한장 모달 날짜 셀 사진 크기 정렬 수정

- **파일**: `components/MonthlyCalendarModal.tsx`
- **문제**: 사진이 있는 날짜 셀의 썸네일이 빈 날짜 셀(점선 테두리)보다 크게 렌더링되어 인접 셀 영역을 침범하는 것처럼 보이는 현상
- **원인**:
  1. `dayPhoto` 스타일이 `width: '100%', height: '100%'`(상대값)이라 expo-image가 부모 크기 확정 전에 원본 해상도로 렌더링할 수 있음
  2. `dayCell`에 `overflow: 'hidden'`이 없어 자식 콘텐츠가 셀 경계를 벗어나도 클리핑되지 않음
- **수정**:
  1. `dayPhoto` 스타일: `{width: '100%', height: '100%'}` → `{width: dp(115), height: dp(115)}` (컨테이너와 동일한 명시적 절대값)
  2. `dayCell` 스타일: `overflow: 'hidden'` 추가 (셀 경계 침범 클리핑 보장)
- **영향 범위**: `MonthlyCalendarModal.tsx` 단독. `MonthlyCalendarDownloadCanvas.tsx`는 독립 스타일이므로 미영향.

### 한달 한장 모달 년/월 선택 UI 교체 — 휠피커 → 화살표 네비게이션

- **파일**: `components/MonthlyCalendarModal.tsx`
- **변경 내용**: 기존 `@react-native-picker/picker` 휠피커(네이티브) + `<select>` 드롭다운(웹) 방식을 제거하고, 캘린더 그리드 바로 위에 `‹ 2026년 8월 ›` 형태의 한 줄 화살표 네비게이션 헤더로 교체
- **제거된 것**: `Picker` import, `yearOptions`/`monthOptions` useMemo, year-dependent useEffect, `monthNav`/`pickerRow`/`pickerFlex`/`pickerItem` 스타일, `webSelectStyles` 전체
- **추가된 것**: `prevMonth()`, `nextMonth()` 함수, `canGoPrev`/`canGoNext` 경계 조건, `monthHeader`/`monthHeaderText`/`navBtn`/`navBtnText`/`navBtnDisabled` 스타일
- **네비게이션 범위**: 이전(‹)은 가장 오래된 사진 연도 1월까지, 다음(›)은 `currentYear + 1년 12월`까지 허용. 미래 월 이동 시 빈 그리드 정상 표시.
- **영향 범위**: `MonthlyCalendarModal.tsx` 단독.

### 한달 한장 다운로드 시 상단 월 타이틀 잘림 버그 수정

- **파일**: `components/MonthlyCalendarModal.tsx`
- **문제**: "앨범에 저장" 시 다운로드 이미지 상단의 월 타이틀 영역(월 숫자, 연도·영문 표기, 좌측 세로 그린 바)이 잘려 저장됨. 화면 미리보기에서는 정상.
- **원인**: `hiddenOffscreen`(ViewShot 포함)이 `sheet` View 안에 있었음. `sheet`는 `borderTopLeftRadius/Right: 20` + `backgroundColor`를 가져 iOS에서 `CAShapeLayer` 마스크를 생성하고 하위 레이어 전체에 클리핑을 적용함. `hiddenOffscreen`이 `top: -100000`으로 `sheet` 위쪽 바깥에 위치하므로 이 마스크가 canvas 상단을 잘라내어 ViewShot 캡처 결과에도 반영됨.
- **수정**: `hiddenOffscreen` 블록을 `sheet` 밖 `backdrop` 레벨로 이동. `backdrop`은 `borderRadius`가 없어 마스크 레이어를 생성하지 않으므로 캡처 시 클리핑이 발생하지 않음.
- **영향 범위**: `MonthlyCalendarModal.tsx` JSX 구조 변경만. 캡처 로직·스타일·다운로드 캔버스 컴포넌트는 무변경.

### 한달 한장 미리보기·다운로드 상단 타이틀 잘림 추가 수정 (캔버스 크기/패딩)

- **파일**: `components/MonthlyCalendarModal.tsx`, `components/MonthlyCalendarDownloadCanvas.tsx`
- **문제**: 이전 ViewShot 위치 수정 후에도 미리보기와 다운로드 이미지 모두에서 상단 타이틀 잘림이 동일하게 발생.
- **원인**: 캔버스 `paddingTop: dp(80)`(기준 80/1080 ≈ 7.4% 상단 여백)이 부족해 타이틀 영역이 캔버스 상단 경계에 붙어 잘림. 두 파일 모두 동일한 문제.
- **수정**: 두 파일 공통으로 캔버스 높이 비율 `1444→1500`(+56 base px), 상단 패딩 `dp(80)→dp(120)`(+40 base px) 증가. 그리드(주행) 콘텐츠 영역은 `flex: 1`로 자동 조정.
- **영향 범위**: `MonthlyCalendarModal.tsx` + `MonthlyCalendarDownloadCanvas.tsx` 수치 변경만. 그리드/셀/저장 버튼 로직 무변경.
