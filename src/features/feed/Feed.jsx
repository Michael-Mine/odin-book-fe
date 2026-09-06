import useFeed from "./useFeed";
import FeedItem from "./FeedItem";
import styles from "./Feed.module.css";

function Feed() {
  const { feed, setFeed, error, setError, loading } = useFeed();

  if (loading) return <h2>Loading...</h2>;
  if (error) return <h2>A network error was encountered</h2>;

  const morePosts = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    console.log("getting more posts");

    fetch(`${apiUrl}v1/posts/feed?cursor=${feed.nextCursor}`, {
      method: "GET",
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }

        return response.json();
      })
      .then((nextPage) => {
        setFeed((currentFeed) => ({
          ...currentFeed,
          ...nextPage,
          posts: [...currentFeed.posts, ...nextPage.posts],
        }));
      })
      .catch((error) => setError(error));
  };

  return (
    <div className={styles.container}>
      <h2>Home Feed</h2>
      {feed.posts.map((post) => {
        return <FeedItem post={post} key={post.cuid} />;
      })}
      {feed.nextCursor && <button onClick={morePosts}>Show More Posts</button>}
    </div>
  );
}

export default Feed;

//add pagination for 20+
