import axios from "axios";

const WAHA_API_URL = process.env.WAHA_API_URL || "http://localhost:3001";
const WAHA_API_KEY = process.env.WAHA_API_KEY;

if (!WAHA_API_KEY) {
    console.warn("⚠️ WAHA_API_KEY não definida no .env");
}

type SendMessageParams = {
    to: string;
    text: string;
    session?: string;
};

export async function sendMessage({
    to,
    text,
    session = "default",
}: SendMessageParams): Promise<void> {

    if (to === "status@broadcast") {
        console.warn("🚫 Tentativa de envio para STATUS bloqueada");
        return;
    }

    if (to.endsWith("@g.us")) {
        console.warn("🚫 Envio para GRUPO bloqueado:", to);
        return;
    }

    if (to.endsWith("@broadcast")) {
        console.warn("🚫 Envio para LISTA DE TRANSMISSÃO bloqueado:", to);
        return;
    }

    if (to === "me" || to === "self") {
        console.warn("🚫 Envio para o próprio bot bloqueado");
        return;
    }

    if (!to.endsWith("@c.us")) {
        console.warn("🚫 Destino inválido ou não permitido:", to);
        return;
    }

    try {
        await axios.post(
        `${WAHA_API_URL}/api/sendText`,
        {
            session,
            chatId: to,
            text,
        },
        {
            headers: {
            "Content-Type": "application/json",
            ...(WAHA_API_KEY && { "X-Api-Key": WAHA_API_KEY }),
            },
        }
        );
    } catch (error: any) {
        console.error("❌ Erro ao enviar mensagem pelo WAHA");

        if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
        } else {
        console.error(error.message);
        }
    }
}
