import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Award, FileSpreadsheet, Mail, QrCode, ArrowRight, CheckCircle2, Zap, Lock, Sparkles } from 'lucide-react';

export const HomePage = () => {
  const [verifyId, setVerifyId] = useState('');
  const navigate = useNavigate();

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    if (verifyId.trim()) {
      navigate(`/verify/${verifyId.trim()}`);
    }
  };

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 lg:pt-20 overflow-hidden">
        {/* Background Radial Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-8">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Enterprise MERN Stack Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            Bulk Generate & Verify <span className="gradient-text">Authentic Certificates</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            Upload recipient lists via CSV or Excel, render high-res PDF certificates with embedded QR codes, automatically dispatch emails, and provide instant public verification.
          </p>

          {/* Quick Certificate Verification Box */}
          <div className="mt-10 max-w-xl mx-auto">
            <form onSubmit={handleVerifySubmit} className="glass-panel p-2 rounded-2xl flex items-center shadow-2xl border-sky-500/30">
              <div className="pl-3 pr-2 text-slate-400">
                <QrCode className="w-5 h-5 text-sky-400" />
              </div>
              <input
                type="text"
                placeholder="Enter Certificate ID (e.g. CERT-DEMO-001)..."
                value={verifyId}
                onChange={(e) => setVerifyId(e.target.value)}
                className="w-full bg-transparent text-white placeholder-slate-400 focus:outline-none text-sm px-2 font-mono"
              />
              <button
                type="submit"
                className="gradient-btn text-white px-6 py-3 rounded-xl text-sm font-semibold flex items-center space-x-2 shrink-0 shadow-lg shadow-sky-500/20"
              >
                <span>Verify Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
            <p className="text-xs text-slate-500 mt-2">
              Try demo ID: <button onClick={() => setVerifyId('CERT-DEMO-001')} className="text-sky-400 hover:underline font-mono">CERT-DEMO-001</button>
            </p>
          </div>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/generator"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold text-white gradient-btn shadow-xl shadow-sky-500/25 flex items-center justify-center space-x-2"
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span>Launch Bulk Generator</span>
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold text-slate-200 glass-card glass-card-hover border border-slate-700 flex items-center justify-center space-x-2"
            >
              <span>Try Admin Demo</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white">Built for High Reliability & Scale</h2>
          <p className="text-slate-400 mt-2 text-sm">Everything you need to issue thousands of credentials seamlessly.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-8 rounded-2xl glass-card-hover border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-6">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">CSV & Excel Support</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Upload recipient data in standard <code className="text-sky-400 font-mono text-xs">.csv</code> or native <code className="text-emerald-400 font-mono text-xs">.xlsx</code> format. Auto-detect columns and map custom dynamic text placeholders.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl glass-card-hover border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Embedded QR Verification</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Every generated PDF certificate features a unique cryptographic Certificate ID and scannable QR code directing straight to public verification.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl glass-card-hover border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Automated Email Dispatch</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Dispatches personalized emails to each recipient with attached PDF certificates and direct verification links via Nodemailer.
            </p>
          </div>
        </div>
      </section>

      {/* Tech Stack Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
              <span>Full-Stack Architecture</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white">Full MERN Stack + PDF Rendering Pipeline</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Powered by MongoDB Mongoose schemas, Express controllers, React Router, Vite, pdf-lib vector PDF generation, and Nodemailer email dispatchers.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="glass-card p-4 rounded-xl text-center border-slate-800">
              <p className="text-xs text-slate-400 uppercase font-semibold">Backend</p>
              <p className="text-lg font-bold text-sky-400">Node + Express</p>
            </div>
            <div className="glass-card p-4 rounded-xl text-center border-slate-800">
              <p className="text-xs text-slate-400 uppercase font-semibold">Database</p>
              <p className="text-lg font-bold text-emerald-400">MongoDB</p>
            </div>
            <div className="glass-card p-4 rounded-xl text-center border-slate-800">
              <p className="text-xs text-slate-400 uppercase font-semibold">Frontend</p>
              <p className="text-lg font-bold text-indigo-400">React + Vite</p>
            </div>
            <div className="glass-card p-4 rounded-xl text-center border-slate-800">
              <p className="text-xs text-slate-400 uppercase font-semibold">PDF Engine</p>
              <p className="text-lg font-bold text-amber-400">pdf-lib</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
