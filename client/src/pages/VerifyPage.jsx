import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../api/axiosInstance';
import { ShieldCheck, ShieldAlert, Award, Calendar, User, Download, ExternalLink, QrCode, Search, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export const VerifyPage = () => {
  const { certificateId: paramCertId } = useParams();
  const navigate = useNavigate();

  const [inputCertId, setInputCertId] = useState(paramCertId || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { isAuthentic, certificate, message }
  const [error, setError] = useState('');

  useEffect(() => {
    if (paramCertId) {
      performVerification(paramCertId);
    }
  }, [paramCertId]);

  const performVerification = async (certId) => {
    if (!certId || !certId.trim()) return;

    try {
      setLoading(true);
      setError('');
      setResult(null);

      const res = await api.get(`/verify/${encodeURIComponent(certId.trim())}`);
      setResult(res.data);
    } catch (err) {
      if (err.response && err.response.data) {
        setResult(err.response.data);
      } else {
        setError('Verification request failed. Server connection error.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (inputCertId.trim()) {
      navigate(`/verify/${encodeURIComponent(inputCertId.trim())}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Page Title */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Public Certificate Verification</h1>
        <p className="text-sm text-slate-400">
          Enter any Certificate ID or scan a QR code to verify credential authenticity and inspect official issuer records.
        </p>
      </div>

      {/* Verification Search Box */}
      <div className="max-w-xl mx-auto">
        <form onSubmit={handleSearchSubmit} className="glass-panel p-2 rounded-2xl flex items-center shadow-2xl border-sky-500/30">
          <div className="pl-3 pr-2 text-slate-400">
            <QrCode className="w-5 h-5 text-sky-400" />
          </div>
          <input
            type="text"
            placeholder="Enter Certificate ID (e.g. CERT-DEMO-001)..."
            value={inputCertId}
            onChange={(e) => setInputCertId(e.target.value)}
            className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none text-sm px-2 font-mono"
          />
          <button
            type="submit"
            disabled={loading}
            className="gradient-btn text-white px-6 py-3 rounded-xl text-sm font-semibold flex items-center space-x-2 shrink-0 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Verify</span>
                <Search className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Verification Result Display Card */}
      {result && (
        <div className="space-y-8 animate-fadeIn">
          {/* Authenticity Status Header Banner */}
          {result.isAuthentic ? (
            <div className="glass-panel p-8 rounded-3xl border-emerald-500/40 bg-emerald-950/20 text-center space-y-3 relative overflow-hidden">
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4" />
                <span>Cryptographically Authentic</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Verified Authentic Credential</h2>
              <p className="text-xs text-emerald-300 font-mono">ID: {result.certificate?.certificateId}</p>
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-3xl border-rose-500/40 bg-rose-950/20 text-center space-y-3">
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider border border-rose-500/30">
                <ShieldAlert className="w-4 h-4" />
                <span>Verification Failed</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-rose-400">Invalid or Unverified Record</h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto">{result.message}</p>
            </div>
          )}

          {/* Authentic Metadata Cards */}
          {result.isAuthentic && result.certificate && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Recipient & Event Details */}
              <div className="glass-card p-8 rounded-3xl border-slate-800 space-y-6">
                <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
                  <span>Credential Metadata</span>
                  <Award className="w-5 h-5 text-sky-400" />
                </h3>

                <div className="space-y-4 text-sm">
                  <div className="flex items-start space-x-3">
                    <User className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase">Recipient Name</p>
                      <p className="text-lg font-bold text-white">{result.certificate.recipientName}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Award className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase">Event / Course Program</p>
                      <p className="text-base font-semibold text-slate-200">{result.certificate.eventName}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase">Date of Issue</p>
                      <p className="text-sm font-semibold text-slate-300">
                        {new Date(result.certificate.issueDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase">Issuing Organization</p>
                      <p className="text-sm font-semibold text-slate-300">{result.certificate.issuerName}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <a
                    href={`${API_BASE_URL}/verify/${result.certificate.certificateId}/download`}
                    className="gradient-btn w-full py-3 rounded-xl font-bold text-sm text-white text-center flex items-center justify-center space-x-2 shadow-lg shadow-sky-500/20"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Official PDF Certificate</span>
                  </a>
                </div>
              </div>

              {/* PDF Document Embedded Viewer */}
              <div className="glass-card rounded-3xl border-slate-800 overflow-hidden flex flex-col h-[450px]">
                <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-300">Official PDF Preview</span>
                  <a
                    href={`${API_BASE_URL}/verify/${result.certificate.certificateId}/view`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-sky-400 hover:underline flex items-center space-x-1"
                  >
                    <span>Open Full Tab</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex-1 bg-slate-950">
                  <iframe
                    src={`${API_BASE_URL}/verify/${result.certificate.certificateId}/view`}
                    title="Verified Certificate PDF"
                    className="w-full h-full border-none"
                  ></iframe>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
