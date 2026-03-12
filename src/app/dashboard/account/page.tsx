'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { auth, db } from '@/lib/firebase/config';
import { updateProfile, updatePassword, verifyBeforeUpdateEmail } from 'firebase/auth';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import styles from './Account.module.css';

export default function AccountPage() {
  const { user } = useAuth();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });

  const [newEmail, setNewEmail] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState({ text: '', type: '' });

  if (!user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMessage({ text: '', type: '' });
    
    try {
      await updateProfile(user, { displayName });
      // Update the user document in Firestore too
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { displayName });
      
      // Reload the auth user to try to trigger a refetch if we needed it
      await user.reload();
      
      setProfileMessage({ text: 'Profile updated successfully.', type: 'success' });
    } catch (error: any) {
      console.error(error);
      setProfileMessage({ text: error.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'Passwords do not match.', type: 'error' });
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordMessage({ text: 'Password should be at least 6 characters.', type: 'error' });
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordMessage({ text: '', type: '' });

    try {
      await updatePassword(user, newPassword);
      setPasswordMessage({ text: 'Password updated successfully.', type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
        setPasswordMessage({ text: 'This operation requires recent authentication. Please log out and log in again, then retry.', type: 'error' });
      } else {
        setPasswordMessage({ text: error.message || 'Failed to update password.', type: 'error' });
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || newEmail === user.email) return;

    setIsUpdatingEmail(true);
    setEmailMessage({ text: '', type: '' });

    try {
      // 1. Send verification email to the new address
      await verifyBeforeUpdateEmail(user, newEmail);
      
      setEmailMessage({ text: 'Verification email sent to ' + newEmail + '. Please follow the link in your inbox to finalize the change.', type: 'success' });
      setNewEmail('');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
        setEmailMessage({ text: 'This operation requires recent authentication. Please log out and log in again, then retry.', type: 'error' });
      } else {
        setEmailMessage({ text: error.message || 'Failed to update email.', type: 'error' });
      }
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Account Settings</h1>
        <p className={styles.subtitle}>Manage your profile information and password.</p>
      </header>

      <div className={styles.grid}>
        {/* Profile Card */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Profile Information</h2>
          <p className={styles.cardSubtitle}>Update your account's profile details.</p>
          
          <form className={styles.form} onSubmit={handleUpdateProfile}>
            <div className={styles.formGroup}>
              <label htmlFor="currentEmail" className={styles.label}>Current Email</label>
              <input 
                id="currentEmail" 
                type="email" 
                className={styles.input} 
                value={user.email || ''} 
                disabled 
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="displayName" className={styles.label}>Display Name</label>
              <input 
                id="displayName" 
                type="text" 
                className={styles.input} 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)} 
                placeholder="E.g. John Doe"
              />
            </div>

            {profileMessage.text && (
              <div className={`${styles.message} ${styles[profileMessage.type]}`}>
                {profileMessage.text}
              </div>
            )}

            <button 
              type="submit" 
              className={styles.button} 
              disabled={isUpdatingProfile}
            >
              {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Password Card */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Change Password</h2>
          <p className={styles.cardSubtitle}>Ensure your account is using a long, random password to stay secure.</p>
          
          <form className={styles.form} onSubmit={handleUpdatePassword}>
            <div className={styles.formGroup}>
              <label htmlFor="newPassword" className={styles.label}>New Password</label>
              <input 
                id="newPassword" 
                type="password" 
                className={styles.input} 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
              <input 
                id="confirmPassword" 
                type="password" 
                className={styles.input} 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required
              />
            </div>

            {passwordMessage.text && (
              <div className={`${styles.message} ${styles[passwordMessage.type]}`}>
                {passwordMessage.text}
              </div>
            )}

            <button 
              type="submit" 
              className={styles.button} 
              disabled={isUpdatingPassword}
            >
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Email Card */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Change Email</h2>
          <p className={styles.cardSubtitle}>Update your login email address. This will be used for future reports.</p>
          
          <form className={styles.form} onSubmit={handleUpdateEmail}>
            <div className={styles.formGroup}>
              <label htmlFor="newEmail" className={styles.label}>New Email Address</label>
              <input 
                id="newEmail" 
                type="email" 
                className={styles.input} 
                value={newEmail} 
                onChange={(e) => setNewEmail(e.target.value)} 
                placeholder="new.email@example.com"
                required
              />
            </div>

            {emailMessage.text && (
              <div className={`${styles.message} ${styles[emailMessage.type]}`}>
                {emailMessage.text}
              </div>
            )}

            <button 
              type="submit" 
              className={styles.button} 
              disabled={isUpdatingEmail}
            >
              {isUpdatingEmail ? 'Updating...' : 'Update Email'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
