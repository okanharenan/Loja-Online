import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import "./styles.css";

export default function Section({ title, viewAllHref, children, className = "" }) {
  return (
    <section className={`section ${className}`}>
      <div className="container">
        {title && (
          <div className="section__header">
            <h2 className="section__title">{title}</h2>
            {viewAllHref && (
              <Link to={viewAllHref} className="section__view-all">
                Ver todos <ArrowRight size={16} />
              </Link>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}