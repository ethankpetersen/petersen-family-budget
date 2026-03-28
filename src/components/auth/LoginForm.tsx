'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn, signUp } from '@/lib/firebase/auth';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, updateDoc, doc, setDoc } from 'firebase/firestore';
import styles from './LoginForm.module.css';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const searchParams = useSearchParams();
  const platformInviteToken = searchParams.get('platformInvite');
  const householdInviteToken = searchParams.get('invite');
  
  const [inviteId, setInviteId] = useState<string | null>(null);
  const [inviteType, setInviteType] = useState<'platform' | 'household' | null>(null);
  const [householdData, setHouseholdData] = useState<any>(null);

  useEffect(() => {
    if (platformInviteToken) {
      const checkPlatformInvite = async () => {
        try {
          const q = query(collection(db, 'platformInvitations'), where('token', '==', platformInviteToken), where('status', '==', 'pending'));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const inviteData = snapshot.docs[0].data();
            setEmail(inviteData.email);
            setInviteId(snapshot.docs[0].id);
            setInviteType('platform');
            setIsSignUp(true);
          } else {
            setError('Invalid or expired platform invitation.');
          }
        } catch (error) {
          console.error("Error checking platform invite:", error);
        }
      };
      checkPlatformInvite();
    } else if (householdInviteToken) {
      const checkHouseholdInvite = async () => {
        try {
          const q = query(collection(db, 'invitations'), where('token', '==', householdInviteToken), where('status', '==', 'pending'));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const inviteData = snapshot.docs[0].data();
            setEmail(inviteData.email);
            setInviteId(snapshot.docs[0].id);
            setHouseholdData(inviteData);
            setInviteType('household');
            setIsSignUp(true);
          } else {
            setError('Invalid or expired household invitation link.');
          }
        } catch (error) {
          console.error("Error checking household invite:", error);
        }
      };
      checkHouseholdInvite();
    }
  }, [platformInviteToken, householdInviteToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const userCredential = await signUp(email, password);
        
        if (inviteType === 'platform' && inviteId) {
          await updateDoc(doc(db, 'platformInvitations', inviteId), {
            status: 'accepted',
            acceptedAt: new Date(),
            userId: userCredential.user.uid
          });

          await setDoc(doc(db, 'users', userCredential.user.uid), {
            email: email,
            role: 'admin',
            isInvited: true,
            createdAt: Date.now()
          }, { merge: true });
        } else if (inviteType === 'household' && inviteId && householdData) {
          await updateDoc(doc(db, 'invitations', inviteId), {
            status: 'accepted',
            acceptedAt: Date.now(),
            userId: userCredential.user.uid
          });

          await setDoc(doc(db, 'users', userCredential.user.uid), {
            email: email,
            householdId: householdData.householdId,
            role: 'member',
            isInvited: true,
            createdAt: Date.now()
          }, { merge: true });
        } else {
          // General sign up without any invitation
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            email: email,
            role: 'admin', 
            createdAt: Date.now()
          }, { merge: true });
        }
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2 className={styles.title}>
          {inviteId ? 'Accept Invitation' : (isSignUp ? 'Create Account' : 'Welcome Back')}
        </h2>
        <p className={styles.subtitle}>
          {inviteId 
            ? 'Set up your account and start your family household.'
            : (isSignUp 
                ? 'Set up your family budget account.' 
                : 'Enter your credentials to access the family vault.')}
        </p>
        
        {error && <div className={styles.error}>{error}</div>}
        
        <div className={styles.inputGroup}>
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            placeholder="admin@petersen.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            readOnly={!!inviteId}
            className={inviteId ? styles.readOnlyInput : ''}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? 'Authenticating...' : (isSignUp ? 'Create Account' : 'Sign In')}
        </button>

        <button 
          type="button" 
          className={styles.toggleButton} 
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
        </button>
      </form>
    </div>
  );
}
