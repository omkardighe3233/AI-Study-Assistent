import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ArrowLeft, CheckCircle2, XCircle, Award, Sparkles, Check, Loader2, Clock, RefreshCw, AlertCircle, Moon, Sun } from 'lucide-react';

const Quiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isRetryMode, setIsRetryMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  // Timer State
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);

  useEffect(() => {
    fetchQuiz();
  }, [id, navigate]);

  const toggleDarkMode = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    localStorage.setItem('theme', nextTheme ? 'dark' : 'light');
  };

  useEffect(() => {
    let interval = null;
    if (timerRunning && !submitted) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerRunning, submitted]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/quizzes');
      const currentQuiz = data.find((q) => q._id === id);
      if (currentQuiz) {
        setQuiz(currentQuiz);
        setActiveQuestions(currentQuiz.questions || []);
        setSubmitted(currentQuiz.completed);
        setScore(currentQuiz.score);
        if (currentQuiz.completed) {
          setTimerRunning(false);
        }
      } else {
        toast.error('Quiz not found');
        navigate('/pdfs');
      }
    } catch (error) {
      toast.error('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (questionId, option) => {
    if (submitted) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < activeQuestions.length) {
      toast.error('Please answer all questions before submitting.');
      return;
    }

    let calculatedCorrect = 0;
    activeQuestions.forEach((q) => {
      if (answers[q._id] === q.correctAnswer) {
        calculatedCorrect += 1;
      }
    });

    const finalScore = Math.round((calculatedCorrect / activeQuestions.length) * 100);

    try {
      setTimerRunning(false);
      if (!isRetryMode) {
        await api.post(`/quizzes/${id}/submit`, { score: finalScore });
      }
      setScore(finalScore);
      setSubmitted(true);
      toast.success(`Quiz completed! Score: ${finalScore}%`);
    } catch (error) {
      toast.error('Failed to submit quiz');
    }
  };

  const handleRetryWrongQuestions = () => {
    const wrongQs = activeQuestions.filter((q) => answers[q._id] !== q.correctAnswer);
    if (wrongQs.length === 0) {
      toast.success('No wrong questions to retry!');
      return;
    }
    setActiveQuestions(wrongQs);
    setAnswers({});
    setSubmitted(false);
    setIsRetryMode(true);
    setTimerSeconds(0);
    setTimerRunning(true);
    toast.success(`Retrying ${wrongQs.length} missed question(s)!`);
  };

  const handleResetFullQuiz = () => {
    if (!quiz) return;
    setActiveQuestions(quiz.questions || []);
    setAnswers({});
    setSubmitted(false);
    setIsRetryMode(false);
    setTimerSeconds(0);
    setTimerRunning(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center text-slate-500 flex flex-col items-center">
          <Loader2 className="animate-spin mb-3 text-indigo-600" size={32} />
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Loading Practice Mode...</p>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / activeQuestions.length) * 100);

  const wrongQuestionsList = submitted
    ? activeQuestions.filter((q) => answers[q._id] !== q.correctAnswer)
    : [];

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 selection:bg-indigo-500 selection:text-white ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/70 text-slate-900'
    }`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header Bar */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 p-6 rounded-3xl border shadow-sm backdrop-blur-xl transition-colors ${
          isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200/80'
        }`}>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Brain size={12} /> {isRetryMode ? 'Retry Practice Mode' : 'MCQ Practice Mode'}
              </span>
            </div>
            <h1 className="text-2xl font-black mt-1">{quiz.title}</h1>
            <p className="text-xs text-slate-400 mt-0.5">Test & reinforce your knowledge with timed questions.</p>
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

            {/* Live Timer Badge */}
            <div className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-2xl text-xs font-extrabold shadow-sm">
              <Clock size={14} className="text-amber-400" />
              <span>{formatTime(timerSeconds)}</span>
            </div>

            <button
              onClick={() => navigate('/pdfs')}
              className={`px-4 py-2 text-xs font-bold rounded-2xl transition-colors flex items-center space-x-1.5 ${
                isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {!submitted && (
          <div className={`p-4 rounded-2xl shadow-sm border mb-6 ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'
          }`}>
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-2">
              <span>Progress: {answeredCount} of {activeQuestions.length} Questions Answered</span>
              <span className="text-indigo-500">{progressPercent}%</span>
            </div>
            <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <div
                className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Score Celebration & Actions Banner */}
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`p-6 sm:p-8 rounded-3xl mb-8 border shadow-md ${
              score >= 70
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-500/30'
                : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-400/30'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-3.5 bg-white/20 rounded-2xl backdrop-blur-md">
                  <Award size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black mb-1">
                    {score >= 70 ? 'Quiz Mastered!' : 'Practice Complete!'}
                  </h3>
                  <p className="text-xs text-white/90 font-medium">
                    Time elapsed: {formatTime(timerSeconds)} • {score >= 70 ? 'Great score!' : 'Review wrong answers below and retry.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-3xl sm:text-4xl font-black tracking-tight bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
                  {score}%
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/20 flex flex-wrap gap-3">
              {wrongQuestionsList.length > 0 && (
                <button
                  onClick={handleRetryWrongQuestions}
                  className="px-5 py-2.5 bg-white text-slate-900 text-xs font-black rounded-2xl shadow-md hover:bg-slate-50 transition-all flex items-center space-x-2 active:scale-95"
                >
                  <RefreshCw size={15} className="text-indigo-600" />
                  <span>Retry {wrongQuestionsList.length} Wrong Question(s)</span>
                </button>
              )}

              <button
                onClick={handleResetFullQuiz}
                className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-2xl transition-all border border-white/20 flex items-center space-x-2"
              >
                <RefreshCw size={14} />
                <span>Retake Full Quiz</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Wrong Answers Dedicated Breakdown Block */}
        {submitted && wrongQuestionsList.length > 0 && (
          <div className="bg-red-50/70 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/50 rounded-3xl p-6 mb-8">
            <div className="flex items-center space-x-2 text-red-700 dark:text-red-300 font-extrabold text-sm mb-4">
              <AlertCircle size={18} />
              <span>Wrong Answers Review ({wrongQuestionsList.length} Missed)</span>
            </div>
            <div className="space-y-4">
              {wrongQuestionsList.map((q) => (
                <div key={q._id} className={`p-4 rounded-2xl border text-xs space-y-2 ${
                  isDarkMode ? 'bg-slate-900 border-red-900/50 text-slate-200' : 'bg-white border-red-100 text-slate-900'
                }`}>
                  <p className="font-bold">
                    <span className="text-red-500 mr-1">Q:</span> {q.question}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <span className="text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-950/60 px-3 py-1.5 rounded-xl border border-red-100 dark:border-red-900/40">
                      Your Answer: {answers[q._id] || 'Not answered'}
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                      Correct Answer: {q.correctAnswer}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Questions List */}
        <div className="space-y-6">
          {activeQuestions.map((q, index) => (
            <motion.div
              key={q._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className={`p-6 sm:p-8 rounded-3xl shadow-sm border transition-colors ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'
              }`}
            >
              <h4 className="text-base sm:text-lg font-bold mb-5 leading-snug flex items-start">
                <span className="w-7 h-7 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-black flex items-center justify-center shrink-0 mr-3 mt-0.5">
                  {index + 1}
                </span>
                <span>{q.question}</span>
              </h4>

              <div className="space-y-3">
                {q.options.map((option, optIdx) => {
                  const isSelected = answers[q._id] === option;
                  const isCorrect = option === q.correctAnswer;

                  let buttonStyle = isDarkMode
                    ? 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                    : 'bg-slate-50/80 border-slate-200/70 text-slate-700 hover:bg-slate-100/80';

                  if (submitted) {
                    if (isCorrect) {
                      buttonStyle = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold shadow-sm';
                    } else if (isSelected && !isCorrect) {
                      buttonStyle = 'bg-red-50 dark:bg-red-950/60 border-red-500 text-red-900 dark:text-red-200 font-medium';
                    }
                  } else if (isSelected) {
                    buttonStyle = 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-600 text-indigo-950 dark:text-indigo-200 font-bold shadow-sm ring-2 ring-indigo-500/20';
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleOptionSelect(q._id, option)}
                      disabled={submitted}
                      className={`w-full text-left px-5 py-3.5 rounded-2xl border text-xs sm:text-sm transition-all flex items-center justify-between ${buttonStyle} ${
                        !submitted && 'cursor-pointer active:scale-[0.99]'
                      }`}
                    >
                      <span>{option}</span>
                      {submitted ? (
                        isCorrect ? (
                          <CheckCircle2 size={18} className="text-emerald-600 shrink-0 ml-2" />
                        ) : isSelected && !isCorrect ? (
                          <XCircle size={18} className="text-red-500 shrink-0 ml-2" />
                        ) : null
                      ) : isSelected ? (
                        <div className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center shrink-0 ml-2">
                          <Check size={12} />
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {submitted && !isCorrectAnswerSelected(answers[q._id], q.correctAnswer) && (
                <div className="mt-4 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 p-3.5 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50 flex items-center space-x-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>
                    <strong className="font-bold">Correct Answer:</strong> {q.correctAnswer}
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Submit Button */}
        {!submitted && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSubmit}
              className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center space-x-2 active:scale-95"
            >
              <Sparkles size={16} />
              <span>Submit Quiz Answers</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

function isCorrectAnswerSelected(selected, correct) {
  return selected === correct;
}

export default Quiz;
