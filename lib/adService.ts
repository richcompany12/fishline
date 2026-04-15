/**
 * adService.ts
 * 광고 하루 1회 제한 관리
 * AsyncStorage 대신 Firebase Firestore 사용 (이미 설정되어 있으므로)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const AD_KEY_SETTINGS = 'ad_shown_settings';
const AD_KEY_FLOATING = 'ad_shown_floating';

// 오늘 날짜 문자열 반환 (YYYY-MM-DD)
function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

// 광고 표시 여부 확인 (하루 1회)
export async function shouldShowAd(key: string): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(key);
    if (!stored) return true;
    return stored !== getTodayStr();
  } catch {
    return true;
  }
}

// 광고 표시 완료 기록
export async function markAdShown(key: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, getTodayStr());
  } catch {
    console.log('광고 기록 오류');
  }
}

export { AD_KEY_SETTINGS, AD_KEY_FLOATING };
