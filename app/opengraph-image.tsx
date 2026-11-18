import { ImageResponse } from "next/og";

export const alt = "Ceramics Gallery: handmade pottery by UK potters";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Default share card for pages that don't have a photo of their own.
export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f5efe6", padding: 80, justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 28, letterSpacing: 6, color: "#c0532d", textTransform: "uppercase" }}>Handmade in Britain</div>
          <div style={{ fontSize: 112, color: "#221b17", marginTop: 24, lineHeight: 1 }}>Ceramics Gallery</div>
          <div style={{ fontSize: 40, color: "#3a302a", marginTop: 28 }}>Pottery, potters and classes, direct from the studio</div>
        </div>
        <svg width="190" height="240" viewBox="0 0 64 80">
          <path d="M24 6h16v6c0 4 12 10 12 30 0 18-9 32-20 32S12 60 12 42c0-20 12-26 12-30z" fill="#c0532d" />
        </svg>
      </div>
    ),
    size,
  );
}
