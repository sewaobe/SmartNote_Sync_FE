import React from "react";
import InteractivePdfPage from "./InteractivePdfPage";

export default function PdfViewer({
    pdf,
    pageNumber,
    allNotes,
    setAllNotes,
    jumpToNote,
    initialNotes,
    onNoteCreate,
    onNoteUpdate,
    onNoteDelete,
    assignMap,
    onPlayAudio
}) {
    return (
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
            <div className="flex justify-center">
                {pdf ? (
                    <InteractivePdfPage
                        pdf={pdf}
                        pageNumber={pageNumber}
                        onPlayAudio={onPlayAudio}
                        onNotesChange={setAllNotes}
                        jumpToNote={jumpToNote}
                        initialNotes={initialNotes}
                        onNoteCreate={onNoteCreate}
                        onNoteUpdate={onNoteUpdate}
                        onNoteDelete={onNoteDelete}
                        assignMap={assignMap}
                    />
                ) : (
                    <p className="text-gray-500">Loading PDF...</p>
                )}
            </div>
        </div>
    );
}
