import React, { useEffect, useState } from "react";
import api from "../api/axiosClient";
import { useNavigate } from "react-router-dom";

export default function ClassList() {
  const [classes, setClasses] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // lecturesMap: { [classId]: { loading, error, data: [], open } }
  const [lecturesMap, setLecturesMap] = useState({});
  const navigate = useNavigate();

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);

  // Get userRole from localStorage
  const userRole = localStorage.getItem("userRole");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    api
      .get("/classes")
      .then((data) => {
        if (!mounted) return;
        // API shape: { message, data: [ ...classes ], userType }
        const payload = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        // Normalize to fields used by the UI
        const normalized = payload.map((c) => ({
          id: c._id || c.id,
          name: c.name || c.title || "Không tên",
          teacherName: c.teacher_id?.full_name || c.teacher || "",
          studentCount: Array.isArray(c.student_ids)
            ? c.student_ids.length
            : c.students || 0,
          description: c.description || "",
          updatedAt:
            c.updated_at ||
            c.updatedAt ||
            c.updated_at ||
            c.updatedAt ||
            c.updated_at ||
            c.created_at ||
            "",
          raw: c,
        }));

        setClasses(normalized);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("Failed to fetch classes:", err);
        setError(err?.message || "Lỗi khi tải danh sách lớp");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const toggleLectures = (classId) => {
    setLecturesMap((m) => ({
      ...m,
      [classId]: { ...(m[classId] || {}), open: !m[classId]?.open },
    }));

    const entry = lecturesMap[classId];
    // if already fetched or now closing, do nothing
    if (entry && (entry.data || entry.loading)) return;

    // fetch lectures for class
    setLecturesMap((m) => ({
      ...m,
      [classId]: { ...(m[classId] || {}), loading: true, error: null },
    }));

    api
      .get(`/lectures/class/${classId}`)
      .then((res) => {
        const payload = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : [];
        setLecturesMap((m) => ({
          ...m,
          [classId]: { ...(m[classId] || {}), loading: false, data: payload },
        }));
      })
      .catch((err) => {
        console.error("Failed to fetch lectures for class", classId, err);
        setLecturesMap((m) => ({
          ...m,
          [classId]: {
            ...(m[classId] || {}),
            loading: false,
            error: err?.message || "Lỗi khi tải bài giảng",
          },
        }));
      });
  };

  const filtered = classes.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.description || "").toLowerCase().includes(q) ||
      (c.teacherName || "").toLowerCase().includes(q)
    );
  });

  // Handle upload file change
  const handleUploadFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setUploadFile(file);
    } else {
      alert("Chỉ hỗ trợ file PDF");
    }
  };

  // Handle upload submission
  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      alert("Vui lòng chọn file");
      return;
    }
    if (!uploadTitle.trim()) {
      alert("Vui lòng nhập tiêu đề");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("title", uploadTitle);

      const res = await api.post(
        `/lectures/create/${selectedClassId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert("Upload thành công!");
      // Reset modal
      setUploadFile(null);
      setUploadTitle("");
      setShowUploadModal(false);

      // Refresh lectures list for this class if already open
      if (lecturesMap[selectedClassId]?.data) {
        setLecturesMap((m) => ({
          ...m,
          [selectedClassId]: {
            ...(m[selectedClassId] || {}),
            data: [res.data, ...(m[selectedClassId].data || [])],
          },
        }));
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert(`Upload lỗi: ${err?.response?.data?.message || err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const openUploadModal = (classId) => {
    setSelectedClassId(classId);
    setShowUploadModal(true);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadTitle("");
    setSelectedClassId(null);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Danh sách lớp</h1>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên, giáo viên, mô tả..."
              className="px-3 py-2 border rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />

            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              onClick={() => {
                // TODO: mở modal tạo lớp hoặc điều hướng.
                alert("Tạo lớp mới - chức năng chưa triển khai");
              }}
            >
              Tạo lớp mới
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Đang tải...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">Lỗi: {error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            Không tìm thấy lớp nào.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-medium">{c.name}</h2>
                    <p className="text-sm text-gray-500">{c.teacherName}</p>
                  </div>
                  <div className="text-sm text-gray-400">
                    {c.studentCount} sv
                  </div>
                </div>

                <p className="mt-3 text-sm text-gray-600 min-h-[48px]">
                  {c.description || "-"}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    Cập nhật:{" "}
                    {c.updatedAt ? new Date(c.updatedAt).toLocaleString() : "-"}
                  </div>
                  <div className="flex items-center gap-2">
                    {userRole === "teacher" && (
                      <button
                        onClick={() => openUploadModal(c.id)}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Upload
                      </button>
                    )}

                    <button
                      onClick={() => toggleLectures(c.id)}
                      className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                    >
                      {lecturesMap[c.id]?.open ? "Ẩn bài giảng" : "Xem"}
                    </button>

                    <button
                      onClick={() =>
                        alert("Chia sẻ/Quản lý lớp - chưa triển khai")
                      }
                      className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                    >
                      Quản lý
                    </button>
                  </div>
                </div>
                {/* Lectures list */}
                {lecturesMap[c.id]?.open && (
                  <div className="mt-3 border-t pt-3">
                    {lecturesMap[c.id]?.loading ? (
                      <div className="text-sm text-gray-500">
                        Đang tải bài giảng...
                      </div>
                    ) : lecturesMap[c.id]?.error ? (
                      <div className="text-sm text-red-500">
                        Lỗi: {lecturesMap[c.id].error}
                      </div>
                    ) : Array.isArray(lecturesMap[c.id]?.data) &&
                      lecturesMap[c.id].data.length === 0 ? (
                      <div className="text-sm text-gray-500">
                        Chưa có bài giảng.
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {lecturesMap[c.id]?.data?.map((lec) => (
                          <li
                            key={lec._id || lec.id}
                            className="text-sm flex items-center justify-between"
                          >
                            <div>
                              <div className="font-medium">
                                {lec.title || lec.name || "Bài giảng"}
                              </div>
                              <div className="text-xs text-gray-400">
                                {lec.updated_at
                                  ? new Date(lec.updated_at).toLocaleString()
                                  : lec.created_at
                                  ? new Date(lec.created_at).toLocaleString()
                                  : ""}
                              </div>
                            </div>
                            <div>
                              {lec.pdf_url || lec.pdfUrl ? (
                                <button
                                  onClick={() => {
                                    try {
                                      const pdf = lec.pdf_url || lec.pdfUrl;
                                      localStorage.setItem(
                                        "lecturePdfUrl",
                                        pdf
                                      );
                                      localStorage.setItem(
                                        "lectureId",
                                        lec._id
                                      );
                                    } catch (err) {
                                      console.error(
                                        "Failed to set pdfUrl in localStorage",
                                        err
                                      );
                                    }
                                    navigate("/lecture");
                                  }}
                                  className="ml-3 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  Mở PDF
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="ml-3 px-2 py-1 text-xs bg-gray-200 text-gray-500 rounded"
                                >
                                  Không có PDF
                                </button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Upload Bài giảng</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Tiêu đề</label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Nhập tiêu đề bài giảng"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={uploading}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">File PDF</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleUploadFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={uploading}
              />
              {uploadFile && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ {uploadFile.name}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleUploadSubmit}
                disabled={uploading}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
              >
                {uploading ? "Đang upload..." : "Upload"}
              </button>
              <button
                onClick={closeUploadModal}
                disabled={uploading}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition disabled:bg-gray-200"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
