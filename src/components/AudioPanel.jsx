export default function AudioPanel({
    transcripts,
    selectedTranscriptIndex,
    setSelectedTranscriptIndex,
    audioUrl,
    setAudioUrl,
    audioRef,
    audioCurrentTime,
    audioDuration,
    setAudioCurrentTime,
    setAudioDuration
}) {
    return (
        <div className="p-4 border-t bg-white sticky bottom-0 shadow-lg">
            <h3 className="text-lg font-bold text-gray-700 mb-2">Audio</h3>

            {transcripts.length === 0 ? (
                <p className="text-gray-500 text-sm">Chưa có audio.</p>
            ) : (
                <div className="space-y-2">
                    {transcripts.map((item, index) => (
                        <button
                            key={item._id || index}
                            onClick={() => {
                                setSelectedTranscriptIndex(index);
                                if (item?.audio_url) setAudioUrl(item.audio_url);
                            }}
                            className={`w-full p-3 rounded-lg border ${selectedTranscriptIndex === index
                                    ? "bg-blue-100 border-blue-400"
                                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                                }`}
                        >
                            <p className="text-sm font-semibold text-gray-700">
                                Audio {index + 1}
                            </p>
                            <p className="text-xs text-gray-600 truncate">{item.full_text}</p>
                        </button>
                    ))}

                    {audioUrl && (
                        <div className="bg-gray-50 p-3 rounded-lg space-y-2 mt-3">
                            <audio
                                ref={audioRef}
                                src={audioUrl}
                                onTimeUpdate={() => {
                                    setAudioCurrentTime(audioRef.current.currentTime);
                                }}
                                onLoadedMetadata={() =>
                                    setAudioDuration(audioRef.current.duration)
                                }
                                className="w-full"
                                controls
                            />
                            <div className="flex justify-between text-xs text-gray-600">
                                <div>{Math.floor(audioCurrentTime)}s</div>
                                <div>{Math.floor(audioDuration)}s</div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
