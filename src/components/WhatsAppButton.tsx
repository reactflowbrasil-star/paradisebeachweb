import { useMemo, useState } from "react";
import { Headset, MessageCircle, Send, X } from "lucide-react";

const ATTENDANCE_NUMBER = "5581965200169";

export default function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  const whatsappUrl = useMemo(() => {
    const defaultText = "Ola! Quero iniciar um atendimento online ao vivo na Paradise Beach.";
    const userText = message.trim();
    const text = userText.length > 0 ? `Ola! ${userText}` : defaultText;
    return `https://wa.me/${ATTENDANCE_NUMBER}?text=${encodeURIComponent(text)}`;
  }, [message]);

  return (
    <div className="fixed bottom-5 right-4 z-[60] sm:bottom-6 sm:right-6">
      {isOpen && (
        <div className="mb-3 w-[92vw] max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="bg-gradient-ocean px-4 py-3 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold leading-tight">Atendimento Online ao Vivo</p>
                <p className="mt-1 flex items-center gap-2 text-xs text-white/90">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
                  Atendente online agora
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1.5 text-white/90 transition-colors hover:bg-white/15 hover:text-white"
                aria-label="Fechar atendimento"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-3 p-4">
            <div className="rounded-xl bg-slate-100 p-3 text-xs leading-relaxed text-slate-600">
              Bem-vindo(a)! Nossa equipe pode te ajudar em tempo real com reservas, fotos e valores.
            </div>

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Digite sua duvida para iniciar o atendimento..."
              className="h-24 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
            />

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="button-pop flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[hsl(142,70%,45%)] px-4 text-sm font-semibold text-white shadow-card"
              aria-label="Iniciar atendimento ao vivo no WhatsApp"
            >
              <Send size={16} />
              Iniciar atendimento agora
            </a>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((value) => !value)}
        className="button-pop flex h-14 items-center gap-2 rounded-full bg-[hsl(174,72%,36%)] px-4 text-white shadow-xl"
        aria-label={isOpen ? "Fechar atendimento online" : "Abrir atendimento online"}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
          {isOpen ? <MessageCircle size={20} /> : <Headset size={20} />}
        </span>
        <span className="pr-1 text-sm font-semibold">Atendimento ao vivo</span>
      </button>
    </div>
  );
}
