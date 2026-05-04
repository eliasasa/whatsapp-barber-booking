import { Router } from "express";
import {
  getClientById,
  updateClientFromAdmin,
  upsertClientByPhoneFromAdmin,
} from "../services/clients/clientService";
import { getAllClients } from "../services/clients/clientService";

const router = Router();

router.post("/block-by-phone", async (req, res) => {
  try {
    const { phone, botDisabled, name, notes } = req.body;

    if (typeof phone !== "string" || !phone.trim()) {
      return res.status(400).json({ error: "Telefone invalido" });
    }

    if (typeof botDisabled !== "boolean") {
      return res.status(400).json({ error: "botDisabled invalido" });
    }

    if (name !== undefined && typeof name !== "string") {
      return res.status(400).json({ error: "Nome invalido" });
    }

    if (notes !== undefined && notes !== null && typeof notes !== "string") {
      return res.status(400).json({ error: "Notes invalido" });
    }

    const updated = await upsertClientByPhoneFromAdmin({
      phone: phone.trim(),
      botDisabled,
      ...(typeof name === "string" ? { name: name.trim() } : {}),
      ...(notes === null || typeof notes === "string"
        ? { notes: typeof notes === "string" ? notes.trim() : notes }
        : {}),
    });

    return res.json(updated);
  } catch (err: any) {
    if (err.message) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/", async (req, res) => {
  try {
    const clients = await getAllClients();
    return res.json(clients);
  } catch (err: any) {
    if (err.message) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const client = await getClientById(id);

    if (!client) {
      return res.status(404).json({ error: "Cliente nao encontrado" });
    }

    return res.json(client);
  } catch (err: any) {
    console.error(err);

    if (err.message) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: "Erro interno" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, notes, botDisabled } = req.body;

    const hasName = typeof name === "string";
    const hasNotes = typeof notes === "string" || notes === null;
    const hasBotDisabled = typeof botDisabled === "boolean";

    if (!hasName && !hasNotes && !hasBotDisabled) {
      return res.status(400).json({ error: "Envie name, notes e/ou botDisabled" });
    }

    if (name !== undefined && typeof name !== "string") {
      return res.status(400).json({ error: "Nome invalido" });
    }

    if (notes !== undefined && notes !== null && typeof notes !== "string") {
      return res.status(400).json({ error: "Notes invalido" });
    }

    if (botDisabled !== undefined && typeof botDisabled !== "boolean") {
      return res.status(400).json({ error: "botDisabled invalido" });
    }

    const trimmedName = typeof name === "string" ? name.trim() : undefined;

    if (trimmedName !== undefined && !trimmedName) {
      return res.status(400).json({ error: "Nome invalido" });
    }

    const normalizedNotes = typeof notes === "string" ? notes.trim() : notes;

    const updateInput: {
      clientId: string;
      name?: string;
      notes?: string | null;
      botDisabled?: boolean;
    } = {
      clientId: id,
    };

    if (trimmedName !== undefined) {
      updateInput.name = trimmedName;
    }

    if (normalizedNotes !== undefined) {
      updateInput.notes = normalizedNotes;
    }

    if (hasBotDisabled) {
      updateInput.botDisabled = botDisabled;
    }

    const updatedClient = await updateClientFromAdmin(updateInput);

    return res.json(updatedClient);
  } catch (err: any) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Cliente nao encontrado" });
    }

    if (err.message) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: "Erro interno" });
  }
});

export default router;