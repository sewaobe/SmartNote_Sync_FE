export default function TranscriptPanel({
    transcripts,
    selectedTranscriptIndex
}) {
    return (
        <>
            <h3 className="text-lg font-bold text-gray-700 mb-3">Transcript</h3>

            {transcripts.length === 0 ? (
                <p className="text-gray-500 text-sm">Chưa có transcript.</p>
            ) : (
                <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="text-xs font-semibold text-gray-600 mb-2">
                        Transcript {selectedTranscriptIndex + 1}
                    </p>
                    <p className="text-sm text-gray-700">
                        {transcripts[selectedTranscriptIndex]?.full_text}
                    </p>
                </div>
            )}
        </>
    );
}
