import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Trash2, Plus, Mail, XCircle, Clock } from 'lucide-react';

interface UserProfile {
  id: string; // uid
  email: string;
  role: 'admin' | 'member';
  householdId: string;
}

export function UserManager() {
  const { user, householdId, isAdmin } = useAuth();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  useEffect(() => {
    let unsubscribeMembers: () => void;
    let unsubscribeInvites: () => void;

    if (!householdId || !isAdmin) {
      setLoading(false);
      return;
    }

    // Real-time Members
    const membersQuery = query(collection(db, 'users'), where('householdId', '==', householdId));
    unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
      const fetchedMembers = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as UserProfile[];
      setMembers(fetchedMembers);
      setLoading(false);
    });

    // Real-time Invitations
    const invitesQuery = query(collection(db, 'invitations'), where('householdId', '==', householdId), where('status', '==', 'pending'));
    unsubscribeInvites = onSnapshot(invitesQuery, (snapshot) => {
      const fetchedInvites = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setInvitations(fetchedInvites);
    });

    return () => {
      if (unsubscribeMembers) unsubscribeMembers();
      if (unsubscribeInvites) unsubscribeInvites();
    };
  }, [householdId, isAdmin]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteStatus(null);
    if (!inviteEmail || !householdId) return;

    try {
      // Simulate creating an invite record
      // User can sign up with this code, or we just record it.
      await addDoc(collection(db, 'invitations'), {
        email: inviteEmail,
        householdId: householdId,
        invitedBy: user?.uid,
        status: 'pending',
        createdAt: Date.now()
      });
      
      setInviteStatus({ type: 'success', msg: `Invitation recorded for ${inviteEmail}. They can now sign up and will be joined to this household.` });
      setInviteEmail('');
    } catch (err) {
      console.error("Error creating invite:", err);
      setInviteStatus({ type: 'error', msg: 'Failed to create invitation.' });
    }
  };

  const handleRemoveMember = async (member: UserProfile) => {
    if (member.id === user?.uid) {
      alert("You cannot remove yourself.");
      return;
    }
    
    if (window.confirm(`Are you sure you want to remove ${member.email || 'this member'} from the household? They will lose access to all data immediately.`)) {
      try {
        await updateDoc(doc(db, 'users', member.id), {
          householdId: null,
          role: 'member'
        });
      } catch (err) {
        console.error("Error removing member:", err);
        alert("Failed to remove member.");
      }
    }
  };

  const handleCancelInvite = async (inviteId: string, email: string) => {
    if (window.confirm(`Cancel invitation for ${email}?`)) {
      try {
        await deleteDoc(doc(db, 'invitations', inviteId));
      } catch (err) {
        console.error("Error canceling invite:", err);
        alert("Failed to cancel invitation.");
      }
    }
  };

  if (!isAdmin) return null;

  return (
    <section className="settings-card">
      <h2>Household Members (Admin)</h2>
      
      <form className="add-form" onSubmit={handleInvite}>
        <input 
          type="email" 
          placeholder="Invite by email..." 
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-primary">
          <Mail size={16} className="mr-2" /> Invite
        </button>
      </form>
      
      {inviteStatus && (
        <div className={`p-3 mt-2 mb-4 text-sm rounded ${inviteStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {inviteStatus.msg}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 italic p-4 text-center">Loading members...</p>
      ) : (
        <>
          <ul className="settings-list mt-4">
            {members.map((member) => (
              <li key={member.id} className="settings-list-item">
                <div className="item-content flex-col items-start gap-1">
                  <span className="font-semibold">{member.email || 'Unknown User'}</span>
                  <span className="badge badge-outline text-xs uppercase">{member.role}</span>
                </div>

                <div className="item-actions">
                  {member.id !== user?.uid && (
                    <button 
                      onClick={() => handleRemoveMember(member)} 
                      className="btn-icon text-danger"
                      title="Unlink from household"
                    >
                      <Trash2 size={16} />
                      <span className="ml-1 text-xs">Remove</span>
                    </button>
                  )}
                  {member.id === user?.uid && (
                    <span className="text-xs text-muted">You</span>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {invitations.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-2">
                <Clock size={14} /> Pending Invitations
              </h3>
              <ul className="settings-list">
                {invitations.map((invite) => (
                  <li key={invite.id} className="settings-list-item">
                    <div className="item-content flex-col items-start gap-1">
                      <span className="font-semibold">{invite.email}</span>
                      <span className="text-xs text-muted">
                        Invited {new Date(invite.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="item-actions">
                      <button 
                        onClick={() => handleCancelInvite(invite.id, invite.email)} 
                        className="btn-icon text-muted"
                        title="Cancel Invitation"
                      >
                        <XCircle size={16} />
                        <span className="ml-1 text-xs">Cancel</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
