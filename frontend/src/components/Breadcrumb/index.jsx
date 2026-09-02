import { Link } from "react-router-dom";
import "./styles.css";

// items: [{ label: "Home", href: "/" }, { label: "Produtos", href: "/produtos" }, { label: "Tênis Nike..." }]
// O último item não precisa de href — ele é o item "atual", sem link.
export default function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb" aria-label="breadcrumb">
      {items.map((item, index) => (
        <span key={index} className="breadcrumb__item">
          {item.href ? (
            <Link to={item.href} className="breadcrumb__link">
              {item.label}
            </Link>
          ) : (
            <span className="breadcrumb__current">{item.label}</span>
          )}
          {index < items.length - 1 && (
            <span className="breadcrumb__separator" aria-hidden="true">
              /
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
