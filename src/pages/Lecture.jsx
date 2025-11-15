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

  const [allNotes, setAllNotes] = useState([]);
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
            className="bg-white border-l shadow-inner flex flex-col"
            style={{ width: rightWidth, height: "100%" }}
          >
            {/* Scrollable main area: Notes + Transcript */}
            <div className="p-5 overflow-y-auto flex-1">
              {/* NOTES SECTION */}
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
                    }}
                  >
                    <p className="font-medium">Trang {note.page}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {note.content || "(Chưa có nội dung)"}
                    </p>
                  </button>
                ))}
              </div>

              {/* TRANSCRIPT SECTION */}
              <h3 className="text-lg font-bold text-gray-700 mb-3">
                Transcript
              </h3>
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
                        if (item?.audio_url) setAudioUrl(item.audio_url);
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        selectedTranscriptIndex === index
                          ? "bg-blue-100 border-blue-400 shadow-md"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
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
    </div>
  );
}
