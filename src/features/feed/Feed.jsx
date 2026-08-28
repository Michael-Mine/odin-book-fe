import styles from "./Feed.module.css";
import useFeed from "./useFeed";
import FeedItem from "./FeedItem";

function Feed() {
  const { feed, error, loading } = useFeed();

  if (loading) return <h2>Loading...</h2>;
  if (error) return <h2>A network error was encountered</h2>;

  return (
    <div className={styles.container}>
      {feed.posts.map((post) => {
        return <FeedItem post={post} key={post.cuid} />;
      })}
    </div>
  );
}

export default Feed;

//add pagination for 20+
