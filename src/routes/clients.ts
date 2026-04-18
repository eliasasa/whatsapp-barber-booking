import { Router } from "express";
import { getClientById } from "../services/clients/clientService";

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

export default router;