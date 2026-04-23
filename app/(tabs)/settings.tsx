import { View, Text, StyleSheet, ScrollView, Switch, AppState, TouchableOpacity, Share } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '@/store/useAppStore';
import { startFloatingButton, stopFloatingButton, updateFloatingItems, updateFloatingStyle, FloatSize, FloatColor } from '@/lib/FloatingService';
import AdModal from '@/components/AdModal';
import { shouldShowAd, markAdShown, AD_KEY_FLOATING } from '@/lib/adService';

const TOGGLE_KEY = 'floating_enabled';
const SIZE_KEY = 'floating_size';
const COLOR_KEY = 'floating_color';

export default function SettingsScreen() {
  const { boatRatio, setBoatRatio } = useAppStore();
  const [floatingEnabled, setFloatingEnabled] = useState(false);
  const [adVisible, setAdVisible] = useState(false);
  
  // v1.0.1 추가: 크기/색상 상태
  const [floatSize, setFloatSize] = useState<FloatSize>('M');
  const [floatColor, setFloatColor] = useState<FloatColor>('GOLD');

  // [토글/스타일 상태 복원] 앱 시작 시 저장된 값 불러오기
  useEffect(() => {
    const loadStates = async () => {
      try {
        const stored = await AsyncStorage.getItem(TOGGLE_KEY);
        if (stored === 'true') {
          setFloatingEnabled(true);
        }
        
        const storedSize = await AsyncStorage.getItem(SIZE_KEY);
        if (storedSize === 'S' || storedSize === 'M' || storedSize === 'L') {
          setFloatSize(storedSize);
        }
        
        const storedColor = await AsyncStorage.getItem(COLOR_KEY);
        if (storedColor === 'GOLD' || storedColor === 'BLUE' || storedColor === 'RED') {
          setFloatColor(storedColor);
        }
      } catch (e) {
        console.log('설정 불러오기 오류:', e);
      }
    };
    loadStates();
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
        // v1.0.1: 스타일도 재적용
        updateFloatingStyle(floatSize, floatColor);
      } catch (e: any) {
        if (e.code === 'NO_PERMISSION') {
          setFloatingEnabled(false);
          await AsyncStorage.setItem(TOGGLE_KEY, 'false');
        }
      }
    });
    return () => sub.remove();
  }, [floatingEnabled, floatSize, floatColor]);

    // ⭐ 앱 공유 기능
  const handleShare = async () => {
    try {
      await Share.share({
        message: `🎣 FISHLINE - 선상낚시인 필수앱 🎣

✅ 낚싯줄 라인 시뮬레이터
   (PE호수, 조류, 수심 실시간 계산)
✅ 마릿수 플로팅 카운터
   (다른 앱 위에서도 표시!)
✅ 맞춤 세팅 저장

▶ 구글플레이에서 다운로드:
https://play.google.com/store/apps/details?id=com.richcompany.fishlineapp

by 웜부자 🐟`,
      });
    } catch (error) {
      console.log('공유 오류:', error);
    }
  };
  
  // v1.0.1: 크기 변경 핸들러
  const handleSizeChange = async (size: FloatSize) => {
    setFloatSize(size);
    await AsyncStorage.setItem(SIZE_KEY, size);
    if (floatingEnabled) {
      updateFloatingStyle(size, floatColor);
    }
  };

  // v1.0.1: 색상 변경 핸들러
  const handleColorChange = async (color: FloatColor) => {
    setFloatColor(color);
    await AsyncStorage.setItem(COLOR_KEY, color);
    if (floatingEnabled) {
      updateFloatingStyle(floatSize, color);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.logo}>FISHLINE</Text>
          <Text style={styles.logoSub}>SETTINGS</Text>
        </View>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.7}>
          <Text style={styles.shareBtnIcon}>🔗</Text>
          <Text style={styles.shareBtnText}>공유</Text>
        </TouchableOpacity>
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
                await AsyncStorage.setItem(TOGGLE_KEY, value.toString());

                if (value) {
                  setFloatingEnabled(true);

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
                  // v1.0.1: 저장된 스타일 적용
                  updateFloatingStyle(floatSize, floatColor);
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
                다른 앱을 열어도 플로팅 버튼이 보여요.
              </Text>
            </View>
          )}
        </View>

        {/* v1.0.1 추가: 버튼 크기 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>BUTTON SIZE</Text>
          <View style={styles.sizeRow}>
            {([
              { key: 'S', label: '소', dp: 48 },
              { key: 'M', label: '중', dp: 72 },
              { key: 'L', label: '대', dp: 96 },
            ] as const).map(item => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.sizeBtn,
                  floatSize === item.key && styles.sizeBtnActive,
                ]}
                onPress={() => handleSizeChange(item.key)}
              >
                <View style={[
                  styles.sizePreview,
                  {
                    width: item.key === 'S' ? 20 : item.key === 'L' ? 40 : 30,
                    height: item.key === 'S' ? 20 : item.key === 'L' ? 40 : 30,
                    backgroundColor: floatSize === item.key 
                      ? getColorHex(floatColor) 
                      : '#3a3020',
                  }
                ]} />
                <Text style={[
                  styles.sizeLabel,
                  floatSize === item.key && styles.sizeLabelActive,
                ]}>{item.label}</Text>
                <Text style={styles.sizeDp}>{item.dp}dp</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* v1.0.1 추가: 버튼 색상 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>BUTTON COLOR</Text>
          <View style={styles.colorRow}>
            {([
              { key: 'GOLD', label: '골드', hex: '#c9a84c' },
              { key: 'BLUE', label: '블루', hex: '#4c88c9' },
              { key: 'RED',  label: '레드', hex: '#c94c4c' },
            ] as const).map(item => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.colorBtn,
                  floatColor === item.key && styles.colorBtnActive,
                ]}
                onPress={() => handleColorChange(item.key)}
              >
                <View style={[
                  styles.colorCircle,
                  { backgroundColor: item.hex },
                  floatColor === item.key && styles.colorCircleActive,
                ]} />
                <Text style={[
                  styles.colorLabel,
                  floatColor === item.key && styles.colorLabelActive,
                ]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 앱 정보 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>APP INFO</Text>
          {[
            ['버전', 'v1.0.1'],
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

// 색상 헬퍼
function getColorHex(color: FloatColor): string {
  switch (color) {
    case 'BLUE': return '#4c88c9';
    case 'RED':  return '#c94c4c';
    default:     return '#c9a84c';
  }
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#080808' },
  header: {
    paddingHorizontal:20, paddingTop:56, paddingBottom:16,
    borderBottomWidth:1, borderBottomColor:'rgba(201,168,76,0.15)',
    flexDirection: 'row', alignItems: 'flex-end',
  },
  shareBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)', borderRadius: 20 },
  shareBtnIcon: { fontSize: 13 },
  shareBtnText: { fontSize: 11, color: '#c9a84c', fontWeight: '600', letterSpacing: 1 },
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
  
  // v1.0.1 추가: 버튼 크기 스타일
  sizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  sizeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.15)',
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sizeBtnActive: {
    borderColor: 'rgba(201,168,76,0.6)',
    backgroundColor: 'rgba(201,168,76,0.08)',
  },
  sizePreview: {
    borderRadius: 100,
    marginBottom: 8,
  },
  sizeLabel: {
    fontSize: 13,
    color: '#8a7a5a',
    fontWeight: '500',
    marginBottom: 2,
  },
  sizeLabelActive: {
    color: '#e8c96a',
  },
  sizeDp: {
    fontSize: 9,
    color: '#5a5040',
    letterSpacing: 1,
  },
  
  // v1.0.1 추가: 버튼 색상 스타일
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  colorBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.15)',
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  colorBtnActive: {
    borderColor: 'rgba(201,168,76,0.6)',
    backgroundColor: 'rgba(201,168,76,0.08)',
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleActive: {
    borderColor: '#f0ead8',
  },
  colorLabel: {
    fontSize: 13,
    color: '#8a7a5a',
    fontWeight: '500',
  },
  colorLabelActive: {
    color: '#e8c96a',
  },
});
