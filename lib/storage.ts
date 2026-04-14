import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface MySetting {
  lineType: string;
  peKey: string;
  dia: number;
  sinker: number;
}

export async function saveMySetting(userId: string, setting: MySetting) {
  try {
    await setDoc(doc(db, 'users', userId, 'settings', 'main'), setting);
  } catch (e) {
    console.log('저장 오류:', e);
  }
}

export async function loadMySetting(userId: string): Promise<MySetting | null> {
  try {
    const snap = await getDoc(doc(db, 'users', userId, 'settings', 'main'));
    if (snap.exists()) return snap.data() as MySetting;
    return null;
  } catch (e) {
    console.log('불러오기 오류:', e);
    return null;
  }
}