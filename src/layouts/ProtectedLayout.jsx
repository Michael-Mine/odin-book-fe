import { Navigate, Outlet, useLocation, useOutletContext } from "react-router";
import Header from "./Header";
import Sidebar from "./Sidebar";
import styles from "./ProtectedLayout.module.css";

function ProtectedLayout() {
  const { user, setUser, loading, error } = useOutletContext();
  const location = useLocation();

  if (loading) {
    return <h2>Loading...</h2>;
  }

  if (error) {
    return <h2>Unable to check your session. Please try again.</h2>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <>
      <Header setUser={setUser} />
      <div className={styles.container}>
        <Sidebar user={user} />
        <Outlet context={user} />
      </div>
    </>
  );
}

export default ProtectedLayout;
