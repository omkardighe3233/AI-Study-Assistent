import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from '../redux/authSlice';
import { motion } from 'framer-motion';
import { BookOpen, Clock, FileText, Target, LogOut, CheckSquare } from 'lucide-react';
import api from '../services/api';

const StatCard = ({ icon: Icon, title, value, color }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4"
  >
    <div className={`p-4 rounded-xl ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
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
    <div className="min-h-screen bg-gray-50/50">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <BookOpen size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-emerald-500 bg-clip-text text-transparent">
                StudySphere
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                Welcome back, {user && user.name}
              </span>
              <button
                onClick={onLogout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Here's your learning progress today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={FileText} title="Total PDFs" value={stats.totalPdfs} color="bg-indigo-500" />
          <StatCard icon={BookOpen} title="Total Notes" value={stats.totalNotes} color="bg-emerald-500" />
          <StatCard icon={Target} title="Avg Quiz Score" value={`${stats.avgQuizScore}%`} color="bg-blue-500" />
          <StatCard icon={CheckSquare} title="Pending Tasks" value={stats.pendingTasks} color="bg-amber-500" />
        </div>

        {/* Feature Hub */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><FileText size={20} /></div>
                <h3 className="text-lg font-bold text-gray-900">Study Materials</h3>
              </div>
              <p className="text-gray-600 text-sm mb-6">Upload PDFs, get AI summaries, and generate quizzes.</p>
            </div>
            <button onClick={() => navigate('/pdfs')} className="w-full py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-semibold hover:bg-indigo-100 transition-colors">
              Open Materials
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><BookOpen size={20} /></div>
                <h3 className="text-lg font-bold text-gray-900">My Notes</h3>
              </div>
              <p className="text-gray-600 text-sm mb-6">Create and manage your personal study notes.</p>
            </div>
            <button onClick={() => navigate('/notes')} className="w-full py-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-semibold hover:bg-emerald-100 transition-colors">
              Open Notes
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><CheckSquare size={20} /></div>
                <h3 className="text-lg font-bold text-gray-900">Study Planner</h3>
              </div>
              <p className="text-gray-600 text-sm mb-6">Track your tasks and assignments in a kanban board.</p>
            </div>
            <button onClick={() => navigate('/tasks')} className="w-full py-2.5 bg-amber-50 text-amber-700 rounded-xl font-semibold hover:bg-amber-100 transition-colors">
              Open Planner
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
