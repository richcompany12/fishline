/**
 * FloatingService.ts
 * React Native ↔ FloatingButtonModule(네이티브) 브리지 헬퍼
 *
 * 수정 내용:
 * - getFloatingItems: 에러 시 null 반환 유지, 타입 명확화
 * - listenFloatingSyncCount: [BUG7 수정] 플로팅 버튼 탭 시 JS로 실시간 이벤트 수신
 * - updateFloatingStyle: 버튼 크기/색상 변경 (v1.0.1 추가)
 */
 
import {
  NativeModules,
  Platform,
  Alert,
  DeviceEventEmitter,
  EmitterSubscription,
} from 'react-native';
 
export type FloatItem = {
  name: string;
  count: number;
};
 
export type FloatState = {
  items: FloatItem[];
  selected: number;
};
 
// v1.0.1 추가: 스타일 타입
export type FloatSize = 'S' | 'M' | 'L';
export type FloatColor = 'GOLD' | 'BLUE' | 'RED';
 
// ─────────────────────────────────────────────
// 서비스 시작 / 중지
// ─────────────────────────────────────────────
 
export async function startFloatingButton(): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (!NativeModules.FloatingButtonModule) {
    Alert.alert('오류', '플로팅 버튼 모듈을 찾을 수 없어요.');
    return;
  }
  try {
    await NativeModules.FloatingButtonModule.startService();
  } catch (e: any) {
    if (e.code === 'NO_PERMISSION') {
      Alert.alert(
        '권한 필요',
        '설정에서 "다른 앱 위에 표시" 권한을 허용해주세요.\n허용 후 앱으로 돌아오면 자동으로 시작됩니다.'
      );
    } else {
      Alert.alert('오류', e.message || String(e));
    }
  }
}
 
export async function stopFloatingButton(): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (!NativeModules.FloatingButtonModule) return;
  try {
    await NativeModules.FloatingButtonModule.stopService();
  } catch (e) {
    console.log('[FloatingService] stopService 오류:', e);
  }
}
 
// ─────────────────────────────────────────────
// 앱 → 서비스: 항목 갱신
// ─────────────────────────────────────────────
 
/**
 * 앱의 현재 items 상태를 플로팅 버튼 서비스로 전송.
 * counter.tsx의 useEffect([items, curId]) 에서 호출.
 */
export function updateFloatingItems(
  items: FloatItem[],
  selectedIndex: number,
  countOnlyUpdate: boolean = false
): void {
  if (Platform.OS !== 'android') return;
  if (!NativeModules.FloatingButtonModule) return;
  try {
    const json = JSON.stringify(items);
    NativeModules.FloatingButtonModule.updateItems(json, selectedIndex, countOnlyUpdate);
  } catch (e) {
    console.log('[FloatingService] updateItems 오류:', e);
  }
}
 
// ─────────────────────────────────────────────
// v1.0.1 추가: 앱 → 서비스: 스타일 변경
// ─────────────────────────────────────────────
 
/**
 * 플로팅 버튼의 크기와 색상을 변경.
 * 설정 화면에서 사용자가 변경할 때 호출.
 */
export function updateFloatingStyle(
  size: FloatSize,
  color: FloatColor
): void {
  if (Platform.OS !== 'android') return;
  if (!NativeModules.FloatingButtonModule) return;
  try {
    NativeModules.FloatingButtonModule.updateStyle(size, color);
  } catch (e) {
    console.log('[FloatingService] updateStyle 오류:', e);
  }
}
 
// ─────────────────────────────────────────────
// 서비스 → 앱: 현재 상태 읽기 (풀링 방식)
// ─────────────────────────────────────────────
 
/**
 * 서비스의 현재 items/selected 값을 읽어옴.
 * 앱이 포그라운드로 돌아올 때(AppState active) 최종 상태 동기화에 사용.
 */
export async function getFloatingItems(): Promise<FloatState | null> {
  if (Platform.OS !== 'android') return null;
  if (!NativeModules.FloatingButtonModule) return null;
  try {
    const result = await NativeModules.FloatingButtonModule.getItems();
    const items: FloatItem[] = JSON.parse(result.items || '[]');
    return { items, selected: result.selected ?? 0 };
  } catch (e) {
    console.log('[FloatingService] getItems 오류:', e);
    return null;
  }
}
 
// ─────────────────────────────────────────────
// 서비스 → 앱: 실시간 이벤트 리스너 (push 방식)
// ─────────────────────────────────────────────
 
/**
 * [BUG7 수정] 플로팅 버튼에서 카운트가 변경될 때마다 서비스가 emit하는
 * 'FloatingSyncCount' 이벤트를 수신.
 */
export function listenFloatingSyncCount(
  callback: (state: FloatState) => void
): EmitterSubscription {
  return DeviceEventEmitter.addListener('FloatingSyncCount', (rawJson: string) => {
    try {
      const items: FloatItem[] = JSON.parse(rawJson || '[]');
      callback({ items, selected: 0 });
    } catch (e) {
      console.log('[FloatingService] FloatingSyncCount 파싱 오류:', e);
    }
  });
}
 
export function listenFloatingServiceStarted(
  callback: () => void
): EmitterSubscription {
  return DeviceEventEmitter.addListener('FloatingServiceStarted', callback);
}