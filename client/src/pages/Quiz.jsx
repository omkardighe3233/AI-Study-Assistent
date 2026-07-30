import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const Quiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        // Find the quiz from the user's quizzes
        const { data } = await api.get('/quizzes');
        const currentQuiz = data.find(q => q._id === id);
        if (currentQuiz) {
          setQuiz(currentQuiz);
          setSubmitted(currentQuiz.completed);
          setScore(currentQuiz.score);
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
    fetchQuiz();
  }, [id, navigate]);

  const handleOptionSelect = (questionId, option) => {
    if (submitted) return;
    setAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < quiz.questions.length) {
      toast.error('Please answer all questions before submitting.');
      return;
    }

    let calculatedScore = 0;
    quiz.questions.forEach(q => {
      if (answers[q._id] === q.correctAnswer) {
        calculatedScore += 1;
      }
    });

    const finalScore = Math.round((calculatedScore / quiz.questions.length) * 100);
    
    try {
      await api.post(`/quizzes/${id}/submit`, { score: finalScore });
      setScore(finalScore);
      setSubmitted(true);
      toast.success(`Quiz completed! Score: ${finalScore}%`);
    } catch (error) {
      toast.error('Failed to submit quiz');
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Loading quiz...</div>;
  if (!quiz) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 min-h-screen bg-gray-50/50">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
          <p className="text-sm text-gray-500 mt-1">AI-generated multiple choice questions.</p>
        </div>
        <button onClick={() => navigate('/pdfs')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
          &larr; Back to Materials
        </button>
      </div>

      {submitted && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-2xl mb-8 flex items-center justify-between shadow-sm border ${
            score >= 70 ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-800'
          }`}
        >
          <div>
            <h3 className="text-lg font-bold">Quiz Completed!</h3>
            <p className="text-sm opacity-80">You scored {score}%. {score >= 70 ? 'Great job!' : 'Keep practicing!'}</p>
          </div>
          <div className="text-4xl font-extrabold">{score}%</div>
        </motion.div>
      )}

      <div className="space-y-6">
        {quiz.questions.map((q, index) => (
          <div key={q._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              <span className="text-indigo-500 font-bold mr-2">{index + 1}.</span>
              {q.question}
            </h4>
            <div className="space-y-3">
              {q.options.map((option, optIdx) => {
                const isSelected = answers[q._id] === option;
                const isCorrect = option === q.correctAnswer;
                
                let buttonStyle = "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100";
                
                if (submitted) {
                  if (isCorrect) {
                    buttonStyle = "bg-emerald-50 border-emerald-500 text-emerald-700 font-medium";
                  } else if (isSelected && !isCorrect) {
                    buttonStyle = "bg-red-50 border-red-500 text-red-700";
                  }
                } else if (isSelected) {
                  buttonStyle = "bg-indigo-50 border-indigo-500 text-indigo-700 font-medium shadow-sm";
                }

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleOptionSelect(q._id, option)}
                    disabled={submitted}
                    className={`w-full text-left px-5 py-3 rounded-xl border transition-all ${buttonStyle} ${!submitted && 'cursor-pointer'}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            
            {submitted && !isCorrectAnswerSelected(answers[q._id], q.correctAnswer) && (
              <div className="mt-4 text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                <span className="font-semibold">Correct Answer:</span> {q.correctAnswer}
              </div>
            )}
          </div>
        ))}
      </div>

      {!submitted && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSubmit}
            className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-sm hover:bg-indigo-700 transition-colors"
          >
            Submit Quiz
          </button>
        </div>
      )}
    </div>
  );
};

// Helper function
function isCorrectAnswerSelected(selected, correct) {
  return selected === correct;
}

export default Quiz;
