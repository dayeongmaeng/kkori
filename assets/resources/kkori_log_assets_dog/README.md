# 꼬리(Kkori) 로고/아이콘 에셋 가이드

첨부 이미지의 라인형 강아지 얼굴과 꼬리 심볼을 기준으로 만든 앱/웹용 에셋 세트입니다. 원본의 **얇은 라인, 빈 꼬리 형태, 감성적이고 따뜻한 반려동물 무드**를 유지했습니다.

## 구성

- `svg/` : 벡터 SVG 버전, 라이트/다크 모드 SVG
- `png/` : 투명 배경 고해상도 PNG `1024`, `2048`, `4096`
- `app-icons/` : iOS / Android / Expo 앱 아이콘용 PNG
- `favicons/` : `16x16`, `32x32`, `48x48`, `64x64`, `favicon.ico`
- `sns/` : SNS 프로필용 정사각형 `1080x1080`
- `variants/` : 단색, 흑백, 라이트/다크 모드 버전
- `symbol-only/` : 심볼만 있는 SVG/PNG
- `text-logo/` : `꼬리` 텍스트 포함 로고 SVG/PNG

## 브랜드 컬러

| 용도 | 컬러 | HEX |
|---|---:|---:|
| Primary Ink | 진한 차콜 | `#111111` |
| Warm Background | 따뜻한 아이보리 | `#FFF7EF` |
| Dark Background | 딥 차콜 | `#111111` |
| Dark Mode Ink | 크림 화이트 | `#F8F3EC` |
| Soft Accent | 소프트 베이지 | `#F6E7D8` |

## 권장 사용법

1. **앱 아이콘**  
   Expo에서는 `app-icons/expo-icon-1024.png`를 `icon`으로 사용하세요. Android Adaptive Icon은 `adaptive-icon-foreground.png`와 `adaptive-icon-background.png` 조합을 권장합니다.

2. **웹/favicon**  
   기본 favicon은 `favicons/favicon.ico`를 사용하고, 고해상도 환경에서는 `favicon-64x64.png`를 함께 등록하세요.

3. **라이트/다크 모드**  
   라이트 모드에서는 차콜 로고 + 아이보리 배경, 다크 모드에서는 크림 로고 + 딥 차콜 배경을 권장합니다.

4. **작은 크기**  
   16px favicon처럼 매우 작은 크기에서는 `symbol-only` 또는 `favicon` 폴더의 전용 파일을 사용하세요.

5. **금지 사항**  
   로고를 임의로 눌러 찌그러뜨리거나, 꼬리 내부를 채우거나, 라인의 비율을 과하게 변경하지 마세요.

## Expo 설정 예시

```json
{
  "expo": {
    "icon": "./assets/app-icons/expo-icon-1024.png",
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/app-icons/adaptive-icon-foreground.png",
        "backgroundImage": "./assets/app-icons/adaptive-icon-background.png"
      }
    },
    "ios": {
      "icon": "./assets/app-icons/ios-icon-1024.png"
    }
  }
}
```
