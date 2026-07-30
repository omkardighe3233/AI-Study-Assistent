import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Trash2, Calendar, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', dueDate: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data } = await api.get('/tasks');
      setTasks(data);
    } catch (error) {
      toast.error('Failed to fetch tasks');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      await api.post('/tasks', newTask);
      toast.success('Task added');
      setIsAdding(false);
      setNewTask({ title: '', dueDate: '' });
      fetchTasks();
    } catch (error) {
      toast.error('Failed to add task');
    }
  };

  const toggleComplete = async (task) => {
    try {
      await api.put(`/tasks/${task._id}`, { completed: !task.completed });
      fetchTasks();
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      toast.success('Task removed');
      fetchTasks();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-gray-50/50">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Study Planner</h1>
          <p className="text-sm text-gray-500 mt-1">Organize your study schedule and tasks.</p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
          &larr; Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Pending Column */}
        <div className="bg-white/80 p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div> To Do
            </h2>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              {isAdding ? <X size={18} /> : <Plus size={18} />}
            </button>
          </div>

          <AnimatePresence>
            {isAdding && (
              <motion.form 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAdd}
                className="mb-4 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50"
              >
                <input
                  type="text"
                  placeholder="What needs to be done?"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full px-4 py-2 mb-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                    className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-600"
                  />
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors text-sm">
                    Add
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            <AnimatePresence>
              {pendingTasks.map((task) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={task._id}
                  className="group bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 flex-1 overflow-hidden">
                    <button 
                      onClick={() => toggleComplete(task)}
                      className="shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
                    >
                      <Check size={12} className="text-transparent" />
                    </button>
                    <div className="truncate">
                      <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                      {task.dueDate && (
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <Calendar size={12} /> {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(task._id)} className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0">
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {pendingTasks.length === 0 && !isAdding && (
              <p className="text-center text-sm text-gray-400 py-6">All caught up!</p>
            )}
          </div>
        </div>

        {/* Completed Column */}
        <div className="bg-white/80 p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Completed
            </h2>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {completedTasks.map((task) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={task._id}
                  className="group bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 flex items-center justify-between opacity-70 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-center gap-4 flex-1 overflow-hidden">
                    <button 
                      onClick={() => toggleComplete(task)}
                      className="shrink-0 w-6 h-6 rounded-full border-2 border-emerald-500 bg-emerald-50 flex items-center justify-center transition-colors"
                    >
                      <Check size={12} className="text-emerald-500" />
                    </button>
                    <div className="truncate">
                      <p className="text-sm font-medium text-gray-500 line-through truncate">{task.title}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(task._id)} className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0">
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tasks;
