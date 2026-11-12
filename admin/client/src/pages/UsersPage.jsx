import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  UserPlus,
  KeyRound,
  Edit2,
  CheckCircle,
  XCircle,
  Trash2,
  History,
  Shield,
  Sparkles,
  ArrowUpDown,
  Trophy,
  Gamepad2,
  Calendar,
  Clock
} from 'lucide-react';
import { api } from '../api';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Sheet from '../components/Sheet';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import SegmentedControl from '../components/SegmentedControl';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortOption, setSortOption] = useState('recently_joined');

  // Sheet states
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    role: 'user',
    canCreateQuiz: true,
    canPresentSlides: true,
    assignedTeacherIds: []
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Password reset modal states
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Match History Modal
  const [historyUser, setHistoryUser] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers({
        search: search.trim() || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        sort: sortOption
      });
      setUsers(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to retrieve users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, sortOption]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const openCreateSheet = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      name: '',
      email: '',
      password: '',
      role: 'user',
      canCreateQuiz: true,
      canPresentSlides: true,
      assignedTeacherIds: []
    });
    setFormError('');
    setSheetOpen(true);
  };

  const openEditSheet = (user) => {
    setEditingUser(user);
    const assignedIds = Array.isArray(user.assignedTeacherIds)
      ? user.assignedTeacherIds.map((t) => (typeof t === 'object' ? t._id : t))
      : [];
    setFormData({
      username: user.username || user.name || '',
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'user',
      canCreateQuiz: user.access?.canCreateQuiz ?? true,
      canPresentSlides: user.access?.canPresentSlides ?? true,
      assignedTeacherIds: assignedIds
    });
    setFormError('');
    setSheetOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Name and email are required');
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      setFormError('Password is required when creating a new user');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        username: (formData.username || formData.name).toLowerCase().replace(/[^a-z0-9_]/g, ''),
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        access: {
          canCreateQuiz: formData.canCreateQuiz,
          canPresentSlides: formData.canPresentSlides
        },
        assignedTeacherIds: formData.role === 'moderator' ? formData.assignedTeacherIds : []
      };

      if (!editingUser) {
        payload.password = formData.password.trim();
        await api.createUser(payload);
      } else {
        await api.updateUser(editingUser._id, payload);
      }

      setSheetOpen(false);
      fetchUsers();
    } catch (err) {
      setFormError(err.message || 'Failed to save user details');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDisabled = async (user) => {
    try {
      await api.toggleUserStatus(user._id, !user.disabled);
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, disabled: !u.disabled } : u))
      );
    } catch (err) {
      alert(err.message || 'Failed to change user status');
    }
  };

  const openResetModal = (user) => {
    setResetUser(user);
    setNewPassword('Demo@123');
    setResetSuccess('');
    setResetModalOpen(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetUser) return;

    try {
      await api.resetPassword(resetUser._id, newPassword);
      setResetSuccess('Password has been successfully updated.');
      setTimeout(() => {
        setResetModalOpen(false);
      }, 1500);
    } catch (err) {
      alert(err.message || 'Failed to reset password');
    }
  };

  const confirmDeleteUser = (user) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await api.deleteUser(userToDelete._id);
      setUsers((prev) => prev.filter((u) => u._id !== userToDelete._id));
      setDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const roleSegments = [
    { label: 'All', value: 'all' },
    { label: 'Admin', value: 'admin' },
    { label: 'Creator', value: 'creator' },
    { label: 'Presenter', value: 'presentor' },
    { label: 'Moderator', value: 'moderator' },
    { label: 'User', value: 'user' }
  ];

  const sortSegments = [
    { label: 'Recently Joined', value: 'recently_joined' },
    { label: 'Username (A-Z)', value: 'username_asc' },
    { label: 'Role', value: 'role' },
    { label: 'Last Online', value: 'last_online' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-250">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-large-title text-label">Users</h1>
          <p className="text-subheadline text-label-2 mt-1">
            MongoDB platform directory &bull; Filter by role, review matches, and manage credentials
          </p>
        </div>
        <Button variant="primary" onClick={openCreateSheet} className="gap-2 shrink-0">
          <UserPlus size={18} strokeWidth={1.75} />
          <span>Create user</span>
        </Button>
      </div>

      {/* Filter, Sort and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Role Segmented Filter */}
        <SegmentedControl
          segments={roleSegments}
          value={roleFilter}
          onChange={setRoleFilter}
          className="overflow-x-auto shrink-0"
        />

        {/* Sort Dropdown & Search Form */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-surface-2/60 border border-separator/40 rounded-field px-3 py-1.5 shrink-0">
            <ArrowUpDown size={14} className="text-label-3" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-transparent text-xs text-label font-medium focus:outline-none cursor-pointer"
            >
              {sortSegments.map((s) => (
                <option key={s.value} value={s.value} className="bg-bg text-label">
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-sm w-full">
            <Input
              icon={Search}
              placeholder="Search by username or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
            <Button type="submit" variant="secondary" size="md">
              Search
            </Button>
          </form>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <LoadingState message="Loading platform users from MongoDB" />
      ) : error ? (
        <ErrorState title="User load failure" message={error} onRetry={fetchUsers} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users match the criteria"
          description="Try modifying your search or role filter, or create a new user account."
          actionLabel="Create user"
          onAction={openCreateSheet}
        />
      ) : (
        <div className="content-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-separator/40 text-footnote text-label-2 bg-surface-2/40">
                  <th className="py-3 px-4 font-medium">User / Account</th>
                  <th className="py-3 px-4 font-medium">Role</th>
                  <th className="py-3 px-4 font-medium">Registered</th>
                  <th className="py-3 px-4 font-medium">Last Online</th>
                  <th className="py-3 px-4 font-medium">Match Stats</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator/20">
                {users.map((u) => {
                  const roleBadgeVariant =
                    u.role === 'admin'
                      ? 'admin'
                      : u.role === 'creator' || u.role === 'principal'
                      ? 'creator'
                      : u.role === 'presentor' || u.role === 'teacher'
                      ? 'presentor'
                      : u.role === 'moderator'
                      ? 'moderator'
                      : 'user';

                  const isSuperAdmin = (u.username === 'pratham' || u.email === 'pratham@zync.local');

                  return (
                    <tr key={u._id} className="h-14 hover:bg-white/[0.02] transition-colors">
                      {/* User Account */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase shadow-md ${
                            isSuperAdmin
                              ? 'bg-gradient-to-tr from-rose-500 to-indigo-500 text-white shadow-indigo-500/20 ring-1 ring-white/20'
                              : 'bg-surface-2 text-label-2 border border-separator/40'
                          }`}>
                            {(u.username || u.name || 'U').charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 font-bold text-sm text-label truncate">
                              <span>{u.username || u.name}</span>
                              {isSuperAdmin && (
                                <span className="text-[10px] bg-gradient-to-r from-amber-400 to-yellow-500 text-black px-1.5 py-0.2 rounded-md font-extrabold uppercase tracking-wider">
                                  Super
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-label-3 font-mono truncate">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-2.5 px-4">
                        <Badge variant={roleBadgeVariant}>
                          {u.role === 'principal' ? 'creator' : u.role === 'teacher' ? 'presentor' : u.role}
                        </Badge>
                      </td>

                      {/* Registered Date */}
                      <td className="py-2.5 px-4 text-xs font-mono text-label-2">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Last Online */}
                      <td className="py-2.5 px-4 text-xs font-mono text-label-2">
                        {u.lastOnline ? (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {new Date(u.lastOnline).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-label-3">Never</span>
                        )}
                      </td>

                      {/* Match Stats & History */}
                      <td className="py-2.5 px-4">
                        <button
                          type="button"
                          onClick={() => setHistoryUser(u)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-2/60 hover:bg-surface-2 border border-separator/40 text-xs font-medium text-label hover:text-accent transition cursor-pointer"
                        >
                          <Trophy size={13} className="text-amber-400" />
                          <span>{u.matchesPlayed || 0} games</span>
                          <span className="text-label-3">&bull;</span>
                          <span className="font-mono text-emerald-400">{u.totalScore || 0} pts</span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-4">
                        <Badge variant={u.disabled ? 'disabled' : 'active'}>
                          {u.disabled ? 'Banned' : 'Active'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditSheet(u)}
                            className="btn-motion w-8 h-8 rounded-full flex items-center justify-center bg-surface-2 text-label-2 hover:text-label cursor-pointer"
                            title="Edit user"
                          >
                            <Edit2 size={14} strokeWidth={1.75} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openResetModal(u)}
                            className="btn-motion w-8 h-8 rounded-full flex items-center justify-center bg-surface-2 text-label-2 hover:text-yellow cursor-pointer"
                            title="Reset password"
                          >
                            <KeyRound size={14} strokeWidth={1.75} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleDisabled(u)}
                            disabled={isSuperAdmin}
                            className={`btn-motion w-8 h-8 rounded-full flex items-center justify-center bg-surface-2 cursor-pointer disabled:opacity-30 ${
                              u.disabled ? 'text-green hover:bg-green/10' : 'text-red hover:bg-red/10'
                            }`}
                            title={u.disabled ? 'Unban account' : 'Ban account'}
                          >
                            {u.disabled ? (
                              <CheckCircle size={14} strokeWidth={1.75} />
                            ) : (
                              <XCircle size={14} strokeWidth={1.75} />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDeleteUser(u)}
                            disabled={isSuperAdmin}
                            className="btn-motion w-8 h-8 rounded-full flex items-center justify-center bg-surface-2 text-label-3 hover:text-red hover:bg-red/10 cursor-pointer disabled:opacity-30"
                            title="Delete user"
                          >
                            <Trash2 size={14} strokeWidth={1.75} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Create / Edit Sheet */}
      <Sheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editingUser ? 'Edit user' : 'Create new user'}
        description={
          editingUser
            ? 'Update profile details, role, and permissions'
            : 'Fill in details to provision a new MongoDB account'
        }
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setSheetOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveUser} disabled={saving}>
              {saving ? 'Saving...' : editingUser ? 'Update user' : 'Create user'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          {formError && (
            <div className="p-3.5 rounded-field bg-red/10 border border-red/30 text-subheadline text-red">
              {formError}
            </div>
          )}

          <Input
            label="Username (unique identifier)"
            placeholder="e.g. pratham, nihal, ramya"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
            helperText="Lowercase letters, numbers, and underscores only"
            required
          />

          <Input
            label="Full name"
            placeholder="e.g. Pratham Upadhyay"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Email address"
            type="email"
            placeholder="e.g. user@zync.local"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          {!editingUser && (
            <Input
              label="Password"
              type="password"
              placeholder="Initial account password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          )}

          <Select
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={[
              { label: 'User (Student)', value: 'user' },
              { label: 'Presenter (Teacher)', value: 'presentor' },
              { label: 'Creator (Principal)', value: 'creator' },
              { label: 'Moderator', value: 'moderator' },
              { label: 'Administrator', value: 'admin' }
            ]}
          />
        </form>
      </Sheet>

      {/* Password Reset Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Reset user password"
        description={`Set a new access password for ${resetUser?.username || resetUser?.name}`}
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setResetModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleResetPassword}>
              Update password
            </Button>
          </div>
        }
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          {resetSuccess && (
            <div className="p-3.5 rounded-field bg-green/10 border border-green/30 text-subheadline text-green">
              {resetSuccess}
            </div>
          )}
          <Input
            label="New password"
            type="text"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="Default recommendation: Demo@123"
            required
          />
        </form>
      </Modal>

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete user account"
        description={`Are you sure you want to permanently delete @${userToDelete?.username || userToDelete?.name}? This action cannot be undone.`}
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete User'}
            </Button>
          </div>
        }
      >
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
          All session tokens and player associations for this account will be removed.
        </div>
      </Modal>

      {/* Match History Modal */}
      <Modal
        isOpen={Boolean(historyUser)}
        onClose={() => setHistoryUser(null)}
        title={`Match History: @${historyUser?.username || historyUser?.name}`}
        description={`Lifetime total: ${historyUser?.matchesPlayed || 0} matches • ${historyUser?.totalScore || 0} pts`}
        footer={
          <Button variant="secondary" onClick={() => setHistoryUser(null)}>
            Close
          </Button>
        }
      >
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {historyUser?.history && historyUser.history.length > 0 ? (
            historyUser.history.map((h, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-surface-2/60 border border-separator/40 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-surface-2 flex items-center justify-center font-mono font-bold text-xs text-accent">
                    #{h.rank || (idx + 1)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-label">
                      PIN: {h.gamePin || 'Quiz Room'}
                    </div>
                    <div className="text-xs text-label-3 font-mono">
                      {h.joinedAt ? new Date(h.joinedAt).toLocaleString() : 'Recent'}
                    </div>
                  </div>
                </div>
                <div className="font-mono font-bold text-sm text-emerald-400">
                  +{h.score || 0} pts
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-label-3 font-mono">
              No recent match history recorded for this user.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
