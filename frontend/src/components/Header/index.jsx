import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, LogOut } from "lucide-react";
import miniCartIcon from "/src/assets/mini-cart.svg";
import Logo from "../Logo";
import { useAuth } from "../../context/AuthContext";
import "./styles.css";

// "Categorias" ainda não tem uma página própria — aponta pra listagem geral
// de produtos até existir uma rota dedicada, pra não deixar o link morto.
const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/produtos", label: "Produtos" },
  { to: "/produtos", label: "Categorias" },
  { to: "/meus-pedidos", label: "Meus Pedidos" },
];

export default function Header({ cartCount = 0, initialQuery = "" }) {
  const [query, setQuery] = useState(initialQuery);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleSearchSubmit(e) {
    e.preventDefault();
    navigate(`/produtos?q=${encodeURIComponent(query)}`);
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  const firstName = user?.name?.split(" ")[0];

  return (
    <header className="header">
      <div className="container header__top">
        <Logo />

        <form
          className="header__search"
          onSubmit={handleSearchSubmit}
          role="search"
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar produto..."
            aria-label="Pesquisar produto"
          />
          <button type="submit" aria-label="Buscar">
            <Search size={18} />
          </button>
        </form>

        <div className="header__actions">
          {user ? (
            <div className="header__account">
              <span className="header__greeting">Olá, {firstName}</span>
              <button
                type="button"
                className="header__logout"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
          ) : (
            <>
              <Link to="/cadastro" className="header__signup">
                Cadastre-se
              </Link>
              <Link to="/entrar" className="header__login">
                Entrar
              </Link>
            </>
          )}
          <Link to="/carrinho" className="header__cart" aria-label="Carrinho">
            <img className="header__cart-icon" src={miniCartIcon} alt="" />
            {cartCount > 0 && (
              <span className="header__cart-badge">{cartCount}</span>
            )}
          </Link>
        </div>
      </div>

      <nav className="container header__nav">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.label}
            to={link.to}
            className={({ isActive }) =>
              "header__nav-link" + (isActive ? " header__nav-link--active" : "")
            }
            end={link.to === "/"}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
