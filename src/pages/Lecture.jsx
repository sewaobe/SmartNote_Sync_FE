import React, { useEffect, useState } from "react";
import pdfjsLib from "../pdf-worker";
import PdfThumbnail from "../components/PdfThumbnail";
import PdfContinuousViewer from "../components/PdfContinuousViewer";
import InteractivePdfPage from "../components/InteractivePdfPage";

export default function Lecture() {
    const [pdf, setPdf] = useState(null);
    const [pageCount, setPageCount] = useState(0);
    const [pageNumber, setPageNumber] = useState(1);

    // -----------------------------
    // Sidebar resize / toggle states
    // -----------------------------
    const [leftWidth, setLeftWidth] = useState(220);
    const [rightWidth, setRightWidth] = useState(300);

    const [prevLeftWidth, setPrevLeftWidth] = useState(220);
    const [prevRightWidth, setPrevRightWidth] = useState(300);

    const [leftOpen, setLeftOpen] = useState(true);
    const [rightOpen, setRightOpen] = useState(true);

    const [isResizingLeft, setIsResizingLeft] = useState(false);
    const [isResizingRight, setIsResizingRight] = useState(false);

    // -----------------------------
    // Global mouse events (resize)
    // -----------------------------
    useEffect(() => {
        const handleMove = (e) => {
            if (isResizingLeft) {
                const newWidth = Math.min(Math.max(e.clientX, 140), 400);
                setLeftWidth(newWidth);
            }
            if (isResizingRight) {
                const newWidth = Math.min(
                    Math.max(window.innerWidth - e.clientX, 200),
                    500
                );
                setRightWidth(newWidth);
            }
        };

        const stopResize = () => {
            setIsResizingLeft(false);
            setIsResizingRight(false);
        };

        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", stopResize);

        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", stopResize);
        };
    }, [isResizingLeft, isResizingRight]);

    // -----------------------------
    // Load PDF from localStorage
    // -----------------------------
    useEffect(() => {
        const base64 = localStorage.getItem("uploadedSlide");
        if (!base64) return;

        loadPdf(base64);
    }, []);

    const loadPdf = async (base64) => {
        const raw = atob(base64.split(",")[1]);
        const pdfDoc = await pdfjsLib.getDocument({ data: raw }).promise;

        setPdf(pdfDoc);
        setPageCount(pdfDoc.numPages);
    };

    // -----------------------------
    // Toggle Left Sidebar
    // -----------------------------
    const toggleLeft = () => {
        if (leftOpen) {
            setPrevLeftWidth(leftWidth);
            setLeftWidth(0);
        } else {
            setLeftWidth(prevLeftWidth);
        }
        setLeftOpen(!leftOpen);
    };

    // -----------------------------
    // Toggle Right Sidebar
    // -----------------------------
    const toggleRight = () => {
        if (rightOpen) {
            setPrevRightWidth(rightWidth);
            setRightWidth(0);
        } else {
            setRightWidth(prevRightWidth);
        }
        setRightOpen(!rightOpen);
    };

    const handlePlayAudioForNote = (note) => {
        console.log("Phát lại timestamp:", note.audioTime);
        // TODO: Kết nối audio recorder player
    };

    const [allNotes, setAllNotes] = useState([]);
    const [jumpToNote, setJumpToNote] = useState(null);



    return (
        <div className="w-full h-screen flex flex-col bg-gray-100">

            {/* HEADER */}
            <div className="h-14 bg-white shadow-md px-6 flex items-center justify-between">

                <h1 className="text-xl font-semibold text-gray-700">Lecture View</h1>

                <div className="flex items-center gap-3">

                    {/* Toggle Left */}
                    <button
                        onClick={toggleLeft}
                        className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
                    >
                        {leftOpen ? "Hide Slides" : "Show Slides"}
                    </button>

                    {/* Toggle Right */}
                    <button
                        onClick={toggleRight}
                        className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
                    >
                        {rightOpen ? "Hide Notes" : "Show Notes"}
                    </button>

                    <button
                        onClick={() => (window.location.href = "/")}
                        className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm"
                    >
                        Back Home
                    </button>
                </div>

            </div>

            {/* CONTENT */}
            <div className="flex flex-1 overflow-hidden">

                {/* LEFT SIDEBAR */}
                {leftOpen && (
                    <div
                        className="bg-white border-r shadow-sm overflow-y-auto p-3 space-y-4"
                        style={{ width: leftWidth }}
                    >
                        <h3 className="text-sm font-semibold text-gray-700">
                            Slides ({pageCount})
                        </h3>

                        {pdf &&
                            Array.from({ length: pageCount }, (_, i) => (
                                <PdfThumbnail
                                    key={i}
                                    pdf={pdf}
                                    pageNumber={i + 1}
                                    sidebarWidth={leftWidth}
                                    isActive={pageNumber === i + 1}
                                    onClick={() => setPageNumber(i + 1)}
                                />
                            ))}
                    </div>
                )}

                {/* LEFT RESIZER */}
                {leftOpen && (
                    <div
                        onMouseDown={() => setIsResizingLeft(true)}
                        className="w-1 cursor-col-resize bg-gray-300 hover:bg-gray-400"
                    ></div>
                )}

                {/* MAIN VIEWER AREA */}
                <div className="flex-1 overflow-auto p-6 bg-gray-50">
                    <div className="flex justify-center">
                        {pdf ? (
                            <InteractivePdfPage
                                pdf={pdf}
                                pageNumber={pageNumber}
                                onPlayAudio={handlePlayAudioForNote}
                                onNotesChange={(notes) => {
                                    setAllNotes(notes);
                                }}
                                jumpToNote={jumpToNote}
                            />


                        ) : (
                            <p className="text-gray-500">Loading PDF...</p>
                        )}
                    </div>
                </div>

                {/* RIGHT RESIZER */}
                {rightOpen && (
                    <div
                        onMouseDown={() => setIsResizingRight(true)}
                        className="w-1 cursor-col-resize bg-gray-300 hover:bg-gray-400"
                    ></div>
                )}

                {/* RIGHT SIDEBAR */}
                {rightOpen && (
                    <div
                        className="bg-white border-l shadow-inner p-5 overflow-y-auto"
                        style={{ width: rightWidth }}
                    >
                        <h2 className="text-lg font-bold text-gray-700 mb-4">Notes</h2>

                        {allNotes.length === 0 && (
                            <p className="text-gray-500 text-sm">Chưa có ghi chú nào.</p>
                        )}

                        <div className="space-y-3">
                            {allNotes.map((note) => (
                                <button
                                    key={note.id}
                                    className="w-full text-left p-3 bg-gray-50 border rounded-lg shadow-sm hover:bg-gray-100 transition"
                                    onClick={() => {
                                        setPageNumber(note.page);
                                        setTimeout(() => {
                                            setJumpToNote(note);
                                        }, 50);
                                    }}
                                >
                                    <p className="font-medium">Trang {note.page}</p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {note.content || "(Chưa có nội dung)"}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
