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
