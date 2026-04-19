import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAppStore } from '@/store/useAppStore';
import { updateFloatingItems } from '@/lib/FloatingService';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const items = useAppStore(s => s.items);
  const curId = useAppStore(s => s.curId);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  // ⭐ 앱 시작 시 & items/curId 변경 시 플로팅 서비스에 즉시 동기화
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const idx = items.findIndex(i => i.id === curId);
    updateFloatingItems(
      items.map(i => ({ name: i.name, count: i.count })),
      idx >= 0 ? idx : 0
    );
  }, [items, curId]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}