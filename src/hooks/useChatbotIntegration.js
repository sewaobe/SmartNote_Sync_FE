import { useCallback } from 'react';

export const useChatbotIntegration = (audioRef) => {
  const handleAudioTimestampClick = useCallback(
    (seconds) => {
      if (audioRef?.current) {
        audioRef.current.currentTime = seconds;
        if (audioRef.current.paused) {
          audioRef.current.play();
        }
        console.log(`Audio jumped to ${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`);
        
        // Scroll to audio player
        setTimeout(() => {
          audioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    },
    [audioRef],
  );

  return { handleAudioTimestampClick };
};
