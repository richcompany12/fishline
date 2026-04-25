# FISHLINE — 개발 전체 정리 문서 v3
> 작성일: 2026년 4월 25일
> 개발자: 팀리치 (웜부자) + 오실장 (Claude)
> 이전 버전: v2 (2026.04.17)

---

## 📌 v3 업데이트 내용 (2026.04.21 ~ 04.25)

- ✅ v1.1.1 업데이트 출시 완료 (versionCode 8)
- ✅ 시뮬레이터 시각 개선 (바닷속 배경 + 배 일러스트)
- ✅ 카운터 항목 이름 편집 기능
- ✅ 길게누르기 커스텀 메뉴 (이름변경/리셋/삭제)
- ✅ 조과 저장 + 히스토리 기능
- ✅ 앱 공유 기능 (모든 탭 헤더)
- ✅ 플로팅 버튼 4초 롱프레스 → 종료 팝업
- ✅ 플로팅 버튼 메탈릭 그라데이션 이미지 적용
- ✅ 플로팅 종료 시 세팅 토글 자동 OFF
- ❌ AdMob 광고 연동 시도 (실패 - RN 0.81 호환성 문제)

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
| 패키지명 | com.richcompany.fishlineapp |
| **현재 버전** | **v1.1.1 (versionCode 8)** |
| **출시 상태** | **비공개 테스트 v1.1.1 검토 중 (2026.04.25)** |

---

## 2. 기술 스택

```
Frontend:  React Native (Expo) + TypeScript
RN 버전:   0.81.5 ⚠️ AdMob 호환성 이슈 있음
상태관리:  Zustand (useAppStore)
라우팅:    Expo Router
SVG:       react-native-svg
인증:      Firebase Auth + Google Sign-In
DB:        Firebase Firestore
Storage:   Firebase Storage (광고 이미지)
로컬저장:  AsyncStorage (히스토리, 토글 상태)
네이티브:  Kotlin (FloatingButtonService, FloatingButtonModule)
```

### 📦 주요 패키지 버전 (2026.04.25 기준)

```json
"react-native": "0.81.5"
"@react-native-async-storage/async-storage": "2.2.0"
"@react-native-google-signin/google-signin": "^16.1.2"
"firebase": "^10.14.1"
"react-native-svg": "15.12.1"
"react-native-screens": "~4.16.0"
"react-native-safe-area-context": "~5.6.0"
```

> ⚠️ **Firebase 10.7.0으로 다운그레이드 시도 금지!** 다른 패키지와 충돌 발생!

---

## 3. 프로젝트 구조

```
D:\app\FishLineV2\
├── app/
│   ├── _layout.tsx
│   ├── index.tsx                # 로그인 화면
│   ├── history.tsx              # ⭐ NEW: 조과 히스토리 화면
│   └── (tabs)/
│       ├── _layout.tsx
│       ├── simulator.tsx        # 라인 시뮬레이터 (배경/배 이미지 적용)
│       ├── counter.tsx          # 마릿수 카운터 (이름편집/저장/공유)
│       └── settings.tsx         # 세팅 화면
├── components/
│   └── AdModal.tsx              # 자체 광고 모달
├── lib/
│   ├── firebase.ts
│   ├── auth.ts
│   ├── physics.ts
│   ├── storage.ts
│   ├── FloatingService.ts       # 플로팅 브리지 (listenFloatingStoppedByUser 추가)
│   ├── adService.ts
│   └── historyService.ts        # ⭐ NEW: 조과 저장/불러오기
├── store/
│   └── useAppStore.ts           # renameItem 추가
├── constants/
│   └── peData.ts
├── assets/
│   └── images/
│       ├── login_bg.png
│       ├── underwater_bg.png    # ⭐ NEW: 시뮬레이터 바닷속 배경
│       ├── boat.png             # ⭐ NEW: 배 일러스트
│       ├── float_gold.png       # ⭐ NEW: 플로팅 버튼 골드
│       ├── float_orange.png     # ⭐ NEW: 플로팅 버튼 오렌지
│       └── float_blue.png       # ⭐ NEW: 플로팅 버튼 블루
└── android/
    ├── app/
    │   ├── google-services.json
    │   ├── build.gradle
    │   └── src/main/
    │       ├── assets/images/   # ⭐ NEW: 플로팅 버튼 이미지 사본
    │       │   ├── float_gold.png
    │       │   ├── float_orange.png
    │       │   └── float_blue.png
    │       ├── java/com/richcompany/fishlineapp/
    │       │   ├── FloatingButtonModule.kt
    │       │   ├── FloatingButtonService.kt   # 4초 롱프레스 종료 추가
    │       │   └── FloatingButtonPackage.kt
    │       └── res/
    │           ├── layout/
    │           │   └── exit_confirm_dialog.xml  # ⭐ NEW
    │           └── drawable/
    │               ├── exit_dialog_bg.xml       # ⭐ NEW
    │               ├── exit_btn_confirm_bg.xml  # ⭐ NEW
    │               └── exit_btn_cancel_bg.xml   # ⭐ NEW
    └── build.gradle
```

---

## 4. 완성된 기능 (v1.1.1 기준)

### 4-1. 라인 시뮬레이터 ⭐ 시각 개선
- PE 호수 선택 (일본/미국/알리합사)
- 봉돌 무게 / 조류 속도 / 수심 조절
- 실시간 낚싯줄 휨 곡선 SVG 렌더링
- 봉돌 드리프트 거리 / 각도 표시
- **🆕 바닷속 배경 이미지** (수면 아래)
- **🆕 사실적인 배 일러스트**
- 내 세팅 저장 / 지우기

### 4-2. 마릿수 카운터 ⭐ 기능 대폭 추가
- 항목 추가 / 삭제 / 리셋
- **🆕 항목 이름 변경** (길게누르기 메뉴)
- **🆕 길게누르기 커스텀 모달 메뉴** (이모지 + 골드 테마)
  - ✏️ 이름 변경
  - 🔄 카운트 리셋
  - 🗑️ 삭제
- **🆕 조과 저장 기능** (메모 + 자동 날짜)
- **🆕 히스토리 화면 이동 버튼**
- TOTAL RECORD 헤더에 [💾 조과 저장] [📖] 버튼 고정 배치
- 합계 영역에 [⚠️ 전체 리셋] 이동 (UX 개선)

### 4-3. 플로팅 카운터 ⭐ 디자인 + 기능 개선
- **🆕 메탈릭 그라데이션 이미지 버튼** (채실장 작품)
  - GOLD / BLUE / ORANGE (RED 슬롯)
- **🆕 4초 롱프레스 → 종료 확인 팝업**
- **🆕 종료 시 앱 세팅 토글 자동 OFF**
- 짧게 탭 → +1 카운트
- 드래그 → 위치 이동 (자유)
- ☰ → 미니패널 열기
- 앱 ↔ 플로팅 양방향 실시간 동기화

### 4-4. 조과 히스토리 ⭐ 신규 화면
- AsyncStorage 기반 (오프라인 OK, 무료)
- 최대 100개 기록 저장
- 카드 대시보드 형태
- 각 기록별:
  - 날짜 / 메모 / 항목별 카운트 / 합계
  - 🔗 공유 (FISHLINE 앱 링크 포함)
  - 🗑️ 삭제

### 4-5. 앱 공유 기능 ⭐ 신규
- 모든 탭 우측 상단 [🔗 공유] 버튼
- React Native 기본 Share API 사용
- 카카오톡/문자/이메일 등 모든 앱에서 공유 가능
- 미리 작성된 홍보 메시지 + 플레이스토어 링크

### 4-6. 세팅 화면
- 배 흐름 비율 (40~90%)
- 백그라운드 실행 토글 (**🆕 플로팅 4초 종료 시 자동 OFF**)
- 플로팅 버튼 크기 (S/M/L)
- 플로팅 버튼 색상 (Gold/Blue/Red→Orange)
- 앱 정보 / PE 라인 기준

### 4-7. 자체 광고 시스템 (기존 유지)
- Firebase Storage 이미지 기반 전면 광고
- 7초 타이머 (스킵 불가)
- 하루 1회만 노출

---

## 5. ❌ AdMob 연동 시도 기록 (2026.04.25)

### 시도 배경
- 비공개 테스트 14일 대기 중 AdMob 배너 연동 시도
- 광고 단위 ID: `ca-app-pub-5136124041871438/...`

### 진행 단계
1. ✅ AdMob 계정 확인 (정상)
2. ✅ 새 앱 추가 (FISHLINE, com.richcompany.fishlineapp)
3. ✅ 배너 광고 단위 만들기 완료
4. ✅ `app.json`에 androidAppId 등록
5. ❌ **빌드 실패 - 호환성 문제**

### 시도한 패키지 버전 및 에러

| 버전 | 결과 | 에러 |
|------|------|------|
| `react-native-google-mobile-ads@latest` (15.x) | ❌ | `Cannot access 'NativeAppModuleSpec'`, `currentActivity` unresolved |
| `react-native-google-mobile-ads@14.7.2` | ❌ | 동일 에러 |
| `react-native-google-mobile-ads@13.2.0` | ❌ | `No "app.plugin.js" file found` (config plugin 없음) |
| `react-native-google-mobile-ads@15.4.0` | ❌ | `Unresolved reference 'currentActivity'`, `runOnUiThread` |

### 근본 원인
**React Native 0.81.5에서 `currentActivity` API 사라짐**
- AdMob 패키지가 아직 RN 0.81 완전 지원 안 됨
- `newArchEnabled=false` 이미 설정되어 있음 (이미 OK)
- `gradle.properties` 정상 (이미 OK)

### 검토한 해결책
1. ❌ 패키지 버전 다운그레이드 → config plugin 없음
2. ❌ 패키지 버전 업그레이드 → currentActivity 호환 안 됨
3. ⏸️ patch-package로 직접 수정 (위험성 vs 시간 대비 효과 낮음)
4. ⏸️ RN 0.79로 다운그레이드 (다른 패키지 깨질 위험 매우 큼)

### 결론 (현재)
- **AdMob 연동 보류** - 패키지 호환성 업데이트 대기
- 현재 잘 작동하는 v1.1.1 상태로 되돌림 (Git 복구)
- AdMob 패키지가 RN 0.81 호환 업데이트하면 30분 내 적용 가능

---

## 6. Firebase 설정 (변경 없음)

| 항목 | 값 |
|---|---|
| 프로젝트 ID | fishline-9e984 |
| 웹 클라이언트 ID | 257296302870-j1jqungq9l6vj3cqv86psvf5e9md28dk.apps.googleusercontent.com |
| Storage 버킷 | fishline-9e984.firebasestorage.app |
| 개인정보처리방침 URL | https://fishline-9e984.web.app/privacy-policy.html |

### 🆕 SHA-1 키 정보
- Google Play 앱 서명 SHA-1: `41:3B:53:94:59:15:19:F4:75:46:DD:22:45:33:8B:63:01:6B:1E:22`
- Firebase Console에 등록 완료

---

## 7. 키스토어 정보 (변경 없음)

| 항목 | 값 |
|---|---|
| 파일명 | fishline-release.keystore |
| 위치 | D:\app\FishLineV2\android\app\ |
| alias | fishline |
| 비밀번호 | (본인만 알고있음) |

> ⚠️ **중요**: GitHub에 올라가지 않음! prebuild 시 수동 백업 필수!

---

## 8. AdMob 정보 (참고용)

| 항목 | 값 |
|---|---|
| 앱 ID | `ca-app-pub-5136124041871438~XXXXXXXXXX` |
| 광고 단위 ID (배너) | `ca-app-pub-5136124041871438/XXXXXXXXXX` |
| 상태 | 광고 단위 생성 완료, 코드 연동 보류 |
| 향후 작업 | 패키지 호환성 업데이트 후 재시도 |

---

## 9. 빌드 방법 (변경 없음)

### 무선 디버깅 연결
```bash
# 전화기에서 무선 디버깅 ON → IP/포트 확인
adb connect 192.168.0.9:포트번호
adb devices
```

### 개발 빌드
```bash
adb -s 192.168.0.9:포트번호 uninstall com.richcompany.fishlineapp
cd D:\app\FishLineV2
npx expo run:android
```

### 릴리즈 AAB 빌드
```bash
cd D:\app\FishLineV2\android
.\gradlew bundleRelease
# 결과물: android/app/build/outputs/bundle/release/app-release.aab
```

### 서명 충돌 시
```bash
adb -s 192.168.0.9:포트번호 uninstall com.richcompany.fishlineapp
# 그 다음 다시 빌드
```

---

## 10. 버전 관리 (현재 상태)

> ⚠️ **두 곳에서 동시 관리, 반드시 둘 다 업데이트!**

### app.json
```json
"android": {
  "versionCode": 8,
  ...
},
"version": "1.1.1"
```

### android/app/build.gradle
```gradle
versionCode 8
versionName "1.1.1"
```

---

## 11. ⚠️ 트러블슈팅 모음

### 11-1. 패키지명 변경 (2026.04.17)
- 원래: `com.teamrich.fishline2` → 등록 불가
- 변경: `com.richcompany.fishlineapp`
- prebuild 후 Kotlin 파일들 수동 복원 필수

### 11-2. Firebase 다운그레이드 시도 실패 (2026.04.21)
- `firebase@10.14.1` → `firebase@10.7.0` 시도
- AsyncStorage persistence 추가하려 했으나 실패
- node_modules 꼬임 → GitHub 이전 커밋(`d93d880`)으로 복구
- **교훈: Firebase 버전 절대 다운그레이드 금지!**

### 11-3. 자동 로그인 시도 실패 (2026.04.21)
- `initializeAuth + getReactNativePersistence` 방식 시도
- RN 환경에서 `Component auth has not been registered yet` 런타임 에러
- 원인: Firebase JS SDK + Expo + Kotlin 네이티브 환경 충돌
- **결론: 현재 환경에서 자동 로그인은 매번 로그인하는 상태로 유지**

### 11-4. 카운터 태그 이름 끝 숫자 표시 문제
- 증상: 이름에 숫자 포함 시 마지막 1글자 짤림
- 예: "민기2다" → "민기2 ", "33" → "3 "
- 시도한 것: `numberOfLines={1}` + `ellipsizeMode="clip"` → 실패
- React Native Text 렌더링 버그 의심
- **상태: TODO (낮은 우선순위)**

### 11-5. AdMob 호환성 문제 (2026.04.25)
- RN 0.81.5 + AdMob 패키지 = `currentActivity` 못 찾음
- 모든 버전(13.x, 14.x, 15.x) 실패
- **상태: 패키지 업데이트 대기**

---

## 12. 현재 비즈니스 상태

### 출시 상태
- ✅ v1.0.0 비공개 테스트 출시 (2026.04.17)
- ✅ v1.1.1 비공개 테스트 업데이트 (2026.04.25, 검토 중)
- 알파 테스터 12명 옵트인
- 14일 대기 기간 진행 중

### 광고/수익화
- ❌ AdMob 연동 보류 (RN 호환성 대기)
- ✅ 자체 광고 시스템 (Firebase Storage) 작동 중
- 💡 향후: 낚시용품 업체 직접 광고 수주 가능

---

## 13. 📌 TODO 리스트

### 🔴 우선순위: 높음
- [ ] **AdMob 광고 연동** (패키지 RN 0.81 호환 업데이트 대기)
- [ ] 비공개 테스트 → 프로덕션 출시 검토

### 🟡 우선순위: 중간
- [ ] 조과 기록에 사진 첨부 기능
  - `expo-image-picker` + `expo-file-system`
  - 자동 리사이징 (300x400, ~100KB)
  - 사진 1~2장 제한
  - 폰 저장 (서버 비용 0원)
- [ ] 데이터 보안 설문 정확하게 재작성 (구글 로그인/Firestore 수집 항목)
- [ ] 카카오 로그인 추가
- [ ] 물때표 API 연동 (국립해양조사원)

### 🟢 우선순위: 낮음 (디테일 다듬기)
- [ ] 시뮬레이터 낚싯대 각도/시작 위치 조정
- [ ] 시뮬레이터 배 크기/위치 미세 조정
- [ ] 카운터 태그 이름 끝 숫자 표시 문제 (RN 렌더링 버그 우회)
- [ ] 조과 저장 기본 메모 포맷 개선
  - 현재: `2026년 4월 23일 쭈꾸미 갑오징어 낚시` (이상하게 붙음)
  - 목표: 날짜 + 줄바꿈 + 목록:수량 형식
- [ ] 자동 로그인 (다른 방식으로 재시도, 우선순위 매우 낮음)

### 💎 신규 아이디어
- [ ] 어드민 앱 (광고 이미지 관리)
- [ ] 스마트라이더 AccessibilityService 스캔 기능 (별도 프로젝트)
- [ ] 미래 사용자 1000명+ 시 백업 유료 기능 (월 1,000원 클라우드 백업)

---

## 14. 핵심 파일별 역할 (업데이트)

| 파일 | 역할 | 변경 |
|---|---|---|
| `simulator.tsx` | 시뮬레이터 메인 | 🆕 이미지 적용 + 공유 버튼 |
| `counter.tsx` | 카운터 + 플로팅 동기화 | 🆕 이름변경/저장/공유/메뉴 |
| `settings.tsx` | 세팅 + 토글 | 🆕 공유 + 플로팅 종료 동기화 |
| `history.tsx` | **NEW** 히스토리 화면 | 신규 |
| `_layout.tsx` (root) | 라우트 등록 | 🆕 history 추가 |
| `FloatingButtonService.kt` | 플로팅 서비스 | 🆕 4초 종료 + 이미지 로드 |
| `FloatingService.ts` | RN 브리지 | 🆕 listenFloatingStoppedByUser |
| `historyService.ts` | **NEW** 히스토리 저장 | 신규 |
| `useAppStore.ts` | 전역 상태 | 🆕 renameItem |
| `AdModal.tsx` | 자체 광고 | 변경 없음 |

---

## 15. 개발 히스토리 요약 (전체)

```
[v1.0.0 단계 - 2025.10 ~ 2026.04.17]
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
11단계: 구글 플레이 스토어 등록 (패키지명 변경)

[v1.0.1 단계 - 2026.04.18]
12단계: 플로팅 버튼 크기/색상 옵션 추가

[v1.1.0 단계 - 2026.04.21 (실패)]
13단계: 자동 로그인 시도 → 실패, GitHub 이전 커밋으로 복구
14단계: Firebase 버전 다운그레이드 실수 → node_modules 재설치로 복구

[v1.1.1 단계 - 2026.04.21 ~ 04.25 (성공!)]
15단계: 시뮬레이터 시각 개선 (바닷속 배경 + 배 이미지)
16단계: 카운터 항목 이름 편집 + 커스텀 메뉴
17단계: 조과 저장 + 히스토리 화면
18단계: 앱 공유 기능 (모든 탭)
19단계: 플로팅 버튼 메탈릭 이미지 적용 (채실장 작품)
20단계: 플로팅 4초 롱프레스 종료 + 토글 동기화
21단계: v1.1.1 비공개 테스트 출시 (2026.04.25)

[AdMob 시도 - 2026.04.25 (보류)]
22단계: AdMob 패키지 호환성 문제로 보류
```

---

## 16. 앱 포지셔닝 (변경 없음)

> 처음엔 낚시 앱으로 시작했지만 실제로는 **범용 플로팅 카운터!**

**활용 분야:**
- 🎣 낚시 → 어종별 마릿수 (쭈꾸미 시즌 9월~겨울 피크)
- 🎬 영화/공연 검표원 → 입장객 카운터
- 🏪 매장 방문객 카운터
- 🏋️ 헬스장 운동 세트 카운터
- 📦 물류 박스 개수 카운터

**수익 예상 (사용자 1만명 기준):**
- AdMob 배너: 월 15만원 (호환성 해결 후)
- 자체 광고 (낚시용품 업체 직접 수주): 건당 20~50만원
- 쭈꾸미 시즌 피크: 월 50~100만원 가능

---

## 17. 개발 환경 (참고)

```
Windows 10/11
VS Code
Android SDK
무선 디버깅 사용 (192.168.0.9:포트번호)
GitHub: richcompany12/fishline
```

---

*"내 뇌를 천만번 복사해봐라 그게 그대로 되나" — 팀리치 대표님*
*Rain Is Complete Honey 🌧️ = RICH 💰*
*"평생 숙원 AdMob, 호환성 업데이트 기다리며..." — 2026.04.25*
