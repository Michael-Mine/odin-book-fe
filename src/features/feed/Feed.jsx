import { useState } from "react";
import useFeed from "./useFeed";
import FeedItem from "./FeedItem";
import styles from "./Feed.module.css";

function Feed() {
  const { feed, setFeed, error, loading } = useFeed();
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(null);

  const morePosts = () => {
    const apiUrl = import.meta.env.VITE_API_URL;

    if (loadingMore || !feed?.nextCursor) return;

    setLoadingMore(true);
    setMoreError(null);

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
      .catch((error) => setMoreError(error))
      .finally(() => setLoadingMore(false));
  };

  if (loading) return <h2>Loading...</h2>;
  if (error) return <h2>A network error was encountered</h2>;

  return (
    <div className={styles.container}>
      <h2>Home Feed</h2>

      {feed.posts.map((post) => {
        return <FeedItem post={post} key={post.cuid} />;
      })}

      {moreError && (
        <p role="alert">Could not load more posts. Please try again.</p>
      )}

      {feed.nextCursor && (
        <button onClick={morePosts} disabled={loadingMore}>
          {loadingMore
            ? "Loading more posts..."
            : moreError
              ? "Try again"
              : "Show More Posts"}
        </button>
      )}
    </div>
  );
}

export default Feed;
