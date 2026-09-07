import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../../services/api";
import "../LoginPage/styles.css";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      navigate("/entrar", {
        replace: true,
        state: { message: "Senha redefinida! Já pode entrar com a nova senha." },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="container auth-page">
        <div className="auth-form">
          <h1>Link inválido</h1>
          <p>Esse link de redefinição de senha está incompleto ou é inválido.</p>
          <p className="auth-form__switch">
            <Link to="/esqueci-senha">Pedir um novo link</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Criar nova senha</h1>

        {error && <p className="auth-form__error">{error}</p>}

        <label>
          Nova senha
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </label>

        <label>
          Confirmar nova senha
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={6}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Redefinir senha"}
        </button>
      </form>
    </div>
  );
}