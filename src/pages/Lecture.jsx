import React, { useEffect, useState } from 'react';
import pdfjsLib from '../pdf-worker';
import PdfThumbnail from '../components/PdfThumbnail';
import PdfContinuousViewer from '../components/PdfContinuousViewer';
import InteractivePdfPage from '../components/InteractivePdfPage';
import api from '../api/axiosClient';
import { updateCurrentPageIndex, getCurrentPageIndex } from '../api/transcriptionAPI';
import { toast } from 'sonner';
import ChatbotDrawer from '../components/ChatbotDrawer';
import SummaryModal from '../components/SummaryModal';
import QuizModal from '../components/QuizModal';
import { ChatbotProvider, useChatbotContext } from '../components/ChatbotProvider';
import { useChatbotIntegration } from '../hooks/useChatbotIntegration';

export default function Lecture() {
    return (
        <ChatbotProvider
            lectureId={localStorage.getItem('lectureId') || '69182ad0faf294fc3f48c783'}
            transcript_id={localStorage.getItem('transcript_id')}>
            <LectureContent />
        </ChatbotProvider>
    );
}

function LectureContent() {
    const chatbot = useChatbotContext();
    const audioRef = React.useRef(null);
    const { handleAudioTimestampClick } = useChatbotIntegration(audioRef);
    const [pdf, setPdf] = useState(null);
    const [pageCount, setPageCount] = useState(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [initialNotesFromServer, setInitialNotesFromServer] = useState([]);
    const [assignMap, setAssignMap] = useState({});
    // Audio and Transcript states
    const [audioUrl, setAudioUrl] = useState(null);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [audioCurrentTime, setAudioCurrentTime] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);
    const [transcripts, setTranscripts] = useState([]); // array of transcripts
    const [selectedTranscriptIndex, setSelectedTranscriptIndex] = useState(0); // track which transcript is selected
    const [pdfPresignedUrl, setPdfPresignedUrl] = useState(null); // store presigned PDF URL

    // Recording states
    const [isRecording, setIsRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const mediaRecorderRef = React.useRef(null);
    const recordedChunksRef = React.useRef([]);

    // User role state
    const [userRole, setUserRole] = useState(null);

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
                const newWidth = Math.min(Math.max(window.innerWidth - e.clientX, 200), 500);
                setRightWidth(newWidth);
            }
        };

        const stopResize = () => {
            setIsResizingLeft(false);
            setIsResizingRight(false);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', stopResize);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', stopResize);
        };
    }, [isResizingLeft, isResizingRight]);

    // -----------------------------
    // Load PDF from localStorage
    // -----------------------------
    useEffect(() => {
        const loadPdfData = async () => {
            const pdfUrl = localStorage.getItem('lecturePdfUrl');

            if (!pdfUrl) {
                toast.error('Không tìm thấy PDF URL');
                return;
            }

            try {
                // 1. Lấy presigned URL
                const res = await api.get(`/files/presigned/${pdfUrl}`);
                const presignedUrl = res.url;

                if (!presignedUrl) throw new Error('Missing presigned URL');

                console.log('Presigned:', presignedUrl);

                // 2. Fetch PDF as blob từ presigned URL
                const loadingTask = pdfjsLib.getDocument({
                    url: presignedUrl,
                    withCredentials: false,
                });
                const pdfDoc = await loadingTask.promise;
                setPdf(pdfDoc);
                setPageCount(pdfDoc.numPages);

                console.log('PDF loaded successfully, pages:', pdfDoc.numPages);
            } catch (err) {
                console.error('Load PDF error:', err);
                toast.error('Không thể load PDF: ' + err.message);
            }
        };

        loadPdfData();
    }, []);

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
        try {
            if (!note) return;

            const noteCreatedAt = note.created_at || note.createdAt || note.created;
            if (!noteCreatedAt) {
                toast.error('Không có thời gian tạo cho ghi chú');
                return;
            }

            console.log('transcripts', transcripts);
            console.log('note.transcript_id', note.transcript_id);
            // choose transcript: prefer note.transcript_id if present, otherwise currently selected transcript
            let transcript = null;
            if (note.transcript_id) {
                transcript = transcripts.find((t) => t._id === note.transcript_id);
            }

            if (!transcript || !transcript.audio_url) {
                toast.error('Không tìm thấy audio tương ứng để phát');
                return;
            }

            const transcriptCreatedAt =
                transcript.created_at || transcript.createdAt || transcript.uploaded_at || transcript.timestamp || null;

            // If we don't have a creation time for the transcript, just play from start
            let offsetSeconds = 0;
            if (transcriptCreatedAt) {
                const noteTime = new Date(noteCreatedAt).getTime();
                const recordTime = new Date(transcriptCreatedAt).getTime();
                if (!isNaN(noteTime) && !isNaN(recordTime)) {
                    offsetSeconds = (noteTime - recordTime) / 1000;
                    if (offsetSeconds < 0) offsetSeconds = 0;
                }
            }

            // ensure selected transcript index and audio url are set
            const idx = transcripts.findIndex((t) => t === transcript);
            if (idx >= 0) setSelectedTranscriptIndex(idx);
            setAudioUrl(transcript.audio_url);

            // play at offset when audio metadata is ready
            const tryPlay = () => {
                const audio = audioRef.current;
                if (!audio) return;

                const setAndPlay = () => {
                    try {
                        if (!isNaN(offsetSeconds) && typeof offsetSeconds === 'number') {
                            // clamp to duration if available
                            const dur = audio.duration || 0;
                            const seekTo = dur > 0 ? Math.min(offsetSeconds, dur) : offsetSeconds;
                            audio.currentTime = seekTo;
                        }
                    } catch (e) {
                        console.warn('Cannot set currentTime yet', e);
                    }

                    audio.play().catch((err) => console.error('Audio play failed:', err));
                };

                if (audio.readyState >= 1) {
                    setAndPlay();
                } else {
                    audio.addEventListener('loadedmetadata', setAndPlay, { once: true });
                }
            };

            // small delay to ensure audio element updates after setAudioUrl
            setTimeout(() => tryPlay(), 80);
            toast.success(`Phát audio từ ${Math.floor(offsetSeconds)} giây`);
        } catch (err) {
            console.error('handlePlayAudioForNote error:', err);
            toast.error('Không thể phát audio');
        }
    };

    const toggleRecording = async () => {
        if (isRecording) {
            // Stop recording
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
            // Start recording
            try {
                const lectureId = getLectureId();

                // Call transcription start API
                try {
                    const res = await api.post(`/transcription/start/${lectureId}`);
                    const transcriptId = res?.data?.transcript_id || res?.transcript_id || res?._id || res?.id;

                    if (transcriptId) {
                        localStorage.setItem('transcriptId', transcriptId);
                        console.log('Transcription started, ID:', transcriptId);
                    } else {
                        console.warn('No transcript_id found in response:', res);
                        toast.error('Không tìm thấy transcript_id từ API');
                        return;
                    }
                } catch (apiErr) {
                    console.error('Failed to start transcription:', apiErr);
                    toast.error('Không thể bắt đầu transcription');
                    return;
                }

                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                recordedChunksRef.current = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        recordedChunksRef.current.push(event.data);
                    }
                };

                mediaRecorder.onstop = () => {
                    const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
                    setRecordedBlob(blob);
                    stream.getTracks().forEach((track) => track.stop());
                    toast.success('Ghi âm hoàn tất');

                    // Upload recorded audio to transcription endpoint
                    const uploadRecording = async () => {
                        try {
                            const transcriptId = localStorage.getItem('transcriptId');
                            if (!transcriptId) {
                                console.warn('No transcriptId found in localStorage');
                                toast.error('Không tìm thấy transcriptId');
                                return;
                            }

                            const formData = new FormData();
                            formData.append('audio', blob, 'recording.webm');

                            const res = await api.post(`/transcription/upload/${transcriptId}`, formData, {
                                headers: {
                                    'Content-Type': 'multipart/form-data',
                                },
                            });

                            console.log('Recording uploaded successfully:', res);
                            toast.success('Ghi âm đã được tải lên');
                        } catch (err) {
                            console.error('Failed to upload recording:', err);
                            toast.error('Không thể tải lên ghi âm: ' + (err?.message || 'Unknown error'));
                        }
                    };

                    uploadRecording();
                };

                mediaRecorder.start();
                mediaRecorderRef.current = mediaRecorder;
                setIsRecording(true);
                toast.success('Bắt đầu ghi âm');
            } catch (err) {
                console.error('Microphone access denied:', err);
                toast.error('Không thể truy cập microphone');
            }
        }
    };
    const [allNotes, setAllNotes] = useState([]);
    const [jumpToNote, setJumpToNote] = useState(null);

    // Load user role from localStorage
    useEffect(() => {
        const role = localStorage.getItem('userRole');
        setUserRole(role);
    }, []);

    // Teacher: Update current page index when page changes
    useEffect(() => {
        if (userRole !== 'teacher' || !pageNumber) return;

        const updatePageIndex = async () => {
            try {
                const lectureId = getLectureId();
                // Page number is 1-based, convert to 0-based index
                await updateCurrentPageIndex(lectureId, pageNumber - 1);
                console.log('Updated page index to:', pageNumber - 1);
            } catch (error) {
                console.error('Failed to update page index:', error);
                // Don't show error toast to avoid spamming the teacher
            }
        };

        updatePageIndex();
    }, [pageNumber, userRole]);

    // Student: Poll for page index updates every 5 seconds
    useEffect(() => {
        if (userRole !== 'student') return;

        const pollPageIndex = async () => {
            try {
                const lectureId = getLectureId();
                const result = await getCurrentPageIndex(lectureId);
                const serverPageIndex = result?.currentPageIndex;

                // If serverPageIndex is -1, do nothing (no active transcription)
                if (serverPageIndex === -1 || serverPageIndex === undefined || serverPageIndex === null) {
                    return;
                }

                // Convert 0-based index to 1-based page number
                const serverPageNumber = serverPageIndex + 1;

                // Only update if different from current page
                if (serverPageNumber !== pageNumber && serverPageNumber > 0 && serverPageNumber <= pageCount) {
                    console.log('Syncing to teacher page:', serverPageNumber);
                    setPageNumber(serverPageNumber);
                    toast.info(`Đã chuyển đến trang ${serverPageNumber} (theo giáo viên)`);
                }
            } catch (error) {
                console.error('Failed to get page index:', error);
                // Don't show error toast to avoid spamming
            }
        };

            // Poll immediately on mount
            pollPageIndex();

            // Then poll every 5 seconds
            const intervalId = setInterval(pollPageIndex, 1000);

        return () => clearInterval(intervalId);
    }, [userRole, pageNumber, pageCount]);

    // Get lectureId from localStorage
    const getLectureId = () => {
        const stored = localStorage.getItem('lectureId');
        return stored && stored !== 'undefined' && stored !== 'null' ? stored : '69182ad0faf294fc3f48c783';
    };

    // Fetch transcription / audio for current lecture
    useEffect(() => {
        const fetchTranscription = async () => {
            // read lectureId from localStorage but guard against string 'undefined'/'null'
            const stored = localStorage.getItem('lectureId');
            const lectureId =
                stored && stored !== 'undefined' && stored !== 'null' ? stored : '69182ad0faf294fc3f48c783';

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

                localStorage.setItem('transcript_id', items[0]._id);
                // pick the first item for audio_url
                const first = items[0];
                if (first?.audio_url) setAudioUrl(first.audio_url);
            } catch (err) {
                console.error('Failed to fetch transcription', err);
                const message = err?.response?.data?.message || err.message || 'Lỗi khi lấy transcription';
                toast.error(`Không thể lấy audio/transcript: ${message}`);
            }
        };

        fetchTranscription();
    }, []);

    // Load notes for this lecture (teacher view)
    useEffect(() => {
        const loadNotes = async () => {
            try {
                const lectureId = getLectureId();
                const res = await api.get(`/notes/lecture/${lectureId}`);
                const payload = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
                setInitialNotesFromServer(payload);
            } catch (err) {
                console.error('Failed to load notes for lecture:', err);
            }
        };

        loadNotes();
    }, []);

    // Handlers for note create/update/delete coming from InteractivePdfPage
    const handleNoteCreate = async (note, posPx) => {
        try {
            const lectureId = getLectureId();
            // prefer a transcript that is currently queued (in-progress) for this lecture
            const queued = transcripts.find((t) => t?.status === 'queued');
            const transcriptId = queued?._id || undefined;

            const body = {
                lecture_id: lectureId,
                position: { x: posPx.x, y: posPx.y },
                content: note.content || '',
                created_at: new Date().toISOString(),
                transcript_id: transcriptId || undefined,
                page_index: note.page,
            };

            const res = await api.post(`/notes`, body);
            const created = res?.data ?? res;
            const createdNote = created?.data ?? created;
            const serverId = createdNote?._id || createdNote?.id || createdNote?.note_id || createdNote?.note?.id;

            if (serverId) {
                // inform child to replace local id with server id
                setAssignMap((m) => ({ ...m, [note.id]: serverId }));
                console.log('Note created on server, mapping', note.id, '->', serverId);
            } else {
                console.warn('Cannot determine server id for created note', created);
            }
        } catch (err) {
            console.error('Failed to create note on server:', err);
            toast.error('Không thể lưu ghi chú');
        }
    };

    const handleNoteUpdate = async (note) => {
        try {
            const serverId = assignMap[note.id] || note.id;
            if (!serverId) return;
            if (/^\d+$/.test(String(serverId))) return; // still local id

            const body = { content: note.content };
            await api.put(`/notes/${serverId}`, body);
        } catch (err) {
            console.error('Failed to update note on server:', err);
            toast.error('Không thể cập nhật ghi chú');
        }
    };

    const handleNoteDelete = async (localId) => {
        try {
            const serverId = assignMap[localId] || localId;
            if (!serverId) return;
            if (/^\d+$/.test(String(serverId))) return;
            await api.delete(`/notes/${serverId}`);
        } catch (err) {
            console.error('Failed to delete note on server:', err);
            toast.error('Không thể xóa ghi chú');
        }
    };

    return (
        <div className="w-full h-screen flex flex-col bg-gray-100">
            {/* HEADER */}
            <div className="h-14 bg-white shadow-md px-6 flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-700">Lecture View</h1>

                <div className="flex items-center gap-3">
                    {/* Chatbot Button */}
                    <button
                        onClick={() => chatbot.setIsChatbotOpen(!chatbot.isChatbotOpen)}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition">
                        💬 Chat
                    </button>
                    {/* Recording Button - only show for teachers */}
                    {userRole === 'teacher' && (
                        <button
                            onClick={toggleRecording}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                                isRecording
                                    ? 'bg-red-500 hover:bg-red-600 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                            }`}>
                            {isRecording ? '⏹ Dừng ghi' : '🎤 Ghi âm'}
                        </button>
                    )}{' '}
                    {/* Toggle Left */}
                    <button onClick={toggleLeft} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm">
                        {leftOpen ? 'Hide Slides' : 'Show Slides'}
                    </button>
                    {/* Toggle Right */}
                    {userRole === 'student' && (
                        <button
                            onClick={toggleRight}
                            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm">
                            {rightOpen ? 'Hide Notes' : 'Show Notes'}
                        </button>
                    )}
                    <button
                        onClick={() => (window.location.href = '/')}
                        className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm">
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
                        style={{ width: leftWidth }}>
                        <h3 className="text-sm font-semibold text-gray-700">Slides ({pageCount})</h3>

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
                        className="w-1 cursor-col-resize bg-gray-300 hover:bg-gray-400"></div>
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
                                initialNotes={initialNotesFromServer}
                                onNoteCreate={handleNoteCreate}
                                onNoteUpdate={handleNoteUpdate}
                                onNoteDelete={handleNoteDelete}
                                assignMap={assignMap}
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
                        className="w-1 cursor-col-resize bg-gray-300 hover:bg-gray-400"></div>
                )}

                {/* RIGHT SIDEBAR */}
                {rightOpen && (
                    <div
                        className="bg-white border-l shadow-inner flex flex-col"
                        style={{ width: rightWidth, height: '100%' }}>
                        {/* Scrollable main area: Notes + Transcript */}
                        <div className="p-5 overflow-y-auto flex-1">
                            {/* NOTES SECTION - only show for students */}
                            {userRole === 'student' && (
                                <>
                                    <h2 className="text-lg font-bold text-gray-700 mb-4">Notes</h2>

                                    {allNotes.length === 0 && (
                                        <p className="text-gray-500 text-sm">Chưa có ghi chú nào.</p>
                                    )}

                                    <div className="space-y-3 mb-6">
                                        {allNotes.map((note) => (
                                            <button
                                                key={note.id}
                                                className="w-full text-left p-3 bg-gray-50 border rounded-lg shadow-sm hover:bg-gray-100 transition"
                                                onClick={() => {
                                                    setPageNumber(note.page);
                                                    setTimeout(() => {
                                                        setJumpToNote(note);
                                                    }, 50);
                                                }}>
                                                <p className="font-medium">Trang {note.page}</p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {note.content || '(Chưa có nội dung)'}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* TRANSCRIPT SECTION */}
                            <h3 className="text-lg font-bold text-gray-700 mb-3">Transcript</h3>
                            {transcripts.length === 0 ? (
                                <p className="text-gray-500 text-sm">Chưa có transcript.</p>
                            ) : (
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="text-xs font-semibold text-gray-600 mb-2">
                                        Transcript {selectedTranscriptIndex + 1}
                                    </p>
                                    <p className="text-sm text-gray-700">
                                        {transcripts[selectedTranscriptIndex]?.full_text}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* AUDIO SECTION - sticky bottom, visually prominent */}
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
                                                localStorage.setItem('transcript_id', item._id || index);
                                                if (item?.audio_url) setAudioUrl(item.audio_url);
                                            }}
                                            className={`w-full text-left p-3 rounded-lg border transition ${
                                                selectedTranscriptIndex === index
                                                    ? 'bg-blue-100 border-blue-400 shadow-md'
                                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                            }`}>
                                            <p className="text-sm font-semibold text-gray-700">Audio {index + 1}</p>
                                            <p className="text-xs text-gray-600 truncate">{item.full_text}</p>
                                        </button>
                                    ))}

                                    {/* Audio Player */}
                                    {audioUrl && (
                                        <div className="bg-gray-50 p-3 rounded-lg space-y-2 mt-3">
                                            <audio
                                                ref={audioRef}
                                                src={audioUrl}
                                                onPlay={() => setIsPlayingAudio(true)}
                                                onPause={() => setIsPlayingAudio(false)}
                                                onTimeUpdate={() => {
                                                    if (audioRef.current) {
                                                        setAudioCurrentTime(audioRef.current.currentTime);
                                                    }
                                                }}
                                                onLoadedMetadata={() => {
                                                    if (audioRef.current) {
                                                        setAudioDuration(audioRef.current.duration);
                                                    }
                                                }}
                                                className="w-full"
                                                controls
                                            />
                                            <div className="flex items-center justify-between text-xs text-gray-600">
                                                <div>{Math.floor(audioCurrentTime)}s</div>
                                                <div>/</div>
                                                <div>{Math.floor(audioDuration)}s</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Chatbot Drawer */}
            <ChatbotDrawer
                isOpen={chatbot.isChatbotOpen}
                onClose={() => chatbot.setIsChatbotOpen(false)}
                lectureId={localStorage.getItem('lectureId') || '69182ad0faf294fc3f48c783'}
                messages={chatbot.messages}
                loading={chatbot.loading}
                onSendMessage={chatbot.sendMessage}
                onAudioTimestampClick={(seconds) => {
                    chatbot.setIsChatbotOpen(false);

                    setTimeout(() => {
                        handleAudioTimestampClick(seconds);
                    }, 300);
                }}
                onSummary={chatbot.handleGetSummary}
                onQuiz={chatbot.handleGetQuiz}
                onClearHistory={chatbot.handleClearHistory}
                summaryLoading={chatbot.summaryLoading}
                quizLoading={chatbot.quizLoading}
            />

            {/* Summary Modal */}
            <SummaryModal
                isOpen={chatbot.summaryOpen}
                onClose={() => chatbot.setSummaryOpen(false)}
                summary={chatbot.summary}
                loading={chatbot.summaryLoading}
            />

            {/* Quiz Modal */}
            <QuizModal
                isOpen={chatbot.quizOpen}
                onClose={() => chatbot.setQuizOpen(false)}
                quiz={chatbot.quiz}
                loading={chatbot.quizLoading}
            />
        </div>
    );
}
