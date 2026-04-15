import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {
  GoogleAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from './firebase';

// Google Sign-In 초기화 (앱 시작 시 1회 호출)
export function configureGoogleSignIn() {
GoogleSignin.configure({
  webClientId: '257296302870-j1jqungq9l6vj3cqv86psvf5e9md28dk.apps.googleusercontent.com',
});
}

// 구글 로그인
export async function signInWithGoogle(): Promise<User | null> {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const idToken = userInfo.data?.idToken;
    if (!idToken) throw new Error('idToken 없음');

    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    return result.user;
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      console.log('로그인 취소');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      console.log('로그인 진행 중');
    } else {
      console.log('로그인 오류:', error);
    }
    return null;
  }
}

// 로그아웃
export async function signOutUser() {
  try {
    await GoogleSignin.signOut();
    await firebaseSignOut(auth);
  } catch (e) {
    console.log('로그아웃 오류:', e);
  }
}

// 인증 상태 감지
export function onAuthChanged(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
