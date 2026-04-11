import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { useProperties } from "@/hooks/useProperties";
import PropertyCard from "@/components/PropertyCard";
import SectionTitle from "@/components/SectionTitle";
import { findSection, usePublicPage } from "@/hooks/useCms";

interface Props {
  listing: "venda" | "aluguel";
}

export default function PropertiesPage({ listing }: Props) {
  const { properties, loading } = useProperties();
  const { data: rentalsPage } = usePublicPage("aluguel");
  const heroSection = findSection(rentalsPage, "hero");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return properties
      .filter((property) => property.listing === listing)
      .filter((property) => !typeFilter || property.type === typeFilter)
      .filter((property) =>
        !search ||
        property.title.toLowerCase().includes(search.toLowerCase()) ||
        property.city.toLowerCase().includes(search.toLowerCase()) ||
        property.location.toLowerCase().includes(search.toLowerCase())
      );
  }, [properties, listing, search, typeFilter]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center pb-16 pt-24 sm:pt-28">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="section-padding pt-24 sm:pt-28">
      <Helmet>
        <title>{rentalsPage?.seo?.seo_title || heroSection?.title || "Imoveis para Aluguel"}</title>
        <meta name="description" content={rentalsPage?.seo?.seo_description || heroSection?.subtitle || "Viva experiencias inesqueciveis nas melhores praias do Brasil."} />
      </Helmet>
      <div className="mobile-shell mx-auto">
        <SectionTitle
          label={listing === "venda" ? "Compre" : "Alugue"}
          title={heroSection?.title || (listing === "venda" ? "Imoveis a Venda" : "Imoveis para Aluguel")}
          subtitle={heroSection?.subtitle || (listing === "venda" ? "Encontre a propriedade perfeita para realizar seu sonho a beira-mar." : "Viva experiencias inesqueciveis nas melhores praias do Brasil.")}
        />

        <div className="mb-10 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Buscar por nome, cidade ou regiao..." value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-full border border-border bg-card py-3 pl-12 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-foreground transition-colors hover:bg-muted">
            <SlidersHorizontal size={16} /> Filtros
          </button>
        </div>

        {showFilters ? (
          <div className="mb-8 flex flex-wrap items-center gap-3 rounded-lg bg-card p-6 shadow-card">
            <span className="mr-2 text-sm font-medium text-foreground">Tipo:</span>
            {["", "casa", "villa", "apartamento", "terreno"].map((type) => (
              <button key={type} onClick={() => setTypeFilter(type)} className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${typeFilter === type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                {type ? type.charAt(0).toUpperCase() + type.slice(1) : "Todos"}
              </button>
            ))}
            {typeFilter || search ? (
              <button onClick={() => { setTypeFilter(""); setSearch(""); }} className="ml-auto flex items-center gap-1 text-sm text-destructive hover:underline">
                <X size={14} /> Limpar
              </button>
            ) : null}
          </div>
        ) : null}

        {filtered.length === 0 ? (
          <div className="py-20 text-center"><p className="text-lg text-muted-foreground">Nenhum imovel encontrado com esses filtros.</p></div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((property, index) => <PropertyCard key={property.id} property={property} index={index} />)}
          </div>
        )}
      </div>
    </div>
  );
}
