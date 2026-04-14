import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.emblem}>
        <Text style={styles.emblemIcon}>🎣</Text>
      </View>
      <Text style={styles.title}>FISHLINE</Text>
      <Text style={styles.subtitle}>PROFESSIONAL LINE SIMULATOR</Text>
      <View style={styles.divider} />

      {/* 로그인 일러스트 */}
      <Svg width={width * 0.75} height={160} style={styles.illust}>
        {/* 밤하늘 */}
        <Rect width={width * 0.75} height={160} fill="#060606" rx={8}/>
        {/* 별 */}
        <Circle cx={30} cy={20} r={1} fill="#c9a84c" opacity={0.8}/>
        <Circle cx={80} cy={12} r={0.8} fill="white" opacity={0.6}/>
        <Circle cx={150} cy={18} r={1.2} fill="white" opacity={0.7}/>
        <Circle cx={220} cy={10} r={0.9} fill="#c9a84c" opacity={0.8}/>
        {/* 달 */}
        <Circle cx={260} cy={24} r={13} fill="none" stroke="#c9a84c" strokeWidth={1} opacity={0.6}/>
        <Circle cx={265} cy={22} r={10} fill="#060606"/>
        {/* 수면 */}
        <Rect x={0} y={78} width={width*0.75} height={82} fill="#0a0a08"/>
        <Line x1={0} y1={78} x2={width*0.75} y2={78} stroke="#c9a84c" strokeWidth={0.5} opacity={0.5}/>
        {/* 조류 물결 */}
        <Path d={`M0 92 Q40 88 80 92 Q120 96 160 92 Q200 88 ${width*0.75} 92`}
          fill="none" stroke="#c9a84c" strokeWidth={0.6} opacity={0.2}/>
        {/* 배 선체 */}
        <Path d="M100 78 Q94 86 100 92 L160 92 Q166 86 160 78 Z"
          fill="#1a1408" stroke="#c9a84c" strokeWidth={0.5} opacity={0.9}/>
        <Rect x={108} y={72} width={44} height={7} rx={2} fill="#141410"/>
        {/* 마스트 */}
        <Rect x={128} y={50} width={2.5} height={24} fill="#c9a84c" opacity={0.8}/>
        {/* 깃발 */}
        <Path d="M130.5 50 L144 56 L130.5 62 Z" fill="#c9a84c" opacity={0.7}/>
        {/* 낚싯대 */}
        <Line x1={131} y1={62} x2={155} y2={78} stroke="#6b8fa8" strokeWidth={1.5}/>
        {/* 라인 */}
        <Path d="M155 78 C160 100 165 128 168 152"
          fill="none" stroke="#c9a84c" strokeWidth={1.2} opacity={0.8}/>
        {/* 봉돌 */}
        <Circle cx={168} cy={154} r={4} fill="#c9a84c" opacity={0.9}/>
        {/* 해저 */}
        <Rect x={0} y={153} width={width*0.75} height={7} fill="#1a1208" opacity={0.8}/>
      </Svg>

      <TouchableOpacity style={styles.googleBtn}
        onPress={() => router.replace('/(tabs)/simulator')}>
        <Text style={styles.googleBtnText}>🔑  GOOGLE 로그인</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/(tabs)/simulator')}>
        <Text style={styles.skipText}>둘러보기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:1, backgroundColor:'#080808',
    alignItems:'center', justifyContent:'center', padding:24,
  },
  emblem: {
    width:80, height:80, borderRadius:40,
    borderWidth:1, borderColor:'rgba(201,168,76,0.4)',
    alignItems:'center', justifyContent:'center', marginBottom:20,
  },
  emblemIcon: { fontSize:32 },
  title: {
    fontSize:36, fontWeight:'700', letterSpacing:8,
    color:'#e8c96a', marginBottom:6,
  },
  subtitle: { fontSize:9, letterSpacing:4, color:'#8a7a5a', marginBottom:12 },
  divider: {
    width:60, height:1,
    backgroundColor:'rgba(201,168,76,0.4)', marginBottom:36,
  },
  illust: { marginBottom:48, borderRadius:8, overflow:'hidden' },
  googleBtn: {
    backgroundColor:'#c9a84c', paddingVertical:14,
    paddingHorizontal:40, borderRadius:4, marginBottom:16,
  },
  googleBtnText: { color:'#080808', fontWeight:'700', fontSize:14, letterSpacing:1 },
  skipText: { color:'#3a3020', fontSize:12, letterSpacing:1 },
});