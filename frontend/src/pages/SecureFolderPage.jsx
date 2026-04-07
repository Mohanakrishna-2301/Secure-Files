import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  Upload, File, FileImage, FileText, Trash2, Download,
  Lock, Eye, EyeOff, Search, Cloud, AlertCircle, X,
  FileVideo, FileAudio, FileCode, ZoomIn, ChevronLeft, ChevronRight
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { format } from 'date-fns';

const fileIcon = (mime = '') => {
  if (mime.startsWith('image/'))       return <FileImage className="w-5 h-5 text-brand-400" />;
  if (mime === 'application/pdf')      return <FileText className="w-5 h-5 text-danger" />;
  if (mime.startsWith('video/'))       return <FileVideo className="w-5 h-5 text-purple-400" />;
  if (mime.startsWith('audio/'))       return <FileAudio className="w-5 h-5 text-yellow-400" />;
  if (mime.startsWith('text/') || mime.includes('json') || mime.includes('xml'))
                                       return <FileCode className="w-5 h-5 text-success" />;
  return <File className="w-5 h-5 text-slate-400" />;
};

const fmtSize = (b) => b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${(b / 1024).toFixed(0)} KB`;

const SecureFolderPage = () => {
  const [files, setFiles]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [search, setSearch]       = useState('');
  const [deleteId, setDeleteId]   = useState(null);

  // Preview state
  const [previewFile, setPreviewFile]   = useState(null);
  const [previewUrl, setPreviewUrl]     = useState(null);
  const [previewText, setPreviewText]   = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const loadFiles = async () => {
    try {
      const { data } = await api.get(`/files?search=${search}`);
      setFiles(data.files);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadFiles(); }, [search]);

  // Clean up blob URL on preview close
  useEffect(() => {
    if (!previewFile) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setPreviewText(null);
    }
  }, [previewFile]);

  const handlePreview = async (file) => {
    setPreviewFile(file);
    setPreviewLoading(true);
    try {
      const resp = await api.get(`/files/${file._id}/download`, { responseType: 'blob' });
      const blob = new Blob([resp.data], { type: file.mimeType });

      if (file.mimeType.startsWith('text/') || file.mimeType.includes('json') || file.mimeType.includes('xml')) {
        const text = await blob.text();
        setPreviewText(text);
      } else {
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      }
    } catch {
      toast.error('Preview failed. Try downloading instead.');
      setPreviewFile(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewFile(null);
  };

  const onDrop = useCallback(async (accepted) => {
    if (!accepted.length) return;
    const file = accepted[0];
    setUploading(true);
    setProgress(0);
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post('/files/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / e.total)),
      });
      toast.success(`"${file.name}" encrypted & uploaded!`);
      loadFiles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed.');
    } finally { setUploading(false); setProgress(0); }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 50 * 1024 * 1024,
    onDropRejected: (r) => toast.error(r[0]?.errors[0]?.message || 'File rejected.'),
  });

  const handleDownload = async (file) => {
    try {
      const resp = await api.get(`/files/${file._id}/download`, { responseType: 'blob' });
      const url  = URL.createObjectURL(new Blob([resp.data]));
      const a    = document.createElement('a');
      a.href     = url;
      a.download = file.originalName;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`"${file.originalName}" downloaded & decrypted.`);
    } catch { toast.error('Download failed.'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/files/${deleteId}`);
      toast.success('File deleted.');
      setDeleteId(null);
      setFiles(p => p.filter(f => f._id !== deleteId));
    } catch { toast.error('Delete failed.'); }
  };

  const canPreview = (mime = '') =>
    mime.startsWith('image/') ||
    mime === 'application/pdf' ||
    mime.startsWith('video/') ||
    mime.startsWith('audio/') ||
    mime.startsWith('text/') ||
    mime.includes('json');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="section-title flex items-center gap-2"><Lock className="w-6 h-6 text-brand-400" /> Secure Folder</h2>
          <p className="text-slate-400 text-sm mt-1">All files are AES-256 encrypted before upload</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 w-64" placeholder="Search files…" />
        </div>
      </div>

      {/* Drop Zone */}
      <motion.div
        {...getRootProps()}
        animate={isDragActive ? { scale: 1.02 } : { scale: 1 }}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300
          ${isDragActive ? 'border-brand-500 bg-brand-500/10' : 'border-white/10 hover:border-brand-500/40 hover:bg-white/5'}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${isDragActive ? 'bg-brand-gradient shadow-brand' : 'bg-white/5'}`}>
            {uploading ? <LoadingSpinner size="md" /> : <Upload className={`w-7 h-7 ${isDragActive ? 'text-white' : 'text-slate-400'}`} />}
          </div>
          {uploading ? (
            <div className="w-full max-w-xs">
              <p className="text-slate-300 text-sm mb-2">Encrypting & uploading… {progress}%</p>
              <div className="progress-track">
                <motion.div animate={{ width: `${progress}%` }} className="progress-fill" />
              </div>
            </div>
          ) : (
            <>
              <p className="text-slate-200 font-medium">{isDragActive ? 'Drop your file here' : 'Drag & drop a file, or click to browse'}</p>
              <p className="text-slate-500 text-sm">Max 50 MB · Images, PDFs, Docs, ZIP, MP4</p>
            </>
          )}
          {isDragActive && <Cloud className="absolute bottom-6 right-6 w-8 h-8 text-brand-400 animate-float" />}
        </div>
      </motion.div>

      {/* Files Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><LoadingSpinner size="lg" text="Loading your secure files…" /></div>
      ) : files.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Lock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No files yet</p>
          <p className="text-slate-600 text-sm">Upload your first encrypted file above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {files.map((file, i) => (
              <motion.div
                key={file._id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5 hover:border-brand-500/20 transition-all duration-200 group"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    {fileIcon(file.mimeType)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-200 truncate">{file.originalName}</p>
                    <p className="text-xs text-slate-500">{fmtSize(file.size)} · {format(new Date(file.uploadedAt || file.createdAt), 'MMM d, yyyy')}</p>
                  </div>
                  {file.encrypted && (
                    <span className="flex items-center gap-1 text-xs text-success bg-success/10 border border-success/20 rounded-full px-2 py-0.5 flex-shrink-0">
                      <Lock className="w-3 h-3" /> Enc
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  {canPreview(file.mimeType) && (
                    <button onClick={() => handlePreview(file)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 text-sm font-medium transition-colors border border-violet-500/20">
                      <Eye className="w-4 h-4" /> Preview
                    </button>
                  )}
                  <button onClick={() => handleDownload(file)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 text-sm font-medium transition-colors border border-brand-500/20">
                    <Download className="w-4 h-4" /> Download
                  </button>
                  <button onClick={() => setDeleteId(file._id)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-danger/10 hover:bg-danger/20 text-danger transition-colors border border-danger/20">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── File Preview Modal ── */}
      <AnimatePresence>
        {previewFile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col">
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-4 bg-dark-100/90 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {fileIcon(previewFile.mimeType)}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{previewFile.originalName}</p>
                  <p className="text-xs text-slate-500">{fmtSize(previewFile.size)} · Decrypted preview</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button onClick={() => handleDownload(previewFile)}
                  className="flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 border border-brand-500/20 hover:border-brand-500/40 px-3 py-1.5 rounded-lg transition-all">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button onClick={closePreview}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-6">
              {previewLoading ? (
                <LoadingSpinner size="lg" text="Decrypting file…" />
              ) : previewFile.mimeType.startsWith('image/') && previewUrl ? (
                <motion.img
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  src={previewUrl} alt={previewFile.originalName}
                  className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                />
              ) : previewFile.mimeType === 'application/pdf' && previewUrl ? (
                <iframe
                  src={previewUrl} title={previewFile.originalName}
                  className="w-full h-full rounded-xl border border-white/10"
                  style={{ minHeight: '70vh' }}
                />
              ) : previewFile.mimeType.startsWith('video/') && previewUrl ? (
                <motion.video
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  src={previewUrl} controls
                  className="max-w-full max-h-full rounded-xl shadow-2xl"
                />
              ) : previewFile.mimeType.startsWith('audio/') && previewUrl ? (
                <div className="glass-card p-8 text-center space-y-4">
                  <FileAudio className="w-16 h-16 text-yellow-400 mx-auto" />
                  <p className="text-slate-300 font-medium">{previewFile.originalName}</p>
                  <audio src={previewUrl} controls className="w-full mt-4" />
                </div>
              ) : previewText !== null ? (
                <motion.pre
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="glass-card p-6 text-slate-300 text-sm font-mono overflow-auto max-w-4xl w-full max-h-[70vh] whitespace-pre-wrap break-words">
                  {previewText}
                </motion.pre>
              ) : (
                <div className="glass-card p-12 text-center">
                  <AlertCircle className="w-12 h-12 text-warning mx-auto mb-3" />
                  <p className="text-slate-300 font-medium">Preview not available</p>
                  <p className="text-slate-500 text-sm mt-1">Please download to view this file.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 max-w-sm w-full text-center">
              <div className="w-14 h-14 rounded-2xl bg-danger/20 border border-danger/30 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-danger" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Delete File?</h3>
              <p className="text-slate-400 text-sm mb-6">This will permanently remove the file from storage and cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleDelete} className="flex-1 py-3 rounded-xl bg-danger text-white font-semibold hover:bg-danger/80 transition-colors">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SecureFolderPage;
