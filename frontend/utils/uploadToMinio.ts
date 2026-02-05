export async function uploadToMinio(file: File, objectName?: string) {
  const uniqueName =
    objectName ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;

  // 1️⃣ Get presigned URL from backend
  const res = await fetch(
    `http://127.0.0.1:8000/course-contents/upload-url?file_name=${encodeURIComponent(
      uniqueName
    )}&content_type=${encodeURIComponent(file.type)}`
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get presigned upload URL: ${errorText}`);
  }

  const { upload_url } = await res.json();

  // 2️⃣ Upload to MinIO using presigned URL
  // Note: Do NOT add extra headers (like Content-Type) that weren't part of
  // the presigned URL signature - this would cause signature mismatch errors.
  const uploadRes = await fetch(upload_url, {
    method: "PUT",
    body: file,
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`Failed to upload file to MinIO (${uploadRes.status}): ${errorText}`);
  }

  // 3️⃣ Store usable file URL (for reference/display only)
  const fileUrl = `http://localhost:9000/lms-content/${encodeURIComponent(
    uniqueName
  )}`;

  return { objectName: uniqueName, fileUrl };
}
