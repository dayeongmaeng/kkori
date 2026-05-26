# 꼬리(Kkori) 로고 사용 가이드

## 포함 파일

1. `svg/kkori-symbol.svg` — SVG 벡터 심볼 버전
2. `png/kkori-symbol-transparent-4096.png` — 고해상도 투명 PNG
3. `app-icons/` — iOS / Android / Expo 앱 아이콘
4. `favicon/` — 16x16, 32x32, 48x48, 64x64 PNG 및 favicon.ico
5. `sns/kkori-profile-square-1080.png` — SNS 프로필용 정사각형 버전
6. `mono/` — 단색 / 흑백 버전
7. `mode/` — 라이트 모드 / 다크 모드 버전
8. `symbol-only/kkori-symbol-only.png` — 심볼만 있는 버전
9. `logo-with-text/` — “꼬리” 텍스트 포함 로고 버전

## 브랜드 컬러

| 용도 | HEX | 설명 |
|---|---:|---|
| Primary Black | `#000000` | 기본 라인 로고 |
| Warm Cream | `#FFF8F1` | 앱 아이콘 / SNS 배경 |
| Soft Peach | `#FFD6AF` | 포인트 컬러 |
| Deep Brown | `#472F20` | 따뜻한 텍스트 보조 컬러 |
| Dark Mode BG | `#141312` | 다크 모드 프리뷰 배경 |
| White | `#FFFFFF` | 다크 모드용 반전 로고 |

## 사용 원칙

- 작은 크기에서는 `symbol-only` 또는 `favicon` 파일을 사용하세요.
- iOS 앱 아이콘은 투명 배경을 권장하지 않으므로 `app-icons/ios-icon-1024.png`를 사용하세요.
- Expo 설정 예시:

```json
{
  "expo": {
    "icon": "./assets/app-icons/expo-icon.png",
    "adaptiveIcon": {
      "foregroundImage": "./assets/app-icons/expo-adaptive-icon-foreground.png",
      "backgroundImage": "./assets/app-icons/expo-adaptive-icon-background.png"
    },
    "favicon": "./assets/favicon/favicon-32x32.png"
  }
}
```

## 여백 규칙

- 로고 주변에는 심볼 높이의 최소 10% 이상 여백을 확보하세요.
- 배경이 어두울 때는 `mode/kkori-dark-mode-transparent.png` 또는 `mono/kkori-monochrome-white-transparent.png`를 사용하세요.
- 배경이 밝을 때는 기본 검정 로고를 사용하세요.

## 금지 사항

- 선 두께를 임의로 얇게 만들지 마세요.
- 얼굴 요소와 꼬리 길이 비율을 변경하지 마세요.
- 복잡한 패턴 위에 로고를 직접 올리지 마세요. 필요한 경우 Warm Cream 배경 박스를 사용하세요.
