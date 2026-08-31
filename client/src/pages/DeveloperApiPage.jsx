import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosInstance';
import { Key, Plus, Trash2, Copy, Check, Code, ShieldCheck, Terminal, Server } from 'lucide-react';

export const DeveloperApiPage = () => {
  const { user, refreshUser } = useAuth();
  const [keyName, setKeyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [msg, setMsg] = useState('');

  const handleCreateKey = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/auth/apikeys', { name: keyName || 'Development Key' });
      if (res.data.success) {
        setKeyName('');
        setMsg('API Key generated!');
        await refreshUser();
      }
    } catch (err) {
      setMsg(`Failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(''), 4000);
    }
  };

  const handleDeleteKey = async (keyId) => {
    try {
      const res = await api.delete(`/auth/apikeys/${keyId}`);
      if (res.data.success) {
        setMsg('API Key deleted.');
        await refreshUser();
      }
    } catch (err) {
      setMsg(`Failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setTimeout(() => setMsg(''), 4000);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const sampleApiKey = user?.apiKeys[0]?.key || 'certify_live_samplekey12345';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider mb-2">
          <Key className="w-3.5 h-3.5" />
          <span>Programmatic REST API</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Developer API Keys & Integration</h1>
        <p className="text-sm text-slate-400 mt-1">
          Issue credentials programmatically from your own platforms using REST endpoints secured by API keys.
        </p>
      </div>

      {/* Alert Banner */}
      {msg && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
          {msg}
        </div>
      )}

      {/* Section 1: Manage API Keys */}
      <div className="glass-panel p-8 rounded-3xl border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Your API Keys</h2>
            <p className="text-xs text-slate-400 mt-1">Keep your secret keys safe. Do not expose them in client-side code.</p>
          </div>

          <form onSubmit={handleCreateKey} className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Key Name (e.g. Staging Server)..."
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="gradient-btn px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center space-x-1 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Key</span>
            </button>
          </form>
        </div>

        {/* API Key List */}
        <div className="space-y-3">
          {user?.apiKeys?.length === 0 ? (
            <p className="text-slate-500 text-xs py-4 text-center">No API keys generated yet.</p>
          ) : (
            user?.apiKeys?.map((k) => (
              <div
                key={k._id}
                className="glass-card p-4 rounded-xl border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-bold text-white">{k.name}</p>
                  <p className="text-xs font-mono text-amber-400 mt-0.5">{k.key}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Created: {new Date(k.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(k.key)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Copy API Key"
                  >
                    {copiedKey === k.key ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => handleDeleteKey(k._id)}
                    className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                    title="Revoke Key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Section 2: REST API Documentation */}
      <div className="glass-panel p-8 rounded-3xl border-slate-800 space-y-6">
        <h2 className="text-xl font-bold text-white border-b border-slate-800 pb-4 flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-amber-400" />
          <span>API Reference Endpoint</span>
        </h2>

        <div className="space-y-4 text-sm">
          <div className="glass-card p-4 rounded-xl border-slate-800 flex items-center space-x-3">
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-xs font-extrabold uppercase">
              POST
            </span>
            <code className="font-mono text-slate-200 text-xs">/api/v1/certificates/issue</code>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-slate-400">Required Request Headers</h4>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-amber-300">
              X-API-KEY: {sampleApiKey}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-slate-400">JSON Request Body Payload</h4>
            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-sky-300 overflow-x-auto">
{`{
  "recipientName": "Alice Walker",
  "recipientEmail": "alice@example.com",
  "eventName": "Advanced AI & MERN Architecture",
  "issueDate": "2026-08-31",
  "issuerName": "DevArena Tech Institute",
  "sendEmail": true
}`}
            </pre>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-slate-400">cURL Example</h4>
            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
{`curl -X POST http://localhost:5000/api/v1/certificates/issue \\
  -H "Content-Type: application/json" \\
  -H "X-API-KEY: ${sampleApiKey}" \\
  -d '{
    "recipientName": "Alice Walker",
    "recipientEmail": "alice@example.com",
    "eventName": "Advanced AI Architecture"
  }'`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
