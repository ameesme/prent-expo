import { Platform } from 'react-native';

/**
 * Saves a captured frame to the device's photo library.
 *
 * `expo-media-library` is imported lazily and only on native: its SDK 57 API is backed by
 * the `ExpoMediaLibraryNext` native module, which has no web implementation and throws on
 * import, taking the whole web bundle down with it.
 *
 * Add-only ("write only") permission is requested, so the app never asks to *read* the
 * user's library — and it is requested at the first capture rather than on launch, which
 * is the moment the permission actually makes sense.
 *
 * @returns whether the photo made it into the library.
 */
export async function saveToGallery(uri: string): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const MediaLibrary = await import('expo-media-library');
  const existing = await MediaLibrary.getPermissionsAsync(true, ['photo']);
  const permission = existing.granted
    ? existing
    : await MediaLibrary.requestPermissionsAsync(true, ['photo']);
  if (!permission.granted) return false;

  await MediaLibrary.Asset.create(uri);
  return true;
}
