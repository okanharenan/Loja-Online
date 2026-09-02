import { Outlet } from "react-router-dom";
import Header from "../Header";
import Footer from "../Footer";
import { useCart } from "../../context/CartContext";

export default function Layout() {
  const { count } = useCart();

  return (
    <div className="layout">
      <Header cartCount={count} />
      <main className="layout__content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
