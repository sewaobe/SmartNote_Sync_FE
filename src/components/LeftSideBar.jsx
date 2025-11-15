import React from "react";
import PdfThumbnail from "./PdfThumbnail";

export default function LeftSidebar({
    pdf,
    pageCount,
    leftWidth,
    pageNumber,
    setPageNumber,
    setIsResizingLeft
}) {
    return (
        <>
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

            <div
                onMouseDown={() => setIsResizingLeft(true)}
                className="w-1 cursor-col-resize bg-gray-300 hover:bg-gray-400"
            ></div>
        </>
    );
}
