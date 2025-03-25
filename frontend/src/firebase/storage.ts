import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './init'

export const uploadImageToFirebase = async (file: File, path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    return downloadURL
  } catch (error) {
    console.error('Firebase upload error:', error)
    throw error
  }
}
