import axios from "axios";

const WAHA_API_URL = process.env.WAHA_API_URL || "http://localhost:3001";
const WAHA_API_KEY = process.env.WAHA_API_KEY;

const wahaHttp = axios.create({
  baseURL: WAHA_API_URL,
  headers: {
    ...(WAHA_API_KEY ? { "X-Api-Key": WAHA_API_KEY } : {}),
  },
});

export type WahaSessionStatus =
  | "STOPPED"
  | "STARTING"
  | "SCAN_QR_CODE"
  | "WORKING"
  | "FAILED"
  | string;

export type WahaSessionSummary = {
  name: string;
  status?: WahaSessionStatus;
  me?: {
    id?: string;
    pushName?: string;
  } | null;
  engine?: {
    engine?: string;
  };
  config?: Record<string, unknown>;
};

function getSessionName(session = "default") {
  return session.trim() || "default";
}

export async function getServerStatus() {
  const response = await wahaHttp.get("/api/server/status");
  return response.data;
}

export async function listSessions() {
  const response = await wahaHttp.get<WahaSessionSummary[]>("/api/sessions", {
    params: { all: true },
  });

  return response.data;
}

export async function getSession(session = "default") {
  const response = await wahaHttp.get<WahaSessionSummary>(
    `/api/sessions/${encodeURIComponent(getSessionName(session))}`,
  );

  return response.data;
}

export async function getSessionMe(session = "default") {
  const response = await wahaHttp.get(
    `/api/sessions/${encodeURIComponent(getSessionName(session))}/me`,
  );

  return response.data;
}

export async function getSessionQr(session = "default") {
  const response = await wahaHttp.get(
    `/api/${encodeURIComponent(getSessionName(session))}/auth/qr`,
    {
      params: { format: "raw" },
    },
  );

  return response.data;
}

export async function startSession(session = "default") {
  const response = await wahaHttp.post(
    `/api/sessions/${encodeURIComponent(getSessionName(session))}/start`,
  );

  return response.data;
}

export async function stopSession(session = "default") {
  const response = await wahaHttp.post(
    `/api/sessions/${encodeURIComponent(getSessionName(session))}/stop`,
  );

  return response.data;
}

export async function restartSession(session = "default") {
  const response = await wahaHttp.post(
    `/api/sessions/${encodeURIComponent(getSessionName(session))}/restart`,
  );

  return response.data;
}

export async function logoutSession(session = "default") {
  const response = await wahaHttp.post(
    `/api/sessions/${encodeURIComponent(getSessionName(session))}/logout`,
  );

  return response.data;
}

export async function deleteSession(session = "default") {
  const response = await wahaHttp.delete(
    `/api/sessions/${encodeURIComponent(getSessionName(session))}`,
  );

  return response.data;
}
