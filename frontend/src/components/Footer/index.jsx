import Logo from "../Logo";
import facebookIcon from "/src/assets/facebook.svg";
import instagramIcon from "/src/assets/instagram.svg";
import twitterIcon from "/src/assets/twitter.svg";
import "./styles.css";

const INFO_LINKS = [
  "Sobre Drip Store",
  "Segurança",
  "Wishlist",
  "Blog",
  "Trabalhe conosco",
  "Meus Pedidos",
];

const CATEGORY_LINKS = ["Camisetas", "Calças", "Bonés", "Headphones", "Tênis"];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <Logo variant="light" />
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore.
          </p>
          <div className="footer__social">
            <a href="#" aria-label="Facebook">
              <img src={facebookIcon} alt="" />
            </a>
            <a href="#" aria-label="Instagram">
              <img src={instagramIcon} alt="" />
            </a>
            <a href="#" aria-label="Twitter">
              <img src={twitterIcon} alt="" />
            </a>
          </div>
        </div>

        <div className="footer__column">
          <h4>Informação</h4>
          <ul>
            {INFO_LINKS.map((link) => (
              <li key={link}>
                <a href="#">{link}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer__column">
          <h4>Categorias</h4>
          <ul>
            {CATEGORY_LINKS.map((link) => (
              <li key={link}>
                <a href="#">{link}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer__column">
          <h4>Contato</h4>
          <p className="footer__address">
            Av. Santos Dumont, 1510 - 1 andar - Aldeota, Fortaleza - CE,
            60150-161
          </p>
          <p className="footer__phone">(85) 3051-3411</p>
        </div>
      </div>

      <div className="footer__bottom">
        <span>© {new Date().getFullYear()} Digital Store</span>
      </div>
    </footer>
  );
}
