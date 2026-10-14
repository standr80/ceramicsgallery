const MAX_SIDE = 2000;

// Re-encode every photo before upload: converts HEIC (which only Safari can show),
// strips metadata such as GPS location, and caps the size.
export async function prepareImage(original: File): Promise<{ file: File; ext: string }> {
  let source: Blob = original;

  if (/image\/hei[cf]/i.test(original.type) || /\.hei[cf]$/i.test(original.name)) {
    const heic2any = (await import("heic2any")).default;
    const converted = await heic2any({ blob: original, toType: "image/jpeg", quality: 0.92 });
    source = Array.isArray(converted) ? converted[0] : converted;
  }

  const bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Encode failed"))), "image/jpeg", 0.88),
  );
  const name = original.name.replace(/\.[^.]+$/, "") + ".jpg";
  return { file: new File([blob], name, { type: "image/jpeg" }), ext: "jpg" };
}
