import React, { useEffect, useRef } from "react";

export default function NotePopup({
    note,
    parentRef,        // wrapperRef từ PDF page
    onClose,
    onSave,
    onDelete,
    onPlayAudio,
}) {
    const popupRef = useRef(null);

    useEffect(() => {
        // Click ra ngoài để đóng popup
        const handleClickOutside = (e) => {
            if (popupRef.current && !popupRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div
            ref={popupRef}
            className="absolute z-30 bg-white shadow-xl p-3 rounded-lg border w-64"
            style={{
                left: `${note.x * 100}%`,
                top: `${note.y * 100}%`,
                transform: "translate(10px, -10px)", // popup lệch sang phải 1 chút
            }}
        >
            <textarea
                className="w-full border rounded-lg p-2 text-sm mb-2"
                rows={3}
                value={note.content}
                onChange={(e) => onSave({ ...note, content: e.target.value })}
            />

            <div className="flex justify-between items-center">
                <button
                    onClick={() => onDelete(note.id)}
                    className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                >
                    Xóa
                </button>

                <div className="flex gap-2">
                    <button
                        onClick={() => onPlayAudio(note)}
                        className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        ▶
                    </button>
                    <button
                        onClick={onClose}
                        className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
