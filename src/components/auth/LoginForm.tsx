'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn, signUp } from '@/lib/firebase/auth';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import styles from './LoginForm.module.css';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('platformInvite');
  const [inviteId, setInviteId] = useState<string | null>(null);

  useEffect(() => {
    if (inviteToken) {
      const checkInvite = async () => {
        try {
          const q = query(collection(db, 'platformInvitations'), where('token', '==', inviteToken), where('status', '==', 'pending'));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const inviteData = snapshot.docs[0].data();
            setEmail(inviteData.email);
            setInviteId(snapshot.docs[0].id);
            setIsSignUp(true);
          }
        } catch (error) {
          console.error("Error checking platform invite:", error);
        }
      };
      checkInvite();
    }
  }, [inviteToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const userCredential = await signUp(email, password);
        
        // If it was an invite, mark it as accepted
        if (inviteId) {
          await updateDoc(doc(db, 'platformInvitations', inviteId), {
            status: 'accepted',
            acceptedAt: new Date(),
            userId: userCredential.user.uid
          });

          // Mark user as invited in their own document
          await updateDoc(doc(db, 'users', userCredential.user.uid), {
            isInvited: true
          });
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
          {loading ? 'Authenticating...' : (isSignUp ? 'Create Admin Account' : 'Sign In')}
        </button>

        {inviteId && isSignUp && (
          <button 
            type="button" 
            className={styles.toggleButton} 
            onClick={() => setIsSignUp(false)}
          >
            Already have an account? Sign In
          </button>
        )}

        {!inviteId && isSignUp && (
          <button 
            type="button" 
            className={styles.toggleButton} 
            onClick={() => setIsSignUp(false)}
          >
            Already have an account? Sign In
          </button>
        )}
      </form>
    </div>
  );
}
