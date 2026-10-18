"use client";

import React, { useState, useEffect } from "react";
import { CMSLayout } from "@/components/CMSLayout";
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Key,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Mail,
  User,
  Clock,
  Eye,
  EyeOff
} from "lucide-react";

interface CMSUser {
  id: string | number;
  name: string;
  email: string;
  role: string;
  is_authorized: boolean;
  can_manage_access: boolean;
  created_at: string;
  last_login_at: string | null;
}

export default function AccessControlPage() {
  const [users, setUsers] = useState<CMSUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state for creating a user
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
    is_authorized: true,
    can_manage_access: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reset password state
  const [resetModalUserId, setResetModalUserId] = useState<string | number | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/manage/users");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load registered CMS users.");
      } else {
        setUsers(data.users || []);
      }
    } catch (err) {
      setError("Network error while loading user access records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleAuthorization = async (userId: string | number, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/manage/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_authorized: !currentStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update authorization status.");
      } else {
        setSuccess(`User login status updated to: ${!currentStatus ? "AUTHORIZED" : "REVOKED"}`);
        setTimeout(() => setSuccess(null), 3000);
        fetchUsers();
      }
    } catch {
      setError("Failed to communicate with authentication registry.");
    }
  };

  const handleToggleManageAccess = async (userId: string | number, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/manage/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ can_manage_access: !currentStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update access control rights.");
      } else {
        setSuccess("Access management privileges updated.");
        setTimeout(() => setSuccess(null), 3000);
        fetchUsers();
      }
    } catch {
      setError("Failed to update access management privileges.");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/manage/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to register new user.");
      } else {
        setSuccess(`User ${formData.email} registered and authorized successfully!`);
        setShowAddModal(false);
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "admin",
          is_authorized: true,
          can_manage_access: false,
        });
        setTimeout(() => setSuccess(null), 3500);
        fetchUsers();
      }
    } catch {
      setError("Failed to register new CMS user.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUserId || !newPassword) return;

    setResetting(true);
    try {
      const res = await fetch(`/api/manage/users/${resetModalUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update password.");
      } else {
        setSuccess("Security passkey updated successfully.");
        setResetModalUserId(null);
        setNewPassword("");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch {
      setError("Failed to reset password.");
    } finally {
      setResetting(false);
    }
  };

  const handleDeleteUser = async (userId: string | number, email: string) => {
    if (!confirm(`Are you sure you want to permanently revoke and delete access for ${email}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/manage/users/${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to delete user.");
      } else {
        setSuccess(`Account for ${email} permanently removed.`);
        setTimeout(() => setSuccess(null), 3000);
        fetchUsers();
      }
    } catch {
      setError("Failed to delete user.");
    }
  };

  return (
    <CMSLayout>
      <div className="space-y-6">
        
        {/* Page Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 font-mono text-xs uppercase text-primary tracking-wider font-semibold">
              <Users className="w-4 h-4" />
              <span>Identity & Access Control (IAM)</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">
              CMS Registered Logins & Access Authority
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Control which email addresses are authorized to log into the CMS. Only registered and active emails can authenticate or view administration controls.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New User</span>
          </button>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-xs font-bold hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Security Rule Card */}
        <div className="bg-surface-container-lowest border border-border rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-mono text-xs font-semibold text-on-surface">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Database Security Invariants</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-on-surface-variant font-mono">
            <div className="p-3 rounded bg-surface-container-low border border-border/50">
              <span className="text-[10px] uppercase text-primary block font-bold">1. Whitelist Verification</span>
              <span>Only emails registered in table <code className="text-primary">cms_users</code> are granted session tokens.</span>
            </div>
            <div className="p-3 rounded bg-surface-container-low border border-border/50">
              <span className="text-[10px] uppercase text-primary block font-bold">2. Constant-Time Scrypt</span>
              <span>Passwords are hashed with individual 16-byte cryptographically secure salts.</span>
            </div>
            <div className="p-3 rounded bg-surface-container-low border border-border/50">
              <span className="text-[10px] uppercase text-primary block font-bold">3. Access Revocation</span>
              <span>Deactivating a user immediately blocks login and voids authorization on the next request.</span>
            </div>
          </div>
        </div>

        {/* Registered Users Table */}
        <div className="bg-surface-container-lowest border border-border rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-on-surface">Authorized Email Registry</span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium">
                {users.length} {users.length === 1 ? "User" : "Users"}
              </span>
            </div>
            <button
              onClick={fetchUsers}
              className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              title="Refresh list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="bg-surface-container-low border-b border-border font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">User & Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Login Access</th>
                  <th className="py-3 px-4">Access Admin</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => {
                  const isPrimaryOwner = u.email === "simonipara428@gmail.com";
                  return (
                    <tr key={u.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                            u.is_authorized ? "bg-primary/10 text-primary" : "bg-red-500/10 text-red-500"
                          }`}>
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-on-surface flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isPrimaryOwner && (
                                <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30">
                                  PRIMARY OWNER
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-[11px] text-on-surface-variant flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span>{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <span className="capitalize px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-medium">
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleAuthorization(u.id, u.is_authorized)}
                          disabled={isPrimaryOwner}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-[11px] font-semibold transition-colors cursor-pointer ${
                            u.is_authorized
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/20"
                          } ${isPrimaryOwner ? "opacity-75 cursor-not-allowed" : ""}`}
                          title={isPrimaryOwner ? "Cannot revoke primary owner" : "Click to toggle authorization"}
                        >
                          {u.is_authorized ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>AUTHORIZED</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>REVOKED</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleManageAccess(u.id, u.can_manage_access)}
                          disabled={isPrimaryOwner}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] transition-colors cursor-pointer ${
                            u.can_manage_access
                              ? "bg-primary/10 text-primary border border-primary/30"
                              : "bg-surface-container text-on-surface-variant"
                          } ${isPrimaryOwner ? "opacity-75 cursor-not-allowed" : ""}`}
                          title={isPrimaryOwner ? "Primary owner always has control" : "Toggle access control permission"}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>{u.can_manage_access ? "CAN MANAGE" : "RESTRICTED"}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-on-surface-variant">
                        {u.last_login_at ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-primary" />
                            <span>{new Date(u.last_login_at).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="italic text-on-surface-variant/60">Never</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setResetModalUserId(u.id)}
                            className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                            title="Reset Password"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                          {!isPrimaryOwner && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              className="p-1.5 rounded hover:bg-red-500/10 text-on-surface-variant hover:text-red-500 transition-colors cursor-pointer"
                              title="Delete Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Register User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-on-surface">Register Authorized CMS User</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 font-sans">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Lead Engineer"
                  className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-xs text-on-surface focus:outline-hidden focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Registered Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. colleague@example.com"
                  className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-xs text-on-surface focus:outline-hidden focus:border-primary font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Initial Security Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter strong passkey"
                    className="w-full h-9 px-3 pr-10 rounded bg-surface-container-low border border-border text-xs text-on-surface focus:outline-hidden focus:border-primary font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">System Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full h-9 px-2.5 rounded bg-surface-container-low border border-border text-xs text-on-surface font-mono"
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end space-y-1">
                  <label className="text-xs font-semibold text-on-surface">Allow Access Management</label>
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={formData.can_manage_access}
                      onChange={(e) => setFormData({ ...formData, can_manage_access: e.target.checked })}
                      className="rounded border-border text-primary focus:ring-0"
                    />
                    <span className="text-[11px] text-on-surface-variant font-mono">Can manage users</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2 font-mono">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 h-8 rounded border border-border bg-surface-container hover:bg-surface-container-high text-xs text-on-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 h-8 rounded bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Hashing & Registering..." : "Register User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalUserId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-on-surface">Reset User Password</h3>
              </div>
              <button
                onClick={() => setResetModalUserId(null)}
                className="text-on-surface-variant hover:text-on-surface p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3 font-sans">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">New Passkey</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new passkey"
                  className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-xs text-on-surface focus:outline-hidden focus:border-primary font-mono"
                />
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2 font-mono">
                <button
                  type="button"
                  onClick={() => setResetModalUserId(null)}
                  className="px-3 h-8 rounded border border-border bg-surface-container hover:bg-surface-container-high text-xs text-on-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="px-4 h-8 rounded bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {resetting ? "Hashing & Updating..." : "Update Passkey"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </CMSLayout>
  );
}
