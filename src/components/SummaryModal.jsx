import React from 'react';

const SummaryModal = ({ isOpen, onClose, summary, loading }) => {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto animate-fadeIn hide-scrollbar'>
        {/* Header */}
        <div className='sticky top-0 bg-linear-to-r from-blue-600 to-indigo-600 text-white p-8 flex items-center justify-between rounded-t-2xl'>
          <div className='flex items-center gap-3'>
            <div className='text-3xl'>📋</div>
            <div>
              <h2 className='text-2xl font-bold'>Tóm tắt bài học</h2>
              <p className='text-blue-100 text-sm mt-1'>AI-generated summary</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='text-3xl font-bold hover:bg-white hover:bg-opacity-20 rounded-full w-10 h-10 flex items-center justify-center transition'
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className='p-8'>
          {loading ? (
            <div className='flex flex-col justify-center items-center py-16'>
              <div className='text-center'>
                <div className='relative w-16 h-16 mx-auto mb-6'>
                  <div className='absolute inset-0 bg-linear-to-r from-blue-600 to-indigo-600 rounded-full animate-spin'></div>
                  <div className='absolute inset-2 bg-white rounded-full'></div>
                  <div className='absolute inset-2 flex items-center justify-center'>
                    <div className='w-1.5 h-1.5 bg-blue-600 rounded-full'></div>
                  </div>
                </div>
                <h3 className='text-lg font-semibold text-gray-700 mb-2'>
                  Đang tạo tóm tắt...
                </h3>
                <p className='text-gray-500 text-sm'>
                  Vui lòng chờ trong khi AI phân tích bài học
                </p>
              </div>
            </div>
          ) : summary ? (
            <div className='space-y-6'>
              {/* Summary Text */}
              {summary.summary_text && (
                <div className='bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100'>
                  <h3 className='flex items-center gap-2 text-lg font-bold text-gray-800 mb-4'>
                    <span className='inline-block w-1 h-6 bg-blue-600 rounded-full'></span>
                    Nội dung chính
                  </h3>
                  <p className='text-gray-700 leading-relaxed text-base whitespace-pre-wrap'>
                    {summary.summary_text}
                  </p>
                </div>
              )}

              {/* Key Points */}
              {summary.key_points && summary.key_points.length > 0 && (
                <div>
                  <h3 className='flex items-center gap-2 text-lg font-bold text-gray-800 mb-4'>
                    <span className='inline-block w-1 h-6 bg-green-600 rounded-full'></span>
                    Những điểm chính
                  </h3>
                  <div className='grid grid-cols-1 gap-3'>
                    {summary.key_points.map((point, idx) => (
                      <div
                        key={idx}
                        className='flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition'
                      >
                        <div className='shrink-0'>
                          <div className='flex items-center justify-center h-6 w-6 rounded-full bg-green-600 text-white text-sm font-bold'>
                            {idx + 1}
                          </div>
                        </div>
                        <p className='text-gray-700 text-sm leading-relaxed mt-0.5'>
                          {point}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta Info */}
              <div className='bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-center justify-between'>
                <div className='flex gap-6 text-sm'>
                  <div>
                    <p className='text-gray-500 text-xs font-semibold uppercase'>
                      Team
                    </p>
                    <p className='text-gray-700 font-medium'>Tứ Quý</p>
                  </div>
                  <div className='border-l border-gray-300'></div>
                  <div>
                    <p className='text-gray-500 text-xs font-semibold uppercase'>
                      Status
                    </p>
                    <p className='text-green-600 font-medium capitalize flex items-center gap-1'>
                      <span className='w-2 h-2 bg-green-600 rounded-full'></span>
                      {summary.status}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm'
                >
                  Đóng
                </button>
              </div>
            </div>
          ) : (
            <div className='flex flex-col justify-center items-center py-16'>
              <div className='text-6xl mb-4'>📭</div>
              <p className='text-gray-500 text-lg'>Không có tóm tắt</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SummaryModal;
