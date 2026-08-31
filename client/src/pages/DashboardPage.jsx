import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../api/axiosInstance';
import { Award, Search, Mail, Download, ExternalLink, RefreshCw, FileText, CheckCircle2, AlertTriangle, Clock, Eye, X, Trash2 } from 'lucide-react';

export const DashboardPage = () => {
  const [certificates, setCertificates] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resendingId, setResendingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [resendMsg, setResendMsg] = useState('');
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [search]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [certRes, batchRes] = await Promise.all([
        api.get(`/certificates?search=${encodeURIComponent(search)}`),
        api.get('/certificates/batches')
      ]);

      if (certRes.data.success) {
        setCertificates(certRes.data.certificates);
      }
      if (batchRes.data.success) {
        setBatches(batchRes.data.batches);
      }
    } catch (err) {
      console.error('[Dashboard fetch error]', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCertificate = async (certId) => {
    if (!window.confirm(`Are you sure you want to permanently delete certificate ${certId}? This will remove it from Cloudinary and database.`)) {
      return;
    }
    try {
      setDeletingId(certId);
      const res = await api.delete(`/certificates/${certId}`);
      if (res.data.success) {
        setResendMsg(`Certificate ${certId} deleted successfully from Cloudinary and database.`);
        setCertificates((prev) => prev.filter((c) => c.certificateId !== certId));
      }
    } catch (err) {
      setResendMsg(`Delete failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setDeletingId(null);
      setTimeout(() => setResendMsg(''), 5000);
    }
  };

  const handleResendEmail = async (certId) => {
    try {
      setResendingId(certId);
      setResendMsg('');
      const res = await api.post(`/certificates/${certId}/resend-email`);
      if (res.data.success) {
        setResendMsg(`Email resent successfully to recipient!`);
        fetchDashboardData();
      }
    } catch (err) {
      setResendMsg(`Failed to resend: ${err.response?.data?.message || err.message}`);
    } finally {
      setResendingId(null);
      setTimeout(() => setResendMsg(''), 5000);
    }
  };

  const totalIssued = certificates.length;
  const sentEmails = certificates.filter((c) => c.emailStatus === 'sent').length;
  const failedEmails = certificates.filter((c) => c.emailStatus === 'failed').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Certificates Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Manage all your generated credentials and delivery statuses.</p>
        </div>
        <Link
          to="/generator"
          className="gradient-btn px-6 py-3 rounded-xl font-semibold text-sm text-white shadow-lg shadow-sky-500/20 flex items-center space-x-2 shrink-0"
        >
          <Award className="w-4 h-4" />
          <span>New Bulk Generation</span>
        </Link>
      </div>

      {/* Alert Banner */}
      {resendMsg && (
        <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 text-sm flex items-center justify-between">
          <span>{resendMsg}</span>
          <button onClick={() => setResendMsg('')} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase font-semibold text-slate-400">Total Issued</p>
            <h3 className="text-2xl font-bold text-white mt-1">{totalIssued}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase font-semibold text-slate-400">Emails Sent</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">{sentEmails}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase font-semibold text-slate-400">Failed Delivery</p>
            <h3 className="text-2xl font-bold text-rose-400 mt-1">{failedEmails}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase font-semibold text-slate-400">Total Batches</p>
            <h3 className="text-2xl font-bold text-indigo-400 mt-1">{batches.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border-slate-800 flex items-center space-x-3">
        <Search className="w-5 h-5 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search by recipient name, email, course, or Certificate ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none text-sm"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-xs text-slate-400 hover:text-white px-2">
            Clear
          </button>
        )}
      </div>

      {/* Certificates Table */}
      <div className="glass-panel rounded-2xl border-slate-800 overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-white text-base">Issued Certificates</h2>
          <span className="text-xs text-slate-400">Showing {certificates.length} records</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading certificates...
          </div>
        ) : certificates.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <Award className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-semibold text-slate-300">No Certificates Issued Yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Get started by uploading a CSV or Excel recipient list to bulk generate certificates.
            </p>
            <Link
              to="/generator"
              className="inline-flex items-center space-x-2 gradient-btn px-6 py-2.5 rounded-xl font-semibold text-sm text-white"
            >
              <span>Create First Batch</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Certificate ID</th>
                  <th className="px-6 py-3.5">Recipient</th>
                  <th className="px-6 py-3.5">Course / Event</th>
                  <th className="px-6 py-3.5">Issue Date</th>
                  <th className="px-6 py-3.5">Email Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {certificates.map((cert) => (
                  <tr key={cert._id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-sky-400">
                      <Link to={`/verify/${cert.certificateId}`} className="hover:underline flex items-center space-x-1">
                        <span>{cert.certificateId}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </Link>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-semibold text-white">{cert.recipientName}</p>
                      <p className="text-xs text-slate-400">{cert.recipientEmail}</p>
                    </td>

                    <td className="px-6 py-4 max-w-xs font-medium text-slate-200 truncate">
                      {cert.eventName}
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(cert.issueDate).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4">
                      {cert.emailStatus === 'sent' && (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Sent</span>
                        </span>
                      )}
                      {cert.emailStatus === 'failed' && (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Failed</span>
                        </span>
                      )}
                      {cert.emailStatus === 'pending' && (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => setPreviewPdfUrl(`${API_BASE_URL}/verify/${cert.certificateId}/view`)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="View PDF Certificate"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <a
                        href={`${API_BASE_URL}/verify/${cert.certificateId}/download`}
                        download={`Certificate_${cert.certificateId}.pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 transition-colors inline-block"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </a>

                      <button
                        onClick={() => handleResendEmail(cert.certificateId)}
                        disabled={resendingId === cert.certificateId}
                        className="p-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-colors disabled:opacity-50"
                        title="Resend Email"
                      >
                        <RefreshCw className={`w-4 h-4 ${resendingId === cert.certificateId ? 'animate-spin' : ''}`} />
                      </button>

                      <button
                        onClick={() => handleDeleteCertificate(cert.certificateId)}
                        disabled={deletingId === cert.certificateId}
                        className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors disabled:opacity-50"
                        title="Delete Certificate & Cloud PDF"
                      >
                        <Trash2 className={`w-4 h-4 ${deletingId === cert.certificateId ? 'animate-pulse' : ''}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PDF Modal Viewer */}
      {previewPdfUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-4xl rounded-2xl overflow-hidden flex flex-col h-[85vh] border-slate-700">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Certificate Viewer</h3>
              <div className="flex items-center space-x-3">
                <a
                  href={previewPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Tab</span>
                </a>
                <button
                  onClick={() => setPreviewPdfUrl(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-950">
              <iframe
                src={previewPdfUrl}
                title="Certificate PDF Preview"
                className="w-full h-full border-none"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
