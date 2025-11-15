import React, { useEffect, useRef, useState } from "react";
import NotePin from "./NotePin";
import NotePopup from "./NotePopup";

export default function InteractivePdfPage({
    pdf,
    pageNumber,
    onPlayAudio,
    onNotesChange,
    jumpToNote,
    initialNotes = [],
    onNoteCreate,
    onNoteUpdate,
    onNoteDelete,
    assignMap = {},
}) {
    const canvasRef = useRef(null);
    const wrapperRef = useRef(null);

    const [viewport, setViewport] = useState(null);
    const [notes, setNotes] = useState([]);
    const [activeId, setActiveId] = useState(null);

    // drag state
    const draggingIdRef = useRef(null);
    const hasDraggedRef = useRef(false);

    // Render PDF
    useEffect(() => {
        if (!pdf) return;

        const renderPage = async () => {
            const page = await pdf.getPage(pageNumber);
            const vp = page.getViewport({ scale: 1 });

            const MAX_WIDTH = 900;
            const scale = MAX_WIDTH / vp.width;

            const scaled = page.getViewport({ scale });

            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");

            canvas.width = scaled.width;
            canvas.height = scaled.height;

            setViewport({ w: scaled.width, h: scaled.height });

            await page.render({
                canvasContext: ctx,
                viewport: scaled,
            }).promise;
        };

        renderPage();
    }, [pdf, pageNumber]);

    // Load initial notes from parent/backend when viewport is ready
    useEffect(() => {
        if (!viewport || !initialNotes || initialNotes.length === 0) return;
        // only initialize if there are no existing notes (don't overwrite user's edits)
        if (notes.length > 0) return;

        const mapped = initialNotes.map((n) => {
            // backend may store position in pixels or normalized (0..1)
            const pos = n.position || n.coords || { x: 0, y: 0 };
            const x = pos.x > 1 ? pos.x / viewport.w : pos.x;
            const y = pos.y > 1 ? pos.y / viewport.h : pos.y;

            // id normalization: accept Mongo _id or string id
            const id = (n._id && (n._id.$oid || n._id)) || n.id || Date.now();

            return {
                id,
                page: n.page || n.lecture_page || 1,
                x: Math.min(Math.max(x, 0), 1),
                y: Math.min(Math.max(y, 0), 1),
                content: n.content || n.text || "",
                audioTime: n.audioTime ?? null,
                created_at: n.created_at || n.createdAt || n.created || null,
                transcript_id: n.transcript_id || n.transcriptId || null,
            };
        });

        setNotes(mapped);
        onNotesChange && onNotesChange(mapped);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewport, initialNotes]);

    // Gửi notes lên Lecture mỗi khi thay đổi
    useEffect(() => {
        onNotesChange && onNotesChange(notes);
    }, [notes, onNotesChange]);

    // Apply server id mappings coming from parent (assignMap)
    const appliedMapRef = useRef({});
    useEffect(() => {
        if (!assignMap || Object.keys(assignMap).length === 0) return;

        let changed = false;
        const newNotes = notes.map((n) => {
            const localId = n.id;
            const mappedId = assignMap[localId];
            if (mappedId && !appliedMapRef.current[localId]) {
                appliedMapRef.current[localId] = true;
                changed = true;
                return { ...n, id: mappedId };
            }
            return n;
        });

        if (changed) {
            setNotes(newNotes);
            onNotesChange && onNotesChange(newNotes);
        }
        // we intentionally do not clear assignMap here; parent owns it
    }, [assignMap]);

    // Tạo note mới khi click lên slide (chỉ khi không drag)
    const handleCreateNote = (e) => {
        // nếu đang drag thì bỏ qua
        if (draggingIdRef.current) return;
        if (!wrapperRef.current) return;

        const rect = wrapperRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        const id = Date.now();

        const newNote = {
            id,
            page: pageNumber,
            x,
            y,
            content: "",
            audioTime: null,
            created_at: new Date().toISOString(),
            transcript_id: localStorage.getItem("transcriptId") || null,
        };

        const posPx = {
            x: Math.round(e.clientX - rect.left),
            y: Math.round(e.clientY - rect.top),
        };

        setNotes((prev) => [...prev, newNote]);
        setActiveId(id);

        // notify parent about creation (pass local note and pixel position)
        onNoteCreate && onNoteCreate(newNote, posPx);
    };

    // Cập nhật note
    const updateNote = (note) => {
        setNotes((prev) => prev.map((n) => (n.id === note.id ? note : n)));
        onNoteUpdate && onNoteUpdate(note);
    };

    // Xóa note
    const deleteNote = (id) => {
        setNotes((prev) => prev.filter((n) => n.id !== id));
        setActiveId(null);
        onNoteDelete && onNoteDelete(id);
    };

    // Bắt đầu drag pin
    const startDrag = (noteId, mouseDownEvent) => {
        mouseDownEvent.stopPropagation(); // không tạo note mới
        draggingIdRef.current = noteId;
        hasDraggedRef.current = false;
    };

    // Global mousemove + mouseup để kéo pin
    useEffect(() => {
        const onMove = (e) => {
            const id = draggingIdRef.current;
            if (!id || !wrapperRef.current) return;

            hasDraggedRef.current = true;

            const rect = wrapperRef.current.getBoundingClientRect();
            let x = (e.clientX - rect.left) / rect.width;
            let y = (e.clientY - rect.top) / rect.height;

            // clamp 0–1
            x = Math.min(Math.max(x, 0), 1);
            y = Math.min(Math.max(y, 0), 1);

            setNotes((prev) =>
                prev.map((n) =>
                    n.id === id
                        ? {
                            ...n,
                            x,
                            y,
                        }
                        : n
                )
            );
        };

        const onUp = () => {
            const id = draggingIdRef.current;
            if (!id) return;

            // nếu không kéo (chỉ nhấp) -> xem như click pin -> mở popup
            if (!hasDraggedRef.current) {
                setActiveId(id);
            }

            draggingIdRef.current = null;
            hasDraggedRef.current = false;
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);

        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
    }, []);

    // Scroll từ sidebar tới note
    useEffect(() => {
        if (!jumpToNote || jumpToNote.page !== pageNumber) return;
        if (!wrapperRef.current) return;

        const container = wrapperRef.current.parentElement; // div scroll ở giữa
        if (!container) return;

        const targetY = jumpToNote.y * container.scrollHeight - 200;

        container.scrollTo({
            top: targetY,
            behavior: "smooth",
        });

        setActiveId(jumpToNote.id);
    }, [jumpToNote, pageNumber]);

    const activeNote = notes.find((n) => n.id === activeId);

    return (
        <div className="relative inline-block" ref={wrapperRef}>
            {/* PDF */}
            <canvas ref={canvasRef} className="rounded-xl shadow bg-white" />

            {/* Overlay cho click tạo note + pin */}
            <div
                className="absolute inset-0 z-10"
                onDoubleClick={handleCreateNote}
                style={{ cursor: "crosshair" }}
            >
                {notes
                    .filter((n) => n.page === pageNumber)
                    .map((note) => (
                        <NotePin
                            key={note.id}
                            x={note.x}
                            y={note.y}
                            isActive={note.id === activeId}
                            onMouseDown={(e) => startDrag(note.id, e)}
                        />
                    ))}
            </div>

            {/* Popup gắn tại note, không che hết màn hình */}
            {activeNote && (
                <NotePopup
                    note={activeNote}
                    onClose={() => setActiveId(null)}
                    onSave={updateNote}
                    onDelete={deleteNote}
                    onPlayAudio={() => onPlayAudio && onPlayAudio(activeNote)}
                />
            )}
        </div>
    );
}
