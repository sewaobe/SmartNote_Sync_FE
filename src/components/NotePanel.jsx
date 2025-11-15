export default function NotesPanel({ allNotes, setPageNumber, setJumpToNote }) {
    return (
        <>
            <h2 className="text-lg font-bold text-gray-700 mb-4">Notes</h2>

            {allNotes.length === 0 && (
                <p className="text-gray-500 text-sm">Chưa có ghi chú nào.</p>
            )}

            <div className="space-y-3 mb-6">
                {allNotes.map((note) => (
                    <button
                        key={note.id}
                        className="w-full text-left p-3 bg-gray-50 border rounded-lg shadow-sm hover:bg-gray-100"
                        onClick={() => {
                            setPageNumber(note.page);
                            setTimeout(() => setJumpToNote(note), 50);
                        }}
                    >
                        <p className="font-medium">Trang {note.page}</p>
                        <p className="text-xs text-gray-500 truncate">
                            {note.content || "(Chưa có nội dung)"}
                        </p>
                    </button>
                ))}
            </div>
        </>
    );
}
