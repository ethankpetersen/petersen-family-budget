'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { collection, query, getDocs, orderBy, deleteDoc, doc, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Users, Home, Shield, ChevronLeft, Trash2, Star, AlertTriangle, X, Mail, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import styles from './AdminDashboard.module.css';

interface DashboardStats {
  totalUsers: number;
  totalHouseholds: number;
}

export default function AdminDashboard() {
  const { user, loading, isGlobalAdmin, householdId: myHouseholdId } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState<DashboardStats>({ totalUsers: 0, totalHouseholds: 0 });
  const [households, setHouseholds] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [fetchingData, setFetchingData] = useState(true);
  
  // Platform Invitation State
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [platformInvites, setPlatformInvites] = useState<any[]>([]);
  const [copySuccessId, setCopySuccessId] = useState<string | null>(null);

  // Custom Modal State
  const [confirmDelete, setConfirmDelete] = useState<{ id: string, name: string, type: 'household' | 'invitation' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!loading && !isGlobalAdmin) {
      router.replace('/dashboard');
    }
  }, [isGlobalAdmin, loading, router]);

  useEffect(() => {
    if (isGlobalAdmin) {
      fetchPlatformData();

      // Listen for platform invitations
      const invitesQuery = query(collection(db, 'platformInvitations'), orderBy('createdAt', 'desc'));
      const unsubscribeInvites = onSnapshot(invitesQuery, (snapshot) => {
        const invites = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPlatformInvites(invites);
      });

      return () => unsubscribeInvites();
    }
  }, [isGlobalAdmin]);

  const fetchPlatformData = useCallback(async () => {
    setFetchingData(true);
    try {
      const hQuery = query(collection(db, 'households'), orderBy('createdAt', 'desc'));
      const hSnapshot = await getDocs(hQuery);
      const hData = hSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHouseholds(hData);

      const uSnapshot = await getDocs(collection(db, 'users'));
      const uData = uSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsersList(uData);

      setStats({
        totalUsers: uData.length,
        totalHouseholds: hData.length
      });
    } catch (error) {
      console.error("Error fetching platform data:", error);
    } finally {
      setFetchingData(false);
    }
  }, []);

  const handleDeleteHousehold = useCallback(async (hId: string) => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'households', hId));
      setConfirmDelete(null);
      fetchPlatformData();
    } catch (error) {
      console.error("Error deleting household:", error);
      alert("Failed to delete household.");
    } finally {
      setIsDeleting(false);
    }
  }, [fetchPlatformData]);

  const handleSendPlatformInvite = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || sendingInvite) return;

    setSendingInvite(true);
    try {
      const inviteToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      await addDoc(collection(db, 'platformInvitations'), {
        email: inviteEmail.trim().toLowerCase(),
        token: inviteToken,
        invitedBy: user?.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setInviteEmail('');
    } catch (error) {
      console.error("Error sending platform invite:", error);
      alert("Failed to send invitation.");
    } finally {
      setSendingInvite(false);
    }
  }, [inviteEmail, sendingInvite, user]);

  const handleCopyInviteLink = useCallback((invite: any) => {
    const baseUrl = window.location.origin;
    const inviteLink = `${baseUrl}?platformInvite=${invite.token}`;
    navigator.clipboard.writeText(inviteLink);
    setCopySuccessId(invite.id);
    setTimeout(() => setCopySuccessId(null), 2000);
  }, []);

  const handleDeletePlatformInvite = useCallback(async (inviteId: string) => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'platformInvitations', inviteId));
      setConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting invitation:", error);
      alert("Failed to delete invitation.");
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const handleConfirmAction = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'household') {
      handleDeleteHousehold(confirmDelete.id);
    } else {
      handleDeletePlatformInvite(confirmDelete.id);
    }
  };

  if (loading || !isGlobalAdmin) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <Link href="/dashboard" className={styles.backBtn}>
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1>Platform Overview</h1>
            <p>Global monitor for Petersen Family Budget</p>
          </div>
        </div>
        <div className={styles.adminBadge}>
          <Shield size={16} />
          Global Admin
        </div>
      </header>

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <Home size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Households</span>
            <span className={styles.statValue}>{stats.totalHouseholds}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <Users size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Users</span>
            <span className={styles.statValue}>{stats.totalUsers}</span>
          </div>
        </div>
      </div>

      <div className={styles.dataGrid}>
        <section className={styles.tableSection}>
          <div className={styles.sectionHeader}>
            <h2>Active Households</h2>
            <button onClick={fetchPlatformData} className={styles.refreshBtn}>Refresh</button>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Household Name</th>
                  <th>Created</th>
                  <th>ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {households.map(h => {
                  const isMine = h.id === myHouseholdId;
                  return (
                    <tr key={h.id} className={isMine ? styles.rowHighlight : ''}>
                      <td className={styles.fontBold}>
                        <div className={styles.flexCenter}>
                          {h.name}
                          {isMine && <Star size={14} className={styles.myStar} fill="currentColor" />}
                        </div>
                      </td>
                      <td>{h.createdAt?.toDate ? h.createdAt.toDate().toLocaleDateString() : 'N/A'}</td>
                      <td className={styles.textMuted}>{h.id}</td>
                      <td>
                        {!isMine && (
                          <button 
                            onClick={(e) => {
                              setConfirmDelete({ id: h.id, name: h.name, type: 'household' });
                            }}
                            className={styles.deleteBtn}
                            title="Delete Household"
                            type="button"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        {isMine && <span className={styles.myLabel}>MINE</span>}
                      </td>
                    </tr>
                  );
                })}
                {households.length === 0 && !fetchingData && <tr><td colSpan={4} className={styles.textCenter}>No households found.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <div className={styles.rightCol}>
          <section className={styles.tableSection}>
            <div className={styles.sectionHeader}>
              <div className={styles.flexCenter}>
                <Mail size={18} className={styles.primaryIcon} />
                <h2>Invite New Family</h2>
              </div>
            </div>
            <div className={styles.tableWrapper}>
              <div className={styles.inviteCard}>
                <p className={styles.inviteDescription}>
                  Send an invitation to a family admin. They will receive a link to create their own household.
                </p>
                <form onSubmit={handleSendPlatformInvite} className={styles.inviteForm}>
                  <input 
                    type="email" 
                    placeholder="family-admin@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className={styles.inviteInput}
                    required
                  />
                  <button type="submit" disabled={sendingInvite} className={styles.inviteBtn}>
                    {sendingInvite ? 'Generating...' : 'Generate Invite Link'}
                  </button>
                </form>
              </div>
            </div>
          </section>

          <section className={styles.tableSection}>
            <div className={styles.sectionHeader}>
              <h2>Platform Invitations</h2>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {platformInvites.map(invite => (
                    <tr key={invite.id}>
                      <td className={styles.inviteEmailCell}>{invite.email}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[invite.status]}`}>
                          {invite.status}
                        </span>
                      </td>
                      <td>
                        <div className={styles.flexCenter}>
                          {invite.status === 'pending' && (
                            <button 
                               onClick={() => handleCopyInviteLink(invite)}
                               className={styles.copyBtn}
                               title="Copy Invite Link"
                            >
                              {copySuccessId === invite.id ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                          )}
                          <button 
                             onClick={() => setConfirmDelete({ id: invite.id, name: invite.email, type: 'invitation' })}
                             className={styles.deleteBtn}
                             title="Delete Invitation"
                             style={{ padding: '4px' }}
                             type="button"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {platformInvites.length === 0 && (
                    <tr><td colSpan={3} className={styles.textCenter}>No pending invitations.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.tableSection}>
            <div className={styles.sectionHeader}>
              <h2>User Registry</h2>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>User Email</th>
                    <th>Household Name</th>
                    <th>Household ID</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map(u => {
                    const household = households.find(h => h.id === u.householdId);
                    const isMe = u.id === user?.uid;
                    return (
                      <tr key={u.id}>
                        <td className={styles.fontBold}>
                          {u.email || u.displayName || u.id}
                          {isMe && <span className={styles.meLabel}> (YOU)</span>}
                        </td>
                        <td>{household?.name || <span className={styles.textMuted}>None</span>}</td>
                        <td className={styles.textMuted}>{u.householdId || 'N/A'}</td>
                        <td>
                          <span className={`${styles.badge} ${u.role === 'admin' ? styles.badgeAdmin : styles.badgeMember}`}>
                            {u.role || 'member'}
                          </span>
                          {u.isGlobalAdmin && <span className={styles.globalLabel}>GLOBAL</span>}
                        </td>
                      </tr>
                    );
                  })}
                  {usersList.length === 0 && !fetchingData && <tr><td colSpan={4} className={styles.textCenter}>No users found.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmDelete && (
        <div className={styles.modalOverlay} onClick={() => !isDeleting && setConfirmDelete(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <AlertTriangle color="#ef4444" size={32} />
              <h3>Confirm Deletion</h3>
            </div>
            <div className={styles.modalBody}>
              <p>Are you sure you want to delete <strong>{confirmDelete.name}</strong>?</p>
              <p className={styles.modalWarning}>
                {confirmDelete.type === 'household' 
                  ? 'This action cannot be undone and will immediately remove the household record.' 
                  : 'This invitation will be canceled and the magic link will no longer work.'}
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button 
                onClick={() => setConfirmDelete(null)} 
                className={styles.cancelBtn}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmAction} 
                className={styles.confirmBtn}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
            {!isDeleting && (
              <button className={styles.closeBtn} onClick={() => setConfirmDelete(null)}>
                <X size={20} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
