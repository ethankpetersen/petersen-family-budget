'use client';

import { useState, FormEvent } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import styles from './Login.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.backgroundAccent}></div>
      <div className={styles.backgroundAccent2}></div>
      
      <div className={styles.glassCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Access the Petersen Family Vault</p>
        </div>

        <form onSubmit={handleSignIn} className={styles.form}>
          {error && <div className={styles.errorAlert} id="login-error-alert">{error}</div>}

          <div className={styles.inputGroup}>
            <label htmlFor="emailAddress" className={styles.label}>Email Address</label>
            <input
              id="emailAddress"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="passwordInput" className={styles.label}>Password</label>
            <input
              id="passwordInput"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <button 
            id="signInButton"
            type="submit" 
            disabled={loading} 
            className={styles.submitButton}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <span className={styles.arrowIcon}>→</span>}
          </button>
        </form>
      </div>
    </div>
  );
}
