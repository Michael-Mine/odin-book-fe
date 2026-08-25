import { useOutletContext } from "react-router";
import styles from "./Feed.module.css";
import useFeed from "./useFeed";

function Feed() {
  const { user } = useOutletContext();
  const { feed, error, loading } = useFeed();

  if (loading) return <h2>Loading...</h2>;
  if (error) return <h2>A network error was encountered</h2>;

  return (
    <div className={styles.container}>
      <h2>Home Feed for {user.name}</h2>
    </div>
  );
}

export default Feed;
