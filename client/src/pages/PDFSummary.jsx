import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import {
  FileText,
  ArrowLeft,
  ExternalLink,
  Brain,
  Sparkles,
  Copy,
  Check,
  Calendar,
  Loader2,
  Highlighter,
  X,
  Trash2,
  Volume2,
  VolumeX,
  Moon,
  Sun
} from 'lucide-react';
import api from '../services/api';

const PDFSummary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pdf, setPdf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    fetchPdfDetails();
  }, [id]);

  const toggleDarkMode = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    localStorage.setItem('theme', nextTheme ? 'dark' : 'light');
  };

  const fetchPdfDetails = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/pdfs/${id}`);
      setPdf(data);
    } catch (error) {
      toast.error('Failed to load PDF summary details');
      navigate('/pdfs');
    } finally {
      setLoading(false);
    }
  };

  const handleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      toast.error('Text-to-Speech is not supported in your browser');
      return;
    }

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      toast.success('Stopped reading');
      return;
    }

    if (!pdf || !pdf.summary) return;

    window.speechSynthesis.cancel();
    // Clean markdown tags for clear speech reading
    const cleanText = pdf.summary.replace(/[#*`_~]/g, '');
    const utterance = new SpeechSynthesisUtterance(`${pdf.title}. ${cleanText}`);
    utterance.rate = 0.95;

    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
    toast.success('Reading PDF summary aloud... 🔊');
  };

  const handleCopySummary = () => {
    if (!pdf || !pdf.summary) return;
    navigator.clipboard.writeText(pdf.summary);
    setCopied(true);
    toast.success('Summary copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateQuiz = async () => {
    setGeneratingQuiz(true);
    const loadingToast = toast.loading('Generating Topic Quiz using AI...');
    try {
      const { data } = await api.post('/quizzes', { pdfId: id });
      toast.success('Quiz generated!', { id: loadingToast });
      navigate(`/quizzes/${data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate quiz', { id: loadingToast });
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : '';
    if (text.length > 2) {
      setSelectedText(text);
    }
  };

  const addHighlight = async (color) => {
    if (!selectedText || !pdf) return;

    const existingHighlights = pdf.highlights || [];
    const updatedHighlights = [...existingHighlights, { text: selectedText, color }];

    try {
      const { data } = await api.put(`/pdfs/${id}/highlights`, { highlights: updatedHighlights });
      setPdf(data);
      toast.success('Sentence highlighted!');
      setSelectedText('');
      window.getSelection()?.removeAllRanges();
    } catch (error) {
      toast.error('Failed to save text highlight');
    }
  };

  const removeHighlight = async (index) => {
    if (!pdf) return;
    const updatedHighlights = (pdf.highlights || []).filter((_, i) => i !== index);

    try {
      const { data } = await api.put(`/pdfs/${id}/highlights`, { highlights: updatedHighlights });
      setPdf(data);
      toast.success('Highlight removed');
    } catch (error) {
      toast.error('Failed to remove highlight');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center text-slate-500 flex flex-col items-center">
          <Loader2 className="animate-spin mb-3 text-indigo-600" size={32} />
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Loading detailed brief...</p>
        </div>
      </div>
    );
  }

  if (!pdf) return null;

  return (
    <div className={`min-h-screen pb-16 font-sans transition-colors duration-300 selection:bg-amber-200 ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/70 text-slate-900'
    }`}>
      {/* Top Navigation */}
      <nav className={`border-b sticky top-0 z-30 backdrop-blur-xl transition-colors ${
        isDarkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white/85 border-slate-200/80'
      }`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => {
                if (speaking) window.speechSynthesis.cancel();
                navigate('/pdfs');
              }}
              className="flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to Study Materials</span>
            </button>

            <div className="flex items-center space-x-3">
              {/* Dark Mode Theme Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-2xl border transition-all ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              <button
                onClick={() => navigate('/chat')}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-2xl transition-colors flex items-center space-x-1.5"
              >
                <Sparkles size={14} />
                <span className="hidden sm:inline">Ask AI Assistant</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Floating Highlight Toolbar */}
      <AnimatePresence>
        {selectedText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center space-x-3"
          >
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-300">
              <Highlighter size={15} className="text-amber-400" />
              <span>Highlight Sentence:</span>
            </div>
            <div className="flex items-center space-x-1.5">
              {[
                { label: 'Yellow', bg: 'bg-amber-300' },
                { label: 'Green', bg: 'bg-emerald-300' },
                { label: 'Blue', bg: 'bg-sky-300' },
                { label: 'Pink', bg: 'bg-pink-300' },
              ].map((c) => (
                <button
                  key={c.label}
                  onClick={() => addHighlight(c.label)}
                  className={`w-6 h-6 rounded-full ${c.bg} border-2 border-white hover:scale-125 transition-transform shadow-sm`}
                  title={`Highlight in ${c.label}`}
                />
              ))}
            </div>
            <button onClick={() => setSelectedText('')} className="p-1 text-slate-400 hover:text-white">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Document Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl p-6 sm:p-8 shadow-sm border mb-8 transition-colors ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-start space-x-4">
              <div className="p-3.5 bg-red-50 dark:bg-red-950/60 text-red-500 rounded-2xl shrink-0">
                <FileText size={26} />
              </div>
              <div>
                <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Document Brief
                </span>
                <h1 className="text-2xl font-black leading-snug mt-1">{pdf.title}</h1>
                <div className="flex items-center space-x-4 mt-2 text-xs text-slate-400">
                  <span className="flex items-center font-medium">
                    <Calendar size={13} className="mr-1" />
                    Uploaded on {new Date(pdf.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Toolbar with TTS */}
            <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
              {/* Text-to-Speech Button */}
              <button
                onClick={handleSpeech}
                className={`px-4 py-2 text-xs font-bold rounded-2xl transition-colors flex items-center space-x-1.5 ${
                  speaking
                    ? 'bg-emerald-600 text-white animate-pulse'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                }`}
                title={speaking ? 'Stop Reading' : 'Read Summary Aloud (Text-to-Speech)'}
              >
                {speaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
                <span>{speaking ? 'Stop Reading' : 'Read Aloud'}</span>
              </button>

              <a
                href={pdf.cloudinaryUrl}
                target="_blank"
                rel="noreferrer"
                className={`px-4 py-2 text-xs font-bold rounded-2xl transition-colors flex items-center space-x-1.5 ${
                  isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <ExternalLink size={14} />
                <span>View PDF</span>
              </a>

              <button
                onClick={handleGenerateQuiz}
                disabled={generatingQuiz}
                className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-xs font-bold rounded-2xl transition-colors flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Brain size={14} />
                <span>Generate Quiz</span>
              </button>

              <button
                onClick={handleCopySummary}
                className={`px-4 py-2 text-xs font-bold rounded-2xl transition-colors flex items-center space-x-1.5 ${
                  isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
              </button>
            </div>
          </div>

          {/* AI Summary Banner */}
          <div className="mt-6 flex items-center justify-between bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 dark:from-indigo-950/50 dark:via-purple-950/50 dark:to-indigo-950/50 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-xs font-black text-indigo-950 dark:text-indigo-200 uppercase tracking-wide">AI Detailed Brief & Audio Reader</h3>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">Use Read Aloud (🔊) or select text to highlight like Adobe Acrobat</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Saved Highlights Section */}
        {pdf.highlights && pdf.highlights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-3xl p-6 shadow-sm border mb-8 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'
            }`}
          >
            <div className="flex items-center space-x-2 font-extrabold text-sm mb-4">
              <Highlighter size={16} className="text-amber-500" />
              <span>Saved Key Sentence Highlights ({pdf.highlights.length})</span>
            </div>
            <div className="space-y-2">
              {pdf.highlights.map((hl, idx) => {
                const colorStyle =
                  hl.color === 'Green'
                    ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                    : hl.color === 'Blue'
                    ? 'bg-sky-100 text-sky-950 border-sky-300'
                    : hl.color === 'Pink'
                    ? 'bg-pink-100 text-pink-950 border-pink-300'
                    : 'bg-amber-100 text-amber-950 border-amber-300';
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border text-xs leading-relaxed flex items-center justify-between gap-3 ${colorStyle}`}
                  >
                    <span>"{hl.text}"</span>
                    <button
                      onClick={() => removeHighlight(idx)}
                      className="p-1 text-slate-500 hover:text-red-600 rounded-lg shrink-0"
                      title="Remove highlight"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Detailed Summary Document Body */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onMouseUp={handleTextSelection}
          className={`rounded-3xl p-6 sm:p-10 shadow-sm border cursor-text transition-colors ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'
          }`}
        >
          <div className={`prose max-w-none leading-relaxed font-sans text-sm sm:text-base ${
            isDarkMode ? 'prose-invert text-slate-200' : 'prose-indigo text-slate-800'
          }`}>
            <ReactMarkdown>{pdf.summary || 'No detailed summary available for this document.'}</ReactMarkdown>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default PDFSummary;
