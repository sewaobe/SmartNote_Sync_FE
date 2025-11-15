import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';

const ChatbotDrawer = ({ isOpen, onClose, lectureId, messages, loading, onSendMessage, onAudioTimestampClick, onSummary, onQuiz, onClearHistory, summaryLoading, quizLoading }) => {
  const inputRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [input, setInput] = React.useState('');

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = () => {
    if (input.trim() && !loading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-white shadow-2xl rounded-l-lg flex flex-col z-50 animate-slideInRight">
      {/* Header */}
      <div className="bg-linear-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between rounded-tl-lg">
        <h2 className="text-lg font-bold">💬 Chat Assistant</h2>
        <button
          onClick={onClose}
          className="text-2xl font-bold hover:bg-white hover:bg-opacity-20 rounded-full w-8 h-8 flex items-center justify-center transition"
        >
          ✕
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-linear-to-b from-blue-50 to-indigo-50">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onAudioTimestampClick={onAudioTimestampClick}
            onCloseChatbot={onClose}
          />
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-blue-100 text-gray-800 p-3 rounded-lg rounded-tl-none">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-4 space-y-3">
        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={onSummary}
            disabled={summaryLoading}
            className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {summaryLoading ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Đang tải...</span>
              </>
            ) : (
              <>
                <span>📋</span>
                <span>Summary</span>
              </>
            )}
          </button>
          <button
            onClick={onQuiz}
            disabled={quizLoading}
            className="text-xs px-3 py-1.5 bg-green-500 text-white rounded-full hover:bg-green-600 transition disabled:bg-green-400 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {quizLoading ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Đang tải...</span>
              </>
            ) : (
              <>
                <span>❓</span>
                <span>Quiz</span>
              </>
            )}
          </button>
          <button
            onClick={onClearHistory}
            className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
          >
            🗑️ Clear
          </button>
        </div>

        {/* Input Field */}
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi điều gì..."
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none overflow-y-auto"
            rows={3}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotDrawer;
