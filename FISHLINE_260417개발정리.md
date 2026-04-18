# FISHLINE — 개발 전체 정리 문서 v2
> 작성일: 2026년 4월 17일
> 개발자: 팀리치 (웜부자) + 오실장 (Claude)

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 앱 이름 | FISHLINE |
| 서브타이틀 | LINE SIMULATOR PRO |
| 컨셉 | 선상낚시인을 위한 낚싯줄 시뮬레이터 + 플로팅 멀티 카운터 |
| 테마 | 블랙 & 골드 (LAFC 컬러 🖤💛) |
| 플랫폼 | Android (Expo/React Native) |
| GitHub | https://github.com/richcompany12/fishline.git |
| 로컬 경로 | D:\app\FishLineV2 |
| Firebase 프로젝트 | fishline-9e984 |
| 패키지명 | com.richcompany.fishlineapp ⚠️ (변경됨 - 아래 주의사항 참고) |

---

## 2. 기술 스택

```
Frontend:  React Native (Expo) + TypeScript
상태관리:  Zustand (useAppStore)
라우팅:   Expo Router
SVG:      react-native-svg
인증:     Firebase Auth + Google Sign-In
DB:       Firebase Firestore (테스트모드 - 추후 보안규칙 강화 필요)
Storage:  Firebase Storage (광고 이미지)
로컬저장: AsyncStorage
네이티브: Kotlin (FloatingButtonService, FloatingButtonModule)
```

---

## 3. 프로젝트 구조

```
D:\app\FishLineV2\
├── app/
│   ├── _layout.tsx
│   ├── index.tsx                # 로그인 화면 (구글 로그인)
│   └── (tabs)/
│       ├── _layout.tsx          # 탭 네비게이션 (3개)
│       ├── simulator.tsx        # 라인 시뮬레이터
│       ├── counter.tsx          # 마릿수 카운터
│       └── settings.tsx         # 세팅 화면
├── components/
│   └── AdModal.tsx              # 광고 모달 컴포넌트
├── lib/
│   ├── firebase.ts
│   ├── auth.ts
│   ├── physics.ts               # 낚싯줄 물리 계산
│   ├── storage.ts               # Firestore 세팅 저장/불러오기
│   ├── FloatingService.ts       # 플로팅 버튼 브리지
│   └── adService.ts             # 광고 하루 1회 제한
├── store/
│   └── useAppStore.ts
├── constants/
│   └── peData.ts
├── assets/
│   └── images/
│       └── login_bg.png
└── android/
    ├── app/
    │   ├── google-services.json
    │   ├── build.gradle          ⚠️ versionCode, signingConfig 여기서 관리
    │   └── src/main/java/com/richcompany/fishlineapp/  ⚠️ 패키지명 변경됨
    │       ├── FloatingButtonModule.kt
    │       ├── FloatingButtonService.kt
    │       └── FloatingButtonPackage.kt
    └── build.gradle
```

---

## 4. 완성된 기능

### 4-1. 라인 시뮬레이터
- PE 호수 선택 (일본/미국/알리합사)
- 봉돌 무게 선택
- 조류 속도 / 수심 조절
- 실시간 낚싯줄 휨 곡선 SVG 렌더링
- 봉돌 드리프트 거리 / 각도 표시
- 내 세팅 저장 / 지우기
- 밤바다 배경 (별, 수면선, 배 일러스트)

### 4-2. 마릿수 카운터
- 항목 추가 / 삭제 / 리셋 (길게누르기 → 3가지 선택)
- + / - 버튼으로 카운트 조절
- TOTAL RECORD 합계 표시
- RECENT LOG 최근 10건 기록

### 4-3. 플로팅 카운터 (핵심 기능!)
- Android 포그라운드 서비스로 다른 앱 위에 표시
- 원형 골드 버튼 (탭 → +1, 길게누르기 → 드래그 이동)
- ☰ 버튼으로 미니패널 열기/닫기
- 미니패널: 항목별 카운트 (낚시, 검표, 재고관리 등 범용 활용 가능)
- 앱 ↔ 플로팅 버튼 양방향 실시간 동기화
- 백그라운드 토글 상태 AsyncStorage 저장

### 4-4. 세팅 화면
- 배 흐름 비율 선택 (40~90%)
- 백그라운드 실행 토글
- 앱 정보 / PE 라인 기준

### 4-5. 로그인 화면
- 채실장(GPT) 제작 블랙골드 스플래시 이미지
- Google 로그인 (Firebase Auth)

### 4-6. 자체 광고 시스템
- Firebase Storage 이미지 기반 전면 광고
  - `ads/settings_save.jpg` (세팅 저장 시)
  - `ads/floating_start.jpg` (백그라운드 실행 시)
- 7초 타이머 전면 광고 (스킵 불가)
- 하루 1회만 노출
- 광고 이미지 교체: Firebase Storage에서 같은 파일명으로 덮어쓰기
- 권장 이미지 규격: **720 x 1280px, JPG/PNG/GIF**

---

## 5. Firebase 설정

| 항목 | 값 |
|---|---|
| 프로젝트 ID | fishline-9e984 |
| 웹 클라이언트 ID | 257296302870-j1jqungq9l6vj3cqv86psvf5e9md28dk.apps.googleusercontent.com |
| SHA1 (구 키스토어) | 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25 |
| Storage 버킷 | fishline-9e984.firebasestorage.app |
| 개인정보처리방침 URL | https://fishline-9e984.web.app/privacy-policy.html |

---

## 6. 키스토어 정보

| 항목 | 값 |
|---|---|
| 파일명 | fishline-release.keystore |
| 위치 | D:\app\FishLineV2\android\app\ |
| alias | fishline |
| 비밀번호 | (본인만 알고있음) |

> ⚠️ **중요**: 키스토어 파일은 깃허브에 올라가지 않음!
> prebuild 또는 android 폴더 재생성 시 반드시 수동으로 복사해야 함.
> 키스토어 분실 시 앱 업데이트 불가 → 백업 필수!

---

## 7. 빌드 방법

### 개발 빌드 (실시간 테스트)
```bash
adb pair 192.168.0.9:페어링포트
adb connect 192.168.0.9:포트번호
adb devices

cd D:\app\FishLineV2
npx expo run:android
```

### 릴리즈 AAB 빌드 (플레이스토어 배포용)
```bash
cd D:\app\FishLineV2\android
.\gradlew bundleRelease

# 결과물 위치
android/app/build/outputs/bundle/release/app-release.aab
```

### 릴리즈 APK 빌드 (직접 설치용)
```bash
cd D:\app\FishLineV2\android
.\gradlew assembleRelease

# 결과물 위치
android/app/build/outputs/apk/release/app-release.apk
```

### GitHub 저장
```bash
cd D:\app\FishLineV2
git add .
git commit -m "커밋 메시지"
git push origin main
```

---

## 8. 버전 관리

> ⚠️ **버전 코드는 두 곳에서 관리됨. 반드시 둘 다 올려야 함!**

### app.json
```json
"android": {
  "versionCode": 2,
  ...
}
```

### android/app/build.gradle
```gradle
versionCode 2
versionName "1.0.0"
```

> 업로드할 때마다 versionCode를 1씩 올려야 함. 한 곳만 바꾸면 오류 남!

---

## 9. 서명 설정 (build.gradle)

```gradle
signingConfigs {
    release {
        storeFile file('fishline-release.keystore')
        storePassword '비밀번호'
        keyAlias 'fishline'
        keyPassword '비밀번호'
    }
}
buildTypes {
    debug {
        signingConfig signingConfigs.release
    }
    release {
        signingConfig signingConfigs.release
        ...
    }
}
```

> ⚠️ debug도 release 키로 서명해야 구글 플레이에 올라감!

---

## 10. 플로팅 버튼 초기 위치 설정

`android/.../FloatingButtonService.kt` → `setupFloatingButton()`:

```kotlin
floatParams = WindowManager.LayoutParams(...).apply {
    gravity = Gravity.TOP or Gravity.START  // 항상 TOP/START 유지
    x = 900
    y = 1800
}
```

> ⚠️ `BOTTOM or END` 로 바꾸면 드래그가 안 됨!

---

## 11. 광고 이미지 교체 방법

1. Firebase Console → Storage → `ads/` 폴더
2. 기존 파일 삭제
3. 같은 파일명으로 새 이미지 업로드
4. 앱 업데이트 없이 자동 반영 ✅

---

## 12. 구글 플레이 스토어 등록 정보

| 항목 | 값 |
|---|---|
| 패키지명 | com.richcompany.fishlineapp |
| 플레이스토어 링크 | https://play.google.com/store/apps/details?id=com.richcompany.fishlineapp |
| 개발자 계정 | richcompany (개인 계정) |
| 현재 상태 | 비공개 테스트 검토 중 (2026.04.17) |
| 구글 앱 서명 | Google Play 앱 서명 사용 중 (권장) |

---

## 13. ⚠️ 패키지명 변경 트러블슈팅 (중요!)

> 2026.04.17 플레이스토어 등록 과정에서 발생한 문제 기록

### 문제 발생 경위
- 원래 패키지명: `com.teamrich.fishline2`
- 이전에 삭제된 구글 플레이 계정에서 이미 사용된 패키지명이라 등록 불가
- `com.teamrich.fishline` 도 막혀있었음
- 최종 변경: `com.richcompany.fishlineapp`

### 패키지명 변경 절차

**1단계: app.json 수정**
```json
"android": {
  "package": "com.richcompany.fishlineapp"
}
```

**2단계: VSCode에서 전체 찾아바꾸기**
- `Ctrl + Shift + H`
- 찾기: `com.teamrich.fishline2`
- 바꾸기: `com.richcompany.fishlineapp`

**3단계: prebuild (android 폴더 재생성)**
```bash
cd D:\app\FishLineV2
npx expo prebuild --clean
```

> ⚠️ prebuild 하면 android 폴더가 완전히 재생성됨!
> 반드시 아래 파일들을 미리 백업해놓고 나중에 복사해야 함:
> - FloatingButtonService.kt
> - FloatingButtonModule.kt
> - FloatingButtonPackage.kt
> - android/app/src/main/res/layout/ 폴더 (floating_button.xml, mini_panel.xml, mini_panel_item.xml)
> - android/app/src/main/res/drawable/ 폴더
> - fishline-release.keystore

**4단계: 백업 파일 복사**
```bash
# Kotlin 파일 3개 복사
copy 백업경로\FloatingButtonService.kt D:\app\FishLineV2\android\app\src\main\java\com\richcompany\fishlineapp\
copy 백업경로\FloatingButtonModule.kt D:\app\FishLineV2\android\app\src\main\java\com\richcompany\fishlineapp\
copy 백업경로\FloatingButtonPackage.kt D:\app\FishLineV2\android\app\src\main\java\com\richcompany\fishlineapp\

# res 폴더 복사
xcopy 백업경로\layout\ D:\app\FishLineV2\android\app\src\main\res\layout\ /E /I
xcopy 백업경로\drawable\ D:\app\FishLineV2\android\app\src\main\res\drawable\ /E /I

# 키스토어 복사
copy 백업경로\fishline-release.keystore D:\app\FishLineV2\android\app\
```

**5단계: build.gradle 서명 설정 확인 및 수정**
- signingConfigs에 release 키스토어 설정
- debug도 release 서명으로 변경

**6단계: 빌드**
```bash
cd D:\app\FishLineV2\android
.\gradlew bundleRelease
```

---

## 14. 구글 플레이 등록 체크리스트

```
✅ 개발자 계정 설정 완료 (본인 인증, 전화번호 인증)
✅ 앱 만들기 (패키지명: com.richcompany.fishlineapp)
✅ 내부 테스트 AAB 업로드
✅ 스토어 등록정보 (아이콘, 피처그래픽, 스크린샷, 설명)
✅ 개인정보처리방침 URL 등록
✅ 콘텐츠 등급 (전체이용가)
✅ 타겟층 (만 13세 이상)
✅ 광고 선언 (광고 있음 - 자체 광고)
✅ 데이터 보안 설문
✅ 포그라운드 서비스 권한 선언
✅ 광고 ID 선언
✅ 비공개 테스트 AAB 업로드
✅ 검토 전송 완료 (2026.04.17)
⬜ 비공개 테스트 승인 대기 중
⬜ 프로덕션 신청
⬜ 정식 출시
```

---

## 15. 남은 작업

```
⬜ 비공개 테스트 승인 후 → AdMob 배너 광고 연동
⬜ AdMob 연동 후 → 광고 있음으로 업데이트 재제출
⬜ 물때표 API 연동 (국립해양조사원)
⬜ 카카오 로그인 (나중에)
⬜ 어드민 앱 (광고 이미지 관리)
⬜ 스마트라이더 AccessibilityService 스캔 기능
⬜ 데이터 보안 설문 정확하게 재작성 (구글 로그인/Firestore 수집 항목 추가)
```

---

## 16. 핵심 파일별 역할 요약

| 파일 | 역할 |
|---|---|
| `simulator.tsx` | 낚싯줄 시뮬레이터 메인 화면 |
| `counter.tsx` | 마릿수 카운터 + 플로팅 동기화 |
| `settings.tsx` | 세팅 + 플로팅 토글 + 광고 |
| `FloatingButtonService.kt` | Android 플로팅 서비스 (핵심!) |
| `FloatingButtonModule.kt` | RN ↔ Kotlin 브리지 |
| `FloatingService.ts` | JS에서 네이티브 호출 헬퍼 |
| `adService.ts` | 광고 하루 1회 제한 |
| `AdModal.tsx` | 광고 모달 UI |
| `useAppStore.ts` | 전역 상태 (items, curId, boatRatio 등) |
| `physics.ts` | 낚싯줄 휨 물리 계산 알고리즘 |

---

## 17. 개발 히스토리 요약

```
1단계: 낚싯줄 물리 계산 알고리즘 개발
2단계: SVG 기반 라인 시뮬레이터 완성
3단계: 마릿수 카운터 구현
4단계: Zustand 상태관리 도입
5단계: Android 네이티브 플로팅 버튼 구현 (★ 가장 복잡)
6단계: 플로팅 ↔ 앱 양방향 동기화 완성
7단계: 미니패널 (항목 선택/카운트) 완성
8단계: 구글 로그인 + 채실장 로그인 화면
9단계: 광고 시스템 (Firebase Storage 연동)
10단계: 토글 상태 영속화 (AsyncStorage)
11단계: 구글 플레이 스토어 등록 (패키지명 변경 포함) ← 2026.04.17
```

---

## 18. 앱 포지셔닝 (비즈니스)

> 처음엔 낚시 앱으로 시작했지만 실제로는 범용 플로팅 카운터!

**활용 분야:**
- 🎣 낚시 → 어종별 마릿수 카운터 (쭈꾸미 시즌 9월~겨울 피크)
- 🎬 영화/공연 검표원 → 남녀 입장객 카운터
- 🏪 매장 방문객 카운터
- 🏋️ 헬스장 운동 세트 카운터
- 📦 물류 박스 개수 카운터

**수익 예상 (사용자 1만명 기준):**
- AdMob 배너: 월 15만원
- 자체 광고 (낚시용품 업체 직접 수주): 건당 20~50만원
- 쭈꾸미 시즌 피크: 월 50~100만원 가능

---

*"내 뇌를 천만번 복사해봐라 그게 그대로 되나" — 팀리치 대표님*
*Rain Is Complete Honey 🌧️ = RICH 💰*
