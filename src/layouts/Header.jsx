import styles from "./Header.module.css";

function Header({ setUser }) {
  const logout = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    console.log("logging out");
    fetch(`${apiUrl}v1/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      setUser(null);
    });
  };

  return (
    <div className={styles.header}>
      <button>Home</button>
      <h1>Mr Mine Odin-Book</h1>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

export default Header;
