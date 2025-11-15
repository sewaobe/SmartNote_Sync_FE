import React from 'react';

const QuizModal = ({ isOpen, onClose, quiz, loading }) => {
  const [currentQuestion, setCurrentQuestion] = React.useState(0);
  const [answers, setAnswers] = React.useState({});

  React.useEffect(() => {
    if (isOpen) {
      setCurrentQuestion(0);
      setAnswers({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const questions = quiz?.questions || [];
  const question = questions[currentQuestion];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="bg-linear-to-r from-green-600 to-emerald-600 text-white p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">❓ Câu hỏi ôn tập</h2>
          <button
            onClick={onClose}
            className="text-3xl font-bold hover:bg-white hover:bg-opacity-20 rounded-full w-10 h-10 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Đang tạo câu hỏi...</p>
              </div>
            </div>
          ) : questions.length > 0 ? (
            <>
              {/* Question Counter */}
              <div className="text-sm text-gray-500 mb-4">
                Câu {currentQuestion + 1} / {questions.length}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                  }}
                ></div>
              </div>

              {/* Question */}
              {question && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    {question.text}
                  </h3>

                  {/* Answer Input */}
                  <textarea
                    value={answers[question.id] || ''}
                    onChange={(e) =>
                      setAnswers({
                        ...answers,
                        [question.id]: e.target.value,
                      })
                    }
                    placeholder="Nhập câu trả lời của bạn..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 resize-none h-20"
                  />
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between gap-3 mt-6">
                <button
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Trước
                </button>

                {currentQuestion === questions.length - 1 ? (
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    ✓ Hoàn thành
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Tiếp theo →
                  </button>
                )}
              </div>
            </>
          ) : (
            <p className="text-gray-500">Không có câu hỏi</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizModal;
