/**
 * share-card.tsx
 *
 * 자랑 카드 화면
 * - 히스토리에서 [공유] 버튼 → 이 화면 진입
 * - ShareCard 미리보기
 * - [갤러리 저장] / [공유] 버튼
 */

import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { getAllHistory, HistoryRecord } from '@/lib/historyService';
import { ShareCard } from '@/components/ShareCard';

export default function ShareCardScreen() {
  const { recordId } = useLocalSearchParams<{ recordId: string }>();
  const [record, setRecord] = useState<HistoryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  
  const cardRef = useRef<View>(null);

  // 기록 불러오기
  useEffect(() => {
    (async () => {
      try {
        const all = await getAllHistory();
        const found = all.find(r => r.id === recordId);
        setRecord(found || null);
      } catch (e) {
        console.error('기록 로드 실패:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [recordId]);

  // 카드를 PNG로 캡처
  const captureCard = async (): Promise<string> => {
    if (!cardRef.current) throw new Error('카드 참조 실패');
    
    const uri = await captureRef(cardRef.current, {
      format: 'png',
      quality: 1.0,
      result: 'tmpfile',
    });
    
    return uri;
  };

  // 갤러리에 저장
  const handleSaveToGallery = async () => {
    if (saving) return;
    setSaving(true);
    
    try {
      // 권한 요청
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '갤러리 저장을 위해 권한이 필요합니다.');
        return;
      }
      
      // 캡처
      const uri = await captureCard();
      
      // 갤러리 저장
      const asset = await MediaLibrary.createAssetAsync(uri);
      
      // FISHLINE 앨범에 추가 (있으면 거기에, 없으면 새로 만들기)
      try {
        const album = await MediaLibrary.getAlbumAsync('FISHLINE');
        if (album) {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        } else {
          await MediaLibrary.createAlbumAsync('FISHLINE', asset, false);
        }
      } catch {
        // 앨범 추가 실패해도 갤러리에는 저장됨
      }
      
      Alert.alert('✅ 저장 완료', '갤러리의 FISHLINE 앨범에 저장됐어요!');
    } catch (e) {
      console.error('갤러리 저장 실패:', e);
      Alert.alert('저장 실패', '다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  // 공유 시트 호출
  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('공유 불가', '이 기기는 공유 기능을 지원하지 않습니다.');
        return;
      }
      
      // 캡처
      const uri = await captureCard();
      
      // 공유 시트 호출
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'FISHLINE 자랑 카드 공유',
      });
    } catch (e) {
      console.error('공유 실패:', e);
      Alert.alert('공유 실패', '다시 시도해주세요.');
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color="#c9a84c" />
        </View>
      </SafeAreaView>
    );
  }

  if (!record) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerWrap}>
          <Text style={styles.errorText}>기록을 찾을 수 없습니다.</Text>
          <TouchableOpacity style={styles.backBtn2} onPress={() => router.back()}>
            <Text style={styles.backBtn2Text}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.logo}>SHARE</Text>
          <Text style={styles.logoSub}>CATCH CARD</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 자랑 카드 미리보기 */}
        <View style={styles.cardWrap}>
          <ShareCard ref={cardRef} record={record} />
        </View>

        <Text style={styles.previewLabel}>
          ↑ 이 카드가 PNG 이미지로 저장/공유됩니다
        </Text>
      </ScrollView>

      {/* 하단 액션 버튼 */}
      <View style={styles.actionBar}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.saveBtn]} 
          onPress={handleSaveToGallery}
          disabled={saving || sharing}
        >
          {saving ? (
            <ActivityIndicator color="#c9a84c" />
          ) : (
            <Text style={styles.saveBtnText}>📥 갤러리 저장</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionBtn, styles.shareBtn]} 
          onPress={handleShare}
          disabled={saving || sharing}
        >
          {sharing ? (
            <ActivityIndicator color="#080808" />
          ) : (
            <Text style={styles.shareBtnText}>📤 공유하기</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080808' },
  
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    color: '#8a7a5a',
    fontSize: 14,
    marginBottom: 20,
  },
  backBtn2: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    borderRadius: 4,
  },
  backBtn2Text: {
    color: '#c9a84c',
    fontSize: 14,
    letterSpacing: 1,
  },
  
  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,168,76,0.15)',
  },
  backBtn: {
    marginRight: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backBtnText: {
    fontSize: 24,
    color: '#c9a84c',
    fontWeight: '300',
  },
  logo: { fontSize: 22, fontWeight: '700', letterSpacing: 4, color: '#e8c96a' },
  logoSub: { fontSize: 8, letterSpacing: 4, color: '#8a7a5a', marginTop: 2 },
  
  // 스크롤 영역
  scrollContent: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 40,
  },
  cardWrap: {
    // 미리보기 카드 그림자
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  previewLabel: {
    fontSize: 11,
    color: '#5a4a30',
    marginTop: 16,
    letterSpacing: 0.5,
  },
  
  // 하단 액션 바
  actionBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(201,168,76,0.15)',
    backgroundColor: '#080808',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  saveBtn: {
    backgroundColor: '#0f0f0f',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.4)',
  },
  saveBtnText: {
    color: '#c9a84c',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1,
  },
  shareBtn: {
    backgroundColor: '#c9a84c',
  },
  shareBtnText: {
    color: '#080808',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});