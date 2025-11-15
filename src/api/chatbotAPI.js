import axios from 'axios';

const mockResponses = [
  {
    id: 'resp1',
    text: 'Xin chào! Tôi là ChatBot hỗ trợ học tập. Bạn cần giúp gì về bài học này? 🎙️ **0:10**',
    timestamp: new Date(),
    audioTimestamp: 10,
    type: 'bot',
  },
  {
    id: 'resp2',
    text: 'Tôi có thể giúp bạn:\n• Tóm tắt bài học\n• Giải thích khái niệm\n• Trả lời câu hỏi\n• Đề xuất câu hỏi ôn tập\n\nHãy bắt đầu tại 🎙️ **0:10**',
    timestamp: new Date(),
    audioTimestamp: 10,
    type: 'bot',
  },
  {
    id: 'resp3',
    text: 'Bài học hôm nay nói về Node.js - một runtime JavaScript rất mạnh mẽ. Bạn muốn hiểu rõ điểm nào? Đoạn này được giải thích tại 🎙️ **0:10**',
    timestamp: new Date(),
    audioTimestamp: 10,
    type: 'bot',
  },
];

const quizQuestions = [
  'Node.js là gì và nó khác với JavaScript ở trình duyệt như thế nào?',
  'Event-driven architecture trong Node.js có ưu điểm gì?',
  'NPM là gì và tại sao nó quan trọng?',
  'Middleware trong Express.js được sử dụng như thế nào?',
  'Làm thế nào để xử lý lỗi trong Node.js?',
];

// Simulate API delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to format seconds to mm:ss
const formatTimeFromSeconds = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Simulate chatbot response with typing effect and timestamps
export const sendChatMessage = async (message, lectureId) => {
  try {
    // Call real backend API
    const response = await axios.post(
      'http://10.62.249.134:5678/webhook-test/0be91f5b-a868-4a6b-a8a5-e51f5ca6e1a5',
      {
        lectureId: lectureId,
        question: message,
      },
      {
        timeout: 10000,
      },
    );
    console.log('Chatbot API response:', response);
    const responseData = response.data;

    // Handle both array and direct object responses
    const output = Array.isArray(responseData) 
      ? responseData[0]?.output 
      : responseData.output;

    if (!output || !output.answer) {
      throw new Error('Invalid response format from server');
    }

    // Check if references exist and have content
    const references = output.references && output.references.length > 0
      ? output.references
      : [];

    // Build message text with clickable timestamps
    let messageText = output.answer;
    const timestamps = [];

    // Extract timestamps from references
    if (references.length > 0) {
      references.forEach((ref, idx) => {
        // Convert milliseconds to seconds
        const startSeconds = ref.start / 1000;
        const timeLabel = formatTimeFromSeconds(startSeconds);
        
        // Add timestamp link to message
        messageText += `\n\n📍 Tham khảo: "${ref.text}"\n🎙️ [${timeLabel}]`;
        
        timestamps.push({
          text: ref.text,
          startTime: startSeconds,
          endTime: ref.end / 1000,
          label: timeLabel,
        });
      });
    }

    return {
      success: true,
      data: {
        id: `msg_${Date.now()}`,
        text: messageText,
        audioTimestamp: references.length > 0 ? references[0].start / 1000 : null,
        timestamp: new Date(),
        type: 'bot',
        references: timestamps,
      },
    };
  } catch (error) {
    console.error('Error calling chatbot API:', error);

    return {
      success: false,
      error: error.message,
      data: {
        id: `msg_${Date.now()}`,
        text: `Xin lỗi, đã xảy ra lỗi khi kết nối với server: ${error.message}. Vui lòng thử lại.`,
        timestamp: new Date(),
        type: 'error',
      },
    };
  }
};

// Get initial greeting messages
export const getInitialMessages = async () => {
  await delay(500);

  return {
    success: true,
    data: mockResponses,
  };
};

// Get summary of lecture
export const getSummary = async (lectureId, transcript_id) => {
  try {
    // Get auth token from localStorage
    const token = localStorage.getItem('authToken');

    // Call real API
    const response = await axios.post(
      'http://localhost:5000/api/summaries/generate',
      {
        lecture_id: lectureId,
        transcript_id: transcript_id,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000,
      },
    );

    console.log('Summary API response:', response.data);

    // Handle both nested (response.data.data) and direct (response.data) structures
    const data = response.data.data || response.data;

    return {
      success: true,
      data: {
        id: data._id || `summary_${lectureId}`,
        title: 'Tóm tắt bài học',
        summary_text: data.summary_text || '',
        key_points: data.key_points || [],
        model_used: data.model_used || 'gemini-2.5-flash',
        status: data.status || 'completed',
        generated_at: data.updated_at || new Date(),
      },
    };
  } catch (err) {
    console.error('Error API Get summary', err);

    return {
      success: false,
      error: err.message,
      data: {
        id: `summary_${lectureId}`,
        title: 'Lỗi tải tóm tắt',
        summary_text: `Đã xảy ra lỗi: ${err.message}`,
        key_points: [],
        status: 'error',
      },
    };
  }
};

// Get quiz questions
export const getQuizQuestions = async (lectureId) => {
  await delay(800);

  const selectedQuestions = quizQuestions
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);

  return {
    success: true,
    data: {
      id: `quiz_${lectureId}`,
      title: 'Câu hỏi ôn tập',
      questions: selectedQuestions.map((q, idx) => ({
        id: `q_${idx}`,
        text: q,
        order: idx + 1,
      })),
      total: selectedQuestions.length,
    },
  };
};

// Clear chat history (local only)
export const clearChatHistory = async () => {
  await delay(300);
  return { success: true, message: 'Chat history cleared' };
};

// Export all functions as default
export default {
  sendChatMessage,
  getInitialMessages,
  getSummary,
  getQuizQuestions,
  clearChatHistory,
};
