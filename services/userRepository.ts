import { User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { db } from '@/lib/firebase';

export interface UserRepository {
  syncAuthenticatedUser(user: User): Promise<void>;
  getUserProfile(userId: string): Promise<UserProfile | null>;
  updateNickname(userId: string, nickname: string): Promise<void>;
}

export type UserProfile = {
  uid: string;
  nickname: string;
  displayName: string;
  photoURL?: string;
  email?: string;
};

class FirestoreUserRepository implements UserRepository {
  async syncAuthenticatedUser(user: User): Promise<void> {
    if (!user.email?.toLowerCase().endsWith('.ac.kr')) return;

    const reference = doc(db, 'users', user.uid);
    const existing = await getDoc(reference);
    await setDoc(
      reference,
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName ?? user.email.split('@')[0],
        ...(existing.exists() ? {} : { nickname: user.displayName ?? user.email.split('@')[0] }),
        photoURL: user.photoURL ?? null,
        ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!userId) return null;
    const snapshot = await getDoc(doc(db, 'users', userId));
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    const displayName = typeof data.displayName === 'string' ? data.displayName : '서로서가';
    return {
      uid: userId,
      nickname: typeof data.nickname === 'string' && data.nickname.trim() ? data.nickname.trim() : displayName,
      displayName,
      photoURL: typeof data.photoURL === 'string' ? data.photoURL : undefined,
      email: typeof data.email === 'string' ? data.email : undefined,
    };
  }

  async updateNickname(userId: string, nickname: string): Promise<void> {
    const nextNickname = nickname.trim();
    if (!userId) throw new Error('AUTH_REQUIRED');
    if (nextNickname.length < 2 || nextNickname.length > 20) throw new Error('INVALID_NICKNAME');
    await setDoc(doc(db, 'users', userId), {
      uid: userId,
      nickname: nextNickname,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }
}

export const userRepository: UserRepository = new FirestoreUserRepository();
