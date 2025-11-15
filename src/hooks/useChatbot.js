import { useState, useCallback, useEffect } from 'react';
import { sendChatMessage, getInitialMessages } from '../api/chatbotAPI';

export const useChatbot = (lectureId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);

  // Load initial messages on mount
  useEffect(() => {
    const loadInitialMessages = async () => {
      try {
        const response = await getInitialMessages();
        if (response.success) {
          setMessages(response.data);
        }
      } catch (error) {
        console.error('Error loading initial messages:', error);
      }
    };

    loadInitialMessages();
  }, []);

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim()) return;

      // Add user message
      const userMessage = {
        id: `msg_${Date.now()}`,
        text,
        timestamp: new Date(),
        type: 'user',
      };

      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      try {
        const response = await sendChatMessage(text, lectureId);

        if (response.success) {
          setMessages((prev) => [...prev, response.data]);
        } else {
          const errorMsg = {
            id: `msg_${Date.now()}`,
            text: response.data?.text || 'Đã xảy ra lỗi. Vui lòng thử lại.',
            timestamp: new Date(),
            type: 'error',
          };
          setMessages((prev) => [...prev, errorMsg]);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        const errorMsg = {
          id: `msg_${Date.now()}`,
          text: `Lỗi: ${error.message}`,
          timestamp: new Date(),
          type: 'error',
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setLoading(false);
      }
    },
    [lectureId],
  );

  return {
    messages,
    loading,
    sendMessage,
    summaryOpen,
    setSummaryOpen,
    quizOpen,
    setQuizOpen,
  };
};
