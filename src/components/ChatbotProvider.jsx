import React, { createContext, useContext, useState } from 'react';
import { useChatbot } from '../hooks/useChatbot';
import { getSummary, getQuizQuestions, clearChatHistory } from '../api/chatbotAPI';

const ChatbotContext = createContext();

export const ChatbotProvider = ({ children, lectureId, transcript_id}) => {
  const chatbot = useChatbot(lectureId);
  const [isChatbotOpen, setIsChatbotOpen] = useState(true);
  const [summary, setSummary] = React.useState(null);
  const [quiz, setQuiz] = React.useState(null);
  const [summaryLoading, setSummaryLoading] = React.useState(false);
  const [quizLoading, setQuizLoading] = React.useState(false);

  const handleGetSummary = async () => {
    setSummaryLoading(true);
    try {
      const response = await getSummary(lectureId, transcript_id);
      if (response.success) {
        setSummary(response.data);
      }
      chatbot.setSummaryOpen(true);
    } catch (error) {
      console.error('Error getting summary:', error);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleGetQuiz = async () => {
    setQuizLoading(true);
    try {
      const response = await getQuizQuestions(lectureId);
      if (response.success) {
        setQuiz(response.data);
      }
      chatbot.setQuizOpen(true);
    } catch (error) {
      console.error('Error getting quiz:', error);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearChatHistory();
      chatbot.setMessages([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const value = {
    ...chatbot,
    isChatbotOpen,
    setIsChatbotOpen,
    summary,
    quiz,
    summaryLoading,
    quizLoading,
    handleGetSummary,
    handleGetQuiz,
    handleClearHistory,
  };

  return (
    <ChatbotContext.Provider value={value}>
      {children}
    </ChatbotContext.Provider>
  );
};

export const useChatbotContext = () => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbotContext must be used within ChatbotProvider');
  }
  return context;
};
