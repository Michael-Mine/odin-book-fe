import { useState } from "react";
import FeedItem from "../feed/FeedItem";
import styles from "./ProfileTabs.module.css";

function ProfileTabs({ userCuid }) {
  const [activeTab, setActiveTab] = useState(null);
  const [postsResponse, setPostsResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;

  const showPosts = () => {
    setActiveTab("posts");
    if (postsResponse) return;

    console.log("getting posts");
    setLoading(true);
    fetch(`${apiUrl}v1/users/${userCuid}/posts`, {
      method: "GET",
      credentials: "include",
    })
      .then((response) => response.json())
      .then((response) => setPostsResponse({ ...response }))
      .catch((error) => setError(error))
      .finally(() => setLoading(false));
  };

  return (
    <>
      <button onClick={showPosts}>Posts</button>
      <button>Followers</button>
      <button>Following</button>
      {loading && <h2>Loading...</h2>}
      {error && <h2>A network error was encountered</h2>}
      <div className={styles.postsContainer}>
        {activeTab == "posts" &&
          postsResponse &&
          postsResponse.posts.map((post) => {
            return <FeedItem post={post} key={post.cuid} />;
          })}
      </div>
    </>
  );
}

export default ProfileTabs;
