import { MessageCircle } from "lucide-react";
import { CONTACT_WHATSAPP_URL } from "@/lib/contact";

export default function WhatsAppButton() {
  return (
    <a
      href={CONTACT_WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[hsl(142,70%,45%)] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
      aria-label="Contato via WhatsApp"
    >
      <MessageCircle size={28} className="text-card" />
    </a>
  );
}
