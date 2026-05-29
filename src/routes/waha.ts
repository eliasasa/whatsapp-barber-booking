import { Router } from "express";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import {
  deleteSession,
  getServerStatus,
  getSession,
  getSessionMe,
  getSessionQr,
  listSessions,
  logoutSession,
  restartSession,
  startSession,
  stopSession,
} from "../whatsapp/wahaAdminClient";

const router = Router();

router.use(requireAdminAuth);

router.get("/server/status", async (_req, res) => {
  try {
    const status = await getServerStatus();
    return res.json(status);
  } catch (error: any) {
    return res.status(error?.response?.status || 500).json({
      error: error?.response?.data || error?.message || "Erro interno",
    });
  }
});

router.get("/sessions", async (_req, res) => {
  try {
    const sessions = await listSessions();
    return res.json({ sessions });
  } catch (error: any) {
    return res.status(error?.response?.status || 500).json({
      error: error?.response?.data || error?.message || "Erro interno",
    });
  }
});

router.get("/sessions/:session", async (req, res) => {
  try {
    const session = await getSession(req.params.session);
    return res.json(session);
  } catch (error: any) {
    return res.status(error?.response?.status || 500).json({
      error: error?.response?.data || error?.message || "Erro interno",
    });
  }
});

router.get("/sessions/:session/me", async (req, res) => {
  try {
    const me = await getSessionMe(req.params.session);
    return res.json(me);
  } catch (error: any) {
    return res.status(error?.response?.status || 500).json({
      error: error?.response?.data || error?.message || "Erro interno",
    });
  }
});

router.get("/sessions/:session/qr", async (req, res) => {
  try {
    const qr = await getSessionQr(req.params.session);
    return res.json(qr);
  } catch (error: any) {
    return res.status(error?.response?.status || 500).json({
      error: error?.response?.data || error?.message || "Erro interno",
    });
  }
});

router.post("/sessions/:session/start", async (req, res) => {
  try {
    const result = await startSession(req.params.session);
    return res.json(result);
  } catch (error: any) {
    return res.status(error?.response?.status || 500).json({
      error: error?.response?.data || error?.message || "Erro interno",
    });
  }
});

router.post("/sessions/:session/stop", async (req, res) => {
  try {
    const result = await stopSession(req.params.session);
    return res.json(result);
  } catch (error: any) {
    return res.status(error?.response?.status || 500).json({
      error: error?.response?.data || error?.message || "Erro interno",
    });
  }
});

router.post("/sessions/:session/restart", async (req, res) => {
  try {
    const result = await restartSession(req.params.session);
    return res.json(result);
  } catch (error: any) {
    return res.status(error?.response?.status || 500).json({
      error: error?.response?.data || error?.message || "Erro interno",
    });
  }
});

router.post("/sessions/:session/logout", async (req, res) => {
  try {
    const result = await logoutSession(req.params.session);
    return res.json(result);
  } catch (error: any) {
    return res.status(error?.response?.status || 500).json({
      error: error?.response?.data || error?.message || "Erro interno",
    });
  }
});

router.delete("/sessions/:session", async (req, res) => {
  try {
    const result = await deleteSession(req.params.session);
    return res.json(result);
  } catch (error: any) {
    return res.status(error?.response?.status || 500).json({
      error: error?.response?.data || error?.message || "Erro interno",
    });
  }
});

export default router;
