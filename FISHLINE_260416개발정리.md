# FISHLINE — 개발 전체 정리 문서
> 작성일: 2026년 4월 16일
> 개발자: 팀리치 (웜부자) + 오실장 (Claude)

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 앱 이름 | FISHLINE |
| 서브타이틀 | LINE SIMULATOR PRO |
| 컨셉 | 선상낚시인을 위한 낚싯줄 시뮬레이터 + 마릿수 카운터 |
| 테마 | 블랙 & 골드 (LAFC 컬러 🖤💛) |
| 플랫폼 | Android (Expo/React Native) |
| GitHub | https://github.com/richcompany12/fishline.git |
| 로컬 경로 | D:\app\FishLineV2 |
| Firebase 프로젝트 | fishline-9e984 |
| 패키지명 | com.richcompany.fishlineapp |

---

## 2. 기술 스택

```
Frontend:  React Native (Expo) + TypeScript
상태관리:  Zustand (useAppStore)
라우팅:   Expo Router
SVG:      react-native-svg
인증:     Firebase Auth + Google Sign-In
DB:       Firebase Firestore
Storage:  Firebase Storage (광고 이미지)
로컬저장: AsyncStorage
네이티브: Kotlin (FloatingButtonService, FloatingButtonModule)
```

---

## 3. 프로젝트 구조

```
D:\app\FishLineV2\
├── app/
│   ├── _layout.tsx              # 루트 레이아웃
│   ├── index.tsx                # 로그인 화면 (구글 로그인)
│   └── (tabs)/
│       ├── _layout.tsx          # 탭 네비게이션 (3개)
│       ├── simulator.tsx        # 라인 시뮬레이터
│       ├── counter.tsx          # 마릿수 카운터
│       └── settings.tsx         # 세팅 화면
├── components/
│   └── AdModal.tsx              # 광고 모달 컴포넌트
├── lib/
│   ├── firebase.ts              # Firebase 설정
│   ├── auth.ts                  # Google 로그인 함수
│   ├── physics.ts               # 낚싯줄 물리 계산
│   ├── storage.ts               # Firestore 세팅 저장/불러오기
│   ├── FloatingService.ts       # 플로팅 버튼 브리지
│   └── adService.ts             # 광고 하루 1회 제한
├── store/
│   └── useAppStore.ts           # Zustand 전역 상태
├── constants/
│   └── peData.ts                # PE 라인 데이터
├── assets/
│   └── images/
│       └── login_bg.png         # 로그인 배경 이미지 (채실장 제작)
└── android/
    ├── app/
    │   ├── google-services.json
    │   ├── build.gradle
    │   └── src/main/java/com/teamrich/fishline2/
    │       ├── FloatingButtonModule.kt   # RN 브리지 모듈
    │       ├── FloatingButtonService.kt  # Android 포그라운드 서비스
    │       └── FloatingButtonPackage.kt  # 패키지 등록
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
- 내 세팅 저장 / 지우기 (저장 후 버튼 토글)
- 밤바다 배경 (별, 수면선, 배 일러스트)
- 배가 수면 위에 떠있도록 boatOffset 적용

### 4-2. 마릿수 카운터
- 항목 추가 / 삭제 / 리셋 (길게누르기 → 3가지 선택)
- 현재 항목 탭 선택
- + / - 버튼으로 카운트 조절
- TOTAL RECORD 합계 표시
- RECENT LOG 최근 10건 기록

### 4-3. 플로팅 카운터 (핵심 기능!)
- Android 포그라운드 서비스로 다른 앱 위에 표시
- 원형 골드 버튼 (탭 → +1, 길게누르기 → 드래그 이동)
- ☰ 버튼으로 미니패널 열기/닫기
- 미니패널: 항목 목록 표시
  - 짧게 탭 → 해당 항목 +1
  - 길게 누르기 → 해당 항목으로 선택 변경
- X 버튼 → 패널만 닫힘 (서비스 종료 아님)
- 앱 ↔ 플로팅 버튼 양방향 실시간 동기화
  - 앱 → 서비스: Broadcast (updateItems)
  - 서비스 → 앱: DeviceEventEmitter (FloatingSyncCount)
  - 서비스 시작 시: FloatingServiceStarted 이벤트로 데이터 push
- 백그라운드 토글 상태 AsyncStorage 저장 (앱 재시작 시 복원)

### 4-4. 세팅 화면
- 배 흐름 비율 선택 (40~90%)
- 백그라운드 실행 토글
  - 권한 없으면 설정 화면으로 이동
  - 권한 허용 후 앱 복귀 시 자동 활성화
  - 토글 상태 AsyncStorage 저장
- 앱 정보 / PE 라인 기준

### 4-5. 로그인 화면
- 채실장(GPT) 제작 블랙골드 스플래시 이미지
- Google 로그인 (Firebase Auth)
- 로그인 성공 시 메인으로 자동 이동

### 4-6. 광고 시스템
- Firebase Storage에 이미지 업로드
  - `ads/settings_save.jpg` (세팅 저장 시)
  - `ads/floating_start.jpg` (백그라운드 실행 시)
- 7초 타이머 전면 광고 (스킵 불가)
- 하루 1회만 노출 (AsyncStorage로 날짜 비교)
- 타이머 종료 후 자동으로 사라짐
- 광고 이미지 교체: Firebase Storage에서 같은 파일명으로 덮어쓰기
- 권장 이미지 규격: **720 x 1280px, JPG/PNG/GIF**

---

## 5. Firebase 설정

| 항목 | 값 |
|---|---|
| 프로젝트 ID | fishline-9e984 |
| 웹 클라이언트 ID | 257296302870-j1jqungq9l6vj3cqv86psvf5e9md28dk.apps.googleusercontent.com |
| SHA1 | 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25 |
| Storage 버킷 | fishline-9e984.firebasestorage.app |

---

## 6. 설치된 주요 패키지

```bash
# 핵심
expo-router
react-native-svg
zustand
firebase

# 인증
@react-native-google-signin/google-signin

# 저장
@react-native-async-storage/async-storage

# 광고
firebase/storage (Firebase Storage SDK)

# 기타
react-native-safe-area-context
expo-splash-screen
expo-auth-session
expo-web-browser
expo-crypto
```

---

## 7. 빌드 방법

### 개발 빌드 (실시간 테스트)
```bash
# 무선 디버깅 연결
adb pair 192.168.0.9:페어링포트   # 페어링
adb connect 192.168.0.9:포트번호  # 연결
adb devices                        # 확인

# 빌드 & 설치
cd D:\app\FishLineV2
npx expo run:android
```

### 릴리즈 APK 빌드 (배포용)
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

## 8. Kotlin 네이티브 파일 수정 시 주의사항

> **Kotlin 파일 수정 후에는 반드시 `npx expo run:android` 로 재빌드 필요!**
> JS/TS 파일은 Metro 서버가 실시간 반영하지만,
> Kotlin 네이티브 파일은 컴파일이 필요함.

---

## 9. 플로팅 버튼 초기 위치 설정

`android/.../FloatingButtonService.kt` → `setupFloatingButton()`:

```kotlin
floatParams = WindowManager.LayoutParams(...).apply {
    gravity = Gravity.TOP or Gravity.START  // 항상 TOP/START 유지
    x = 900    // 오른쪽에서 위치
    y = 1800   // 숫자 클수록 아래 (하단 네비게이션 근처)
}
```

> ⚠️ `BOTTOM or END` 로 바꾸면 드래그가 안 됨! 항상 `TOP or START` 유지

---

## 10. 광고 이미지 교체 방법

1. Firebase Console → Storage → `ads/` 폴더
2. 기존 파일 삭제
3. 같은 파일명으로 새 이미지 업로드
4. 앱 업데이트 없이 자동 반영 ✅

---

## 11. 남은 작업

```
⬜ 플로팅 버튼 초기 위치 빌드 적용 (Kotlin 수정 후 재빌드 필요)
⬜ 구글 플레이 스토어 등록
⬜ 애드몹 배너 광고 (하단 상시 노출)
⬜ 카카오 로그인 (나중에)
⬜ 물때표 API 연동 (국립해양조사원)
⬜ 어드민 앱 (광고 이미지 관리)
⬜ 스마트라이더 AccessibilityService 스캔 기능
```

---

## 12. 핵심 파일별 역할 요약

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

## 13. 개발 히스토리 요약

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
```

---

*"내 뇌를 천만번 복사해봐라 그게 그대로 되나" — 팀리치 대표님*
*Rain Is Complete Honey 🌧️ = RICH 💰*
