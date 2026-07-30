import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Trash2, Brain, X, Maximize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PDFs = () => {
  const [pdfs, setPdfs] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [selectedSummaryPdf, setSelectedSummaryPdf] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPdfs();
  }, []);

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
    const loadingToast = toast.loading('Uploading & Generating AI Summary...');

    try {
      await api.post('/pdfs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Upload successful!', { id: loadingToast });
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
    const loadingToast = toast.loading('Generating Quiz using AI...');
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
    return url.endsWith('.pdf') ? url : `${url}.pdf`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-gray-50/50">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Study Materials</h1>
          <p className="text-sm text-gray-500 mt-1">Upload PDFs and let AI summarize them for you.</p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
          &larr; Back to Dashboard
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload New PDF</h3>
        <form onSubmit={handleUpload} className="flex flex-col sm:flex-row items-center gap-4">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 transition-colors"
          />
          <button
            type="submit"
            disabled={uploading}
            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Upload size={18} />
            {uploading ? 'Processing...' : 'Upload'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pdfs.map((pdf) => (
          <motion.div
            key={pdf._id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-3 bg-red-50 text-red-500 rounded-xl shrink-0">
                  <FileText size={20} />
                </div>
                <h4 className="font-semibold text-gray-900 truncate" title={pdf.title}>{pdf.title}</h4>
              </div>
              <button onClick={() => handleDelete(pdf._id)} className="text-gray-400 hover:text-red-500 transition-colors shrink-0">
                <Trash2 size={18} />
              </button>
            </div>
            
            <div className="flex-grow">
              <h5 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">AI Summary</h5>
              <button 
                onClick={() => setSelectedSummaryPdf(pdf)}
                className="w-full text-left bg-gray-50 p-4 rounded-xl border border-gray-100 hover:bg-indigo-50 hover:border-indigo-100 transition-all group"
              >
                <p className="text-sm text-gray-600 line-clamp-3 mb-2">{pdf.summary || 'No summary available.'}</p>
                <div className="flex items-center text-xs font-bold text-indigo-600 opacity-80 group-hover:opacity-100">
                  <Maximize2 size={14} className="mr-1" /> Read Full Summary
                </div>
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3">
              <a 
                href={getViewUrl(pdf.cloudinaryUrl)} 
                target="_blank" 
                rel="noreferrer"
                className="flex-1 px-4 py-2 bg-gray-50 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-100 transition-colors text-center"
              >
                View PDF
              </a>
              <button 
                onClick={() => generateQuiz(pdf._id)}
                disabled={generatingQuiz}
                className="flex-1 px-4 py-2 bg-emerald-50 text-emerald-600 text-sm font-medium rounded-xl hover:bg-emerald-100 transition-colors text-center flex items-center justify-center gap-2"
              >
                <Brain size={16} /> Quiz
              </button>
            </div>
          </motion.div>
        ))}
        {pdfs.length === 0 && !uploading && (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100 border-dashed">
            No PDFs uploaded yet. Upload one above to get started!
          </div>
        )}
      </div>

      {/* Summary Modal */}
      <AnimatePresence>
        {selectedSummaryPdf && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <FileText size={18} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 truncate pr-4">
                    {selectedSummaryPdf.title}
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedSummaryPdf(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 overflow-y-auto custom-scrollbar">
                <div className="prose prose-sm sm:prose-base prose-indigo max-w-none text-gray-700 whitespace-pre-wrap">
                  {selectedSummaryPdf.summary || 'No summary available for this document.'}
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                <button 
                  onClick={() => setSelectedSummaryPdf(null)}
                  className="px-6 py-2.5 bg-gray-200 text-gray-800 font-medium rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    generateQuiz(selectedSummaryPdf._id);
                    setSelectedSummaryPdf(null);
                  }}
                  className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Brain size={18} /> Generate Quiz
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PDFs;
