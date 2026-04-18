import { Router } from "express";
import { getClientById, updateClientFromPanel } from "../services/clients/clientService";

const router = Router();

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
    const { name, notes } = req.body;

    const hasName = typeof name === "string";
    const hasNotes = typeof notes === "string" || notes === null;

    if (!hasName && !hasNotes) {
      return res.status(400).json({ error: "Envie name e/ou notes" });
    }

    if (name !== undefined && typeof name !== "string") {
      return res.status(400).json({ error: "Nome invalido" });
    }

    if (notes !== undefined && notes !== null && typeof notes !== "string") {
      return res.status(400).json({ error: "Notes invalido" });
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
    } = {
      clientId: id,
    };

    if (trimmedName !== undefined) {
      updateInput.name = trimmedName;
    }

    if (normalizedNotes !== undefined) {
      updateInput.notes = normalizedNotes;
    }

    const updatedClient = await updateClientFromPanel(updateInput);

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