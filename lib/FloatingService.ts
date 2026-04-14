import { NativeModules, Platform, Alert, NativeEventEmitter, DeviceEventEmitter } from 'react-native';

export async function startFloatingButton() {
  if (Platform.OS !== 'android') return;
  if (!NativeModules.FloatingButtonModule) {
    Alert.alert('오류', '플로팅 버튼 모듈을 찾을 수 없어요.');
    return;
  }
  try {
    await NativeModules.FloatingButtonModule.startService();
  } catch (e: any) {
    if (e.code === 'NO_PERMISSION') {
      Alert.alert('권한 필요', '설정에서 "다른 앱 위에 표시" 권한을 허용해주세요.');
    } else {
      Alert.alert('오류', e.message || String(e));
    }
  }
}

export async function stopFloatingButton() {
  if (Platform.OS !== 'android') return;
  if (!NativeModules.FloatingButtonModule) return;
  try {
    await NativeModules.FloatingButtonModule.stopService();
  } catch (e) {
    console.log('중지 오류:', e);
  }
}

export function updateFloatingItems(
  items: { name: string; count: number }[],
  selectedIndex: number
) {
  if (Platform.OS !== 'android') return;
  if (!NativeModules.FloatingButtonModule) return;
  try {
    const json = JSON.stringify(items);
    NativeModules.FloatingButtonModule.updateItems(json, selectedIndex);
  } catch (e) {
    console.log('항목 업데이트 오류:', e);
  }
}

export async function getFloatingItems(): Promise<{
  items: { name: string; count: number }[];
  selected: number;
} | null> {
  if (Platform.OS !== 'android') return null;
  if (!NativeModules.FloatingButtonModule) return null;
  try {
    const result = await NativeModules.FloatingButtonModule.getItems();
    const items = JSON.parse(result.items);
    return { items, selected: result.selected };
  } catch (e) {
    return null;
  }
}