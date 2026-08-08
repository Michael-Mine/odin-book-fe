import reactLogo from "../assets/react.svg";
import viteLogo from "/favicon.svg";
import myLogo from "../assets/logo.png";
import styles from "./Footer.module.css";

function Footer() {
  return (
    <footer>
      <a href="https://vite.dev" target="_blank">
        <img src={viteLogo} className={styles.logo} alt="Vite logo" />
      </a>
      <a href="https://mrmine.net/" target="_blank" data-testid="my-site-link">
        <img src={myLogo} className={styles.myLogo} alt="Mr Mine logo" />
      </a>
      <a href="https://react.dev" target="_blank">
        <img src={reactLogo} className={styles.logo} alt="React logo" />
      </a>
    </footer>
  );
}

export default Footer;
