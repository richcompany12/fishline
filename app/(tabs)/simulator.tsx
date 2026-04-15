import { View, Text, StyleSheet, ScrollView,
         TouchableOpacity, Dimensions } from 'react-native';
import { useState } from 'react';
import { PE_DATA, SINKERS, LineType } from '@/constants/peData';
import { calcLineCurve } from '@/lib/physics';
import { useAppStore } from '@/store/useAppStore';
import Svg, { Path, Line, Circle, Rect, Defs,
               LinearGradient, Stop } from 'react-native-svg';
import AdModal from '@/components/AdModal';
import { shouldShowAd, markAdShown, AD_KEY_SETTINGS } from '@/lib/adService';

const { width } = Dimensions.get('window');
const CANVAS_W = width - 32;
const CANVAS_H = 420;

export default function SimulatorScreen() {
  const { boatRatio, mySetting, saveUserSetting } = useAppStore();
  const [lineType, setLineType] = useState<LineType>('jp');
  const [peKey, setPeKey] = useState('1호');
  const [sinker, setSinker] = useState(150);
  const [current, setCurrent] = useState(1.0);
  const [depth, setDepth] = useState(80);
  const [saved, setSaved] = useState<any>(null);
  const [hasSaved, setHasSaved] = useState(false);
  const [adVisible, setAdVisible] = useState(false);

  const dia = PE_DATA[lineType][peKey] || 0.165;
  const vRel = current * 0.5144 * (1 - boatRatio / 100);
  const pts = calcLineCurve({ dia, sinker, vRel, depth });
  const savedPts = saved ? calcLineCurve(saved) : null;

  const last = pts[pts.length - 1];
  const drift = last.x.toFixed(1);
  const angle = (Math.atan2(last.x, last.y) * 180 / Math.PI).toFixed(1);

  // SVG 계산
  const surfY = 72;
  const availH = CANVAS_H - surfY - 20;
  const scaleY = availH / depth;
  const maxDrift = Math.max(...pts.map(p => p.x));
  const availW = CANVAS_W * 0.40;
  const scaleX = maxDrift > 0.1
    ? Math.min(availW / maxDrift, scaleY * 2.2)
    : scaleY;
  const cx = CANVAS_W / 2;
  const ox = cx + 34;
  const oy = surfY - 8;

  // [배 위치 수정] 배가 수면 위에 뜨도록 boatOffset 추가
  const boatOffset = 18; // 수면 위로 띄우는 픽셀

  function buildPath(points: {x:number,y:number}[]) {
    if (!points.length) return '';
    let d = `M ${ox} ${oy}`;
    points.forEach(p => {
      d += ` L ${ox + p.x * scaleX} ${surfY + p.y * scaleY}`;
    });
    return d;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>FISHLINE</Text>
        <Text style={styles.logoSub}>LINE SIMULATOR PRO</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── 캔버스 + 세팅 통합 박스 ── */}
        <View style={styles.canvasBox}>
          <Text style={styles.liveTag}>LIVE SIM</Text>

          {/* 상단: 라인셋업 */}
          <View style={styles.inlineSetup}>
            {/* 라인 타입 */}
            <View style={styles.inlineRow}>
              {(['jp','us','cn'] as LineType[]).map(t => (
                <TouchableOpacity key={t}
                  style={[styles.inlineBtn, lineType===t && styles.inlineBtnActive]}
                  onPress={() => setLineType(t)}>
                  <Text style={[styles.inlineBtnText, lineType===t && styles.inlineBtnTextActive]}>
                    {t==='jp'?'일본합사':t==='us'?'미국합사':'알리합사'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* PE 호수 */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              style={{marginBottom:6}}>
              <View style={{flexDirection:'row',gap:5}}>
                {Object.keys(PE_DATA[lineType]).map(k => (
                  <TouchableOpacity key={k}
                    style={[styles.smallBtn, peKey===k && styles.smallBtnActive]}
                    onPress={() => setPeKey(k)}>
                    <Text style={[styles.smallBtnText, peKey===k && styles.smallBtnTextActive]}>
                      {k}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* 봉돌 */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{flexDirection:'row',gap:5}}>
                {SINKERS.map(w => (
                  <TouchableOpacity key={w}
                    style={[styles.smallBtn, sinker===w && styles.smallBtnActive]}
                    onPress={() => setSinker(w)}>
                    <Text style={[styles.smallBtnText, sinker===w && styles.smallBtnTextActive]}>
                      {w}g
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* SVG 캔버스 */}
          <View style={{position:'relative'}}>
            <Svg width={CANVAS_W} height={CANVAS_H}>
              <Defs>
                <LinearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#060808" stopOpacity="1"/>
                  <Stop offset="1" stopColor="#020404" stopOpacity="1"/>
                </LinearGradient>
              </Defs>

              {/* 배경 */}
              <Rect width={CANVAS_W} height={CANVAS_H} fill="#050505"/>

              {/* 밤하늘 */}
              <Rect width={CANVAS_W} height={surfY} fill="#060810"/>
              {[...Array(20)].map((_,i) => (
                <Circle key={i}
                  cx={(i*137+13)%CANVAS_W}
                  cy={(i*89+7)%(surfY*0.8)+4}
                  r={0.5} fill="white"
                  opacity={0.2+Math.sin(i*1.3)*0.2}/>
              ))}

              {/* 물 */}
              <Rect x={0} y={surfY} width={CANVAS_W} height={CANVAS_H-surfY}
                fill="url(#seaGrad)"/>

              {/* 수면선 */}
              <Line x1={0} y1={surfY} x2={CANVAS_W} y2={surfY}
                stroke="rgba(201,168,76,0.5)" strokeWidth={0.8}/>

              {/* 조류 물결 */}
              {[0.2,0.4,0.6,0.8].map((ratio2,i) => {
                const wy = surfY + (CANVAS_H - surfY - 20) * ratio2;
                return (
                  <Path key={i}
                    d={`M0 ${wy} Q${CANVAS_W*0.25} ${wy-3} ${CANVAS_W*0.5} ${wy} Q${CANVAS_W*0.75} ${wy+3} ${CANVAS_W} ${wy}`}
                    fill="none" stroke="rgba(201,168,76,0.06)"
                    strokeWidth={0.8}/>
                );
              })}

              {/* 수심 격자 */}
              {Array.from({length:Math.floor(depth/20)},(_,i)=>(i+1)*20).map(d => {
                const py = surfY + d * scaleY;
                return py < CANVAS_H - 20 ? (
                  <Line key={d} x1={28} y1={py} x2={CANVAS_W} y2={py}
                    stroke="rgba(201,168,76,0.04)"
                    strokeWidth={0.5} strokeDasharray="2,4"/>
                ) : null;
              })}

              {/* 수심 라벨 */}
              {Array.from({length:Math.floor(depth/20)},(_,i)=>(i+1)*20).map(d => {
                const py = surfY + d * scaleY;
                return py < CANVAS_H - 20 ? (
                  <Path key={`t${d}`}
                    d={`M 4 ${py-2}`} fill="rgba(201,168,76,0.3)"/>
                ) : null;
              })}

              {/* 해저 */}
              <Rect x={0} y={CANVAS_H-16} width={CANVAS_W} height={16}
                fill="#100e08"/>

              {/* [배 위치 수정] boatOffset 만큼 위로 띄움 */}
              {/* 선체 — 수면 위에 올라오도록 */}
              <Path
                d={`M${cx-40} ${surfY-boatOffset} C${cx-44} ${surfY-boatOffset+10} ${cx-28} ${surfY-boatOffset+22} ${cx-16} ${surfY-boatOffset+22} L${cx+16} ${surfY-boatOffset+22} C${cx+28} ${surfY-boatOffset+22} ${cx+44} ${surfY-boatOffset+10} ${cx+40} ${surfY-boatOffset} Z`}
                fill="#1a1408" stroke="rgba(201,168,76,0.4)" strokeWidth={0.8}/>
              {/* 갑판 */}
              <Rect x={cx-22} y={surfY-boatOffset-9} width={44} height={8}
                fill="#141410" stroke="rgba(201,168,76,0.2)" strokeWidth={0.5}/>
              {/* 마스트 */}
              <Line x1={cx} y1={surfY-boatOffset-32} x2={cx} y2={surfY-boatOffset-8}
                stroke="#c9a84c" strokeWidth={2}/>
              {/* 항법등 */}
              <Circle cx={cx} cy={surfY-boatOffset-32} r={2.5} fill="#c9a84c"/>
              <Circle cx={cx} cy={surfY-boatOffset-32} r={5}
                fill="rgba(201,168,76,0.2)"/>
              {/* 낚싯대 */}
              <Line x1={cx} y1={surfY-boatOffset-24} x2={ox} y2={oy}
                stroke="rgba(201,168,76,0.5)" strokeWidth={1.2}/>
              {/* 릴 */}
              <Circle cx={cx+14} cy={surfY-boatOffset-12} r={2} fill="#c9a84c"/>

              {/* 저장 라인 (빨강 점선) */}
              {savedPts && (
                <Path d={buildPath(savedPts)} fill="none"
                  stroke="#e05555" strokeWidth={1.5}
                  strokeDasharray="8,5" opacity={0.65}/>
              )}

              {/* 메인 라인 (골드 글로우) */}
              <Path d={buildPath(pts)} fill="none"
                stroke="rgba(201,168,76,0.15)" strokeWidth={8}/>
              <Path d={buildPath(pts)} fill="none"
                stroke="#c9a84c" strokeWidth={2}/>

              {/* 봉돌 */}
              <Circle
                cx={ox + last.x * scaleX}
                cy={surfY + last.y * scaleY}
                r={10} fill="rgba(201,168,76,0.15)"/>
              <Circle
                cx={ox + last.x * scaleX}
                cy={surfY + last.y * scaleY}
                r={5} fill="#c9a84c"/>
            </Svg>

            {/* 좌측 세로 정보 패널 */}
            <View style={styles.sideInfo}>
              <View style={styles.sideItem}>
                <Text style={styles.sideLabel}>DRIFT</Text>
                <Text style={styles.sideVal}>{drift}m</Text>
              </View>
              <View style={styles.sideItem}>
                <Text style={styles.sideLabel}>ANGLE</Text>
                <Text style={styles.sideVal}>{angle}°</Text>
              </View>
              <View style={styles.sideItem}>
                <Text style={styles.sideLabel}>DIA</Text>
                <Text style={styles.sideVal}>{dia.toFixed(3)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── 조류/수심 컨트롤 ── */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>ENVIRONMENT</Text>
          {[
            { label:'조류 속도', val:current.toFixed(1)+'kt',
              min:0.1, max:2.0, step:0.1,
              set:setCurrent, cur:current },
            { label:'수심', val:depth+'m',
              min:10, max:200, step:5,
              set:setDepth, cur:depth },
          ].map(item => (
            <View key={item.label} style={styles.sliderRow}>
              <Text style={styles.ctrlLabel}>{item.label}</Text>
              <View style={styles.stepWrap}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => item.set(
                    Math.max(item.min, +(item.cur - item.step).toFixed(1))
                  )}>
                  <Text style={styles.stepBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepVal}>{item.val}</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => item.set(
                    Math.min(item.max, +(item.cur + item.step).toFixed(1))
                  )}>
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* ── 저장 버튼 ── */}
        {/* [버튼 토글 수정]
            저장 전: 내 세팅 저장 → 골드(활성), 지우기 → 흐림(비활성)
            저장 후: 내 세팅 저장 → 흐림(비활성), 지우기 → 골드(활성) */}
        <View style={styles.btnRow}>
          {/* 내 세팅 저장 버튼 */}
          <TouchableOpacity
            style={[styles.btnGold, hasSaved && styles.btnGoldDisabled]}
            disabled={hasSaved}
            onPress={async () => {
  setSaved({ dia, sinker, vRel, depth });
  setHasSaved(true);
  await saveUserSetting({ lineType, peKey, dia, sinker });

  // 광고 하루 1회 체크
  const show = await shouldShowAd(AD_KEY_SETTINGS);
  if (show) {
    await markAdShown(AD_KEY_SETTINGS);
    setAdVisible(true);
  }
}}>
            <Text style={[styles.btnGoldText, hasSaved && styles.btnTextDisabled]}>
              ⚓ 내 세팅 저장
            </Text>
          </TouchableOpacity>

          {/* 지우기 버튼 — 저장 후 골드로 활성화 */}
          <TouchableOpacity
            style={[
              hasSaved ? styles.btnGoldSmall : styles.btnGhost,
              !hasSaved && styles.btnGhostDisabled,
            ]}
            disabled={!hasSaved}
            onPress={() => { setSaved(null); setHasSaved(false); }}>
            <Text style={[
              hasSaved ? styles.btnGoldText : styles.btnGhostText,
              !hasSaved && styles.btnTextDisabled,
            ]}>
              지우기
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>  

      <AdModal       
        visible={adVisible}
        storagePathOrUrl="ads/settings_save.jpg"
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

  canvasBox: {
    margin:16, marginBottom:10,
    borderWidth:1, borderColor:'rgba(201,168,76,0.35)',
    borderRadius:4, overflow:'hidden',
    backgroundColor:'#0a0a0a',
  },
  liveTag: {
    fontSize:8, letterSpacing:3, color:'#c9a84c',
    padding:8, paddingBottom:4,
  },

  inlineSetup: {
    paddingHorizontal:10, paddingBottom:8,
    borderBottomWidth:1, borderBottomColor:'rgba(201,168,76,0.1)',
  },
  inlineRow: { flexDirection:'row', gap:5, marginBottom:6 },
  inlineBtn: {
    flex:1, padding:6, alignItems:'center',
    borderWidth:1, borderColor:'rgba(201,168,76,0.15)',
    borderRadius:3,
  },
  inlineBtnActive: {
    backgroundColor:'rgba(201,168,76,0.15)',
    borderColor:'rgba(201,168,76,0.4)',
  },
  inlineBtnText: { fontSize:11, color:'#8a7a5a' },
  inlineBtnTextActive: { color:'#e8c96a' },
  smallBtn: {
    paddingHorizontal:9, paddingVertical:5,
    borderWidth:1, borderColor:'rgba(201,168,76,0.15)',
    borderRadius:3,
  },
  smallBtnActive: {
    backgroundColor:'rgba(201,168,76,0.15)',
    borderColor:'rgba(201,168,76,0.4)',
  },
  smallBtnText: { fontSize:11, color:'#8a7a5a' },
  smallBtnTextActive: { color:'#e8c96a' },

  sideInfo: {
    position:'absolute', left:6, top:80,
    gap:16,
  },
  sideItem: { alignItems:'center' },
  sideLabel: {
    fontSize:7, letterSpacing:1.5,
    color:'rgba(201,168,76,0.5)', marginBottom:2,
  },
  sideVal: {
    fontSize:11, fontWeight:'700',
    color:'#e8c96a', letterSpacing:0.5,
  },

  panel: {
    margin:16, marginTop:0, backgroundColor:'#0f0f0f',
    borderWidth:1, borderColor:'rgba(201,168,76,0.15)',
    borderRadius:4, padding:16, marginBottom:10,
  },
  panelTitle: {
    fontSize:9, letterSpacing:4, color:'#c9a84c',
    marginBottom:14, fontWeight:'500',
  },
  sliderRow: {
    flexDirection:'row', justifyContent:'space-between',
    alignItems:'center', marginBottom:14,
  },
  ctrlLabel: { fontSize:12, color:'#8a7a5a', flex:1 },
  stepWrap: { flexDirection:'row', alignItems:'center', gap:8 },
  stepBtn: {
    width:32, height:32, borderWidth:1,
    borderColor:'rgba(201,168,76,0.2)', borderRadius:3,
    alignItems:'center', justifyContent:'center',
  },
  stepBtnText: { color:'#c9a84c', fontSize:18, lineHeight:22 },
  stepVal: {
    fontSize:14, fontWeight:'700', color:'#e8c96a',
    letterSpacing:1, minWidth:64, textAlign:'center',
  },

  btnRow: {
    flexDirection:'row', gap:8,
    margin:16, marginTop:0, marginBottom:24,
  },

  // 내 세팅 저장 — 기본 골드
  btnGold: {
    flex:1, backgroundColor:'#c9a84c',
    padding:13, borderRadius:4, alignItems:'center',
  },
  // 내 세팅 저장 — 저장 후 흐림
  btnGoldDisabled: {
    backgroundColor:'rgba(201,168,76,0.15)',
    borderWidth:1, borderColor:'rgba(201,168,76,0.2)',
  },

  // 지우기 — 저장 후 골드 (작은 버튼)
  btnGoldSmall: {
    paddingHorizontal:20, padding:13,
    backgroundColor:'#c9a84c',
    borderRadius:4, alignItems:'center',
  },

  // 지우기 — 기본 ghost
  btnGhost: {
    paddingHorizontal:20, padding:13, borderRadius:4,
    borderWidth:1, borderColor:'rgba(201,168,76,0.2)', alignItems:'center',
  },
  // 지우기 — 저장 전 흐림
  btnGhostDisabled: {
    opacity: 0.3,
  },

  btnGoldText: { color:'#080808', fontWeight:'700', fontSize:12, letterSpacing:1 },
  btnGhostText: { color:'#8a7a5a', fontSize:12 },
  btnTextDisabled: { color:'#3a3020' },
});
