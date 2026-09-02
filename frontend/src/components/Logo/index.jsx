import { Link } from "react-router-dom";
import "./styles.css";

import logoHeader from "/src/assets/logo-header.svg";
import logoFooter from "/src/assets/logo-footer.svg";

export default function Logo({ variant = "dark" }) {
  const src = variant === "light" ? logoFooter : logoHeader;

  return (
    <Link to="/" className={`logo logo--${variant}`} aria-label="Digital Store">
      <img className="logo__image" src={src} alt="Digital Store" />
    </Link>
  );
}
