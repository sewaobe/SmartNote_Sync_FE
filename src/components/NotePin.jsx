import React from "react";

export default function NotePin({ x, y, isActive, onMouseDown }) {
    return (
        <button
            className={`
        absolute -translate-x-1/2 -translate-y-1/2 
        px-2 py-1 rounded-full text-xs shadow 
        transition 
        ${isActive ? "bg-blue-500 text-white" : "bg-yellow-300 hover:bg-yellow-400"}
      `}
            style={{
                left: `${x * 100}%`,
                top: `${y * 100}%`,
            }}
            onMouseDown={onMouseDown}
        >
            📝
        </button>
    );
}
