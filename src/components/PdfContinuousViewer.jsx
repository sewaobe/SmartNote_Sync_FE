import React, { useEffect, useState, useRef } from "react";

export default function PdfContinuousViewer({ pdf }) {
    const [pages, setPages] = useState([]);

    useEffect(() => {
        if (!pdf) return;

        const loadPages = async () => {
            const list = [];
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                list.push({ page, number: i });
            }
            setPages(list);
        };

        loadPages();
    }, [pdf]);

    return (
        <div className="flex flex-col space-y-10 w-full items-center">
            {pages.map(({ page, number }) => (
                <SinglePage key={number} page={page} />
            ))}
        </div>
    );
}

function SinglePage({ page }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const render = async () => {
            const viewport = page.getViewport({ scale: 1 });

            const MAX_W = 900;
            const scale = MAX_W / viewport.width;

            const scaledViewport = page.getViewport({ scale });

            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");

            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;

            await page.render({
                canvasContext: ctx,
                viewport: scaledViewport,
            }).promise;
        };

        render();
    }, [page]);

    return (
        <canvas
            ref={canvasRef}
            className="shadow-2xl rounded-xl bg-white"
        />
    );
}
