import express from "express";
import appointmentRoutes from "./routes/appointments";

export const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  return res.status(200).json({ status: "ok" });
});

app.use("/appointments", appointmentRoutes);
