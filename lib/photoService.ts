import * as ImagePicker from 'expo-image-picker';
import ImagePickerCrop from 'react-native-image-crop-picker'; // ⭐ 새 도구 연결
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

const PHOTO_DIR = FileSystem.documentDirectory + 'fishline_photos/';
const TARGET_WIDTH = 720;
const COMPRESS_QUALITY = 0.85;

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

// ⭐ 갤러리에서 사진 선택 (버튼 버그 해결 버전)
export const pickFromGallery = async (): Promise<string | null> => {
  const granted = await requestGalleryPermission();
  if (!granted) return null;

  try {
    // 새 도구로 갤러리 열기
    const image = await ImagePickerCrop.openPicker({
      width: 720,
      height: 960,
      cropping: true,          // 크롭 활성화
      includeBase64: false,
      mediaType: 'photo',
      cropperToolbarTitle: '자랑용 사진 자르기',
      cropperChooseText: '선택',
      cropperCancelText: '취소',
    });

    return await processAndSavePhoto(image.path);
  } catch (error) {
    console.log('선택 취소 또는 에러:', error);
    return null;
  }
};

// ⭐ 카메라로 사진 촬영 (버튼 버그 해결 버전)
export const takePhoto = async (): Promise<string | null> => {
  const granted = await requestCameraPermission();
  if (!granted) return null;

  try {
    const image = await ImagePickerCrop.openCamera({
      width: 720,
      height: 960,
      cropping: true,
      cropperToolbarTitle: '자랑용 사진 자르기',
      cropperChooseText: '선택',
      cropperCancelText: '취소',
    });

    return await processAndSavePhoto(image.path);
  } catch (error) {
    console.log('촬영 취소 또는 에러:', error);
    return null;
  }
};

// 사진 처리 + 영구 저장 (내부)
const processAndSavePhoto = async (sourceUri: string): Promise<string> => {
  await ensurePhotoDir();

  // 리사이징 (이미 위에서 크롭하며 720x960을 맞췄지만, 압축을 위해 한 번 더 수행)
  const manipulated = await ImageManipulator.manipulateAsync(
    sourceUri,
    [{ resize: { width: TARGET_WIDTH } }], 
    {
      compress: COMPRESS_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  const filename = `photo_${Date.now()}.jpg`;
  const targetUri = PHOTO_DIR + filename;
  
  await FileSystem.moveAsync({
    from: manipulated.uri,
    to: targetUri,
  });

  return targetUri;
};

export const photoExists = async (uri: string): Promise<boolean> => {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists;
  } catch {
    return false;
  }
};