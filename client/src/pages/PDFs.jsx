import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Trash2, Brain, X, Maximize2, ExternalLink, Sparkles, ArrowLeft, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PDFs = () => {
  const [pdfs, setPdfs] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [selectedSummaryPdf, setSelectedSummaryPdf] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  const navigate = useNavigate();

  useEffect(() => {
    fetchPdfs();
  }, []);

  const toggleDarkMode = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    localStorage.setItem('theme', nextTheme ? 'dark' : 'light');
  };

  const fetchPdfs = async () => {
    try {
      const { data } = await api.get('/pdfs');
      setPdfs(data);
    } catch (error) {
      toast.error('Failed to fetch PDFs');
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a PDF to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);

    setUploading(true);
    const loadingToast = toast.loading('Uploading & Generating AI Detailed Summary...');

    try {
      await api.post('/pdfs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Upload & Detailed Summary complete!', { id: loadingToast });
      setFile(null);
      fetchPdfs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed', { id: loadingToast });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this PDF?')) return;
    try {
      await api.delete(`/pdfs/${id}`);
      toast.success('PDF deleted');
      fetchPdfs();
    } catch (error) {
      toast.error('Failed to delete PDF');
    }
  };

  const generateQuiz = async (pdfId) => {
    setGeneratingQuiz(true);
    const loadingToast = toast.loading('Generating Topic Quiz using AI...');
    try {
      const { data } = await api.post('/quizzes', { pdfId });
      toast.success('Quiz generated!', { id: loadingToast });
      navigate(`/quizzes/${data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate quiz', { id: loadingToast });
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const getViewUrl = (url) => {
    if (!url) return '#';
    return url;
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/70 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 p-6 rounded-3xl border shadow-sm backdrop-blur-xl transition-colors ${
          isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200/80'
        }`}>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                Study Hub
              </span>
            </div>
            <h1 className="text-2xl font-black mt-1">Study Materials & PDF Summarizer</h1>
            <p className="text-xs text-slate-400 mt-0.5">Upload PDF documents to generate detailed study guides & topic quizzes.</p>
          </div>
          
          <div className="flex items-center space-x-3 self-start sm:self-auto">
            {/* Dark Mode Theme Switcher */}
            <button
              onClick={toggleDarkMode}
              className={`p-2.5 rounded-2xl border transition-all ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button 
              onClick={() => navigate('/dashboard')} 
              className={`px-4 py-2 text-xs font-bold rounded-2xl transition-colors flex items-center space-x-1.5 ${
                isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>

        {/* Upload Dropzone Card */}
        <div className={`p-6 sm:p-8 rounded-3xl shadow-sm border mb-8 transition-colors ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <Upload size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold">Upload New PDF Document</h3>
              <p className="text-xs text-slate-400">Supported format: PDF (up to 20MB)</p>
            </div>
          </div>

          <form onSubmit={handleUpload} className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className={`block w-full text-xs file:mr-4 file:py-3 file:px-5 file:rounded-2xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 dark:file:bg-indigo-950/60 file:text-indigo-600 dark:file:text-indigo-300 hover:file:bg-indigo-100 transition-all cursor-pointer border rounded-2xl p-1 ${
                  isDarkMode ? 'border-slate-800 bg-slate-950 text-slate-400' : 'border-slate-200/70 bg-slate-50/50 text-slate-500'
                }`}
              />
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-2xl transition-all shadow-md shadow-indigo-200 dark:shadow-none disabled:opacity-50 flex items-center justify-center space-x-2 shrink-0 active:scale-95"
            >
              <Sparkles size={16} />
              <span>{uploading ? 'Analyzing PDF...' : 'Upload & Summarize'}</span>
            </button>
          </form>
        </div>

        {/* PDF Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pdfs.map((pdf) => (
            <motion.div
              key={pdf._id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -4 }}
              className={`rounded-3xl p-6 shadow-sm border flex flex-col justify-between hover:shadow-md transition-all group ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="p-3 bg-red-50 dark:bg-red-950/60 text-red-500 rounded-2xl shrink-0 group-hover:scale-105 transition-transform">
                      <FileText size={22} />
                    </div>
                    <h4 className="font-bold text-sm truncate" title={pdf.title}>{pdf.title}</h4>
                  </div>
                  <button 
                    onClick={() => handleDelete(pdf._id)} 
                    className="text-slate-400 hover:text-red-500 p-1 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/60 transition-colors shrink-0"
                    title="Delete PDF"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="flex-grow mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">AI Detailed Brief</h5>
                    <span className="text-[10px] text-slate-400 font-medium">Ready</span>
                  </div>
                  <button 
                    onClick={() => navigate(`/pdfs/${pdf._id}/summary`)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all group/sum text-xs ${
                      isDarkMode
                        ? 'bg-slate-950/80 border-slate-800 hover:bg-indigo-950/30 hover:border-indigo-900/50'
                        : 'bg-slate-50/80 border-slate-100 hover:bg-indigo-50/60 hover:border-indigo-100'
                    }`}
                  >
                    <p className="text-slate-400 line-clamp-3 mb-2 leading-relaxed">{pdf.summary || 'No summary available.'}</p>
                    <div className="flex items-center text-xs font-extrabold text-indigo-600 dark:text-indigo-400 group-hover/sum:translate-x-1 transition-transform">
                      <Maximize2 size={13} className="mr-1.5" /> Open Full Page Summary &rarr;
                    </div>
                  </button>
                </div>
              </div>

              <div className={`pt-4 border-t flex gap-2.5 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                <a 
                  href={getViewUrl(pdf.cloudinaryUrl)} 
                  target="_blank" 
                  rel="noreferrer"
                  className={`flex-1 py-2.5 text-xs font-bold rounded-2xl transition-colors text-center flex items-center justify-center space-x-1.5 ${
                    isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <ExternalLink size={14} />
                  <span>View PDF</span>
                </a>
                <button 
                  onClick={() => generateQuiz(pdf._id)}
                  disabled={generatingQuiz}
                  className="flex-1 py-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-2xl hover:bg-emerald-100 transition-colors text-center flex items-center justify-center space-x-1.5"
                >
                  <Brain size={15} />
                  <span>Generate Quiz</span>
                </button>
              </div>
            </motion.div>
          ))}

          {pdfs.length === 0 && !uploading && (
            <div className={`col-span-full text-center py-16 rounded-3xl border border-dashed ${
              isDarkMode ? 'bg-slate-900/60 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-400'
            }`}>
              <FileText size={40} className="mx-auto mb-3 text-slate-400" />
              <p className="text-sm font-semibold text-slate-400">No PDFs uploaded yet</p>
              <p className="text-xs text-slate-500 mt-1">Upload a PDF document above to get started with AI summaries and quizzes!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFs;
