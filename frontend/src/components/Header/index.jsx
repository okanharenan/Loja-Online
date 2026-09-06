import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Search, LogOut, Heart } from "lucide-react";
import miniCartIcon from "/src/assets/mini-cart.svg";
import Logo from "../Logo";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";
import "./styles.css";

// "Categorias" ainda não tem uma página própria — leva pra mesma listagem de
// "Produtos", só que com ?view=categorias na URL. Isso é o que permite saber
// qual das duas abas foi clicada por último (e destacar só ela), já que as
// duas apontam pro mesmo /produtos.

export default function Header({ cartCount = 0, initialQuery = "" }) {
  const [query, setQuery] = useState(initialQuery);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { count: wishlistCount } = useWishlist();

  function handleSearchSubmit(e) {
    e.preventDefault();
    navigate(`/produtos?q=${encodeURIComponent(query)}`);
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  const firstName = user?.name?.split(" ")[0];

  const isProdutosPage = location.pathname === "/produtos";
  const isCategoriasView = new URLSearchParams(location.search).get("view") === "categorias";
  const isProdutosActive = isProdutosPage && !isCategoriasView;
  const isCategoriasActive = isProdutosPage && isCategoriasView;

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
          {user && (
            <Link to="/favoritos" className="header__wishlist" aria-label="Favoritos">
              <Heart size={20} />
              {wishlistCount > 0 && (
                <span className="header__cart-badge">{wishlistCount}</span>
              )}
            </Link>
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
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            "header__nav-link" + (isActive ? " header__nav-link--active" : "")
          }
        >
          Home
        </NavLink>
        <Link
          to="/produtos"
          className={
            "header__nav-link" + (isProdutosActive ? " header__nav-link--active" : "")
          }
        >
          Produtos
        </Link>
        <Link
          to="/produtos?view=categorias"
          className={
            "header__nav-link" + (isCategoriasActive ? " header__nav-link--active" : "")
          }
        >
          Categorias
        </Link>
        <NavLink
          to="/meus-pedidos"
          className={({ isActive }) =>
            "header__nav-link" + (isActive ? " header__nav-link--active" : "")
          }
        >
          Meus Pedidos
        </NavLink>
        {user?.role === "ADMIN" && (
          <NavLink
            to="/admin/produtos"
            className={({ isActive }) =>
              "header__nav-link" + (isActive ? " header__nav-link--active" : "")
            }
          >
            Admin
          </NavLink>
        )}
      </nav>
    </header>
  );
}