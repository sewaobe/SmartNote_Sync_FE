import React, { useEffect, useState } from "react";
import pdfjsLib from "../pdf-worker";
import PdfThumbnail from "../components/PdfThumbnail";
import PdfContinuousViewer from "../components/PdfContinuousViewer";
import InteractivePdfPage from "../components/InteractivePdfPage";
import api from "../api/axiosClient";
import { toast } from "sonner";

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
        const loadPdfData = async () => {
            const pdfUrl = localStorage.getItem("lecturePdfUrl");

            if (!pdfUrl) {
                toast.error("Không tìm thấy PDF URL");
                return;
            }

            try {
                // 1. Lấy presigned URL
                const res = await api.get(`/files/presigned/${pdfUrl}`);
                const presignedUrl = res.url;

                if (!presignedUrl) throw new Error("Missing presigned URL");

                console.log("Presigned:", presignedUrl);

                // 2. Fetch PDF as blob từ presigned URL
                const loadingTask = pdfjsLib.getDocument({
                    url: presignedUrl,
                    withCredentials: false,
                });
                const pdfDoc = await loadingTask.promise;
                setPdf(pdfDoc);
                setPageCount(pdfDoc.numPages);

                console.log("PDF loaded successfully, pages:", pdfDoc.numPages);
            } catch (err) {
                console.error("Load PDF error:", err);
                toast.error("Không thể load PDF: " + err.message);
            }
        };

        loadPdfData();
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

    const toggleRecording = async () => {
        if (isRecording) {
            // Stop recording
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
            // Start recording
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                recordedChunksRef.current = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        recordedChunksRef.current.push(event.data);
                    }
                };

                mediaRecorder.onstop = () => {
                    const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
                    setRecordedBlob(blob);
                    stream.getTracks().forEach((track) => track.stop());
                    toast.success("Ghi âm hoàn tất");
                };

                mediaRecorder.start();
                mediaRecorderRef.current = mediaRecorder;
                setIsRecording(true);
                toast.success("Bắt đầu ghi âm");
            } catch (err) {
                console.error("Microphone access denied:", err);
                toast.error("Không thể truy cập microphone");
            }
        }
    }; const [allNotes, setAllNotes] = useState([]);
    const [jumpToNote, setJumpToNote] = useState(null);

    // Audio and Transcript states
    const [audioUrl, setAudioUrl] = useState(null);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [audioCurrentTime, setAudioCurrentTime] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);
    const [transcripts, setTranscripts] = useState([]); // array of transcripts
    const [selectedTranscriptIndex, setSelectedTranscriptIndex] = useState(0); // track which transcript is selected
    const [pdfPresignedUrl, setPdfPresignedUrl] = useState(null); // store presigned PDF URL
    const audioRef = React.useRef(null);

    // Recording states
    const [isRecording, setIsRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const mediaRecorderRef = React.useRef(null);
    const recordedChunksRef = React.useRef([]);

    // User role state
    const [userRole, setUserRole] = useState(null);

    // Load user role from localStorage
    useEffect(() => {
        const role = localStorage.getItem("userRole");
        setUserRole(role);
    }, []);

    // Fetch transcription / audio for current lecture
    useEffect(() => {
        const fetchTranscription = async () => {
            // read lectureId from localStorage but guard against string 'undefined'/'null'
            const stored = localStorage.getItem("lectureId");
            const lectureId =
                stored && stored !== "undefined" && stored !== "null"
                    ? stored
                    : "69182ad0faf294fc3f48c783";

            try {
                const res = await api.get(`/transcription/lecture/${lectureId}`);
                console.log(res);
                // server returns { message, data: [ ... ], count }
                const items = res?.data ?? res;

                if (!items || items.length === 0) {
                    // no transcription available
                    return;
                }

                // set all transcripts for display
                setTranscripts(items);
                setSelectedTranscriptIndex(0); // default to first

                // pick the first item for audio_url
                const first = items[0];
                if (first?.audio_url) setAudioUrl(first.audio_url);
            } catch (err) {
                console.error("Failed to fetch transcription", err);
                const message =
                    err?.response?.data?.message ||
                    err.message ||
                    "Lỗi khi lấy transcription";
                toast.error(`Không thể lấy audio/transcript: ${message}`);
            }
        };

        fetchTranscription();
    }, []);

    return (
        <div className="w-full h-screen flex flex-col bg-gray-50">

            {/* HEADER */}
            <div className="h-14 bg-white border-b shadow-sm px-6 flex items-center justify-between sticky top-0 z-20">
                <h1 className="text-xl font-semibold text-gray-800 tracking-tight">
                    📚 Lecture View
                </h1>

                <div className="flex items-center gap-2">

                    {/* RECORDING BUTTON */}
                    {userRole === "teacher" && (
                        <button
                            onClick={toggleRecording}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition flex items-center gap-1
                            ${isRecording
                                    ? "bg-red-500 hover:bg-red-600 text-white shadow"
                                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                                }`}
                        >
                            {isRecording ? "⏹ Dừng ghi" : "🎤 Ghi âm"}
                        </button>
                    )}

                    {/* LEFT SIDEBAR TOGGLE */}
                    <button
                        onClick={toggleLeft}
                        className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm flex items-center gap-1"
                    >
                        {leftOpen ? "📑 Hide Slides" : "📑 Show Slides"}
                    </button>

                    {/* RIGHT SIDEBAR TOGGLE (STUDENT ONLY) */}
                    {userRole === "student" && (
                        <button
                            onClick={toggleRight}
                            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm flex items-center gap-1"
                        >
                            {rightOpen ? "📝 Hide Notes" : "📝 Show Notes"}
                        </button>
                    )}

                    <button
                        onClick={() => (window.location.href = "/")}
                        className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm"
                    >
                        ⬅ Home
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex flex-1 overflow-hidden">

                {/* LEFT SIDEBAR */}
                {leftOpen && (
                    <div
                        className="bg-white border-r shadow-inner overflow-y-auto p-4 space-y-4"
                        style={{ width: leftWidth }}
                    >
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Slides ({pageCount})
                        </h3>

                        {pdf &&
                            Array.from({ length: pageCount }, (_, i) => (
                                <div
                                    key={i}
                                    className={`rounded-lg overflow-hidden border cursor-pointer transition
                                ${pageNumber === i + 1
                                            ? "shadow-md border-blue-400"
                                            : "border-gray-300 hover:border-gray-400"
                                        }`}
                                    onClick={() => setPageNumber(i + 1)}
                                >
                                    <PdfThumbnail
                                        pdf={pdf}
                                        pageNumber={i + 1}
                                        sidebarWidth={leftWidth - 32}
                                        isActive={pageNumber === i + 1}
                                    />
                                </div>
                            ))}
                    </div>
                )}

                {/* LEFT RESIZER */}
                {leftOpen && (
                    <div
                        onMouseDown={() => setIsResizingLeft(true)}
                        className="w-1 cursor-col-resize bg-gray-300 hover:bg-gray-400 transition"
                    ></div>
                )}

                {/* MAIN PDF VIEWER */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="max-w-5xl mx-auto flex justify-center">
                        {pdf ? (
                            <div className="rounded-xl shadow-md bg-white p-4 border">
                                <InteractivePdfPage
                                    pdf={pdf}
                                    pageNumber={pageNumber}
                                    onPlayAudio={handlePlayAudioForNote}
                                    onNotesChange={setAllNotes}
                                    jumpToNote={jumpToNote}
                                />
                            </div>
                        ) : (
                            <div className="text-gray-500 pt-24 animate-pulse text-lg">
                                Đang tải PDF...
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT RESIZER */}
                {userRole === "student" && rightOpen && (
                    <div
                        onMouseDown={() => setIsResizingRight(true)}
                        className="w-1 cursor-col-resize bg-gray-300 hover:bg-gray-400"
                    ></div>
                )}

                {/* RIGHT SIDEBAR */}
                {userRole === "student" && rightOpen && (
                    <div
                        className="bg-white border-l shadow-inner p-5 flex flex-col"
                        style={{ width: rightWidth }}
                    >
                        {/* NOTES */}
                        <h2 className="text-lg font-bold text-gray-800 mb-4">📒 Notes</h2>

                        <div className="flex-1 overflow-y-auto space-y-3">

                            {allNotes.length === 0 && (
                                <p className="text-gray-500 text-sm">Chưa có ghi chú nào.</p>
                            )}

                            {allNotes.map((note) => (
                                <button
                                    key={note.id}
                                    className="w-full text-left p-3 bg-gray-50 border rounded-lg shadow-sm hover:bg-blue-100 transition"
                                    onClick={() => {
                                        setPageNumber(note.page);
                                        setTimeout(() => setJumpToNote(note), 50);
                                    }}
                                >
                                    <p className="font-medium text-gray-800">
                                        Trang {note.page}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {note.content || "(Không có nội dung)"}
                                    </p>
                                </button>
                            ))}

                            {/* TRANSCRIPT */}
                            <h3 className="text-lg font-bold text-gray-800 mt-6 mb-2">
                                🎧 Transcript
                            </h3>

                            {transcripts.length === 0 ? (
                                <p className="text-gray-500 text-sm">Chưa có transcript.</p>
                            ) : (
                                <div className="space-y-2">
                                    {transcripts.map((item, index) => (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                setSelectedTranscriptIndex(index);
                                                if (item.audio_url) setAudioUrl(item.audio_url);
                                            }}
                                            className={`w-full text-left p-3 rounded-lg border transition shadow-sm
                                            ${selectedTranscriptIndex === index
                                                    ? "bg-blue-100 border-blue-400"
                                                    : "bg-gray-50 border-gray-200 hover:bg-gray-200"
                                                }`}
                                        >
                                            <p className="text-sm font-semibold text-gray-700">
                                                Audio {index + 1}
                                            </p>
                                            <p className="text-xs text-gray-600 truncate">
                                                {item.full_text}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* AUDIO PLAYER */}
                            {audioUrl && (
                                <div className="bg-gray-50 p-4 rounded-xl border shadow-inner mt-4">
                                    <audio
                                        src={audioUrl}
                                        ref={audioRef}
                                        controls
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-gray-600 pt-1">
                                        <span>{Math.floor(audioCurrentTime)}s</span>
                                        <span>{Math.floor(audioDuration)}s</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

}
