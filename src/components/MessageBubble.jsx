import React from 'react';

const MessageBubble = ({ message, onAudioTimestampClick, onCloseChatbot }) => {
  const parseTimestamps = (text) => {
    // Regex to match [mm:ss] format (inside square brackets)
    const timestampRegex = /\[(\d{1,2}:\d{2})\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = timestampRegex.exec(text)) !== null) {
      // Add text before timestamp
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          value: text.substring(lastIndex, match.index),
        });
      }

      // Parse timestamp
      const [mins, secs] = match[1].split(':').map(Number);
      const totalSeconds = mins * 60 + secs;

      parts.push({
        type: 'timestamp',
        value: match[1],
        seconds: totalSeconds,
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        value: text.substring(lastIndex),
      });
    }

    return parts;
  };

  const handleTimestampClick = (seconds) => {
    onAudioTimestampClick(seconds);
    if (onCloseChatbot) {
      onCloseChatbot();
    }
  };

  const renderContent = (text) => {
    const parts = parseTimestamps(text);
    const lines = [];
    let currentLine = [];

    parts.forEach((part, idx) => {
      if (part.type === 'text') {
        const textParts = part.value.split('\n');
        textParts.forEach((textPart, textIdx) => {
          if (textIdx > 0) {
            lines.push(currentLine);
            currentLine = [];
          }
          if (textPart) {
            currentLine.push(
              <span key={`text_${idx}_${textIdx}`}>{textPart}</span>
            );
          }
        });
      } else if (part.type === 'timestamp') {
        currentLine.push(
          <button
            key={`ts_${idx}`}
            onClick={() => handleTimestampClick(part.seconds)}
            className="inline-block px-2 py-0.5 mx-0.5 bg-yellow-300 text-gray-800 rounded hover:bg-yellow-400 transition font-semibold text-sm"
          >
            🎙️ {part.value}
          </button>
        );
      }
    });

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    return lines.map((line, idx) => (
      <div key={`line_${idx}`}>{line}</div>
    ));
  };

  const baseClasses =
    'p-3 rounded-lg max-w-sm text-sm shadow-sm mb-3 break-words';

  let containerClasses = baseClasses;
  let contentClasses = '';

  if (message.type === 'bot') {
    containerClasses +=
      ' bg-blue-100 text-gray-800 border border-blue-300 rounded-tl-none';
  } else if (message.type === 'user') {
    containerClasses +=
      ' bg-green-500 text-white rounded-tr-none ml-auto text-right';
  } else if (message.type === 'error') {
    containerClasses +=
      ' bg-red-100 text-red-800 border border-red-300 rounded-tl-none';
  }

  return (
    <div className={containerClasses}>
      {message.type === 'bot' || message.type === 'error'
        ? renderContent(message.text)
        : message.text}
    </div>
  );
};

export default MessageBubble;
