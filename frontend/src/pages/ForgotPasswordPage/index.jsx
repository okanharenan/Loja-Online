import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../../services/api";
import "../LoginPage/styles.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      // A resposta da API é sempre genérica (não revela se o e-mail existe
      // ou não) — então a tela mostra sempre a mesma mensagem de sucesso.
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="container auth-page">
        <div className="auth-form">
          <h1>Verifique seu e-mail</h1>
          <p>
            Se <strong>{email}</strong> estiver cadastrado, você vai receber um
            link para redefinir sua senha em alguns minutos.
          </p>
          <p className="auth-form__switch">
            <Link to="/entrar">Voltar para o login</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Esqueci minha senha</h1>
        <p>Digite seu e-mail e enviaremos um link para você criar uma nova senha.</p>

        {error && <p className="auth-form__error">{error}</p>}

        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Enviando..." : "Enviar link de redefinição"}
        </button>

        <p className="auth-form__switch">
          <Link to="/entrar">Voltar para o login</Link>
        </p>
      </form>
    </div>
  );
}