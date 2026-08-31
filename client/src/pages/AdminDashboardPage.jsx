import React, { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import { Users, Award, ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw, Lock, Unlock, ShieldCheck, Search, FileText } from 'lucide-react';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'certificates'
  const [userSearch, setUserSearch] = useState('');
  const [certSearch, setCertSearch] = useState('');

  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, certsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/certificates')
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (usersRes.data.success) setUsers(usersRes.data.users);
      if (certsRes.data.success) setCertificates(certsRes.data.certificates);
    } catch (err) {
      console.error('[Admin fetch error]', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'active' ? 'deactivated' : 'active';
      const res = await api.patch(`/admin/users/${userId}/status`, { status: nextStatus });
      if (res.data.success) {
        setActionMsg(res.data.message);
        fetchAdminData();
      }
    } catch (err) {
      setActionMsg(`Failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setTimeout(() => setActionMsg(''), 4000);
    }
  };

  const handleToggleUserRole = async (userId, currentRole) => {
    try {
      const nextRole = currentRole === 'admin' ? 'user' : 'admin';
      const res = await api.patch(`/admin/users/${userId}/role`, { role: nextRole });
      if (res.data.success) {
        setActionMsg(res.data.message);
        fetchAdminData();
      }
    } catch (err) {
      setActionMsg(`Failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setTimeout(() => setActionMsg(''), 4000);
    }
  };

  const handleRevokeCert = async (certId) => {
    try {
      const res = await api.patch(`/admin/certificates/${certId}/revoke`);
      if (res.data.success) {
        setActionMsg(res.data.message);
        fetchAdminData();
      }
    } catch (err) {
      setActionMsg(`Failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setTimeout(() => setActionMsg(''), 4000);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredCerts = certificates.filter(
    (c) =>
      c.recipientName.toLowerCase().includes(certSearch.toLowerCase()) ||
      c.recipientEmail.toLowerCase().includes(certSearch.toLowerCase()) ||
      c.certificateId.toLowerCase().includes(certSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Title */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 text-xs font-bold uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin System Dashboard</h1>
        </div>

        <button
          onClick={fetchAdminData}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Alert Banner */}
      {actionMsg && (
        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm flex items-center justify-between">
          <span>{actionMsg}</span>
        </div>
      )}

      {/* System Analytics Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="glass-card p-5 rounded-2xl border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase">Total Users</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.totalUsers}</h3>
            <span className="text-[10px] text-emerald-400 font-semibold">{stats.activeUsers} Active</span>
          </div>

          <div className="glass-card p-5 rounded-2xl border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase">Certificates Issued</p>
            <h3 className="text-2xl font-bold text-sky-400 mt-1">{stats.totalCertificates}</h3>
          </div>

          <div className="glass-card p-5 rounded-2xl border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase">Emails Sent</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">{stats.emailsSent}</h3>
          </div>

          <div className="glass-card p-5 rounded-2xl border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase">Failed Emails</p>
            <h3 className="text-2xl font-bold text-rose-400 mt-1">{stats.emailsFailed}</h3>
          </div>

          <div className="glass-card p-5 rounded-2xl border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase">Total Batches</p>
            <h3 className="text-2xl font-bold text-indigo-400 mt-1">{stats.totalBatches}</h3>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-4 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-2 px-4 text-sm font-bold transition-colors border-b-2 ${
            activeTab === 'users'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          User Management ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('certificates')}
          className={`pb-2 px-4 text-sm font-bold transition-colors border-b-2 ${
            activeTab === 'certificates'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          System Certificates ({certificates.length})
        </button>
      </div>

      {/* TAB 1: User Management */}
      {activeTab === 'users' && (
        <div className="glass-panel rounded-2xl border-slate-800 overflow-hidden shadow-2xl space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">All Registered Users</h3>
            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900 text-xs font-semibold text-slate-400 uppercase">
                <tr>
                  <th className="px-6 py-3">User Details</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Joined Date</th>
                  <th className="px-6 py-3 text-right">Admin Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-900/50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-white">{u.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{u.email}</p>
                    </td>

                    <td className="px-6 py-4">
                      {u.role === 'admin' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                          👑 Admin
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                          User
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {u.status === 'active' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Deactivated
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleUserRole(u._id, u.role)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                      >
                        {u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                      </button>

                      <button
                        onClick={() => handleToggleUserStatus(u._id, u.status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          u.status === 'active'
                            ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {u.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: System Certificates Control */}
      {activeTab === 'certificates' && (
        <div className="glass-panel rounded-2xl border-slate-800 overflow-hidden shadow-2xl space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">All System Certificates</h3>
            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search certificate ID..."
                value={certSearch}
                onChange={(e) => setCertSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900 text-xs font-semibold text-slate-400 uppercase">
                <tr>
                  <th className="px-6 py-3">Certificate ID</th>
                  <th className="px-6 py-3">Recipient</th>
                  <th className="px-6 py-3">Course / Program</th>
                  <th className="px-6 py-3">Issuer Account</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Revocation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredCerts.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-900/50">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-sky-400">
                      {c.certificateId}
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-semibold text-white">{c.recipientName}</p>
                      <p className="text-xs text-slate-400 font-mono">{c.recipientEmail}</p>
                    </td>

                    <td className="px-6 py-4 text-xs font-medium text-slate-200">
                      {c.eventName}
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-400">
                      {c.userId?.name || 'System'}
                    </td>

                    <td className="px-6 py-4">
                      {c.status === 'valid' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Valid
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Revoked
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRevokeCert(c.certificateId)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          c.status === 'valid'
                            ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {c.status === 'valid' ? 'Revoke Certificate' : 'Restore Authenticity'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
