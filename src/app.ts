import express from "express";
import appointmentRoutes from "./routes/appointments";
import authRoutes from "./routes/auth";
import availabilityRoutes from "./routes/availability";
import availabilityBlocksRoutes from "./routes/availabilityBlocks";
import availabilitySlotsRoutes from "./routes/availabilitySlots";
import cancelAppointmentRoutes from "./routes/cancelAppointment";
import rescheduleAppointmentRoutes from "./routes/rescheduleAppointment";
import dailyAgendaRoutes from "./routes/dailyAgenda";
import webhookRoutes from "./routes/webhook";
import clientsRoutes from "./routes/clients";
import botMessagesRoutes from "./routes/botMessages";
import servicesRoutes from "./routes/services";
import botStateRoutes from "./routes/botState";
import cors from "cors";

export const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  return res.status(200).json({ status: "ok" });
});

app.use("/appointments", appointmentRoutes);

app.use("/auth", authRoutes);

app.use("/availability", availabilityRoutes);

app.use("/availability-blocks", availabilityBlocksRoutes);

app.use("/availability-slots", availabilitySlotsRoutes);

app.use("/appointments", cancelAppointmentRoutes);

app.use("/appointments", rescheduleAppointmentRoutes);

app.use("/agenda", dailyAgendaRoutes);

app.use("/clients", clientsRoutes);

app.use("/bot-messages", botMessagesRoutes);

app.use("/services", servicesRoutes);

app.use("/bot", botStateRoutes);

app.use("/webhook", webhookRoutes);
