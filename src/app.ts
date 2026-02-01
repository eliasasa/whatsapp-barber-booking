import express from "express";
import appointmentRoutes from "./routes/appointments";
import availabilityRoutes from "./routes/availability";


export const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  return res.status(200).json({ status: "ok" });
});

app.use("/appointments", appointmentRoutes);

app.use("/availability", availabilityRoutes);

