import appIcon from "../assets/card-account-details-outline.svg";
import myLogo from "../assets/logo.png";
import githubLogo from "../assets/github-mark.svg";
import styles from "./Navbar.module.css";

function Navbar() {
  return (
    <nav className={styles.container}>
      <a href="/">
        <img src={appIcon} className={styles.homeIcon} alt="Blog icon" />
      </a>
      <a href="https://mrmine.net/" target="_blank" data-testid="my-site-link">
        <img src={myLogo} className={styles.myLogo} alt="Mr Mine logo" />
      </a>
      <a
        href="https://github.com/Michael-Mine"
        target="_blank"
        data-testid="github-link"
      >
        <img src={githubLogo} className={styles.githubLogo} alt="GitHub logo" />
      </a>
    </nav>
  );
}

export default Navbar;
