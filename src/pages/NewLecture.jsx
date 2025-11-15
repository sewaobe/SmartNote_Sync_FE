import React, { useEffect, useState, useRef } from "react";
import pdfjsLib from "../pdf-worker";
import api from "../api/axiosClient";
import { toast } from "sonner";

// COMPONENTS
import HeaderBar from "../components/HeaderBar";
import LeftSidebar from "../components/LeftSideBar";
import PdfViewer from "../components/PdfViewer";
import RightSidebar from "../components/RightSideBar";

export default function NewLecture() {
    // -----------------------------
    // PDF STATES
    // -----------------------------
    const [pdf, setPdf] = useState(null);
    const [pageCount, setPageCount] = useState(0);
    const [pageNumber, setPageNumber] = useState(1);

    // Notes
    const [initialNotesFromServer, setInitialNotesFromServer] = useState([]);
    const [assignMap, setAssignMap] = useState({});
    const [allNotes, setAllNotes] = useState([]);
    const [jumpToNote, setJumpToNote] = useState(null);

    // -----------------------------
    // AUDIO + TRANSCRIPT
    // -----------------------------
    const [audioUrl, setAudioUrl] = useState(null);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [audioCurrentTime, setAudioCurrentTime] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);

    const [transcripts, setTranscripts] = useState([]);
    const [selectedTranscriptIndex, setSelectedTranscriptIndex] = useState(0);
    const audioRef = useRef(null);

    // -----------------------------
    // RECORDING
    // -----------------------------
    const [isRecording, setIsRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);

    // -----------------------------
    // USER ROLE
    // -----------------------------
    const [userRole, setUserRole] = useState(null);

    // -----------------------------
    // SIDEBAR STATES
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
    // RESIZE EVENTS
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
    // LOAD PDF
    // -----------------------------
    useEffect(() => {
        const loadPdfData = async () => {
            const pdfUrl = localStorage.getItem("lecturePdfUrl");
            if (!pdfUrl) {
                toast.error("Không tìm thấy PDF URL");
                return;
            }

            try {
                const res = await api.get(`/files/presigned/${pdfUrl}`);
                const presignedUrl = res.url;

                if (!presignedUrl) throw new Error("Missing presigned URL");

                const loadingTask = pdfjsLib.getDocument({
                    url: presignedUrl,
                    withCredentials: false,
                });

                const pdfDoc = await loadingTask.promise;
                setPdf(pdfDoc);
                setPageCount(pdfDoc.numPages);
            } catch (err) {
                console.error("Load PDF error:", err);
                toast.error("Không thể load PDF");
            }
        };

        loadPdfData();
    }, []);

    // -----------------------------
    // TOGGLE SIDEBARS
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

    const toggleRight = () => {
        if (rightOpen) {
            setPrevRightWidth(rightWidth);
            setRightWidth(0);
        } else {
            setRightWidth(prevRightWidth);
        }
        setRightOpen(!rightOpen);
    };

    // -----------------------------
    // PLAY AUDIO FOR NOTE
    // -----------------------------
    const handlePlayAudioForNote = (note) => {
        try {
            if (!note) return;

            let transcript = null;

            if (note.transcript_id) {
                transcript = transcripts.find(
                    (t) => t._id === note.transcript_id
                );
            }

            if (!transcript?.audio_url) {
                toast.error("Không tìm thấy audio");
                return;
            }

            setAudioUrl(transcript.audio_url);

            const idx = transcripts.findIndex((t) => t === transcript);
            if (idx >= 0) setSelectedTranscriptIndex(idx);

            const noteTime = new Date(note.created_at).getTime();
            const transcriptTime = new Date(transcript.created_at).getTime();
            let offset = (noteTime - transcriptTime) / 1000;

            if (offset < 0) offset = 0;

            setTimeout(() => {
                if (!audioRef.current) return;

                const audio = audioRef.current;

                const playWithOffset = () => {
                    try {
                        audio.currentTime = offset;
                        audio.play();
                    } catch (e) { }
                };

                if (audio.readyState >= 1) playWithOffset();
                else audio.addEventListener("loadedmetadata", playWithOffset, { once: true });
            }, 100);
        } catch (err) {
            console.error(err);
            toast.error("Không thể phát audio");
        }
    };

    // -----------------------------
    // LOAD USER ROLE
    // -----------------------------
    useEffect(() => {
        const role = localStorage.getItem("userRole");
        setUserRole(role);
    }, []);

    const getLectureId = () => {
        const stored = localStorage.getItem("lectureId");
        return stored && stored !== "undefined" ? stored : "69182ad0faf294fc3f48c783";
    };

    // -----------------------------
    // LOAD TRANSCRIPT
    // -----------------------------
    useEffect(() => {
        const fetchTranscription = async () => {
            const lectureId = getLectureId();
            try {
                const res = await api.get(`/transcription/lecture/${lectureId}`);
                const items = res?.data ?? res;

                if (!items.length) return;

                setTranscripts(items);
                setSelectedTranscriptIndex(0);

                if (items[0]?.audio_url) setAudioUrl(items[0].audio_url);
            } catch (err) {
                toast.error("Không thể tải transcript");
            }
        };

        fetchTranscription();
    }, []);

    // -----------------------------
    // LOAD NOTES FROM SERVER
    // -----------------------------
    useEffect(() => {
        const loadNotes = async () => {
            try {
                const res = await api.get(`/notes/lecture/${getLectureId()}`);
                const payload = Array.isArray(res) ? res : res?.data || [];
                setInitialNotesFromServer(payload);
            } catch (err) {
                console.error("Failed to load notes", err);
            }
        };

        loadNotes();
    }, []);

    // -----------------------------
    // NOTE EVENTS
    // -----------------------------
    const handleNoteCreate = async (note, posPx) => {
        try {
            const lectureId = getLectureId();

            const queued = transcripts.find((t) => t?.status === "queued");
            const transcriptId = queued?._id;

            const body = {
                lecture_id: lectureId,
                position: posPx,
                content: note.content,
                created_at: new Date().toISOString(),
                transcript_id: transcriptId,
                page_index: note.page,
            };

            const res = await api.post(`/notes`, body);
            const created = res?.data ?? res;

            const id = created?._id || created?.id;
            if (id) {
                setAssignMap((m) => ({ ...m, [note.id]: id }));
            }
        } catch (err) {
            toast.error("Không thể tạo ghi chú");
        }
    };

    const handleNoteUpdate = async (note) => {
        try {
            const serverId = assignMap[note.id] || note.id;
            if (!serverId) return;

            await api.put(`/notes/${serverId}`, { content: note.content });
        } catch (err) {
            toast.error("Không thể cập nhật");
        }
    };

    const handleNoteDelete = async (localId) => {
        try {
            const serverId = assignMap[localId] || localId;
            if (!serverId) return;
            await api.delete(`/notes/${serverId}`);
        } catch (err) {
            toast.error("Không thể xóa");
        }
    };

    const toggleRecording = async () => {
        if (isRecording) {
            // STOP
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            return;
        }

        // START
        try {
            const lectureId = getLectureId();

            // 1. Gọi API bắt đầu transcription
            let transcriptId = null;
            try {
                const res = await api.post(`/transcription/start/${lectureId}`);
                transcriptId = res?.data?.transcript_id;
                if (!transcriptId) {
                    toast.error("Không có transcript_id từ server!");
                    return;
                }
                localStorage.setItem("transcriptId", transcriptId);
            } catch (err) {
                toast.error("Không thể bắt đầu transcription");
                return;
            }

            // 2. Bật microphone
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            recordedChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
                setRecordedBlob(blob);

                stream.getTracks().forEach((t) => t.stop());

                toast.success("Ghi âm hoàn tất — Đang tải lên...");

                // 3. Upload file audio
                try {
                    const transcriptId = localStorage.getItem("transcriptId");
                    const formData = new FormData();
                    formData.append("audio", blob, "recording.webm");

                    await api.post(`/transcription/upload/${transcriptId}`, formData, {
                        headers: { "Content-Type": "multipart/form-data" },
                    });

                    toast.success("Tải lên audio thành công!");
                } catch (err) {
                    console.error(err);
                    toast.error("Tải lên audio thất bại");
                }
            };

            mediaRecorder.start();
            mediaRecorderRef.current = mediaRecorder;
            setIsRecording(true);
            toast.success("Bắt đầu ghi âm");

        } catch (err) {
            console.error("Mic error:", err);
            toast.error("Không thể mở microphone");
        }
    };


    // -----------------------------
    // RENDER UI
    // -----------------------------
    return (
        <div className="w-full h-screen flex flex-col bg-gray-100">

            <HeaderBar
                userRole={userRole}
                isRecording={isRecording}
                toggleRecording={toggleRecording}
                toggleLeft={toggleLeft}
                toggleRight={toggleRight}
            />


            <div className="flex flex-1 overflow-hidden">

                {leftOpen && (
                    <LeftSidebar
                        pdf={pdf}
                        pageCount={pageCount}
                        leftWidth={leftWidth}
                        pageNumber={pageNumber}
                        setPageNumber={setPageNumber}
                        setIsResizingLeft={setIsResizingLeft}
                    />
                )}

                <PdfViewer
                    pdf={pdf}
                    pageNumber={pageNumber}
                    allNotes={allNotes}
                    setAllNotes={setAllNotes}
                    jumpToNote={jumpToNote}
                    initialNotes={initialNotesFromServer}
                    onNoteCreate={handleNoteCreate}
                    onNoteUpdate={handleNoteUpdate}
                    onNoteDelete={handleNoteDelete}
                    assignMap={assignMap}
                    onPlayAudio={handlePlayAudioForNote}
                />

                {rightOpen && (
                    <RightSidebar
                        rightWidth={rightWidth}
                        userRole={userRole}
                        allNotes={allNotes}
                        setPageNumber={setPageNumber}
                        setJumpToNote={setJumpToNote}
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
                        setIsResizingRight={setIsResizingRight}
                    />
                )}
            </div>
        </div>
    );
}
