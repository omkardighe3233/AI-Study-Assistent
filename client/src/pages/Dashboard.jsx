import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from '../redux/authSlice';
import { motion } from 'framer-motion';
import { BookOpen, FileText, Target, LogOut, CheckSquare, Sparkles, ArrowRight, Zap, Moon, Sun } from 'lucide-react';
import api from '../services/api';

const StatCard = ({ icon: Icon, title, value, gradient, bgGlow, isDarkMode }) => (
  <motion.div 
    whileHover={{ y: -6, scale: 1.02 }}
    transition={{ duration: 0.2 }}
    className={`relative p-6 rounded-3xl shadow-sm border backdrop-blur-xl overflow-hidden group transition-colors ${
      isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-100/80'
    }`}
  >
    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20 ${bgGlow}`} />
    <div className="flex items-center space-x-4 relative z-10">
      <div className={`p-3.5 rounded-2xl ${gradient} text-white shadow-md shadow-indigo-100 dark:shadow-none group-hover:scale-110 transition-transform`}>
        <Icon size={22} />
      </div>
      <div>
        <p className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>{title}</p>
        <h4 className={`text-2xl font-black mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{value}</h4>
      </div>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [stats, setStats] = useState({
    totalPdfs: 0,
    totalNotes: 0,
    avgQuizScore: 0,
    pendingTasks: 0
  });

  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  const toggleDarkMode = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    localStorage.setItem('theme', nextTheme ? 'dark' : 'light');
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const [pdfRes, notesRes, tasksRes, quizzesRes] = await Promise.all([
          api.get('/pdfs'),
          api.get('/notes'),
          api.get('/tasks'),
          api.get('/quizzes')
        ]);

        const quizzes = quizzesRes.data.filter(q => q.completed);
        const avgScore = quizzes.length > 0 
          ? Math.round(quizzes.reduce((acc, q) => acc + q.score, 0) / quizzes.length) 
          : 0;

        setStats({
          totalPdfs: pdfRes.data.length,
          totalNotes: notesRes.data.length,
          avgQuizScore: avgScore,
          pendingTasks: tasksRes.data.filter(t => !t.completed).length
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      }
    };

    fetchStats();
  }, [user, navigate]);

  const onLogout = () => {
    dispatch(logout());
    dispatch(reset());
    navigate('/login');
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 selection:bg-indigo-500 selection:text-white ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/70 text-slate-900'
    }`}>
      {/* Top Navbar */}
      <nav className={`border-b sticky top-0 z-50 backdrop-blur-xl transition-colors ${
        isDarkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white/85 border-slate-200/60'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none">
                <BookOpen size={20} className="text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-500 bg-clip-text text-transparent">
                StudySphere
              </span>
            </div>

            <div className="flex items-center space-x-3">
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
                onClick={() => navigate('/chat')}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-2xl hover:shadow-lg hover:shadow-indigo-200 transition-all flex items-center space-x-2 active:scale-95"
              >
                <Sparkles size={15} />
                <span>AI Chatbot</span>
              </button>

              <span className={`text-xs font-bold hidden sm:block px-3 py-2 rounded-2xl border ${
                isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100/80 text-slate-700 border-slate-200/60'
              }`}>
                Welcome back, {user && user.name}
              </span>

              <button
                onClick={onLogout}
                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-colors border border-transparent hover:border-red-100"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner Hero */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-8 text-white overflow-hidden shadow-xl shadow-indigo-950/10 border border-indigo-700/30"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/20 backdrop-blur-md px-3 py-1 rounded-full text-indigo-200 text-xs font-semibold mb-4 border border-indigo-400/20">
              <Zap size={13} className="text-amber-400" />
              <span>AI-Powered Study Workspace</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
              Accelerate Your Learning with AI
            </h1>
            <p className="text-indigo-200 text-sm leading-relaxed mb-6">
              Upload PDFs for instant detailed summaries, generate custom topic quizzes, track study tasks, and chat with Sarvam AI.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/chat')}
                className="px-5 py-2.5 bg-white text-indigo-900 text-xs font-extrabold rounded-2xl hover:bg-indigo-50 transition-all flex items-center space-x-2 shadow-md"
              >
                <Sparkles size={16} className="text-indigo-600" />
                <span>Launch AI Assistant</span>
              </button>
              <button
                onClick={() => navigate('/pdfs')}
                className="px-5 py-2.5 bg-indigo-700/40 hover:bg-indigo-700/60 backdrop-blur-md text-white text-xs font-bold rounded-2xl transition-all border border-indigo-400/30"
              >
                <span>Upload Material</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Study Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard 
              icon={FileText} 
              title="Total PDFs" 
              value={stats.totalPdfs} 
              gradient="bg-gradient-to-tr from-indigo-600 to-indigo-500" 
              bgGlow="bg-indigo-500"
              isDarkMode={isDarkMode}
            />
            <StatCard 
              icon={BookOpen} 
              title="Total Notes" 
              value={stats.totalNotes} 
              gradient="bg-gradient-to-tr from-emerald-600 to-teal-500" 
              bgGlow="bg-emerald-500"
              isDarkMode={isDarkMode}
            />
            <StatCard 
              icon={Target} 
              title="Avg Quiz Score" 
              value={`${stats.avgQuizScore}%`} 
              gradient="bg-gradient-to-tr from-blue-600 to-cyan-500" 
              bgGlow="bg-blue-500"
              isDarkMode={isDarkMode}
            />
            <StatCard 
              icon={CheckSquare} 
              title="Pending Tasks" 
              value={stats.pendingTasks} 
              gradient="bg-gradient-to-tr from-amber-500 to-orange-500" 
              bgGlow="bg-amber-500"
              isDarkMode={isDarkMode}
            />
          </div>
        </div>

        {/* Feature Hub Grid */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Study Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* AI Chatbot Card */}
            <motion.div 
              whileHover={{ y: -6 }}
              className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white p-6 rounded-3xl shadow-lg shadow-indigo-900/10 flex flex-col justify-between border border-indigo-500/30 group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/15 text-white rounded-2xl backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform">
                    <Sparkles size={22} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full text-indigo-100">
                    Pro AI
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2">AI Chatbot</h3>
                <p className="text-indigo-100/90 text-xs leading-relaxed mb-6">
                  Ask Sarvam AI study questions, get topic explanations, & practice concepts.
                </p>
              </div>
              <button 
                onClick={() => navigate('/chat')} 
                className="w-full py-3 bg-white text-indigo-900 rounded-2xl font-bold text-xs hover:bg-indigo-50 transition-colors shadow-md flex items-center justify-center space-x-2"
              >
                <span>Start Chatting</span>
                <ArrowRight size={14} />
              </button>
            </motion.div>

            {/* Study Materials Card */}
            <motion.div 
              whileHover={{ y: -6 }}
              className={`p-6 rounded-3xl shadow-sm border flex flex-col justify-between transition-all group ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/70'
              }`}
            >
              <div>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <FileText size={22} />
                </div>
                <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Study Materials</h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-6">
                  Upload PDFs, get AI summaries, and generate custom topic quizzes.
                </p>
              </div>
              <button 
                onClick={() => navigate('/pdfs')} 
                className="w-full py-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-2xl font-bold text-xs hover:bg-indigo-100 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Open Materials</span>
                <ArrowRight size={14} />
              </button>
            </motion.div>

            {/* My Notes Card */}
            <motion.div 
              whileHover={{ y: -6 }}
              className={`p-6 rounded-3xl shadow-sm border flex flex-col justify-between transition-all group ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/70'
              }`}
            >
              <div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen size={22} />
                </div>
                <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>My Notes</h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-6">
                  Create notes, listen with Audio TTS, star favorites, and highlight text.
                </p>
              </div>
              <button 
                onClick={() => navigate('/notes')} 
                className="w-full py-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-2xl font-bold text-xs hover:bg-emerald-100 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Open Notes</span>
                <ArrowRight size={14} />
              </button>
            </motion.div>

            {/* Study Planner Card */}
            <motion.div 
              whileHover={{ y: -6 }}
              className={`p-6 rounded-3xl shadow-sm border flex flex-col justify-between transition-all group ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/70'
              }`}
            >
              <div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <CheckSquare size={22} />
                </div>
                <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Study Planner</h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-6">
                  Track your tasks and assignments in an organized kanban board.
                </p>
              </div>
              <button 
                onClick={() => navigate('/tasks')} 
                className="w-full py-3 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded-2xl font-bold text-xs hover:bg-amber-100 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Open Planner</span>
                <ArrowRight size={14} />
              </button>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
