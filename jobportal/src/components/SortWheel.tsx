"use client";

import { useState } from "react";

type Option = { id: string; label: string };

type Props = {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
};

export default function SortWheel({ options, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const activeIdx = Math.max(0, options.findIndex((o) => o.id === value));
  const rotation = -activeIdx * (360 / options.length);

  return (
    <div className={`sortwheel ${open ? "is-open" : ""}`}>
      <button className="sortwheel-trigger" onClick={() => setOpen(!open)}>
        <span className="sortwheel-caption mono">SORT</span>
        <span className="sortwheel-value">{options[activeIdx]?.label}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <path
            d="M2 3.5 L5 6.5 L8 3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div className="sortwheel-panel">
          <div className="sortwheel-dial" style={{ transform: `rotate(${rotation}deg)` }}>
            {options.map((opt, i) => {
              const angle = (i / options.length) * 360;
              return (
                <button
                  key={opt.id}
                  className={`sortwheel-spoke ${opt.id === value ? "is-active" : ""}`}
                  style={{
                    transform: `rotate(${angle}deg) translateY(-78px) rotate(${-angle}deg) rotate(${-rotation}deg)`,
                  }}
                  onClick={() => {
                    onChange(opt.id);
                    setTimeout(() => setOpen(false), 280);
                  }}
                >
                  <span className="sortwheel-spoke-label">{opt.label}</span>
                </button>
              );
            })}
            <div className="sortwheel-center">
              <span className="mono sortwheel-center-caption">SORTED BY</span>
              <span className="sortwheel-center-value">{options[activeIdx]?.label}</span>
            </div>
            <div className="sortwheel-pointer" />
          </div>
        </div>
      )}
    </div>
  );
}
