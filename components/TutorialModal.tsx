/**
 * TutorialModal.tsx
 * 
 * 범용 튜토리얼 모달
 * - 단계별로 다른 이미지 표시 가능
 * - 풀스크린, 슬라이드, 핑크 강조
 */

import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  Image, Dimensions, ScrollView, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { useState, useRef } from 'react';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const SCREENSHOT_W = SCREEN_W * 0.72;
const SCREENSHOT_H = SCREEN_H * 0.48;

const ACCENT = '#ff6b8a';
const ACCENT_BG = 'rgba(255, 107, 138, 0.18)';

export interface TutorialStep {
  step: number;
  title: string;
  desc: string;
  // 단계마다 다른 이미지 표시 가능
  image: any;
  // 강조 표시 위치 (스크린샷 내부, 0~1 비율)
  focus: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

interface Props {
  visible: boolean;
  onClose: () => void;
  steps: TutorialStep[];
  totalLabel?: string; // "5" or "3" 등
}

export function TutorialModal({ visible, onClose, steps, totalLabel }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const total = totalLabel || String(steps.length);

  const goToStep = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * SCREEN_W, animated: true });
    setCurrentStep(index);
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (index !== currentStep) setCurrentStep(index);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      goToStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) goToStep(currentStep - 1);
  };

  // visible이 false면 currentStep 초기화
  if (!visible && currentStep !== 0) {
    setCurrentStep(0);
  }

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
          {steps.map((step) => {
            const focusTop = step.focus.top * SCREENSHOT_H;
            const focusLeft = step.focus.left * SCREENSHOT_W;
            const focusW = step.focus.width * SCREENSHOT_W;
            const focusH = step.focus.height * SCREENSHOT_H;
            
            return (
              <View key={step.step} style={styles.slide}>
                
                <View style={styles.screenshotWrap}>
                  <Image
                    source={step.image}
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
                  
                  {/* 숫자 마커 */}
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

                <View style={styles.infoCard}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>STEP {step.step} / {total}</Text>
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
          {steps.map((_, i) => (
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
              {currentStep === steps.length - 1 ? '시작하기 🎣' : '다음 →'}
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
  slideArea: {
    flex: 1,
  },
  slide: {
    width: SCREEN_W,
    alignItems: 'center',
    paddingTop: 16,
  },
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