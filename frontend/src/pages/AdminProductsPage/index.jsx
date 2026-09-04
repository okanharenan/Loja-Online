import { useEffect, useState } from "react";
import { productsApi } from "../../services/api";
import { formatPrice } from "../../utils/format";
import "./styles.css";

const EMPTY_FORM = {
  name: "",
  slug: "",
  description: "",
  price: "",
  oldPrice: "",
  imageUrl: "",
  category: "",
  brand: "",
  gender: "",
  sizes: "",
  colors: "",
  stock: "",
};

// Converte um texto em slug, removendo acentos e caracteres especiais.
function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Painel simples de gestão de catálogo — pra quem tem role ADMIN não
// precisar mexer direto no banco pra cadastrar/editar/remover produto.
export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  function loadProducts() {
    setLoading(true);
    productsApi
      .list({ limit: 60 })
      .then((data) => setProducts(data.products))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(loadProducts, []);

  function handleNameChange(value) {
    setForm((f) => ({
      ...f,
      name: value,
      slug: slugTouched ? f.slug : slugify(value),
    }));
  }

  function startEdit(product) {
    setEditingId(product.id);
    setSlugTouched(true);
    setForm({
      name: product.name || "",
      slug: product.slug || "",
      description: product.description || "",
      price: product.price ?? "",
      oldPrice: product.oldPrice ?? "",
      imageUrl: product.imageUrl || "",
      category: product.category || "",
      brand: product.brand || "",
      gender: product.gender || "",
      sizes: (product.sizes || []).join(", "),
      colors: (product.colors || []).join(", "),
      stock: product.stock ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setSlugTouched(false);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Constrói o payload a ser enviado pro backend, convertendo tipos e
    // removendo campos vazios.
    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description || undefined,
      price: Number(form.price),
      oldPrice: form.oldPrice ? Number(form.oldPrice) : undefined,
      imageUrl: form.imageUrl || undefined,
      category: form.category || undefined,
      brand: form.brand || undefined,
      gender: form.gender || undefined,
      stock: form.stock ? Number(form.stock) : undefined,
      sizes: form.sizes
        ? form.sizes.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined,
      colors: form.colors
        ? form.colors.split(",").map((c) => c.trim()).filter(Boolean)
        : undefined,
    };

    try {
      if (editingId) {
        await productsApi.update(editingId, payload);
      } else {
        await productsApi.create(payload);
      }
      resetForm();
      loadProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Remover este produto do catálogo?")) return;
    try {
      await productsApi.remove(id);
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="container admin-products">
      <h1>Gerenciar produtos</h1>

      <form className="admin-products__form" onSubmit={handleSubmit}>
        <h2>{editingId ? "Editar produto" : "Novo produto"}</h2>

        {error && <p className="admin-products__error">{error}</p>}

        <div className="admin-products__grid">
          <label>
            Nome
            <input
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </label>

          <label>
            Slug
            <input
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((f) => ({ ...f, slug: e.target.value }));
              }}
              required
            />
          </label>

          <label>
            Preço (R$)
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              required
            />
          </label>

          <label>
            Preço antigo (R$)
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.oldPrice}
              onChange={(e) => setForm((f) => ({ ...f, oldPrice: e.target.value }))}
            />
          </label>

          <label>
            Estoque
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
            />
          </label>

          <label>
            Categoria
            <input
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
          </label>

          <label>
            Marca
            <input
              value={form.brand}
              onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
            />
          </label>

          <label>
            Gênero
            <select
              value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
            >
              <option value="">—</option>
              <option value="MASCULINO">Masculino</option>
              <option value="FEMININO">Feminino</option>
              <option value="UNISSEX">Unissex</option>
            </select>
          </label>

          <label>
            URL da imagem
            <input
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              placeholder="/produc-image-1.jpeg ou https://..."
            />
          </label>

          <label>
            Tamanhos (separados por vírgula)
            <input
              value={form.sizes}
              onChange={(e) => setForm((f) => ({ ...f, sizes: e.target.value }))}
              placeholder="39, 40, 41"
            />
          </label>

          <label>
            Cores (separadas por vírgula)
            <input
              value={form.colors}
              onChange={(e) => setForm((f) => ({ ...f, colors: e.target.value }))}
              placeholder="black, white"
            />
          </label>
        </div>

        <label className="admin-products__description-field">
          Descrição
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </label>

        <div className="admin-products__form-actions">
          <button type="submit" disabled={saving}>
            {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Criar produto"}
          </button>
          {editingId && (
            <button type="button" className="admin-products__cancel" onClick={resetForm}>
              Cancelar edição
            </button>
          )}
        </div>
      </form>

      <h2 className="admin-products__list-title">Catálogo ({products.length})</h2>

      {loading && <p>Carregando...</p>}

      {!loading && (
        <table className="admin-products__table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Preço</th>
              <th>Estoque</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td className="admin-products__cell-name">
                  <img src={product.imageUrl} alt="" />
                  {product.name}
                </td>
                <td>{product.category || "—"}</td>
                <td>{formatPrice(product.price)}</td>
                <td>{product.stock}</td>
                <td className="admin-products__cell-actions">
                  <button type="button" onClick={() => startEdit(product)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="admin-products__delete"
                    onClick={() => handleDelete(product.id)}
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}