import React from 'react';
import { useChatbotContext } from './ChatbotProvider';

const ChatbotTrigger = () => {
  const { summaryOpen, setSummaryOpen } = useChatbotContext();

  return (
    <button
      onClick={() => setSummaryOpen(!summaryOpen)}
      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
    >
      💬 Chat
    </button>
  );
};

export default ChatbotTrigger;
