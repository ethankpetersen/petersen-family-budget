'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { auth, db } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import styles from './DashboardLayout.module.css';

const NAV_ITEMS = [
  { id: 'nav-dashboard', label: 'Dashboard', path: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'nav-budget', label: 'Budget', path: '/dashboard/budget', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'nav-transactions', label: 'Transactions', path: '/dashboard/transactions', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { id: 'nav-recurring', label: 'Recurring', path: '/dashboard/recurring', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  { id: 'nav-settings', label: 'Settings', path: '/dashboard/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, householdId, isAdmin, isGlobalAdmin, isInvited } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [creatingHousehold, setCreatingHousehold] = useState(false);
  const [householdName, setHouseholdName] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setSidebarCollapsed(savedState === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !householdName.trim()) return;
    
    setCreatingHousehold(true);
    try {
      const householdRef = await addDoc(collection(db, 'households'), {
        name: householdName,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      
      await setDoc(doc(db, 'users', user.uid), {
        householdId: householdRef.id,
        role: 'admin', // First user in household defaults to admin for this flow
      }, { merge: true });
      // The local useAuth listener will automatically pick up the new 
      // householdId without needing a reload.
    } catch (error) {
      console.error('Error creating household:', error);
      setCreatingHousehold(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (!user) return null; // Wait for redirect to happen

  // Household Setup Interstitial
  if (!householdId) {
    return (
      <div className={styles.setupContainer}>
        <div className={styles.setupCard}>
          {isInvited || isGlobalAdmin ? (
            <>
              <h2 className={styles.setupTitle}>Create a Household</h2>
              <p className={styles.setupSubtitle}>Welcome! Before you can access the dashboard, you need to create a family vault.</p>
              <form onSubmit={handleCreateHousehold} className={styles.setupForm}>
                <input 
                  id="household-name-input"
                  type="text" 
                  placeholder="e.g. Petersen Family" 
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  className={styles.setupInput}
                  required
                />
                <button 
                  id="create-household-button"
                  type="submit" 
                  disabled={creatingHousehold} 
                  className={styles.setupBtn}
                >
                  {creatingHousehold ? 'Creating...' : 'Create Household'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className={styles.setupTitle} style={{ color: '#ef4444' }}>Access Restricted</h2>
              <p className={styles.setupSubtitle}>
                You need a platform invitation to create a new household. 
                If you believe this is an error, please contact the administrator.
              </p>
              <button 
                onClick={handleSignOut} 
                className={styles.setupBtn}
                style={{ background: 'var(--color-surface-hover)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--color-text)' }}
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.layout} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
      {/* Sidebar for Desktop / Hidden on Mobile */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarToggle} onClick={toggleSidebar}>
          <svg className={styles.chevronIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
          </svg>
        </div>

        <div className={styles.sidebarContent}>
          <div className={styles.brand}>
            <div className={styles.brandLogo}>Vault</div>
            <span className={styles.brandText}>Petersen Family</span>
          </div>

          <nav className={styles.nav}>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
              return (
                <Link key={item.path} href={item.path} id={item.id} className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`} title={sidebarCollapsed ? item.label : ''}>
                  <svg className={styles.navIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  <span className={styles.navText}>{item.label}</span>
                </Link>
              );
            })}
            
            {isGlobalAdmin && (
              <Link 
                href="/admin" 
                id="nav-admin" 
                className={`${styles.navItem} ${pathname === '/admin' ? styles.navItemActive : ''}`} 
                style={{ marginTop: 'auto', color: '#ef4444', borderTop: '1px solid rgba(239, 68, 68, 0.1)' }}
                title={sidebarCollapsed ? 'Platform Admin' : ''}
              >
                <svg className={styles.navIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className={styles.navText}>Admin Panel</span>
              </Link>
            )}
          </nav>

          <div className={styles.userSection}>
            <Link href="/dashboard/account" className={styles.userInfo}>
              <div className={styles.userAvatar}>
                {user.displayName?.[0].toUpperCase() || user.email?.[0].toUpperCase() || 'U'}
              </div>
              <div className={styles.userDetails}>
                <span className={styles.userEmail}>{user.displayName || user.email}</span>
                <span className={styles.userRole}>{isAdmin ? 'Admin' : 'Member'}</span>
              </div>
            </Link>
            <button id="sign-out-btn" onClick={handleSignOut} className={styles.signOutBtn}>
              <svg className={styles.signOutIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className={styles.signOutText}>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        <div className={styles.pageInner}>
          {children}
        </div>
      </main>

      {/* Bottom Nav for Mobile / Hidden on Desktop */}
      <nav className={styles.bottomNav}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
          return (
            <Link key={`mobile-${item.path}`} href={item.path} id={`mobile-${item.id}`} className={`${styles.bottomNavItem} ${isActive ? styles.bottomNavItemActive : ''}`}>
               <svg className={styles.bottomNavIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
              <span className={styles.bottomNavLabel}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
