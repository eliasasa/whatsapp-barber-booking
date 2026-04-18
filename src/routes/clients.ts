import { Router } from "express";
import { getClientById, updateClientName } from "../services/clients/clientService";

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
    const { name } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Nome invalido" });
    }

    const updatedClient = await updateClientName(id, name.trim());
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