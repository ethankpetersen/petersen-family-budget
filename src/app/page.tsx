'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import LoginForm from '@/components/auth/LoginForm';
import styles from './page.module.css';

export default function Home() {
  return (
    <Suspense fallback={<div className={styles.loadingContainer}><div className={styles.loader}></div></div>}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('platformInvite')) {
      setShowLogin(true);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <main className={styles.loadingContainer}>
        <div className={styles.loader}></div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        {!showLogin && !user && (
          <>
            <h1 className={styles.title}>Petersen Family Budget</h1>
            <p className={styles.subtitle}>
              Premium household financial management, simplified.
            </p>
            <div className={styles.ctaGroup}>
              <button className={styles.primaryButton} onClick={() => setShowLogin(true)}>
                Sign In
              </button>
            </div>
          </>
        )}

        {showLogin && !user && (
          <>
            <LoginForm />
            <button className={styles.textButton} onClick={() => setShowLogin(false)}>
              Back to start
            </button>
          </>
        )}

        {user && (
          <div className={styles.card}>
            <h2>Welcome back, {user.email}</h2>
            <p>You are successfully connected to the family vault.</p>
            <Link href="/dashboard" className={styles.primaryButton}>
              Go to Dashboard
            </Link>
          </div>
        )}
      </section>

      <footer className={styles.footer}>
        <p>&copy; 2024 Petersen Family Budget. All rights secured via Firestore.</p>
      </footer>
    </main>
  );
}
