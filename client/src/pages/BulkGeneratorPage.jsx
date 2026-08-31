import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import api from '../api/axiosInstance';
import { UploadCloud, FileSpreadsheet, CheckCircle2, ArrowRight, ArrowLeft, Eye, Mail, Award, AlertCircle, RefreshCw, X, Play } from 'lucide-react';

export const BulkGeneratorPage = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');

  // Parsed File Payload
  const [fileData, setFileData] = useState(null); // { fileName, headers, previewRows, allRows }

  // Field Mapping Config
  const [nameKey, setNameKey] = useState('');
  const [emailKey, setEmailKey] = useState('');
  const [eventKey, setEventKey] = useState('');
  const [dateKey, setDateKey] = useState('');
  const [issuerName, setIssuerName] = useState('Certify Academy');
  const [batchTitle, setBatchTitle] = useState('Spring 2026 Cohort Certification');
  const [sendEmails, setSendEmails] = useState(true);

  // Live PDF Preview
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);

  // Batch Generation Executing
  const [generatingBatch, setGeneratingBatch] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [batchResult, setBatchResult] = useState(null);

  // Handle File Upload & Server Parsing
  const handleFileUpload = async (uploadedFile) => {
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setError('');
    setParsing(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const res = await api.post('/certificates/parse-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setFileData(res.data);
        const headers = res.data.headers;

        // Auto-select smart matching keys
        setNameKey(headers.find((h) => /name/i.test(h)) || headers[0] || '');
        setEmailKey(headers.find((h) => /email/i.test(h)) || headers[1] || '');
        setEventKey(headers.find((h) => /course|event|program/i.test(h)) || headers[2] || '');
        setDateKey(headers.find((h) => /date|issue/i.test(h)) || '');

        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'File parsing failed. Please check file format.');
    } finally {
      setParsing(false);
    }
  };

  // Generate Live PDF Preview of First Row
  const handleGeneratePreview = async () => {
    if (!fileData || !fileData.allRows || fileData.allRows.length === 0) return;

    try {
      setGeneratingPreview(true);
      const sampleRow = fileData.allRows[0];

      const previewPayload = {
        recipientName: sampleRow[nameKey] || 'Sample Recipient',
        eventName: sampleRow[eventKey] || 'Sample Course Name',
        issueDate: sampleRow[dateKey] || new Date(),
        issuerName: issuerName
      };

      const res = await api.post('/certificates/preview', previewPayload, {
        responseType: 'blob'
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPreviewPdfUrl(url);
    } catch (err) {
      setError('Could not render certificate preview.');
    } finally {
      setGeneratingPreview(false);
    }
  };

  // Execute Bulk Certificate Generation
  const handleStartGeneration = async () => {
    try {
      setGeneratingBatch(true);
      setError('');
      setGenerationProgress(25);

      const payload = {
        recipients: fileData.allRows,
        nameKey,
        emailKey,
        eventKey,
        dateKey,
        issuerName,
        batchTitle,
        sendEmails
      };

      setGenerationProgress(65);

      const res = await api.post('/certificates/bulk-generate', payload);

      setGenerationProgress(100);

      if (res.data.success) {
        setBatchResult(res.data);
        setStep(4);
        // Fire celebration confetti!
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Bulk generation failed. Please review input data.');
    } finally {
      setGeneratingBatch(false);
    }
  };

  // Download Sample CSV helper
  const downloadSampleCSV = () => {
    const csvContent = "Name,Email,Course,Date\nSarah Connor,sarah.connor@example.com,AI & Machine Learning,2026-08-31\nMarcus Wright,marcus.w@example.com,Full-Stack MERN Architecture,2026-08-31\nKyle Reese,kyle.reese@example.com,Cybersecurity Engineering,2026-08-31";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_recipients.csv';
    a.click();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Bulk Certificate Generator</h1>
        <p className="text-sm text-slate-400">
          Upload recipient spreadsheets, configure field mapping, preview design, and issue certificates in batch.
        </p>
      </div>

      {/* Stepper Progress Bar */}
      <div className="flex items-center justify-between max-w-2xl mx-auto relative px-4">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0"></div>

        {[
          { num: 1, label: 'Upload File' },
          { num: 2, label: 'Map Fields' },
          { num: 3, label: 'Preview' },
          { num: 4, label: 'Results' }
        ].map((item) => (
          <div key={item.num} className="relative z-10 flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                step === item.num
                  ? 'bg-sky-500 text-white ring-4 ring-sky-500/20'
                  : step > item.num
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-900 text-slate-500 border border-slate-800'
              }`}
            >
              {step > item.num ? <CheckCircle2 className="w-5 h-5" /> : item.num}
            </div>
            <span className={`text-xs mt-2 font-medium ${step >= item.num ? 'text-slate-200' : 'text-slate-500'}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 1: Upload File */}
      {step === 1 && (
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border-slate-800 text-center space-y-8">
          <div className="max-w-lg mx-auto space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mx-auto">
              <UploadCloud className="w-10 h-10 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-white">Upload Recipient File</h2>
            <p className="text-slate-400 text-sm">
              Supports both <strong className="text-sky-400">.csv</strong> and <strong className="text-emerald-400">.xlsx / .xls</strong> Excel spreadsheets containing recipient details.
            </p>
          </div>

          {/* Drag & Drop File Zone */}
          <div className="max-w-xl mx-auto">
            <label className="border-2 border-dashed border-slate-700 hover:border-sky-500/60 bg-slate-900/50 hover:bg-slate-900/80 transition-all rounded-2xl p-8 block cursor-pointer group">
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files[0])}
              />
              <FileSpreadsheet className="w-12 h-12 text-slate-500 group-hover:text-sky-400 mx-auto mb-3 transition-colors" />
              <p className="text-sm font-semibold text-slate-200">
                Click to browse or drag file here
              </p>
              <p className="text-xs text-slate-500 mt-1">CSV or Excel format (max 10MB)</p>
            </label>
          </div>

          {/* Sample CSV Link */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-center space-x-3 text-xs text-slate-400">
            <span>Need a test file?</span>
            <button
              onClick={downloadSampleCSV}
              className="text-sky-400 font-semibold hover:underline flex items-center space-x-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Download Sample CSV Template</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Field Mapping */}
      {step === 2 && fileData && (
        <div className="glass-panel p-8 rounded-3xl border-slate-800 space-y-8">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white">Configure Field Mapping</h2>
              <p className="text-xs text-slate-400 mt-1">
                Parsed <strong className="text-sky-400">{fileData.totalRows} recipients</strong> from <code className="font-mono text-slate-300">{fileData.fileName}</code>
              </p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white text-xs font-semibold flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change File</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column Key Mappers */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Spreadsheet Columns</h3>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Recipient Name Column *</label>
                <select
                  value={nameKey}
                  onChange={(e) => setNameKey(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  {fileData.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Recipient Email Column *</label>
                <select
                  value={emailKey}
                  onChange={(e) => setEmailKey(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  {fileData.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Course / Event Name Column *</label>
                <select
                  value={eventKey}
                  onChange={(e) => setEventKey(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  {fileData.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Issue Date Column (Optional)</label>
                <select
                  value={dateKey}
                  onChange={(e) => setDateKey(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="">-- Use Today's Date --</option>
                  {fileData.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Batch & Issuer Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Issuance Settings</h3>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Authorized Issuer Name</label>
                <input
                  type="text"
                  value={issuerName}
                  onChange={(e) => setIssuerName(e.target.value)}
                  placeholder="Certify Academy"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Generation Batch Title</label>
                <input
                  type="text"
                  value={batchTitle}
                  onChange={(e) => setBatchTitle(e.target.value)}
                  placeholder="Summer Cohort 2026"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmails}
                    onChange={(e) => setSendEmails(e.target.checked)}
                    className="w-4 h-4 accent-sky-500 rounded"
                  />
                  <span className="text-sm text-slate-300 font-medium">
                    Automatically send certificate emails to recipients via Nodemailer
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Table Preview of Uploaded Rows */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h4 className="text-xs uppercase font-bold text-slate-400">Sample Row Preview</h4>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 font-bold uppercase">
                  <tr>
                    {fileData.headers.map((h) => (
                      <th key={h} className="px-4 py-2.5">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {fileData.previewRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50">
                      {fileData.headers.map((h) => (
                        <td key={h} className="px-4 py-2.5 font-mono text-slate-300">
                          {row[h]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-800">
            <button
              onClick={() => {
                handleGeneratePreview();
                setStep(3);
              }}
              className="gradient-btn px-8 py-3 rounded-xl text-sm font-semibold text-white flex items-center space-x-2 shadow-lg shadow-sky-500/20"
            >
              <span>Preview Certificate Design</span>
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Certificate Preview */}
      {step === 3 && (
        <div className="glass-panel p-8 rounded-3xl border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white">Live Certificate Preview</h2>
              <p className="text-xs text-slate-400 mt-1">
                Preview how recipient <strong className="text-sky-400">{fileData?.allRows[0]?.[nameKey]}</strong> will look on the official PDF document.
              </p>
            </div>
            <button
              onClick={() => setStep(2)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white text-xs font-semibold flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Mapping</span>
            </button>
          </div>

          {/* Embedded PDF iframe preview */}
          <div className="w-full h-[500px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
            {generatingPreview ? (
              <div className="text-center text-slate-400">
                <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Rendering PDF certificate...
              </div>
            ) : previewPdfUrl ? (
              <iframe
                src={previewPdfUrl}
                title="Certificate PDF Preview"
                className="w-full h-full border-none"
              ></iframe>
            ) : (
              <div className="text-center text-slate-400">
                <p>No preview generated.</p>
                <button
                  onClick={handleGeneratePreview}
                  className="mt-2 text-sky-400 text-xs font-semibold hover:underline"
                >
                  Generate Preview Now
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div className="text-xs text-slate-400">
              Ready to generate <strong className="text-white">{fileData?.totalRows} certificates</strong>?
            </div>
            <button
              onClick={handleStartGeneration}
              disabled={generatingBatch}
              className="gradient-btn px-8 py-3.5 rounded-xl text-base font-bold text-white flex items-center space-x-2 shadow-xl shadow-sky-500/25 disabled:opacity-50"
            >
              {generatingBatch ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating Batch... ({generationProgress}%)</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Start Bulk Generation & Emailing</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Results & Batch Details */}
      {step === 4 && batchResult && (
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border-slate-800 text-center space-y-8">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <h2 className="text-3xl font-extrabold text-white">Batch Completed!</h2>
            <p className="text-slate-400 text-sm">
              Successfully generated <strong className="text-white">{batchResult.summary.total} certificates</strong> and dispatched automated emails.
            </p>
          </div>

          {/* Stats Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="glass-card p-6 rounded-2xl border-slate-800 text-center">
              <p className="text-xs uppercase font-semibold text-slate-400">Total Generated</p>
              <h3 className="text-3xl font-bold text-white mt-1">{batchResult.summary.total}</h3>
            </div>
            <div className="glass-card p-6 rounded-2xl border-slate-800 text-center">
              <p className="text-xs uppercase font-semibold text-slate-400">Emails Sent</p>
              <h3 className="text-3xl font-bold text-emerald-400 mt-1">{batchResult.summary.sent}</h3>
            </div>
            <div className="glass-card p-6 rounded-2xl border-slate-800 text-center">
              <p className="text-xs uppercase font-semibold text-slate-400">Failed / Skipped</p>
              <h3 className="text-3xl font-bold text-rose-400 mt-1">{batchResult.summary.failed}</h3>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-slate-800">
            <Link
              to="/dashboard"
              className="gradient-btn px-8 py-3.5 rounded-xl font-bold text-sm text-white shadow-lg shadow-sky-500/20 flex items-center space-x-2"
            >
              <Award className="w-4 h-4" />
              <span>View All Certificates in Dashboard</span>
            </Link>
            <button
              onClick={() => {
                setStep(1);
                setFile(null);
                setFileData(null);
                setBatchResult(null);
              }}
              className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-sm border border-slate-800"
            >
              Start Another Batch
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
