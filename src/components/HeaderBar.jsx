import React from "react";

export default function HeaderBar({
    userRole,
    isRecording,
    toggleRecording,
    toggleLeft,
    toggleRight
}) {
    return (
        <div className="h-14 bg-white shadow-md px-6 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-700">Lecture View</h1>

            <div className="flex items-center gap-3">
                {userRole === "teacher" && (
                    <button
                        onClick={toggleRecording}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition ${isRecording
                                ? "bg-red-500 hover:bg-red-600 text-white"
                                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                            }`}
                    >
                        {isRecording ? "⏹ Dừng ghi" : "🎤 Ghi âm"}
                    </button>
                )}

                <button
                    onClick={toggleLeft}
                    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
                >
                    Toggle Slides
                </button>

                {userRole === "student" && (
                    <button
                        onClick={toggleRight}
                        className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
                    >
                        Toggle Notes
                    </button>
                )}

                <button
                    onClick={() => (window.location.href = "/")}
                    className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm"
                >
                    Back Home
                </button>
            </div>
        </div>
    );
}
