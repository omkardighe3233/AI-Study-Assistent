import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit3, X, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const { data } = await api.get('/notes');
      setNotes(data);
    } catch (error) {
      toast.error('Failed to fetch notes');
    }
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
      await api.delete(`/notes/${id}`);
      toast.success('Note deleted');
      fetchNotes();
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const openEdit = (note) => {
    setFormData({ title: note.title, content: note.content });
    setEditingId(note._id);
    setIsAdding(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-gray-50/50">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Notes</h1>
          <p className="text-sm text-gray-500 mt-1">Capture your thoughts and study concepts.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
            &larr; Dashboard
          </button>
          {!isAdding && (
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <Plus size={16} /> New Note
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <input
              type="text"
              placeholder="Note Title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full text-xl font-bold border-none outline-none mb-4 placeholder-gray-300 bg-transparent"
              autoFocus
            />
            <textarea
              placeholder="Start typing your note here..."
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              className="w-full h-32 text-gray-700 border-none outline-none resize-none placeholder-gray-300 bg-transparent"
            />
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-50">
              <button 
                onClick={() => { setIsAdding(false); setEditingId(null); setFormData({title:'', content:''}); }}
                className="px-4 py-2 text-gray-500 hover:bg-gray-50 rounded-xl transition-colors font-medium text-sm flex items-center gap-2"
              >
                <X size={16} /> Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 bg-emerald-500 text-white rounded-xl shadow-sm hover:bg-emerald-600 transition-colors font-medium text-sm flex items-center gap-2"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 hover:masonry">
        {notes.map((note) => (
          <motion.div
            key={note._id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col group relative overflow-hidden transition-all hover:shadow-md"
          >
            <h3 className="font-bold text-gray-900 text-lg mb-2 truncate">{note.title}</h3>
            <p className="text-gray-600 text-sm whitespace-pre-wrap flex-grow opacity-90">{note.content}</p>
            
            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs text-gray-400 font-medium">
                {new Date(note.updatedAt).toLocaleDateString()}
              </span>
              <div className="flex gap-2">
                <button onClick={() => openEdit(note)} className="p-1.5 text-indigo-500 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => handleDelete(note._id)} className="p-1.5 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {notes.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white/50 border border-dashed border-gray-200 rounded-2xl">
            No notes yet. Click 'New Note' to create one!
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;
