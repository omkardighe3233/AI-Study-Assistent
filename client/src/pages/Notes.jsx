import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit3, X, Save, Star, ArrowLeft, Highlighter, Volume2, VolumeX, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [filter, setFilter] = useState('all');
  const [selectedText, setSelectedText] = useState('');
  const [highlightingNoteId, setHighlightingNoteId] = useState(null);
  const [speakingNoteId, setSpeakingNoteId] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  const navigate = useNavigate();

  useEffect(() => {
    fetchNotes();
  }, []);

  const toggleDarkMode = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    localStorage.setItem('theme', nextTheme ? 'dark' : 'light');
  };

  const fetchNotes = async () => {
    try {
      const { data } = await api.get('/notes');
      setNotes(data);
    } catch (error) {
      toast.error('Failed to fetch notes');
    }
  };

  const handleSpeech = (e, note) => {
    e.stopPropagation();
    if (!('speechSynthesis' in window)) {
      toast.error('Text-to-Speech is not supported in your browser');
      return;
    }

    if (speakingNoteId === note._id) {
      window.speechSynthesis.cancel();
      setSpeakingNoteId(null);
      toast.success('Stopped reading');
      return;
    }

    window.speechSynthesis.cancel();
    const textToRead = `${note.title}. ${note.content}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95;

    utterance.onend = () => setSpeakingNoteId(null);
    utterance.onerror = () => setSpeakingNoteId(null);

    window.speechSynthesis.speak(utterance);
    setSpeakingNoteId(note._id);
    toast.success('Reading note aloud... 🔊');
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      if (editingId) {
        await api.put(`/notes/${editingId}`, formData);
        toast.success('Note updated');
      } else {
        await api.post('/notes', formData);
        toast.success('Note created');
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ title: '', content: '' });
      fetchNotes();
    } catch (error) {
      toast.error('Failed to save note');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      if (speakingNoteId === id) window.speechSynthesis.cancel();
      await api.delete(`/notes/${id}`);
      toast.success('Note deleted');
      fetchNotes();
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const handleTogglePin = async (e, note) => {
    e.stopPropagation();
    try {
      await api.put(`/notes/${note._id}/pin`);
      toast.success(note.isPinned ? 'Note unstarred' : 'Note starred as favorite ⭐');
      fetchNotes();
    } catch (error) {
      toast.error('Failed to update favorite status');
    }
  };

  const openEdit = (note) => {
    setFormData({ title: note.title, content: note.content });
    setEditingId(note._id);
    setIsAdding(true);
  };

  const handleTextSelection = (noteId) => {
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : '';
    if (text.length > 2) {
      setSelectedText(text);
      setHighlightingNoteId(noteId);
    }
  };

  const addHighlightToNote = async (color) => {
    if (!selectedText || !highlightingNoteId) return;

    const targetNote = notes.find((n) => n._id === highlightingNoteId);
    if (!targetNote) return;

    const existingHighlights = targetNote.highlights || [];
    const updatedHighlights = [...existingHighlights, { text: selectedText, color }];

    try {
      await api.put(`/notes/${highlightingNoteId}`, { highlights: updatedHighlights });
      toast.success('Sentence highlighted!');
      setSelectedText('');
      setHighlightingNoteId(null);
      window.getSelection()?.removeAllRanges();
      fetchNotes();
    } catch (error) {
      toast.error('Failed to save text highlight');
    }
  };

  const removeHighlight = async (noteId, index) => {
    const targetNote = notes.find((n) => n._id === noteId);
    if (!targetNote) return;

    const updated = (targetNote.highlights || []).filter((_, i) => i !== index);

    try {
      await api.put(`/notes/${noteId}`, { highlights: updated });
      toast.success('Highlight removed');
      fetchNotes();
    } catch (error) {
      toast.error('Failed to remove highlight');
    }
  };

  const filteredNotes = filter === 'starred' ? notes.filter((n) => n.isPinned) : notes;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 selection:bg-amber-300 ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/70 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 p-6 rounded-3xl border shadow-sm backdrop-blur-xl transition-colors ${
          isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200/80'
        }`}>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                Study Notebook
              </span>
            </div>
            <h1 className="text-2xl font-black mt-1">My Notes & Audio Reader</h1>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Listen to notes with Text-to-Speech 🔊, star favorites ⭐, & highlight key sentences.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Dark Mode Theme Toggle */}
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
              <span>Dashboard</span>
            </button>

            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center space-x-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-md transition-all active:scale-95"
              >
                <Plus size={16} />
                <span>New Note</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-xs font-bold rounded-2xl transition-all ${
              filter === 'all'
                ? isDarkMode
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-white shadow-sm'
                : isDarkMode
                ? 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            All Notes ({notes.length})
          </button>
          <button
            onClick={() => setFilter('starred')}
            className={`px-4 py-2 text-xs font-bold rounded-2xl transition-all flex items-center space-x-1.5 ${
              filter === 'starred'
                ? 'bg-amber-500 text-white shadow-sm'
                : isDarkMode
                ? 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Star size={14} className="fill-amber-300 text-amber-300" />
            <span>Starred / Favorites ({notes.filter((n) => n.isPinned).length})</span>
          </button>
        </div>

        {/* Floating Highlight Color Picker Toolbar */}
        <AnimatePresence>
          {selectedText && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white p-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center space-x-3"
            >
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-300">
                <Highlighter size={14} className="text-amber-400" />
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
                    onClick={() => addHighlightToNote(c.label)}
                    className={`w-6 h-6 rounded-full ${c.bg} border-2 border-white hover:scale-125 transition-transform shadow-sm`}
                    title={`Highlight in ${c.label}`}
                  />
                ))}
              </div>
              <button
                onClick={() => {
                  setSelectedText('');
                  setHighlightingNoteId(null);
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add / Edit Note Modal */}
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mb-8 p-6 sm:p-8 rounded-3xl shadow-sm border overflow-hidden transition-colors ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'
              }`}
            >
              <input
                type="text"
                placeholder="Note Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`w-full text-xl font-black border-none outline-none mb-3 bg-transparent ${
                  isDarkMode ? 'text-white placeholder-slate-600' : 'text-slate-900 placeholder-slate-300'
                }`}
                autoFocus
              />
              <textarea
                placeholder="Start typing your study note here..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className={`w-full h-36 text-sm border-none outline-none resize-none bg-transparent ${
                  isDarkMode ? 'text-slate-200 placeholder-slate-600' : 'text-slate-700 placeholder-slate-300'
                }`}
              />
              <div className={`flex justify-end gap-3 mt-4 pt-4 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setEditingId(null);
                    setFormData({ title: '', content: '' });
                  }}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors font-bold text-xs flex items-center space-x-1.5"
                >
                  <X size={15} />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSave}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-2xl shadow-sm hover:bg-emerald-700 transition-colors font-bold text-xs flex items-center space-x-1.5"
                >
                  <Save size={15} />
                  <span>Save Note</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => {
            const isSpeaking = speakingNoteId === note._id;

            return (
              <motion.div
                key={note._id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onMouseUp={() => handleTextSelection(note._id)}
                className={`p-6 rounded-3xl shadow-sm border flex flex-col group relative overflow-hidden transition-all hover:shadow-md ${
                  note.isPinned
                    ? 'border-amber-400 ring-2 ring-amber-400/20'
                    : isDarkMode
                    ? 'bg-slate-900 border-slate-800'
                    : 'bg-white border-slate-200/80'
                }`}
              >
                {/* Header with TTS & Star */}
                <div className="flex justify-between items-start mb-3">
                  <h3 className={`font-extrabold text-base truncate pr-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {note.title}
                  </h3>
                  <div className="flex items-center space-x-1 shrink-0">
                    {/* TTS Read Aloud Button */}
                    <button
                      onClick={(e) => handleSpeech(e, note)}
                      className={`p-1.5 rounded-xl transition-all ${
                        isSpeaking
                          ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 animate-pulse'
                          : isDarkMode
                          ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                          : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                      }`}
                      title={isSpeaking ? 'Stop Reading' : 'Read Note Aloud (Text-to-Speech)'}
                    >
                      {isSpeaking ? <VolumeX size={17} /> : <Volume2 size={17} />}
                    </button>

                    {/* Favorite Star Button */}
                    <button
                      onClick={(e) => handleTogglePin(e, note)}
                      className={`p-1.5 rounded-xl transition-all ${
                        note.isPinned
                          ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/60'
                          : isDarkMode
                          ? 'text-slate-500 hover:text-amber-400 hover:bg-slate-800'
                          : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50'
                      }`}
                      title={note.isPinned ? 'Unstar Note' : 'Star Note as Favorite ⭐'}
                    >
                      <Star size={17} className={note.isPinned ? 'fill-amber-400 text-amber-400' : ''} />
                    </button>
                  </div>
                </div>

                {/* Content Body */}
                <p className={`text-xs whitespace-pre-wrap flex-grow leading-relaxed mb-4 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {note.content}
                </p>

                {/* Highlights Section */}
                {note.highlights && note.highlights.length > 0 && (
                  <div className={`mb-4 pt-3 border-t space-y-1.5 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Highlighter size={11} className="text-amber-500" /> Saved Highlights:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {note.highlights.map((hl, hIdx) => {
                        const colorBg =
                          hl.color === 'Green'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : hl.color === 'Blue'
                            ? 'bg-sky-100 text-sky-900 border-sky-300'
                            : hl.color === 'Pink'
                            ? 'bg-pink-100 text-pink-900 border-pink-300'
                            : 'bg-amber-100 text-amber-900 border-amber-300';
                        return (
                          <span
                            key={hIdx}
                            className={`text-[11px] px-2 py-0.5 rounded-lg border font-medium flex items-center gap-1 ${colorBg}`}
                          >
                            <span className="truncate max-w-[160px]">"{hl.text}"</span>
                            <button
                              onClick={() => removeHighlight(note._id, hIdx)}
                              className="hover:text-red-600 font-bold ml-1"
                            >
                              &times;
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Footer Actions */}
                <div className={`pt-3 border-t flex justify-between items-center text-slate-400 ${
                  isDarkMode ? 'border-slate-800' : 'border-slate-100'
                }`}>
                  <span className="text-[10px] font-medium">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(note)}
                      className="p-1.5 text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl hover:bg-indigo-100 transition-colors"
                      title="Edit Note"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(note._id)}
                      className="p-1.5 text-red-500 bg-red-50 dark:bg-red-950/60 rounded-xl hover:bg-red-100 transition-colors"
                      title="Delete Note"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filteredNotes.length === 0 && !isAdding && (
            <div className={`col-span-full py-16 text-center rounded-3xl border border-dashed ${
              isDarkMode ? 'bg-slate-900/60 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-400'
            }`}>
              {filter === 'starred' ? (
                <>
                  <Star size={36} className="mx-auto mb-2 text-amber-300" />
                  <p className="text-sm font-bold text-slate-400">No starred notes yet</p>
                  <p className="text-xs text-slate-500 mt-1">Click the star ⭐ icon on any note to mark it as a favorite!</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-slate-400">No notes created yet</p>
                  <p className="text-xs text-slate-500 mt-1">Click 'New Note' above to capture your study ideas!</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notes;
