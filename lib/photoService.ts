/**
 * 사진 처리 헬퍼 모듈
 * - 갤러리/카메라에서 사진 선택
 * - 자동 리사이징 (300x400, ~100KB)
 * - 앱 전용 폴더에 영구 저장
 *
 * 수정 내역:
 * - 2026.04.27: 크롭 비활성화 (edgeToEdge와 크롭 UI 충돌 해결)
 *   사진은 자동 리사이징으로 대체
 */

import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

const PHOTO_DIR = FileSystem.documentDirectory + 'fishline_photos/';
const TARGET_WIDTH = 720;  // ⭐ 300 → 720 (자랑 카드 화질 개선)
const TARGET_HEIGHT = 960;
const COMPRESS_QUALITY = 0.85;  // ⭐ 0.7 → 0.85 (화질 약간 더)

// 사진 저장 폴더 생성 (없으면)
const ensurePhotoDir = async (): Promise<void> => {
  const info = await FileSystem.getInfoAsync(PHOTO_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
  }
};

// 갤러리 권한 요청
export const requestGalleryPermission = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
};

// 카메라 권한 요청
export const requestCameraPermission = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
};

// 갤러리에서 사진 선택
export const pickFromGallery = async (): Promise<string | null> => {
  const granted = await requestGalleryPermission();
  if (!granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false, // ⭐ 크롭 비활성화 (자동 리사이징으로 대체)
    quality: 1,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  return await processAndSavePhoto(result.assets[0].uri);
};

// 카메라로 사진 촬영
export const takePhoto = async (): Promise<string | null> => {
  const granted = await requestCameraPermission();
  if (!granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: false, // ⭐ 크롭 비활성화 (자동 리사이징으로 대체)
    quality: 1,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  return await processAndSavePhoto(result.assets[0].uri);
};

// 사진 처리 + 영구 저장 (내부)
const processAndSavePhoto = async (sourceUri: string): Promise<string> => {
  await ensurePhotoDir();

  // 리사이징 + 압축 (가로 기준 자동 비율 유지)
  const manipulated = await ImageManipulator.manipulateAsync(
    sourceUri,
    [{ resize: { width: TARGET_WIDTH } }], // ⭐ 가로만 지정 → 세로 자동
    {
      compress: COMPRESS_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  // 영구 저장 위치로 복사
  const filename = `photo_${Date.now()}.jpg`;
  const targetUri = PHOTO_DIR + filename;
  
  await FileSystem.moveAsync({
    from: manipulated.uri,
    to: targetUri,
  });

  return targetUri;
};

// 사진 파일 존재 여부 확인
export const photoExists = async (uri: string): Promise<boolean> => {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists;
  } catch {
    return false;
  }
};