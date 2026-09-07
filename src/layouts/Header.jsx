import { useState } from "react";
import styles from "./Header.module.css";

function Header({ user, setUser }) {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const logout = () => {
    const apiUrl = import.meta.env.VITE_API_URL;

    setError(null);
    setLoading(true);

    fetch(`${apiUrl}v1/auth/logout`, {
      method: "POST",
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }
        setUser(null);
      })
      .catch(() => setError("Unable to log out. Please try again."))
      .finally(() => setLoading(false));
  };

  return (
    <div className={styles.header}>
      <img className={styles.profilePic} src={user.picURL} alt="profile pic" />
      <h1>Mr Mine Odin-Book</h1>
      <button onClick={logout} disabled={loading}>
        {loading ? "Logging out..." : "Logout"}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

export default Header;
