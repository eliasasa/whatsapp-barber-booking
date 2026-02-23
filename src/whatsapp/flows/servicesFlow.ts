import { listServices } from "../../services/catalog/ListServicesService";
import { resetConversation } from "../conversation/conversationStore";

export async function servicesFlow(from: string): Promise<string> {
  const services = await listServices();

  if (!services.length) {
    return "❌ Nenhum serviço disponível no momento.";
  }

  const formatted = services.map((service, index) => {
    const price = Number(service.price)
      .toFixed(2)
      .replace(".", ",");

    return `${index + 1}️. *${service.name}*\n💰 R$ ${price}\n⏱ ${service.duration} min`;
  });

  resetConversation(from);

  return `💈 *Nossos serviços disponíveis:*\n\n${formatted.join("\n\n")}`;
}
