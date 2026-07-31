import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import {
  MessageSquare,
  Plus,
  Trash2,
  Send,
  Bot,
  User as UserIcon,
  ArrowLeft,
  Menu,
  X,
  Sparkles,
  Loader2,
  BookOpen,
  Zap,
  Check,
  Copy,
  HelpCircle,
  Code,
  Layers
} from 'lucide-react';
import api from '../services/api';

const Chat = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingChats, setFetchingChats] = useState(true);
  const [fetchingMessages, setFetchingMessages] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // AI Doubt Solver Mode Toggle State
  const [isDoubtSolver, setIsDoubtSolver] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      setFetchingChats(true);
      const { data } = await api.get('/chat');
      setChats(data);
    } catch (error) {
      toast.error('Failed to load chat history');
    } finally {
      setFetchingChats(false);
    }
  };

  const loadChat = async (chatId) => {
    try {
      setFetchingMessages(true);
      setCurrentChatId(chatId);
      const { data } = await api.get(`/chat/${chatId}`);
      setMessages(data.messages || []);
      setSidebarOpen(false);
    } catch (error) {
      toast.error('Failed to load chat conversation');
    } finally {
      setFetchingMessages(false);
    }
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setInputMessage('');
    setSidebarOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this chat conversation?')) return;

    try {
      await api.delete(`/chat/${chatId}`);
      toast.success('Chat deleted');
      setChats((prev) => prev.filter((c) => c._id !== chatId));

      if (currentChatId === chatId) {
        handleNewChat();
      }
    } catch (error) {
      toast.error('Failed to delete chat');
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    let messageText = inputMessage.trim();
    if (!messageText || loading) return;

    // If AI Doubt Solver mode is active, format prompt with structural breakdown requirement
    const payloadMessage = isDoubtSolver
      ? `[AI DOUBT SOLVER REQUEST]: Please explain the following concept/doubt thoroughly: "${messageText}".\n\nFormat your response cleanly in Markdown with the following structured sections:\n1. 📌 **Core Concept & Intuition** (Step-by-step clear explanation)\n2. 💡 **Real-World Example & Analogy** (Practical relatable example)\n3. 💻 **Code / Technical Implementation** (Clean, well-commented code snippet or formula)\n4. 📊 **Visual Diagram / Structural Representation** (Use clean ASCII diagrams, tree structures, or Mermaid charts to illustrate the concept visually)`
      : messageText;

    const tempUserMsg = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const endpoint = currentChatId ? `/chat/${currentChatId}/message` : '/chat/message';
      const { data } = await api.post(endpoint, {
        message: payloadMessage,
        chatId: currentChatId,
      });

      if (!currentChatId && data.chatId) {
        setCurrentChatId(data.chatId);
      }

      setMessages(data.messages || []);
      fetchChats();
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to get response from AI Chatbot';
      toast.error(errorMessage);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Error:** ${errorMessage}. Please check your connection or try again.`,
          timestamp: new Date().toISOString(),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyText = (content, index) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    toast.success('Copied message text!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-md lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950/95 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight block">AI Assistant</span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Sarvam AI Powered</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={handleNewChat}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-indigo-600/25 active:scale-95"
          >
            <Plus size={16} />
            <span>New Conversation</span>
          </button>
        </div>

        {/* Mode Selector in Sidebar */}
        <div className="px-4 pb-2">
          <div className="bg-slate-900 p-1 rounded-2xl border border-slate-800 flex items-center">
            <button
              onClick={() => setIsDoubtSolver(false)}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl transition-all ${
                !isDoubtSolver ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              General Chat
            </button>
            <button
              onClick={() => setIsDoubtSolver(true)}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center space-x-1 ${
                isDoubtSolver ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <HelpCircle size={12} />
              <span>Doubt Solver</span>
            </button>
          </div>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 custom-scrollbar">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
            History
          </p>

          {fetchingChats ? (
            <div className="flex items-center justify-center py-8 text-slate-500">
              <Loader2 className="animate-spin mr-2" size={16} />
              <span className="text-xs">Loading sessions...</span>
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-8 text-slate-500 px-4">
              <MessageSquare size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-xs">No saved chats yet. Start a new conversation!</p>
            </div>
          ) : (
            chats.map((chat) => {
              const isActive = currentChatId === chat._id;
              return (
                <div
                  key={chat._id}
                  onClick={() => loadChat(chat._id)}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-2xl cursor-pointer transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate mr-2">
                    <MessageSquare
                      size={15}
                      className={isActive ? 'text-indigo-400 shrink-0' : 'text-slate-500 shrink-0'}
                    />
                    <span className="text-xs truncate">{chat.title || 'Untitled Chat'}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteChat(e, chat._id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-all"
                    title="Delete Chat"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-2.5 px-3 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all flex items-center justify-center space-x-2 border border-slate-800"
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full bg-slate-900 relative">
        {/* Header */}
        <header className="h-16 border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between bg-slate-950/80 backdrop-blur-xl z-10">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl lg:hidden"
            >
              <Menu size={18} />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-indigo-500/20">
                {isDoubtSolver ? <HelpCircle size={20} /> : <Bot size={20} />}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="font-extrabold text-white text-base leading-tight">
                    {isDoubtSolver ? 'AI Doubt Solver' : 'Sarvam AI Study Assistant'}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {isDoubtSolver ? 'Code & Diagram Mode' : 'General Chat'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {isDoubtSolver ? 'Ask any academic doubt for code, examples & diagrams' : 'Ask questions, get summaries & study help'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsDoubtSolver(!isDoubtSolver)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center space-x-1.5 ${
                isDoubtSolver
                  ? 'bg-purple-600 text-white border-purple-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              <HelpCircle size={14} />
              <span className="hidden sm:inline">{isDoubtSolver ? 'Doubt Mode ON' : 'Doubt Solver'}</span>
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all hidden sm:flex items-center text-xs font-semibold"
              title="Return to Dashboard"
            >
              <BookOpen size={16} className="mr-1.5 text-indigo-400" />
              <span>Dashboard</span>
            </button>
          </div>
        </header>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-900/90 custom-scrollbar">
          {fetchingMessages ? (
            <div className="flex items-center justify-center h-full text-slate-500">
              <Loader2 className="animate-spin mr-2" size={22} />
              <span className="text-sm">Loading conversation...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="max-w-2xl mx-auto text-center my-auto py-12 px-4">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/20 border border-indigo-400/30">
                {isDoubtSolver ? <HelpCircle size={30} /> : <Sparkles size={30} />}
              </div>
              <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
                {isDoubtSolver ? 'AI Academic Doubt Solver' : 'How can I help you study today?'}
              </h2>
              <p className="text-slate-400 text-xs mb-8 max-w-md mx-auto leading-relaxed">
                {isDoubtSolver
                  ? 'Type any concept or doubt (e.g. "Explain Binary Search Tree"). AI will explain with examples, code snippets, and structural diagrams.'
                  : 'Powered by Sarvam AI. Ask me to explain complex topics, summarize study notes, generate practice questions, or solve problems.'}
              </p>

              {/* Sample Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-lg mx-auto">
                {(isDoubtSolver
                  ? [
                      'Explain Binary Search Tree',
                      'Explain Photosynthesis step-by-step',
                      'Explain Quick Sort algorithm',
                      'Explain Master Theorem in algorithm analysis',
                    ]
                  : [
                      'Explain Quantum Mechanics simply',
                      'Summarize key principles of Organic Chemistry',
                      'Give me 5 practice questions on World War II',
                      'How do I write a solid research thesis statement?',
                    ]
                ).map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputMessage(prompt);
                      if (inputRef.current) inputRef.current.focus();
                    }}
                    className="p-3.5 bg-slate-800/80 hover:bg-indigo-950/60 border border-slate-700/60 hover:border-indigo-500/40 rounded-2xl text-xs text-slate-300 text-left transition-all shadow-sm group hover:-translate-y-0.5"
                  >
                    <span className="font-bold text-indigo-400 group-hover:text-indigo-300 block mb-1 flex items-center">
                      <Zap size={12} className="mr-1 text-amber-400" /> {isDoubtSolver ? 'Doubt Prompt' : 'Prompt Idea'}
                    </span>
                    <span className="line-clamp-2 text-slate-300">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isUser = msg.role === 'user';

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-start gap-3 max-w-4xl mx-auto ${
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                      isUser
                        ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white'
                        : 'bg-slate-800 border border-slate-700 text-indigo-400'
                    }`}
                  >
                    {isUser ? <UserIcon size={17} /> : <Bot size={17} />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`group relative rounded-2xl p-4 text-xs sm:text-sm max-w-[88%] sm:max-w-[78%] leading-relaxed ${
                      isUser
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md rounded-tr-xs'
                        : msg.isError
                        ? 'bg-red-950/60 text-red-300 border border-red-800/60 rounded-tl-xs'
                        : 'bg-slate-800/90 text-slate-100 border border-slate-700/80 shadow-md rounded-tl-xs'
                    }`}
                  >
                    {!isUser && (
                      <button
                        onClick={() => handleCopyText(msg.content, index)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white bg-slate-700/60 rounded-lg transition-all"
                        title="Copy message"
                      >
                        {copiedIndex === index ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      </button>
                    )}

                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="prose prose-invert prose-sm max-w-none text-slate-200">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}

                    <span
                      className={`block text-[10px] mt-2 text-right ${
                        isUser ? 'text-indigo-200' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp
                        ? new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}

          {/* Typing Loading Indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 max-w-4xl mx-auto"
            >
              <div className="w-9 h-9 bg-slate-800 border border-slate-700 text-indigo-400 rounded-2xl flex items-center justify-center shrink-0 shadow-md">
                <Bot size={17} />
              </div>
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl rounded-tl-xs px-4 py-3 shadow-md flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-slate-400 ml-2 font-semibold">
                  {isDoubtSolver ? 'Sarvam AI Doubt Solver is generating code & diagram explanation...' : 'Sarvam AI is generating response...'}
                </span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-end gap-2">
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isDoubtSolver ? 'Type your academic doubt (e.g. "Explain Binary Search Tree")...' : 'Ask Sarvam AI a study question...'}
                rows={1}
                className="w-full bg-transparent border-0 resize-none text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-0 max-h-32 min-h-[38px] px-2 py-1.5 custom-scrollbar"
              />
            </div>
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white rounded-2xl transition-all shadow-md shadow-indigo-600/20 shrink-0 flex items-center justify-center active:scale-95"
              title="Send Message"
            >
              <Send size={17} />
            </button>
          </form>
          <p className="text-[10px] text-slate-500 text-center mt-2 font-medium">
            {isDoubtSolver ? 'Doubt Solver active: Generates intuition, real-world examples, code, & diagrams.' : 'Sarvam AI can make mistakes. Verify important academic information.'}
          </p>
        </div>
      </main>
    </div>
  );
};

export default Chat;
