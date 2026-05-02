/**
 * ShareCard.tsx
 *
 * 자랑 카드 컴포넌트 (트로피 모드)
 * - 9:16 비율 (인스타 스토리, 카톡 최적화)
 * - 사진이 메인 비주얼
 * - 시네마틱 그라데이션 오버레이
 * - 거대한 TOTAL 숫자 (메탈릭 골드)
 * - 하단 QR + 워터마크
 */

import { View, Text, Image, StyleSheet } from 'react-native';
import { forwardRef } from 'react';
import Svg, { Defs, LinearGradient, Stop, Rect, Line, Text as SvgText } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import { HistoryRecord, formatDate } from '@/lib/historyService';

// 카드 사이즈 (9:16 비율, 인스타 스토리 표준)
const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;

// 미리보기용 스케일 (실제 캡처 시에는 100%, 화면 표시 시에는 축소)
// 화면에서는 380으로 축소 표시 (≈ 35%)
const PREVIEW_WIDTH = 380;
const PREVIEW_SCALE = PREVIEW_WIDTH / CARD_WIDTH;
const PREVIEW_HEIGHT = CARD_HEIGHT * PREVIEW_SCALE;

const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.richcompany.fishlineapp';

interface ShareCardProps {
  record: HistoryRecord;
}

export const ShareCard = forwardRef<View, ShareCardProps>(({ record }, ref) => {
  const dateStr = formatShareDate(record.date);
  const dayStr = formatDayOfWeek(record.date);
  
  // 항목별 카운트를 두 개씩 묶기 (한 줄에 두 개 표시)
  const itemPairs: Array<[typeof record.items[0], typeof record.items[0] | null]> = [];
  for (let i = 0; i < record.items.length; i += 2) {
    itemPairs.push([record.items[i], record.items[i + 1] || null]);
  }
  
  return (
    <View 
      ref={ref}
      style={[styles.cardContainer, { width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }]}
      collapsable={false} // ⭐ view-shot 캡처 위해 필수
    >
      {/* 사진 (배경) */}
      {record.photoUri ? (
        <Image
          source={{ uri: record.photoUri }}
          style={styles.bgImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.bgFallback} />
      )}
      
      {/* 시네마틱 그라데이션 오버레이 (SVG) */}
      <View style={styles.overlayWrap} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox={`0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}`}>
          <Defs>
            {/* 위에서 아래로 어두워지는 그라데이션 */}
            <LinearGradient id="bottomDark" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#000" stopOpacity="0.1" />
              <Stop offset="40%" stopColor="#000" stopOpacity="0.3" />
              <Stop offset="70%" stopColor="#000" stopOpacity="0.75" />
              <Stop offset="100%" stopColor="#000" stopOpacity="0.95" />
            </LinearGradient>
            
            {/* 상단 약간 어둡게 */}
            <LinearGradient id="topDark" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#000" stopOpacity="0.6" />
              <Stop offset="100%" stopColor="#000" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          
          <Rect x="0" y="0" width={PREVIEW_WIDTH} height={PREVIEW_HEIGHT} fill="url(#bottomDark)" />
          <Rect x="0" y="0" width={PREVIEW_WIDTH} height={PREVIEW_HEIGHT * 0.18} fill="url(#topDark)" />
        </Svg>
      </View>
      
      {/* 콘텐츠 영역 (스케일 적용된 절대 좌표) */}
      <View style={styles.contentWrap} pointerEvents="none">
        
        {/* 헤더 - 좌상단 로고 */}
        <View style={[styles.headerLeft, { top: 50 * PREVIEW_SCALE, left: 60 * PREVIEW_SCALE }]}>
          <Text style={[styles.brandLogo, { fontSize: 28 * PREVIEW_SCALE }]}>FISHLINE</Text>
          <View style={[styles.brandLine, { width: 100 * PREVIEW_SCALE }]} />
          <Text style={[styles.brandSub, { fontSize: 22 * PREVIEW_SCALE }]}>CATCH OF THE DAY</Text>
        </View>
        
        {/* 헤더 - 우상단 날짜 */}
        <View style={[styles.headerRight, { top: 50 * PREVIEW_SCALE, right: 60 * PREVIEW_SCALE }]}>
          <Text style={[styles.dateMain, { fontSize: 26 * PREVIEW_SCALE }]}>{dateStr}</Text>
          <Text style={[styles.daySub, { fontSize: 20 * PREVIEW_SCALE }]}>{dayStr}</Text>
        </View>
        
        {/* 메인 영역 - 하단 좌측 */}
        <View style={[styles.mainArea, { 
          left: 60 * PREVIEW_SCALE, 
          right: 60 * PREVIEW_SCALE,
          bottom: 240 * PREVIEW_SCALE,
        }]}>
          
          {/* TOTAL 라벨 */}
          <Text style={[styles.totalLabel, { 
            fontSize: 24 * PREVIEW_SCALE, 
            marginBottom: 10 * PREVIEW_SCALE,
          }]}>TOTAL CATCH</Text>
          
          {/* 거대한 숫자 */}
          <View style={styles.totalNumberRow}>
            <Text style={[styles.totalNumber, { 
              fontSize: 220 * PREVIEW_SCALE,
              lineHeight: 220 * PREVIEW_SCALE,
            }]}>
              {record.totalCount}
            </Text>
            <Text style={[styles.totalUnit, { 
              fontSize: 50 * PREVIEW_SCALE,
              marginLeft: 20 * PREVIEW_SCALE,
              marginBottom: 30 * PREVIEW_SCALE,
            }]}>
              마리
            </Text>
          </View>
          
          {/* 골드 라인 */}
          <View style={[styles.goldDivider, { 
            width: 130 * PREVIEW_SCALE,
            marginTop: 10 * PREVIEW_SCALE,
            marginBottom: 30 * PREVIEW_SCALE,
          }]} />
          
          {/* 항목별 카운트 */}
          {itemPairs.map((pair, idx) => (
            <View key={idx} style={[styles.itemRow, { marginBottom: 12 * PREVIEW_SCALE }]}>
              <ItemText item={pair[0]} scale={PREVIEW_SCALE} />
              {pair[1] && (
                <>
                  <Text style={[styles.itemSep, { fontSize: 28 * PREVIEW_SCALE }]}> · </Text>
                  <ItemText item={pair[1]} scale={PREVIEW_SCALE} />
                </>
              )}
            </View>
          ))}
          
          {/* 메모 (이탤릭 인용) */}
          {record.memo ? (
            <Text style={[styles.memo, { 
              fontSize: 28 * PREVIEW_SCALE,
              marginTop: 25 * PREVIEW_SCALE,
            }]} numberOfLines={2}>
              "{record.memo}"
            </Text>
          ) : null}
        </View>
        
        {/* 하단 - QR + 브랜드 워터마크 */}
        <View style={[styles.footer, { 
          bottom: 80 * PREVIEW_SCALE,
          left: 60 * PREVIEW_SCALE,
          right: 60 * PREVIEW_SCALE,
        }]}>
          {/* 좌측: QR + 텍스트 */}
          <View style={styles.footerLeft}>
            <View style={[styles.qrWrap, { 
              width: 100 * PREVIEW_SCALE, 
              height: 100 * PREVIEW_SCALE,
              padding: 6 * PREVIEW_SCALE,
            }]}>
              <QRCode
                value={GOOGLE_PLAY_URL}
                size={88 * PREVIEW_SCALE}
                backgroundColor="white"
                color="black"
              />
            </View>
            <View style={{ marginLeft: 20 * PREVIEW_SCALE }}>
              <Text style={[styles.footerGet, { fontSize: 20 * PREVIEW_SCALE }]}>GET</Text>
              <Text style={[styles.footerBrand, { fontSize: 32 * PREVIEW_SCALE }]}>FISHLINE</Text>
              <Text style={[styles.footerSub, { fontSize: 16 * PREVIEW_SCALE }]}>on Google Play</Text>
            </View>
          </View>
          
          {/* 우측: 회사명 워터마크 */}
          <Text style={[styles.footerCompany, { fontSize: 16 * PREVIEW_SCALE }]}>
            RICHCOMPANY
          </Text>
        </View>
      </View>
    </View>
  );
});

ShareCard.displayName = 'ShareCard';

// 항목 텍스트 (이름 + 골드 숫자)
const ItemText = ({ item, scale }: { item: { name: string; count: number }; scale: number }) => (
  <Text style={{ color: '#fff', fontSize: 30 * scale, opacity: 0.9 }}>
    {item.name} <Text style={{ color: '#d4af37', fontWeight: '600' }}>{item.count}</Text>
  </Text>
);

// 날짜 포맷: 2026 . 04 . 27
function formatShareDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y} . ${m} . ${day}`;
}

// 요일 포맷: SUNDAY
function formatDayOfWeek(iso: string): string {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  return days[new Date(iso).getDay()];
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#0a1428',
    overflow: 'hidden',
    position: 'relative',
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  bgFallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#051528',
  },
  overlayWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  // 헤더 좌측 (로고)
  headerLeft: {
    position: 'absolute',
  },
  brandLogo: {
    color: '#fff',
    fontFamily: 'Georgia',
    letterSpacing: 6,
    fontWeight: '500',
  },
  brandLine: {
    height: 1,
    backgroundColor: '#d4af37',
    marginTop: 6,
    marginBottom: 8,
  },
  brandSub: {
    color: '#fff',
    letterSpacing: 3,
    opacity: 0.6,
  },
  
  // 헤더 우측 (날짜)
  headerRight: {
    position: 'absolute',
    alignItems: 'flex-end',
  },
  dateMain: {
    color: '#fff',
    letterSpacing: 2,
    opacity: 0.85,
  },
  daySub: {
    color: '#fff',
    letterSpacing: 4,
    opacity: 0.4,
    marginTop: 4,
  },
  
  // 메인 영역
  mainArea: {
    position: 'absolute',
  },
  totalLabel: {
    color: '#fff',
    letterSpacing: 5,
    opacity: 0.65,
  },
  totalNumberRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  totalNumber: {
    color: '#f4d57a',
    fontFamily: 'Georgia',
    fontWeight: '400',
  },
  totalUnit: {
    color: '#fff',
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    opacity: 0.85,
  },
  goldDivider: {
    height: 2,
    backgroundColor: '#d4af37',
  },
  itemRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  itemSep: {
    color: '#d4af37',
    opacity: 0.5,
  },
  memo: {
    color: '#fff',
    fontStyle: 'italic',
    fontFamily: 'Georgia',
    opacity: 0.7,
  },
  
  // 하단
  footer: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrWrap: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerGet: {
    color: '#fff',
    letterSpacing: 3,
    opacity: 0.55,
  },
  footerBrand: {
    color: '#fff',
    fontFamily: 'Georgia',
    letterSpacing: 4,
    fontWeight: '500',
  },
  footerSub: {
    color: '#fff',
    opacity: 0.4,
    letterSpacing: 1,
    marginTop: 2,
  },
  footerCompany: {
    color: '#fff',
    letterSpacing: 3,
    opacity: 0.3,
  },
});