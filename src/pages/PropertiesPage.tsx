import { useState, useMemo } from "react";
import { properties } from "@/data/properties";
import PropertyCard from "@/components/PropertyCard";
import SectionTitle from "@/components/SectionTitle";
import { Search, SlidersHorizontal, X } from "lucide-react";

interface Props {
  listing: "venda" | "aluguel";
}

export default function PropertiesPage({ listing }: Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return properties
      .filter((p) => p.listing === listing)
      .filter((p) => !typeFilter || p.type === typeFilter)
      .filter((p) =>
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.city.toLowerCase().includes(search.toLowerCase()) ||
        p.location.toLowerCase().includes(search.toLowerCase())
      );
  }, [listing, search, typeFilter]);


  return (
    <div className="pb-16 pt-24 sm:pt-28">
      <div className="mobile-shell mx-auto">
        <SectionTitle
          label={listing === "venda" ? "Compre" : "Alugue"}
          title={listing === "venda" ? "Imóveis à Venda" : "Imóveis para Aluguel"}
          subtitle={listing === "venda"
            ? "Encontre a propriedade perfeita para realizar seu sonho à beira-mar."
            : "Viva experiências inesquecíveis nas melhores praias do Brasil."
          }
        />

        {/* Filters */}
        <div className="mb-10 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome, cidade ou região..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-full border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-6 py-3 rounded-full border border-border bg-card text-foreground hover:bg-muted transition-colors"
          >
            <SlidersHorizontal size={16} /> Filtros
          </button>
        </div>

        {showFilters && (
          <div className="mb-8 p-6 bg-card rounded-lg shadow-card flex flex-wrap gap-3 items-center">
            <span className="text-sm font-medium text-foreground mr-2">Tipo:</span>
            {["", "casa", "villa", "apartamento", "terreno"].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  typeFilter === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {t ? t.charAt(0).toUpperCase() + t.slice(1) : "Todos"}
              </button>
            ))}
            {(typeFilter || search) && (
              <button
                onClick={() => { setTypeFilter(""); setSearch(""); }}
                className="ml-auto flex items-center gap-1 text-sm text-destructive hover:underline"
              >
                <X size={14} /> Limpar
              </button>
            )}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">Nenhum imóvel encontrado com esses filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((p, i) => (
              <PropertyCard key={p.id} property={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
