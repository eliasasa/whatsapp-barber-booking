import { listServices } from "../../services/catalog/ListServicesService";

export async function servicesFlow(): Promise<string> {
  const services = await listServices();

  if (!services.length) {
    return "❌ Nenhum serviço disponível no momento.";
  }

  const formatted = services.map((service, index) => {
    const price = Number(service.price)
      .toFixed(2)
      .replace(".", ",");

    return `${index + 1}️⃣ *${service.name}*\n💰 R$ ${price}\n⏱ ${service.duration} min`;
  });

  return `💈 *Nossos serviços disponíveis:*\n\n${formatted.join("\n\n")}`;
}
