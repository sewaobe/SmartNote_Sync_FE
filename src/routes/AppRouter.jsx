import { Route, Routes, useNavigate } from "react-router-dom";
import { Suspense } from "react";
import { Toaster } from "sonner";
import Home from "../pages/Home";
import NewLecture from "../pages/NewLecture";
import UploadFile from "../pages/UploadFile";
import ClassList from "../pages/ClassList";

const App = () => {
  const navigate = useNavigate();

  return (
    <div>
      <button
        onClick={() => {
          navigate("/some-path");
        }}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Button Demo
      </button>
    </div>
  );
};

export const AppRouter = () => {
  return (
    <>
      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          classNames: {
            loading: `
              !text-blue-400 
              [&>svg]:!text-blue-400 
              [&>svg]:!stroke-blue-400 
              [&>svg]:!fill-blue-400
            `,
          },
        }}
      />

      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          {/* Routes đơn giản */}
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<UploadFile />} />
          <Route path="/lecture" element={<NewLecture />} />
          <Route path="/classes" element={<div><ClassList /></div>} />
          <Route path="/some-path" element={<div>Some Path</div>} />
        </Routes>
      </Suspense>
    </>
  );
};
