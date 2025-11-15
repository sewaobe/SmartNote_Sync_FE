import React, { useEffect, useRef } from "react";

export default function PdfViewer({ pdf, pageNumber }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!pdf || !pageNumber) return;

        const renderPage = async () => {
            const page = await pdf.getPage(pageNumber);
            const viewport = page.getViewport({ scale: 1.4 });

            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({
                canvasContext: ctx,
                viewport,
            }).promise;
        };

        renderPage();
    }, [pdf, pageNumber]);

    return (
        <canvas
            ref={canvasRef}
            className="rounded-xl shadow-xl bg-white"
        />
    );
}
