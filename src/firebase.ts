import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User, 
  updateProfile as firebaseUpdateProfile,
  deleteUser,
  reauthenticateWithPopup
} from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, onSnapshot, query, orderBy, limit, addDoc, getDocFromServer, deleteDoc, updateDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  ANALYST: 'analyst',
  EDITOR: 'editor'
} as const;

// Auth Helpers
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

export const updateProfile = async (user: User, data: { displayName?: string; photoURL?: string }) => {
  await firebaseUpdateProfile(user, data);
  const userDocRef = doc(db, 'users', user.uid);
  await updateDoc(userDocRef, data);
};

export const deleteAccount = async (user: User) => {
  // Re-authenticate if necessary (standard Firebase requirement for sensitive operations)
  try {
    await deleteUser(user);
    const userDocRef = doc(db, 'users', user.uid);
    await deleteDoc(userDocRef);
  } catch (error: any) {
    if (error.code === 'auth/requires-recent-login') {
      await reauthenticateWithPopup(user, googleProvider);
      await deleteUser(user);
      const userDocRef = doc(db, 'users', user.uid);
      await deleteDoc(userDocRef);
    } else {
      throw error;
    }
  }
};

// Firestore Connection Test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();
