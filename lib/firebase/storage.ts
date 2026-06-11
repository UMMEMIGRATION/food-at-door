import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './config'

/**
 * Upload an image file and return its public download URL.
 * @param path  - Storage path e.g. "restaurants/{id}/cover.jpg"
 * @param file  - The File object to upload
 */
export async function uploadImage(path: string, file: File): Promise<string> {
  const storageRef = ref(storage, path)
  const snapshot = await uploadBytes(storageRef, file)
  return getDownloadURL(snapshot.ref)
}

/**
 * Upload a restaurant cover image.
 */
export async function uploadRestaurantCover(restaurantId: string, file: File): Promise<string> {
  return uploadImage(`restaurants/${restaurantId}/cover_${Date.now()}`, file)
}

/**
 * Upload a restaurant logo image.
 */
export async function uploadRestaurantLogo(restaurantId: string, file: File): Promise<string> {
  return uploadImage(`restaurants/${restaurantId}/logo_${Date.now()}`, file)
}

/**
 * Upload a menu item image.
 */
export async function uploadMenuItemImage(restaurantId: string, itemId: string, file: File): Promise<string> {
  return uploadImage(`restaurants/${restaurantId}/menu/${itemId}_${Date.now()}`, file)
}

/**
 * Upload a user profile photo.
 */
export async function uploadUserPhoto(userId: string, file: File): Promise<string> {
  return uploadImage(`users/${userId}/photo_${Date.now()}`, file)
}

/**
 * Delete a file at the given full storage path.
 */
export async function deleteImage(fullPath: string): Promise<void> {
  const storageRef = ref(storage, fullPath)
  await deleteObject(storageRef)
}
