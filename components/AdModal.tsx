/**
 * AdModal.tsx
 * Firebase Storage 이미지를 불러와서 7초 전면 광고로 표시
 * 타이머 종료 후 자동으로 사라짐 (스킵 불가)
 */

import {
  Modal, View, Image, Text, StyleSheet,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '@/lib/firebase';

const { width, height } = Dimensions.get('window');
const AD_DURATION = 7; // 초

interface AdModalProps {
  visible: boolean;
  storagePathOrUrl: string; // 'ads/settings_save.jpg' 또는 https:// URL
  onClose: () => void;
}

export default function AdModal({ visible, storagePathOrUrl, onClose }: AdModalProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(AD_DURATION);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 이미지 URL 불러오기
  useEffect(() => {
    if (!visible) return;
    setCountdown(AD_DURATION);
    setLoading(true);
    setImageUrl(null);

    const loadImage = async () => {
      try {
        if (storagePathOrUrl.startsWith('http')) {
          setImageUrl(storagePathOrUrl);
        } else {
          const url = await getDownloadURL(ref(storage, storagePathOrUrl));
          setImageUrl(url);
        }
      } catch (e) {
        console.log('광고 이미지 로드 오류:', e);
        onClose(); // 이미지 못 불러오면 그냥 닫기
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [visible, storagePathOrUrl]);

  // 카운트다운 타이머
  useEffect(() => {
    if (!visible || loading) return;

    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
  clearInterval(timerRef.current!);
  setTimeout(() => onClose(), 0);  // 👈 setTimeout으로 감싸기
  return 0;
}
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, loading]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.container}>

          {/* 상단: 광고 라벨 + 카운트다운 */}
          <View style={styles.topBar}>
            <Text style={styles.adLabel}>AD</Text>
            <View style={styles.countdown}>
              <Text style={styles.countdownText}>
                {countdown}초 후 자동으로 닫힙니다
              </Text>
            </View>
          </View>

          {/* 광고 이미지 */}
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#c9a84c" size="large"/>
            </View>
          ) : imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.adImage}
              resizeMode="contain"
            />
          ) : null}

          {/* 하단: 타이머 바 */}
          <View style={styles.timerBarWrap}>
            <View style={[
              styles.timerBar,
              { width: `${(countdown / AD_DURATION) * 100}%` }
            ]}/>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: width * 0.85,
    backgroundColor: '#0f0f0f',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,168,76,0.15)',
  },
  adLabel: {
    fontSize: 9,
    letterSpacing: 3,
    color: 'rgba(201,168,76,0.5)',
    fontWeight: '600',
  },
  countdown: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 3,
  },
  countdownText: {
    fontSize: 11,
    color: '#c9a84c',
    letterSpacing: 0.5,
  },
  loadingWrap: {
    height: height * 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adImage: {
    width: '100%',
    height: height * 0.55,
  },
  timerBarWrap: {
    height: 3,
    backgroundColor: 'rgba(201,168,76,0.1)',
  },
  timerBar: {
    height: 3,
    backgroundColor: '#c9a84c',
  },
});
