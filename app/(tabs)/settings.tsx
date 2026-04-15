import { View, Text, StyleSheet, ScrollView, Switch, AppState } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '@/store/useAppStore';
import { startFloatingButton, stopFloatingButton, updateFloatingItems } from '@/lib/FloatingService';
import AdModal from '@/components/AdModal';
import { shouldShowAd, markAdShown, AD_KEY_FLOATING } from '@/lib/adService';

const TOGGLE_KEY = 'floating_enabled';

export default function SettingsScreen() {
  const { boatRatio, setBoatRatio } = useAppStore();
  const [floatingEnabled, setFloatingEnabled] = useState(false);
  const [adVisible, setAdVisible] = useState(false);

  // [토글 상태 복원] 앱 시작 시 저장된 토글 상태 불러오기
  useEffect(() => {
    const loadToggleState = async () => {
      try {
        const stored = await AsyncStorage.getItem(TOGGLE_KEY);
        if (stored === 'true') {
          setFloatingEnabled(true);
        }
      } catch (e) {
        console.log('토글 상태 불러오기 오류:', e);
      }
    };
    loadToggleState();
  }, []);

  // 권한 설정 화면 갔다가 앱으로 돌아올 때 자동으로 서비스 시작 재시도
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (state) => {
      if (state !== 'active') return;
      if (!floatingEnabled) return;

      try {
        await startFloatingButton();
        const { items, curId } = useAppStore.getState();
        const idx = items.findIndex((i: any) => i.id === curId);
        updateFloatingItems(
          items.map((i: any) => ({ name: i.name, count: i.count })),
          idx >= 0 ? idx : 0,
          false
        );
      } catch (e: any) {
        if (e.code === 'NO_PERMISSION') {
          setFloatingEnabled(false);
          await AsyncStorage.setItem(TOGGLE_KEY, 'false'); // 권한 거부 시 저장도 false로
        }
      }
    });
    return () => sub.remove();
  }, [floatingEnabled]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>FISHLINE</Text>
        <Text style={styles.logoSub}>SETTINGS</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} style={{padding:16}}>

        {/* 배 흐름 비율 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>BOAT FLOW</Text>
          <View style={styles.ratioWrap}>
            <View style={styles.ratioLeft}>
              <Text style={styles.ratioVal}>{boatRatio}%</Text>
              <Text style={styles.ratioLabel}>배 흐름 비율</Text>
            </View>
            <View style={styles.ratioRight}>
              <View style={styles.stepBtns}>
                {[40,50,60,70,80,90].map(v => (
                  <Text key={v}
                    style={[styles.stepMark, boatRatio===v && styles.stepMarkActive]}
                    onPress={() => setBoatRatio(v)}>
                    {v}%
                  </Text>
                ))}
              </View>
            </View>
          </View>
          <View style={styles.ratioDesc}>
            <Text style={styles.ratioDescText}>
              실제 조류 속도와 배의 속도를 반영한 비율이에요.{'\n'}
              바람이 없는 날 기준 배는 조류의 약 60~70% 속도로 흘러요.{'\n'}
              맞바람이 강할수록 낮게, 순풍일수록 높게 설정하세요.
            </Text>
          </View>
        </View>

        {/* 플로팅 카운터 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>FLOATING COUNTER</Text>
          <View style={styles.switchRow}>
            <View style={styles.switchLeft}>
              <Text style={styles.switchLabel}>백그라운드 실행</Text>
              <Text style={styles.switchDesc}>
                유튜브, 인스타 등 다른 앱 위에{'\n'}
                카운터 버튼 표시
              </Text>
            </View>
            <Switch
              value={floatingEnabled}
              onValueChange={async (value) => {
                // [토글 상태 저장] 변경할 때마다 AsyncStorage에 저장
                await AsyncStorage.setItem(TOGGLE_KEY, value.toString());

                if (value) {
                  setFloatingEnabled(true);

                  // 광고 하루 1회 체크
                  const show = await shouldShowAd(AD_KEY_FLOATING);
                  if (show) {
                    await markAdShown(AD_KEY_FLOATING);
                    setAdVisible(true);
                  }

                  await startFloatingButton();
                  const { items, curId } = useAppStore.getState();
                  const idx = items.findIndex((i: any) => i.id === curId);
                  updateFloatingItems(
                    items.map((i: any) => ({ name: i.name, count: i.count })),
                    idx >= 0 ? idx : 0,
                    false
                  );
                } else {
                  setFloatingEnabled(false);
                  await stopFloatingButton();
                }
              }}
              trackColor={{
                false: '#1a1a1a',
                true: 'rgba(201,168,76,0.4)',
              }}
              thumbColor={floatingEnabled ? '#c9a84c' : '#3a3020'}
            />
          </View>
          {floatingEnabled && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                ✅ 활성화됐어요!{'\n'}
                다른 앱을 열어도 골드 버튼이 보여요.
              </Text>
            </View>
          )}
        </View>

        {/* 앱 정보 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>APP INFO</Text>
          {[
            ['버전', 'v1.0.0'],
            ['물때표 API', '국립해양조사원 (예정)'],
            ['해수 밀도', '1025 kg/m³'],
            ['보정계수', '0.85 (실측 기반)'],
            ['계산 세그먼트', '100 points'],
          ].map(([k,v]) => (
            <View key={k} style={styles.row}>
              <Text style={styles.rowKey}>{k}</Text>
              <Text style={styles.rowVal}>{v}</Text>
            </View>
          ))}
        </View>

        {/* PE 라인 기준 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>PE 라인 기준</Text>
          {[
            ['일본합사', '표준 직경 기준'],
            ['미국합사', '일본합사 대비 약 10% 굵음'],
            ['알리합사', '일본합사 대비 20% 굵음'],
          ].map(([k,v]) => (
            <View key={k} style={styles.row}>
              <Text style={styles.rowKey}>{k}</Text>
              <Text style={styles.rowVal}>{v}</Text>
            </View>
          ))}
        </View>

      </ScrollView>

      <AdModal
        visible={adVisible}
        storagePathOrUrl="ads/floating_start.jpg"
        onClose={() => setAdVisible(false)}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#080808' },
  header: {
    paddingHorizontal:20, paddingTop:56, paddingBottom:16,
    borderBottomWidth:1, borderBottomColor:'rgba(201,168,76,0.15)',
  },
  logo: { fontSize:22, fontWeight:'700', letterSpacing:4, color:'#e8c96a' },
  logoSub: { fontSize:8, letterSpacing:4, color:'#8a7a5a', marginTop:2 },
  card: {
    backgroundColor:'#0f0f0f', borderWidth:1,
    borderColor:'rgba(201,168,76,0.15)', borderRadius:4,
    padding:16, marginBottom:12,
  },
  cardTitle: {
    fontSize:9, letterSpacing:4, color:'#c9a84c',
    marginBottom:16, fontWeight:'500',
  },
  ratioWrap: {
    flexDirection:'row', alignItems:'center',
    marginBottom:14, gap:16,
  },
  ratioLeft: { alignItems:'center' },
  ratioVal: {
    fontSize:42, fontWeight:'700', color:'#e8c96a', letterSpacing:-1,
  },
  ratioLabel: { fontSize:10, color:'#8a7a5a', letterSpacing:1 },
  ratioRight: { flex:1 },
  stepBtns: { flexDirection:'row', flexWrap:'wrap', gap:6 },
  stepMark: {
    paddingHorizontal:12, paddingVertical:7,
    borderWidth:1, borderColor:'rgba(201,168,76,0.15)',
    borderRadius:3, fontSize:12, color:'#8a7a5a',
    overflow:'hidden',
  },
  stepMarkActive: {
    backgroundColor:'rgba(201,168,76,0.15)',
    borderColor:'rgba(201,168,76,0.4)',
    color:'#e8c96a',
  },
  ratioDesc: {
    backgroundColor:'rgba(201,168,76,0.05)',
    borderRadius:4, padding:12,
    borderWidth:1, borderColor:'rgba(201,168,76,0.1)',
  },
  ratioDescText: {
    fontSize:11, color:'#8a7a5a', lineHeight:18,
  },
  switchRow: {
    flexDirection:'row', justifyContent:'space-between', alignItems:'center',
  },
  switchLeft: { flex:1, marginRight:16 },
  switchLabel: { fontSize:13, color:'#f0ead8', marginBottom:4 },
  switchDesc: { fontSize:11, color:'#8a7a5a', lineHeight:16 },
  infoBox: {
    marginTop:12, padding:10,
    backgroundColor:'rgba(201,168,76,0.08)',
    borderWidth:1, borderColor:'rgba(201,168,76,0.2)',
    borderRadius:4,
  },
  infoText: { fontSize:11, color:'#c9a84c', lineHeight:16 },
  row: {
    flexDirection:'row', justifyContent:'space-between',
    paddingVertical:8, borderBottomWidth:1,
    borderBottomColor:'rgba(201,168,76,0.08)',
  },
  rowKey: { fontSize:12, color:'#8a7a5a' },
  rowVal: { fontSize:12, color:'#f0ead8', fontWeight:'500' },
});
