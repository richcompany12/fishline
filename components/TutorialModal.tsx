/**
 * TutorialModal.tsx
 * 
 * FISHLINE 카운터 탭 사용법 튜토리얼
 * - 풀스크린 모달, 5단계
 * - 실제 화면 스크린샷 + 핑크 강조 + 숫자 마커
 * - 좌우 스와이프 가능 + 인디케이터
 */

import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  Image, Dimensions, ScrollView, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { useState, useRef } from 'react';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// 스크린샷 표시 영역 크기
const SCREENSHOT_W = SCREEN_W * 0.72;
const SCREENSHOT_H = SCREEN_H * 0.48;

interface TutorialStep {
  step: number;
  title: string;
  desc: string;
  // 강조 표시 위치 (스크린샷 내부, % 기준)
  focus: {
    top: number;    // 0~1 (상단부터 비율)
    left: number;   // 0~1 (왼쪽부터 비율)
    width: number;  // 0~1 (너비 비율)
    height: number; // 0~1 (높이 비율)
  };
}

const STEPS: TutorialStep[] = [
  {
    step: 1,
    title: '＋ 어종 추가',
    desc: '＋ 버튼을 눌러 어종을 추가하세요\n예: 갑오징어, 쭈꾸미',
    focus: { top: 0.09, left: 0.40, width: 0.25, height: 0.15 },
  },
  {
    step: 2,
    title: '＋ 카운트',
    desc: '＋ 버튼을 눌러 카운트하세요\n한 마리 잡을 때마다 탭!',
    focus: { top: 0.41, left: 0.40, width: 0.32, height: 0.17 },
  },
  {
    step: 3,
    title: '✋ 길게 누르기',
    desc: '아이템 항목을 길게 누르면\n이름 변경, 리셋, 삭제 가능',
    focus: { top: 0.11, left: 0.11, width: 0.28, height: 0.10 },
  },
  {
    step: 4,
    title: '💾 조과 저장 & 공유',
    desc: '오늘 잡은 조과를 사진과 함께 저장하고\n인스타·밴드에 공유할 수 있어요',
    focus: { top: 0.55, left: 0.09, width: 0.55, height: 0.10 },
  },
  {
    step: 5,
    title: '🎯 플로팅 카운터',
    desc: '플로팅 버튼을 켜면\n다른 앱을 사용 중일 때도 카운트가 가능해요',
    focus: { top: 0.04, left: 0.50, width: 0.38, height: 0.09 },
  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

const ACCENT = '#ff6b8a';  // 로즈 핑크
const ACCENT_BG = 'rgba(255, 107, 138, 0.18)';

export function TutorialModal({ visible, onClose }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const goToStep = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * SCREEN_W, animated: true });
    setCurrentStep(index);
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (index !== currentStep) setCurrentStep(index);
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      goToStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) goToStep(currentStep - 1);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View style={styles.container}>
        
        {/* 헤더 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>FISHLINE</Text>
            <Text style={styles.headerSub}>HOW TO USE</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.skipBtn}>
            <Text style={styles.skipText}>건너뛰기</Text>
          </TouchableOpacity>
        </View>

        {/* 슬라이드 영역 */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.slideArea}
        >
          {STEPS.map((step) => {
            const focusTop = step.focus.top * SCREENSHOT_H;
            const focusLeft = step.focus.left * SCREENSHOT_W;
            const focusW = step.focus.width * SCREENSHOT_W;
            const focusH = step.focus.height * SCREENSHOT_H;
            
            return (
              <View key={step.step} style={styles.slide}>
                
                {/* 스크린샷 + 강조 표시 */}
                <View style={styles.screenshotWrap}>
                  <Image
                    source={require('@/assets/tutorial/screen.png')}
                    style={styles.screenshot}
                    resizeMode="contain"
                  />
                  
                  {/* 핑크 강조 박스 */}
                  <View
                    style={[
                      styles.highlight,
                      {
                        top: focusTop,
                        left: focusLeft,
                        width: focusW,
                        height: focusH,
                      },
                    ]}
                    pointerEvents="none"
                  />
                  
                  {/* 숫자 마커 (강조 박스 좌상단에) */}
                  <View
                    style={[
                      styles.numberDot,
                      {
                        top: focusTop - 14,
                        left: focusLeft - 14,
                      },
                    ]}
                    pointerEvents="none"
                  >
                    <Text style={styles.numberDotText}>{step.step}</Text>
                  </View>
                </View>

                {/* 안내 카드 */}
                <View style={styles.infoCard}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>STEP {step.step} / 5</Text>
                  </View>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* 페이지 인디케이터 */}
        <View style={styles.indicators}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentStep && styles.dotActive]}
            />
          ))}
        </View>

        {/* 하단 버튼 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.navBtn, currentStep === 0 && styles.navBtnDisabled]}
            onPress={handlePrev}
            disabled={currentStep === 0}
          >
            <Text style={[styles.navBtnText, currentStep === 0 && styles.navBtnTextDisabled]}>
              ← 이전
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>
              {currentStep === STEPS.length - 1 ? '시작하기 🎣' : '다음 →'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
  },
  
  // 헤더
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,168,76,0.15)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 4,
    color: '#e8c96a',
  },
  headerSub: {
    fontSize: 9,
    letterSpacing: 3,
    color: '#8a7a5a',
    marginTop: 2,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    borderRadius: 20,
  },
  skipText: {
    fontSize: 11,
    color: '#c9a84c',
    fontWeight: '600',
    letterSpacing: 1,
  },

  // 슬라이드 영역
  slideArea: {
    flex: 1,
  },
  slide: {
    width: SCREEN_W,
    alignItems: 'center',
    paddingTop: 16,
  },
  
  // 스크린샷
  screenshotWrap: {
    width: SCREENSHOT_W,
    height: SCREENSHOT_H,
    position: 'relative',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
  },
  screenshot: {
    width: '100%',
    height: '100%',
  },
  highlight: {
    position: 'absolute',
    borderWidth: 2.5,
    borderColor: ACCENT,
    borderRadius: 8,
    backgroundColor: ACCENT_BG,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 10,
  },
  numberDot: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  numberDotText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },

  // 안내 카드
  infoCard: {
    marginTop: 20,
    marginHorizontal: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0f0f0f',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    borderRadius: 12,
    alignItems: 'center',
    width: SCREEN_W - 40,
  },
  stepBadge: {
    backgroundColor: 'rgba(232,201,106,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(232,201,106,0.4)',
    marginBottom: 10,
  },
  stepBadgeText: {
    fontSize: 10,
    color: '#e8c96a',
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e8c96a',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  stepDesc: {
    fontSize: 13,
    color: '#f0ead8',
    textAlign: 'center',
    lineHeight: 20,
    flexShrink: 1,
    flexWrap: 'wrap',
  },

  // 인디케이터
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(201,168,76,0.25)',
  },
  dotActive: {
    backgroundColor: '#e8c96a',
    width: 24,
  },

  // 하단 버튼
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(201,168,76,0.15)',
  },
  navBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    borderColor: 'rgba(201,168,76,0.1)',
  },
  navBtnText: {
    color: '#c9a84c',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
  },
  navBtnTextDisabled: {
    color: '#3a3020',
  },
  nextBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#c9a84c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    color: '#080808',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});