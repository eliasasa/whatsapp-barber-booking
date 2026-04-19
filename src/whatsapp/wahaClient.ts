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

function extractDigits(value: string): string {
    return value.replace(/\D/g, "");
}

function parsePhoneFromLidsResponse(data: any): string | null {
    if (!data) return null;

    const candidates = [
        data?.phoneNumber,
        data?.phone,
        data?.pn,
        data?.chatId,
        data?.jid,
        data?.user?.phoneNumber,
        data?.user?.phone,
        data?.user?.pn,
        data?.user?.chatId,
    ].filter(Boolean);

    for (const candidate of candidates) {
        const asString = String(candidate);
        const digits = extractDigits(asString);
        if (asString.endsWith("@c.us") || digits.length >= 10) {
            return digits;
        }
    }

    return null;
}

export async function resolvePhoneFromLid(
    lidChatId: string,
    session = "default"
): Promise<string | null> {
    if (!lidChatId.endsWith("@lid")) {
        return null;
    }

    const lid = lidChatId.replace(/@lid$/, "");

    try {
        const response = await axios.get(`${WAHA_API_URL}/api/${session}/lids/${encodeURIComponent(lid)}`,
            {
                headers: {
                    ...(WAHA_API_KEY && { "X-Api-Key": WAHA_API_KEY }),
                },
            }
        );

        return parsePhoneFromLidsResponse(response.data);
    } catch (error: any) {
        if (error.response?.status !== 404) {
            console.warn("⚠️ Não foi possível resolver LID via WAHA Lids:", lidChatId);
        }
        return null;
    }
}

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

    if (!to.endsWith("@c.us") && !to.endsWith("@lid")) {
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
