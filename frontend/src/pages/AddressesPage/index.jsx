import { useEffect, useState } from "react";
import { addressApi } from "../../services/api";
import "./styles.css";

const EMPTY_FORM = {
  label: "",
  recipientName: "",
  zipCode: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  isDefault: false,
};

const BRAZIL_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

export default function AddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  function loadAddresses() {
    setLoading(true);
    addressApi
      .list()
      .then((data) => setAddresses(data.addresses))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(loadAddresses, []);

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(false);
  }

  function startEdit(address) {
    setEditingId(address.id);
    setForm({
      label: address.label || "",
      recipientName: address.recipientName,
      zipCode: address.zipCode,
      street: address.street,
      number: address.number,
      complement: address.complement || "",
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      isDefault: address.isDefault,
    });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      label: form.label || undefined,
      complement: form.complement || undefined,
      state: form.state.toUpperCase(),
    };

    try {
      if (editingId) {
        await addressApi.update(editingId, payload);
      } else {
        await addressApi.create(payload);
      }
      resetForm();
      loadAddresses();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Remover este endereço?")) return;
    try {
      await addressApi.remove(id);
      loadAddresses();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSetDefault(address) {
    try {
      await addressApi.update(address.id, { isDefault: true });
      loadAddresses();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="container addresses-page">
      <div className="addresses-page__header">
        <h1>Meus endereços</h1>
        {!showForm && (
          <button type="button" onClick={() => setShowForm(true)}>
            + Adicionar endereço
          </button>
        )}
      </div>

      {error && <p className="addresses-page__error">{error}</p>}

      {showForm && (
        <form className="addresses-page__form" onSubmit={handleSubmit}>
          <h2>{editingId ? "Editar endereço" : "Novo endereço"}</h2>

          <div className="addresses-page__grid">
            <label>
              Apelido (opcional)
              <input
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="Casa, Trabalho..."
              />
            </label>

            <label>
              Nome do destinatário
              <input
                value={form.recipientName}
                onChange={(e) => setForm((f) => ({ ...f, recipientName: e.target.value }))}
                required
              />
            </label>

            <label>
              CEP
              <input
                value={form.zipCode}
                onChange={(e) => setForm((f) => ({ ...f, zipCode: e.target.value }))}
                placeholder="00000-000"
                required
              />
            </label>

            <label>
              Rua
              <input
                value={form.street}
                onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
                required
              />
            </label>

            <label>
              Número
              <input
                value={form.number}
                onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
                required
              />
            </label>

            <label>
              Complemento (opcional)
              <input
                value={form.complement}
                onChange={(e) => setForm((f) => ({ ...f, complement: e.target.value }))}
                placeholder="Apto, bloco..."
              />
            </label>

            <label>
              Bairro
              <input
                value={form.neighborhood}
                onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
                required
              />
            </label>

            <label>
              Cidade
              <input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                required
              />
            </label>

            <label>
              Estado
              <select
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                required
              >
                <option value="">Selecione</option>
                {BRAZIL_STATES.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="addresses-page__checkbox">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
            />
            Definir como endereço padrão
          </label>

          <div className="addresses-page__form-actions">
            <button type="submit" disabled={saving}>
              {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Adicionar endereço"}
            </button>
            <button type="button" className="addresses-page__cancel" onClick={resetForm}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading && <p>Carregando...</p>}

      {!loading && addresses.length === 0 && !showForm && (
        <p className="addresses-page__empty">
          Você ainda não tem nenhum endereço cadastrado.
        </p>
      )}

      <ul className="addresses-page__list">
        {addresses.map((address) => (
          <li key={address.id} className="addresses-page__card">
            {address.isDefault && (
              <span className="addresses-page__badge">Padrão</span>
            )}
            <strong>{address.label || "Endereço"}</strong>
            <span>{address.recipientName}</span>
            <span>
              {address.street}, {address.number}
              {address.complement && ` — ${address.complement}`}
            </span>
            <span>
              {address.neighborhood}, {address.city} - {address.state}
            </span>
            <span>CEP: {address.zipCode}</span>

            <div className="addresses-page__card-actions">
              <button type="button" onClick={() => startEdit(address)}>
                Editar
              </button>
              {!address.isDefault && (
                <button type="button" onClick={() => handleSetDefault(address)}>
                  Tornar padrão
                </button>
              )}
              <button
                type="button"
                className="addresses-page__delete"
                onClick={() => handleDelete(address.id)}
              >
                Remover
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}