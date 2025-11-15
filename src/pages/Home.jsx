import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { setAuthToken } from "../api/axiosClient";

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

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
      localStorage.setItem("uploadedSlide", reader.result); // base64
      navigate("/lecture");
    };
    reader.readAsDataURL(file);
  };

  const handlePresetLogin = async (role) => {
    const presets = {
      student: { email: "studentB@student.edu.vn", password: "123456789" },
      teacher: { email: "teacherA@gv.edu.vn", password: "123456789" },
    };

    const credentials = presets[role];
    if (!credentials) return;

    setLoading(true);
    try {
      const res = await api.post("/auth/login", credentials);
      // res may be token string or object containing token/accessToken
      const token =
        res?.token ||
        res?.accessToken ||
        (typeof res === "string" ? res : null) ||
        res?.data?.token;
      if (token) {
        setAuthToken(token);
        localStorage.setItem("userRole", role);
        navigate("/lecture");
      } else {
        alert("Đăng nhập thất bại: token không tìm thấy.");
      }
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.message || err.message || "Lỗi khi gọi API";
      alert(`Đăng nhập lỗi: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
      <h1 className="text-4xl font-bold mb-4">NoteSync Lecture</h1>

      <div className="flex gap-3 mb-4">
        <button
          className="bg-green-500 text-white px-4 py-2 rounded-lg shadow hover:bg-green-600 transition"
          onClick={() => handlePresetLogin("student")}
          disabled={loading}
        >
          Student
        </button>

        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition"
          onClick={() => handlePresetLogin("teacher")}
          disabled={loading}
        >
          Teacher
        </button>
      </div>

      <label className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition">
        Upload Slide (PDF)
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleUpload}
        />
      </label>
    </div>
  );
}
