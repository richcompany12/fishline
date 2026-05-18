/**
 * CopilotTooltip.tsx
 * 
 * 글래스모피즘 스타일 커스텀 튜토리얼 툴팁
 * - 투명 유리 효과
 * - 골드 액센트
 * - 단계 표시 (1/5)
 * - 이전/다음/건너뛰기 버튼
 */

import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useCopilot } from 'react-native-copilot';

export function CopilotTooltip() {
  const {
    isFirstStep,
    isLastStep,
    currentStep,
    currentStepNumber,
    totalStepsNumber,
    goToNext,
    goToPrev,
    stop,
  } = useCopilot();

   if (!currentStep) return null;

  console.log('[COPILOT_DEBUG] currentStep:', {
    name: currentStep.name,
    order: currentStep.order,
    text: currentStep.text,
  });

  return (
    <View style={styles.container}>
      {/* 단계 표시 */}
      <View style={styles.stepBadge}>
        <Text style={styles.stepText}>
          {currentStepNumber} / {totalStepsNumber}
        </Text>
      </View>

      {/* 메인 텍스트 */}
      <Text style={styles.text}>{currentStep.text}</Text>

      {/* 버튼 영역 */}
      <View style={styles.btnRow}>
        {/* 건너뛰기 (왼쪽) */}
        <TouchableOpacity onPress={() => stop()} style={styles.skipBtn}>
          <Text style={styles.skipText}>건너뛰기</Text>
        </TouchableOpacity>

        {/* 이전/다음 (오른쪽) */}
        <View style={styles.navBtns}>
          {!isFirstStep && (
            <TouchableOpacity onPress={() => goToPrev()} style={styles.prevBtn}>
              <Text style={styles.prevText}>이전</Text>
            </TouchableOpacity>
          )}
          
          {!isLastStep ? (
            <TouchableOpacity onPress={() => goToNext()} style={styles.nextBtn}>
              <Text style={styles.nextText}>다음 →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => stop()} style={styles.nextBtn}>
              <Text style={styles.nextText}>완료 ✓</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
   container: {
    backgroundColor: 'rgba(15, 15, 15, 0.96)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#c9a84c',
    width: 280,
    maxWidth: 280,
    shadowColor: '#c9a84c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(232, 201, 106, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(232, 201, 106, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  stepText: {
    fontSize: 11,
    color: '#e8c96a',
    fontWeight: '700',
    letterSpacing: 1,
  },
  text: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 22,
    marginBottom: 20,
    fontWeight: '400',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 12,
    color: '#8a7a5a',
    letterSpacing: 0.5,
  },
  navBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  prevBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(232, 201, 106, 0.3)',
  },
  prevText: {
    fontSize: 12,
    color: '#c9a84c',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  nextBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#c9a84c',
  },
  nextText: {
    fontSize: 12,
    color: '#080808',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});