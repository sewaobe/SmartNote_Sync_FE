import NotesPanel from "./NotePanel";
import TranscriptPanel from "./TranscriptPanel";
import AudioPanel from "./AudioPanel";

export default function RightSidebar({
    rightWidth,
    userRole,
    allNotes,
    setPageNumber,
    setJumpToNote,
    transcripts,
    selectedTranscriptIndex,
    setSelectedTranscriptIndex,
    audioUrl,
    setAudioUrl,
    audioRef,
    audioCurrentTime,
    setAudioCurrentTime,
    audioDuration,
    setAudioDuration,
    setIsResizingRight
}) {
    return (
        <>
            <div
                onMouseDown={() => setIsResizingRight(true)}
                className="w-1 cursor-col-resize bg-gray-300 hover:bg-gray-400"
            ></div>

            <div
                className="bg-white border-l shadow-inner flex flex-col"
                style={{ width: rightWidth }}
            >
                <div className="p-5 overflow-y-auto flex-1">
                    {userRole === "student" && (
                        <NotesPanel
                            allNotes={allNotes}
                            setPageNumber={setPageNumber}
                            setJumpToNote={setJumpToNote}
                        />
                    )}

                    <TranscriptPanel
                        transcripts={transcripts}
                        selectedTranscriptIndex={selectedTranscriptIndex}
                    />
                </div>

                <AudioPanel
                    transcripts={transcripts}
                    selectedTranscriptIndex={selectedTranscriptIndex}
                    setSelectedTranscriptIndex={setSelectedTranscriptIndex}
                    audioUrl={audioUrl}
                    setAudioUrl={setAudioUrl}
                    audioRef={audioRef}
                    audioCurrentTime={audioCurrentTime}
                    setAudioCurrentTime={setAudioCurrentTime}
                    audioDuration={audioDuration}
                    setAudioDuration={setAudioDuration}
                />
            </div>
        </>
    );
}
