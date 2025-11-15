import React, { useEffect, useRef, useState } from "react";

export default function PdfThumbnail({ pdf, pageNumber, sidebarWidth, onClick, isActive }) {
    const canvasRef = useRef(null);
    const [size, setSize] = useState({ w: 100, h: 100 });

    useEffect(() => {
        if (!pdf) return;

        const renderThumb = async () => {
            const page = await pdf.getPage(pageNumber);
            const viewport = page.getViewport({ scale: 1 });

            const ORI_W = viewport.width;
            const ORI_H = viewport.height;

            const maxW = sidebarWidth - 30;
            const scale = maxW / ORI_W;

            const newViewport = page.getViewport({ scale });

            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");

            canvas.width = newViewport.width;
            canvas.height = newViewport.height;

            setSize({
                w: newViewport.width,
                h: newViewport.height,
            });

            await page.render({
                canvasContext: ctx,
                viewport: newViewport,
            }).promise;
        };

        renderThumb();
    }, [pdf, pageNumber, sidebarWidth]);

    return (
        <div
            onClick={onClick}
            className={`cursor-pointer bg-white border rounded-xl shadow-sm hover:shadow-md transition-all
            ${isActive ? "ring-2 ring-blue-500" : "ring-1 ring-gray-200"}`}
            style={{ padding: 6 }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: size.w,
                    height: size.h,
                    display: "block",
                    borderRadius: "0.5rem",
                }}
            />
        </div>
    );
}
