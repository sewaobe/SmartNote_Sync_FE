import React from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
    const navigate = useNavigate();

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const allowed = ["application/pdf"];

        if (!allowed.includes(file.type)) {
            alert("Chỉ hỗ trợ PDF. PPTX không thể hiển thị trực tiếp.");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            localStorage.setItem("uploadedSlide", reader.result);  // base64
            navigate("/lecture");
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
            <h1 className="text-4xl font-bold mb-4">NoteSync Lecture</h1>

            <label className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition">
                Upload Slide (PDF)
                <input type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />
            </label>
        </div>
    );
}
