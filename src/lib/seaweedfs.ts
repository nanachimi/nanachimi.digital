/**
 * SeaweedFS client for file storage.
 * Uses the simple HTTP API — no special client library needed.
 *
 * Required env vars:
 *   SEAWEEDFS_MASTER_URL=http://localhost:9333
 *   SEAWEEDFS_FILER_URL=http://localhost:8888
 */

const MASTER_URL = process.env.SEAWEEDFS_MASTER_URL || "http://localhost:9333";
const FILER_URL = process.env.SEAWEEDFS_FILER_URL || "http://localhost:8888";

interface AssignResponse {
  fid: string;
  url: string;
  publicUrl: string;
  count: number;
}

/**
 * Upload a file to SeaweedFS.
 * 1. Requests a file ID from the master server
 * 2. Uploads the file to the assigned volume server
 * Returns the file ID (fid) for later retrieval.
 */
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  contentType = "application/pdf"
): Promise<string> {
  // Step 1: Get a file assignment from master
  const assignRes = await fetch(`${MASTER_URL}/dir/assign`);
  if (!assignRes.ok) {
    throw new Error(`SeaweedFS assign failed: ${assignRes.status} ${assignRes.statusText}`);
  }
  const assign: AssignResponse = await assignRes.json();

  // Step 2: Upload file to the volume server
  const formData = new FormData();
  const blob = new Blob([buffer as unknown as BlobPart], { type: contentType });
  formData.append("file", blob, filename);

  const uploadUrl = `http://${assign.url}/${assign.fid}`;
  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  if (!uploadRes.ok) {
    throw new Error(`SeaweedFS upload failed: ${uploadRes.status} ${uploadRes.statusText}`);
  }

  console.log(`[SeaweedFS] Uploaded ${filename} as fid=${assign.fid}`);
  return assign.fid;
}

/**
 * Get the direct URL to download a file from SeaweedFS.
 * First looks up the volume ID to find the server, then constructs the URL.
 */
export async function getFileUrl(fid: string): Promise<string> {
  // fid format: "volumeId,fileKey" e.g. "3,01637037d6"
  const volumeId = fid.split(",")[0];

  const lookupRes = await fetch(`${MASTER_URL}/dir/lookup?volumeId=${volumeId}`);
  if (!lookupRes.ok) {
    throw new Error(`SeaweedFS lookup failed: ${lookupRes.status}`);
  }

  const lookup = await lookupRes.json();
  const url = lookup.locations?.[0]?.url || lookup.locations?.[0]?.publicUrl;

  if (!url) {
    throw new Error(`SeaweedFS: no location found for volume ${volumeId}`);
  }

  return `http://${url}/${fid}`;
}

/**
 * Download a file from SeaweedFS as a Buffer.
 */
export async function downloadFile(fid: string): Promise<Buffer> {
  const url = await getFileUrl(fid);
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`SeaweedFS download failed: ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Alternative: Upload via the Filer API (simpler path-based access).
 * Files are accessible at FILER_URL/path/filename
 */
export async function uploadViaFiler(
  buffer: Buffer,
  path: string,
  contentType = "application/pdf"
): Promise<string> {
  const formData = new FormData();
  const blob = new Blob([buffer as unknown as BlobPart], { type: contentType });
  const filename = path.split("/").pop() || "file";
  formData.append("file", blob, filename);

  const uploadRes = await fetch(`${FILER_URL}${path}`, {
    method: "POST",
    body: formData,
  });

  if (!uploadRes.ok) {
    throw new Error(`SeaweedFS filer upload failed: ${uploadRes.status}`);
  }

  console.log(`[SeaweedFS] Uploaded via filer: ${path}`);
  return path;
}

/**
 * Download a file via the Filer API.
 */
export async function downloadViaFiler(path: string): Promise<Buffer> {
  const res = await fetch(`${FILER_URL}${path}`);
  if (!res.ok) {
    throw new Error(`SeaweedFS filer download failed: ${res.status}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Delete a file from SeaweedFS by fid.
 */
export async function deleteFile(fid: string): Promise<void> {
  const url = await getFileUrl(fid);
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(`SeaweedFS delete failed: ${res.status}`);
  }
  console.log(`[SeaweedFS] Deleted fid=${fid}`);
}
