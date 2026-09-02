import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import FilterGroup from "../../components/FilterGroup";
import ProductListing from "../../components/ProductListing";
import { productsApi } from "../../services/api";
import { adaptProductSummary } from "../../utils/productAdapter";
import "./styles.css";

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: "relevantes", label: "mais relevantes" },
  { value: "menor-preco", label: "menor preço" },
  { value: "maior-preco", label: "maior preço" },
];

// Listas fixas pra bater com o painel de filtros do design — independem do
// que já está cadastrado no banco (é assim que a maioria das lojas monta o
// filtro: mostra as opções disponíveis, não só as que têm produto agora).
const MARCA_OPTIONS = ["Adidas", "Balenciaga", "K-Swiss", "Nike", "Puma"];
const CATEGORIA_OPTIONS = ["Tênis", "Esporte e lazer", "Casual", "Utilitário", "Corrida"];
const GENERO_OPTIONS = [
  { label: "Masculino", value: "MASCULINO" },
  { label: "Feminino", value: "FEMININO" },
  { label: "Unissex", value: "UNISSEX" },
];

export default function ProductListingPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const categoryFromUrl = searchParams.get("category") || "";
  const brandFromUrl = searchParams.get("brand") || "";

  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("relevantes");

  const [selectedBrands, setSelectedBrands] = useState(
    brandFromUrl ? [brandFromUrl] : []
  );
  const [selectedCategories, setSelectedCategories] = useState(
    categoryFromUrl ? [categoryFromUrl] : []
  );
  const [selectedGenders, setSelectedGenders] = useState([]);

  // Sempre que um filtro/busca muda, volta pra primeira página — senão a
  // gente ia continuar acumulando resultados da busca anterior.
  useEffect(() => {
    setPage(1);
  }, [query, selectedCategories, selectedBrands, selectedGenders]);

  useEffect(() => {
    let cancelled = false;
    const isFirstPage = page === 1;
    if (isFirstPage) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    productsApi
      .list({
        q: query || undefined,
        category: selectedCategories,
        brand: selectedBrands,
        gender: selectedGenders,
        page,
        limit: PAGE_SIZE,
      })
      .then((data) => {
        if (cancelled) return;
        const adapted = data.products.map(adaptProductSummary);
        setProducts((prev) => (isFirstPage ? adapted : [...prev, ...adapted]));
        setMeta(data.meta);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setLoadingMore(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, selectedCategories, selectedBrands, selectedGenders, page]);

  // Ordenação é aplicada só sobre o que já foi carregado — pra ordenar o
  // catálogo inteiro no servidor seria preciso mandar o sort pra API.
  const sortedProducts = useMemo(() => {
    const list = [...products];
    if (sortBy === "menor-preco") list.sort((a, b) => a.price - b.price);
    if (sortBy === "maior-preco") list.sort((a, b) => b.price - a.price);
    return list;
  }, [products, sortBy]);

  function handleGenderChange(labels) {
    const values = GENERO_OPTIONS.filter((g) => labels.includes(g.label)).map(
      (g) => g.value
    );
    setSelectedGenders(values);
  }

  const genderLabelsSelected = GENERO_OPTIONS.filter((g) =>
    selectedGenders.includes(g.value)
  ).map((g) => g.label);

  const hasMore = page < meta.totalPages;

  return (
    <div className="container listing-page">
      <div className="listing-page__header">
        <h1>
          {query ? `Resultados para "${query}"` : "Todos os produtos"}{" "}
          <span>- {meta.total} produtos</span>
        </h1>

        <label className="listing-page__sort">
          Ordenar por:
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="listing-page__body">
        <aside className="listing-page__sidebar">
          <h2 className="listing-page__sidebar-title">Filtrar por</h2>

          <FilterGroup
            title="Marca"
            options={MARCA_OPTIONS}
            selected={selectedBrands}
            onChange={setSelectedBrands}
          />

          <FilterGroup
            title="Categoria"
            options={CATEGORIA_OPTIONS}
            selected={selectedCategories}
            onChange={setSelectedCategories}
          />

          <FilterGroup
            title="Gênero"
            options={GENERO_OPTIONS.map((g) => g.label)}
            selected={genderLabelsSelected}
            onChange={handleGenderChange}
          />
        </aside>

        <main className="listing-page__results">
          {loading && <p>Carregando produtos...</p>}
          {error && <p className="listing-page__error">Erro: {error}</p>}
          {!loading && !error && sortedProducts.length === 0 && (
            <p className="listing-page__empty">
              Nenhum produto encontrado com esses filtros.
            </p>
          )}
          {!loading && !error && sortedProducts.length > 0 && (
            <>
              <ProductListing products={sortedProducts} columns={3} />

              {hasMore && (
                <div className="listing-page__load-more">
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={loadingMore}
                  >
                    {loadingMore ? "Carregando..." : "Carregar mais"}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
