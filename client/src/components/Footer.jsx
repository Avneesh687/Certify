import React from 'react';
import { Link } from 'react-router-dom';
import { Award, ShieldCheck, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 py-12 text-slate-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Info */}
        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
              <Award className="w-4 h-4 text-sky-400" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Certify</span>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            Enterprise-grade MERN stack bulk certificate generator, automated emailing pipeline, and instant QR verification portal.
          </p>
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Cryptographically Verified & Authentic Credentials</span>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-semibold text-white mb-4 text-xs uppercase tracking-wider">Product</h4>
          <ul className="space-y-2.5">
            <li>
              <Link to="/verify" className="hover:text-sky-400 transition-colors">
                Public Verification Portal
              </Link>
            </li>
            <li>
              <Link to="/generator" className="hover:text-sky-400 transition-colors">
                CSV & Excel Bulk Generator
              </Link>
            </li>
            <li>
              <Link to="/api-keys" className="hover:text-sky-400 transition-colors">
                Developer API Docs
              </Link>
            </li>
          </ul>
        </div>

        {/* Demo Accounts */}
        <div>
          <h4 className="font-semibold text-white mb-4 text-xs uppercase tracking-wider">Demo Credentials</h4>
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg space-y-1.5 text-xs">
            <p className="text-slate-300 font-semibold">Admin Account:</p>
            <p className="text-sky-400 font-mono">admin@certify.com / admin123</p>
            <p className="text-slate-300 font-semibold pt-1 border-t border-slate-800">User Account:</p>
            <p className="text-indigo-400 font-mono">user@certify.com / user123</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-slate-800/60 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} Certify System. Built with MERN Stack.</p>
        <p className="flex items-center space-x-1 mt-2 md:mt-0">
          <span>Designed for high-scale credential verification</span>
        </p>
      </div>
    </footer>
  );
};
