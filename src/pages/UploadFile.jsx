import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosClient";
import { toast } from "sonner";

export default function UploadFile() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      toast.error("Chỉ hỗ trợ file PDF");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Vui lòng chọn file");
      return;
    }

    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);

      // Get classId from localStorage (you can set it during login or get from user input)
      // For now, using a placeholder - update as needed
      const classId =
        localStorage.getItem("classId") || "6918298b400b4d7ede47d0bf";

      const res = await api.post(`/lectures/create/${classId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Upload thành công!");
      // Reset form
      setFile(null);
      setTitle("");
      console.log(res.data);

      // Store lecture info and navigate to lecture page
      localStorage.setItem("lectureId", res.data._id || res.data.id);
      localStorage.setItem("lecturePdfUrl", res.data.pdf_url || "");
      navigate("/lecture");
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.message || err.message || "Lỗi khi upload";
      toast.error(`Upload lỗi: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center">Upload Lecture</h1>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Tiêu đề</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tiêu đề bài giảng"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">File PDF</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          {file && <p className="text-sm text-green-600 mt-2">✓ {file.name}</p>}
        </div>

        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {loading ? "Đang upload..." : "Upload"}
        </button>

        <button
          onClick={() => navigate("/")}
          disabled={loading}
          className="w-full mt-3 bg-gray-500 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-600 transition disabled:bg-gray-400"
        >
          Quay lại
        </button>
      </div>
    </div>
  );
}
