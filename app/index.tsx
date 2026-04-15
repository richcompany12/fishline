import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { configureGoogleSignIn, signInWithGoogle, onAuthChanged } from '@/lib/auth';
import { useAppStore } from '@/store/useAppStore';

configureGoogleSignIn();

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const { setUserId } = useAppStore();

  // 이미 로그인된 경우 자동으로 메인으로 이동
  useEffect(() => {
    const unsub = onAuthChanged((user) => {
      if (user) {
        setUserId(user.uid);
        router.replace('/(tabs)/simulator');
      } else {
        setChecking(false);
      }
    });
    return unsub;
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      if (user) {
        setUserId(user.uid);
        router.replace('/(tabs)/simulator');
      }
    } catch (e) {
      Alert.alert('오류', '로그인에 실패했어요. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color="#c9a84c" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* 배경 이미지 — 채실장 작품 */}
      <Image
        source={require('@/assets/images/login_bg.png')}
        style={styles.bg}
        resizeMode="cover"
      />

      {/* 하단 버튼 영역 */}
      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.googleBtn}
          onPress={handleGoogleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#080808" />
          ) : (
            <>
              {/* 구글 로고 */}
              <View style={styles.googleIcon}>
                <Text style={styles.googleIconText}>G</Text>
              </View>
              <Text style={styles.googleBtnText}>Google로 로그인</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    backgroundColor: '#080808',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#080808',
  },
  bg: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    width: '100%',
    height: '100%',
  },
  bottom: {
    position: 'absolute',
    bottom: 70,
    left: 10,
    right: 10,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#c9a84c',
    borderRadius: 4,
    paddingVertical: 16,
    gap: 10,
  },
  googleIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#080808',
    letterSpacing: 1,
  },
});
