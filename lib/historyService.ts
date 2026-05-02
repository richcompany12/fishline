import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const HISTORY_KEY = '@fishline_history';
const MAX_RECORDS = 100;

export interface HistoryRecord {
  id: string;
  date: string;        // ISO 날짜 (정렬용)
  memo: string;        // 사용자 메모
  items: Array<{ name: string; count: number }>;
  totalCount: number;
  photoUri?: string;   // ⭐ 추가: 사진 파일 경로 (옵션)
}

// 모든 히스토리 불러오기
export const getAllHistory = async (): Promise<HistoryRecord[]> => {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('히스토리 불러오기 오류:', e);
    return [];
  }
};

// 새 기록 저장 ⭐ photoUri 파라미터 추가
export const saveHistory = async (
  memo: string,
  items: Array<{ name: string; count: number }>,
  photoUri?: string  // ⭐ 추가 (옵션)
): Promise<HistoryRecord> => {
  try {
    const existing = await getAllHistory();
    const newRecord: HistoryRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      memo: memo.trim(),
      items: items.filter(i => i.count > 0),
      totalCount: items.reduce((sum, i) => sum + i.count, 0),
      ...(photoUri && { photoUri }),  // ⭐ 사진 있으면 추가
    };
    // 최신 기록이 맨 앞에 오도록, 최대 100개까지만 유지
    const updated = [newRecord, ...existing].slice(0, MAX_RECORDS);
    
    // ⭐ MAX_RECORDS 초과로 잘려나간 기록의 사진 파일 삭제 (저장공간 정리)
    if (existing.length >= MAX_RECORDS) {
      const removed = existing.slice(MAX_RECORDS - 1);
      for (const r of removed) {
        if (r.photoUri) await deletePhotoFile(r.photoUri);
      }
    }
    
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return newRecord;
  } catch (e) {
    console.error('히스토리 저장 오류:', e);
    throw e;
  }
};

// 특정 기록 삭제 ⭐ 사진도 같이 삭제
export const deleteHistory = async (id: string): Promise<void> => {
  try {
    const existing = await getAllHistory();
    const target = existing.find(r => r.id === id);
    
    // ⭐ 사진 파일도 같이 삭제
    if (target?.photoUri) {
      await deletePhotoFile(target.photoUri);
    }
    
    const updated = existing.filter(r => r.id !== id);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('히스토리 삭제 오류:', e);
  }
};

// 전체 히스토리 삭제 ⭐ 모든 사진도 삭제
export const clearAllHistory = async (): Promise<void> => {
  try {
    // ⭐ 모든 사진 파일 삭제
    const all = await getAllHistory();
    for (const r of all) {
      if (r.photoUri) await deletePhotoFile(r.photoUri);
    }
    
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    console.error('전체 삭제 오류:', e);
  }
};

// ⭐ 사진 파일 안전 삭제 (헬퍼)
const deletePhotoFile = async (uri: string): Promise<void> => {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch (e) {
    console.warn('사진 파일 삭제 실패:', e);
    // 사진 삭제 실패해도 기록 삭제는 진행
  }
};

// 날짜 포맷 헬퍼
export const formatDate = (iso: string): string => {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${day} ${h}:${min}`;
};

// 메모 기본값 자동 생성
export const generateDefaultMemo = (items: Array<{ name: string; count: number }>): string => {
  const today = new Date();
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  const nonZero = items.filter(i => i.count > 0);
  const names = nonZero.map(i => i.name).join(' ');
  return `${dateStr} ${names} 낚시`;
};