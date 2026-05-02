/**
 * ShareCard.tsx (v5 - 광고 효과 강화)
 *
 * 자랑 카드 컴포넌트
 * - 9:16 비율 (인스타 스토리, 카톡 최적화)
 * - 사진이 메인 비주얼
 * - 시네마틱 그라데이션 오버레이
 * - 거대한 TOTAL 숫자 (메탈릭 골드)
 * - 푸터 = 광고 영역 강화
 *   - QR 코드 크게 (인스타 인식 가능 사이즈)
 *   - FISHLINE 로고 거대 (Georgia + 메탈릭 골드)
 *   - "on Google Play" 명확
 *   - RICHCOMPANY 우측 하단 (저작권)
 */

import { View, Text, Image, StyleSheet } from 'react-native';
import { forwardRef } from 'react';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import { HistoryRecord } from '@/lib/historyService';

// 카드 사이즈 (9:16 비율, 인스타 스토리 표준)
const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;

// 미리보기용 스케일 (실제 캡처 시 1080×1920, 화면에서는 380px로 축소)
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
  
  // 항목별 카운트를 한 줄로 압축 (인터펀크트로 구분)
  const itemsLine = record.items.map(i => `${i.name} ${i.count}`).join(' · ');
  
  return (
    <View 
      ref={ref}
      style={[styles.cardContainer, { width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }]}
      collapsable={false}
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
      
      {/* 시네마틱 그라데이션 오버레이 */}
      <View style={styles.overlayWrap} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox={`0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}`}>
          <Defs>
            {/* 하단으로 갈수록 어두워짐 */}
            <LinearGradient id="bottomDark" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#000" stopOpacity="0" />
              <Stop offset="40%" stopColor="#000" stopOpacity="0.3" />
              <Stop offset="75%" stopColor="#000" stopOpacity="0.85" />
              <Stop offset="100%" stopColor="#000" stopOpacity="0.98" />
            </LinearGradient>
            
            {/* 상단 약간 어둡게 */}
            <LinearGradient id="topDark" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#000" stopOpacity="0.55" />
              <Stop offset="100%" stopColor="#000" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          
          <Rect x="0" y="0" width={PREVIEW_WIDTH} height={PREVIEW_HEIGHT} fill="url(#bottomDark)" />
          <Rect x="0" y="0" width={PREVIEW_WIDTH} height={PREVIEW_HEIGHT * 0.18} fill="url(#topDark)" />
        </Svg>
      </View>
      
      {/* 콘텐츠 영역 */}
      <View style={styles.contentWrap} pointerEvents="none">
        
        {/* 헤더 좌상단 - CATCH OF THE DAY */}
        <View style={[styles.headerLeft, { 
          top: 60 * PREVIEW_SCALE, 
          left: 56 * PREVIEW_SCALE,
        }]}>
          <View style={[styles.brandAccentLine, { 
            width: 110 * PREVIEW_SCALE, 
            height: 5 * PREVIEW_SCALE,
            marginBottom: 14 * PREVIEW_SCALE,
          }]} />
          <Text style={[styles.brandSub, { fontSize: 28 * PREVIEW_SCALE }]}>
            CATCH OF THE DAY
          </Text>
        </View>
        
        {/* 헤더 우상단 - 날짜 */}
        <View style={[styles.headerRight, { 
          top: 60 * PREVIEW_SCALE, 
          right: 56 * PREVIEW_SCALE,
        }]}>
          <Text style={[styles.dateMain, { fontSize: 36 * PREVIEW_SCALE }]}>
            {dateStr}
          </Text>
          <Text style={[styles.daySub, { 
            fontSize: 22 * PREVIEW_SCALE,
            marginTop: 6 * PREVIEW_SCALE,
          }]}>
            {dayStr}
          </Text>
        </View>
        
        {/* 메인 영역 - TOTAL CATCH */}
        <View style={[styles.mainArea, { 
          left: 56 * PREVIEW_SCALE, 
          right: 56 * PREVIEW_SCALE,
          bottom: 280 * PREVIEW_SCALE,
        }]}>
          
          {/* 골드 라인 + TOTAL CATCH 라벨 */}
          <View style={[styles.brandAccentLine, { 
            width: 130 * PREVIEW_SCALE, 
            height: 8 * PREVIEW_SCALE,
            marginBottom: 18 * PREVIEW_SCALE,
          }]} />
          <Text style={[styles.totalLabel, { 
            fontSize: 30 * PREVIEW_SCALE, 
            marginBottom: 8 * PREVIEW_SCALE,
          }]}>
            TOTAL CATCH
          </Text>
          
          {/* 거대한 숫자 + 마리 */}
          <View style={styles.totalNumberRow}>
            <Text style={[styles.totalNumber, { 
              fontSize: 280 * PREVIEW_SCALE,
              lineHeight: 280 * PREVIEW_SCALE,
            }]}>
              {record.totalCount}
            </Text>
            <Text style={[styles.totalUnit, { 
              fontSize: 60 * PREVIEW_SCALE,
              marginLeft: 24 * PREVIEW_SCALE,
              marginBottom: 40 * PREVIEW_SCALE,
            }]}>
              마리
            </Text>
          </View>
          
          {/* 항목별 카운트 */}
          <Text style={[styles.itemsLine, { 
            fontSize: 32 * PREVIEW_SCALE,
            marginTop: 16 * PREVIEW_SCALE,
          }]}>
            {itemsLine}
          </Text>
          
          {/* 메모 (이탤릭 인용) */}
          {record.memo ? (
            <Text style={[styles.memo, { 
              fontSize: 26 * PREVIEW_SCALE,
              marginTop: 20 * PREVIEW_SCALE,
            }]} numberOfLines={2}>
              "{record.memo}"
            </Text>
          ) : null}
        </View>
        
        {/* 푸터 - 광고 영역 */}
        <View style={[styles.footerBg, { 
          height: 220 * PREVIEW_SCALE,
        }]}>
          {/* 골드 상단 라인 */}
          <View style={[styles.footerTopLine, { height: 2 * PREVIEW_SCALE }]} />
          
          {/* 푸터 콘텐츠 */}
          <View style={[styles.footerContent, { 
            paddingHorizontal: 56 * PREVIEW_SCALE,
            paddingTop: 32 * PREVIEW_SCALE,
          }]}>
            
            {/* QR 코드 */}
            <View style={[styles.qrWrap, { 
              width: 176 * PREVIEW_SCALE, 
              height: 176 * PREVIEW_SCALE,
              padding: 10 * PREVIEW_SCALE,
            }]}>
              <QRCode
                value={GOOGLE_PLAY_URL}
                size={156 * PREVIEW_SCALE}
                backgroundColor="white"
                color="black"
              />
            </View>
            
            {/* FISHLINE + on Google Play + RICHCOMPANY */}
            <View style={[styles.brandTextWrap, { 
              marginLeft: 32 * PREVIEW_SCALE,
              flex: 1,
            }]}>
              <Text style={[styles.footerBrand, { 
                fontSize: 84 * PREVIEW_SCALE,
                lineHeight: 90 * PREVIEW_SCALE,
              }]}>
                FISHLINE
              </Text>
              <View style={styles.googlePlayRow}>
                <Text style={[styles.footerSub, { 
                  fontSize: 28 * PREVIEW_SCALE,
                }]}>
                  on Google Play
                </Text>
                <Text style={[styles.footerCompany, { 
                  fontSize: 22 * PREVIEW_SCALE,
                }]}>
                  RICHCOMPANY
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
});

ShareCard.displayName = 'ShareCard';

// 날짜 포맷: 2026.05.02
function formatShareDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

// 요일 포맷: SATURDAY
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
  
  // 골드 액센트 라인 (재사용)
  brandAccentLine: {
    backgroundColor: '#d4af37',
  },
  
  // 헤더 좌측
  headerLeft: {
    position: 'absolute',
  },
  brandSub: {
    color: '#fff',
    letterSpacing: 4,
    opacity: 0.85,
    fontFamily: 'Georgia',
  },
  
  // 헤더 우측
  headerRight: {
    position: 'absolute',
    alignItems: 'flex-end',
  },
  dateMain: {
    color: '#fff',
    letterSpacing: 2,
    fontWeight: '600',
    opacity: 0.95,
  },
  daySub: {
    color: '#fff',
    letterSpacing: 5,
    opacity: 0.55,
  },
  
  // 메인 영역
  mainArea: {
    position: 'absolute',
  },
  totalLabel: {
    color: '#fff',
    letterSpacing: 6,
    opacity: 0.7,
  },
  totalNumberRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  totalNumber: {
    color: '#f4d57a',
    fontFamily: 'Georgia',
    fontWeight: '500',
  },
  totalUnit: {
    color: '#fff',
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    opacity: 0.9,
  },
  itemsLine: {
    color: '#fff',
    opacity: 0.9,
    letterSpacing: 0.5,
  },
  memo: {
    color: '#fff',
    fontStyle: 'italic',
    fontFamily: 'Georgia',
    opacity: 0.7,
  },
  
  // 푸터 (광고 영역)
  footerBg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.94)',
  },
  footerTopLine: {
    backgroundColor: '#d4af37',
    opacity: 0.7,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  qrWrap: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTextWrap: {
    justifyContent: 'flex-start',
  },
  footerBrand: {
    color: '#f4d57a',
    fontFamily: 'Georgia',
    fontWeight: '600',
    letterSpacing: 6,
  },
  googlePlayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  footerSub: {
    color: '#fff',
    opacity: 0.65,
    letterSpacing: 2,
  },
  footerCompany: {
    color: '#8b6914',
    letterSpacing: 4,
    opacity: 0.85,
  },
});