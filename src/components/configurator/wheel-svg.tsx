"use client";

import React from "react";
import type { WheelFinish, WheelStyle } from "@/db/schema";

interface WheelSvgProps {
  style: WheelStyle;
  finish: WheelFinish;
  sizeInches?: number;
  className?: string;
}

const FINISH_PALETTES: Record<
  WheelFinish,
  { rim: string; spoke: string; inner: string; highlight: string }
> = {
  silver: {
    rim: "#D4D7DC",
    spoke: "#E5E8EC",
    inner: "#8F959E",
    highlight: "#FFFFFF",
  },
  bicolor: {
    rim: "#E2E5EA",
    spoke: "#F0F2F5",
    inner: "#22252A",
    highlight: "#FFFFFF",
  },
  anthracite: {
    rim: "#747A84",
    spoke: "#89909B",
    inner: "#3B4048",
    highlight: "#B6BCC6",
  },
  titanium: {
    rim: "#A7ABB2",
    spoke: "#C2C6CC",
    inner: "#686D75",
    highlight: "#E6E8EC",
  },
  bronze: {
    rim: "#A58A68",
    spoke: "#C1A580",
    inner: "#5B4A35",
    highlight: "#E4CEA8",
  },
  "matte-black": {
    rim: "#34383F",
    spoke: "#2A2D33",
    inner: "#16181C",
    highlight: "#5C626E",
  },
  "gloss-black": {
    rim: "#23262C",
    spoke: "#1B1E23",
    inner: "#101215",
    highlight: "#7E8591",
  },
};

export function WheelSvg({
  style,
  finish,
  sizeInches = 19,
  className = "w-16 h-16",
}: WheelSvgProps) {
  const palette = FINISH_PALETTES[finish] ?? FINISH_PALETTES.silver;
  // Larger inch diameter visually slims the tire sidewall cleanly
  const outerRimRadius = Math.min(41.5, Math.max(36, 35.5 + (sizeInches - 16) * 1.15));

  const renderSpokes = () => {
    switch (style) {
      case "sport-5":
        return Array.from({ length: 5 }).map((_, i) => (
          <g key={i} transform={`rotate(${i * 72} 50 50)`}>
            <path
              d="M 46.2 46 L 44.5 14 L 55.5 14 L 53.8 46 Z"
              fill={palette.spoke}
              stroke={palette.inner}
              strokeWidth="0.9"
            />
            <line
              x1="50"
              y1="15.5"
              x2="50"
              y2="41"
              stroke={palette.highlight}
              strokeOpacity="0.45"
              strokeWidth="1.2"
            />
          </g>
        ));

      case "aero-5":
        return Array.from({ length: 5 }).map((_, i) => (
          <g key={i} transform={`rotate(${i * 72} 50 50)`}>
            <path
              d="M 47 45 L 41 16 L 52 14 L 57 44 Z"
              fill={palette.inner}
              stroke={palette.rim}
              strokeWidth="0.8"
            />
            <path
              d="M 48 45 L 44 15.5 L 51 14.5 L 53 45 Z"
              fill={palette.spoke}
            />
          </g>
        ));

      case "diamond-10":
        return Array.from({ length: 10 }).map((_, i) => (
          <g key={i} transform={`rotate(${i * 36} 50 50)`}>
            <polygon
              points="48.4,45 47.4,13.5 50,12.5 52.6,13.5 51.6,45"
              fill={i % 2 === 0 ? palette.spoke : palette.inner}
              stroke={palette.highlight}
              strokeOpacity={i % 2 === 0 ? "0.4" : "0.1"}
              strokeWidth="0.5"
            />
          </g>
        ));

      case "turbine-15":
        return Array.from({ length: 15 }).map((_, i) => (
          <g key={i} transform={`rotate(${i * 24} 50 50)`}>
            <path
              d="M 48.8 45 Q 46.5 29 52.5 13 L 55 13.8 Q 50 29 51.4 45 Z"
              fill={palette.spoke}
              stroke={palette.inner}
              strokeWidth="0.45"
            />
          </g>
        ));

      case "forged-y":
      default:
        return Array.from({ length: 5 }).map((_, i) => (
          <g key={i} transform={`rotate(${i * 72} 50 50)`}>
            <path
              d="M 48.2 46 L 48.2 31 L 39.5 14 L 43 13 L 50 28 L 57 13 L 60.5 14 L 51.8 31 L 51.8 46 Z"
              fill={palette.spoke}
              stroke={palette.inner}
              strokeWidth="0.7"
            />
            <path
              d="M 49.6 44 L 49.6 30 L 41.8 14.5 M 50.4 30 L 58.2 14.5"
              fill="none"
              stroke={palette.highlight}
              strokeOpacity="0.4"
              strokeWidth="0.8"
            />
          </g>
        ));
    }
  };

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* Tire sidewall */}
      <circle cx="50" cy="50" r="48" fill="#16181C" stroke="#282C33" strokeWidth="1.5" />
      <circle
        cx="50"
        cy="50"
        r="45.2"
        fill="none"
        stroke="#2E323B"
        strokeWidth="0.6"
        strokeDasharray="3 3"
      />

      {/* Inner wheel well + brake disc */}
      <circle cx="50" cy="50" r={outerRimRadius} fill="#111317" />
      <circle
        cx="50"
        cy="50"
        r={outerRimRadius * 0.72}
        fill="#3B3F47"
        stroke="#595F6A"
        strokeWidth="1"
      />
      <circle
        cx="50"
        cy="50"
        r={outerRimRadius * 0.56}
        fill="none"
        stroke="#22252A"
        strokeWidth="0.9"
        strokeDasharray="1.8 3.2"
      />

      {/* Racing Vermilion Brake Caliper */}
      <path
        d="M 67 34 A 23 23 0 0 1 67 66 L 73 63 A 28 28 0 0 0 73 37 Z"
        fill="#C83E2B"
      />

      {/* Outer Alloy Barrel Lip */}
      <circle
        cx="50"
        cy="50"
        r={outerRimRadius}
        fill="none"
        stroke={palette.rim}
        strokeWidth="3.4"
      />
      <circle
        cx="50"
        cy="50"
        r={outerRimRadius + 1.1}
        fill="none"
        stroke={palette.highlight}
        strokeOpacity="0.45"
        strokeWidth="0.7"
      />

      {/* Spokes */}
      <g>{renderSpokes()}</g>

      {/* Center Hub + 5 Lug Bolts */}
      <circle
        cx="50"
        cy="50"
        r="9.8"
        fill={palette.inner}
        stroke={palette.rim}
        strokeWidth="1.4"
      />
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i * 72 * Math.PI) / 180;
        const cx = 50 + Math.cos(angle) * 6.4;
        const cy = 50 + Math.sin(angle) * 6.4;
        return <circle key={i} cx={cx} cy={cy} r="1.2" fill={palette.highlight} opacity="0.75" />;
      })}
      <circle cx="50" cy="50" r="3.8" fill="#141518" stroke={palette.rim} strokeWidth="0.8" />
      <circle cx="50" cy="50" r="1.3" fill="#C83E2B" />
    </svg>
  );
}
