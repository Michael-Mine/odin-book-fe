import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import FeedItem from "../feed/FeedItem";
import styles from "./ProfileTabs.module.css";

function ProfileTabs({ userCuid }) {
  const [activeTab, setActiveTab] = useState(null);
  const [postsResponse, setPostsResponse] = useState(null);
  const [followersResponse, setFollowersResponse] = useState(null);
  const [followingResponse, setFollowingResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  const requestControllerRef = useRef(null);

  useEffect(() => {
    return () => {
      requestControllerRef.current?.abort();
      requestControllerRef.current = null;
    };
  }, []);

  const runTabRequest = ({ tab, cachedResponse, endpoint, saveResponse }) => {
    setActiveTab(tab);

    // Cancel the previous tab's request.
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;

    setError(null);

    if (cachedResponse) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    requestControllerRef.current = controller;
    setLoading(true);

    fetch(`${apiUrl}v1/users/${userCuid}/${endpoint}`, {
      method: "GET",
      credentials: "include",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }

        return response.json();
      })
      .then((response) => {
        // Ignore a response if another request has replaced this one.
        if (requestControllerRef.current === controller) {
          saveResponse(response);
        }
      })
      .catch((error) => {
        if (
          error.name !== "AbortError" &&
          requestControllerRef.current === controller
        ) {
          setError(error);
        }
      })
      .finally(() => {
        // An older aborted request must not change the current loading state.
        if (requestControllerRef.current === controller) {
          requestControllerRef.current = null;
          setLoading(false);
        }
      });
  };

  const showPosts = () => {
    runTabRequest({
      tab: "posts",
      cachedResponse: postsResponse,
      endpoint: "posts",
      saveResponse: (response) => setPostsResponse(response),
    });
  };

  const showFollowers = () => {
    runTabRequest({
      tab: "followers",
      cachedResponse: followersResponse,
      endpoint: "followers",
      saveResponse: (response) => setFollowersResponse(response.followers),
    });
  };

  const showFollowing = () => {
    runTabRequest({
      tab: "following",
      cachedResponse: followingResponse,
      endpoint: "following",
      saveResponse: (response) => setFollowingResponse(response.following),
    });
  };

  return (
    <>
      <button
        className={activeTab === "posts" ? styles.activeTab : ""}
        aria-pressed={activeTab === "posts"}
        onClick={showPosts}
      >
        Posts
      </button>

      <button
        className={activeTab === "followers" ? styles.activeTab : ""}
        aria-pressed={activeTab === "followers"}
        onClick={showFollowers}
      >
        Followers
      </button>

      <button
        className={activeTab === "following" ? styles.activeTab : ""}
        aria-pressed={activeTab === "following"}
        onClick={showFollowing}
      >
        Following
      </button>
      {loading && <h2>Loading...</h2>}
      {error && <h2>A network error was encountered</h2>}

      <div className={styles.postsContainer}>
        {activeTab === "posts" &&
          postsResponse &&
          (postsResponse.posts.length > 0 ? (
            postsResponse.posts.map((post) => (
              <FeedItem post={post} key={post.cuid} />
            ))
          ) : (
            <p className={styles.emptyMessage}>No posts yet.</p>
          ))}
      </div>

      <div className={styles.followContainer}>
        {activeTab === "followers" &&
          followersResponse &&
          (followersResponse.length > 0 ? (
            <>
              <span className={styles.heading}>Followers:</span>

              {followersResponse.map((follower) => (
                <Link
                  to={`/profile/${follower.follower.cuid}`}
                  key={follower.follower.cuid}
                  className={styles.profileLink}
                >
                  <span>{follower.follower.name}</span>
                </Link>
              ))}
            </>
          ) : (
            <p className={styles.emptyMessage}>No followers yet.</p>
          ))}

        {activeTab === "following" &&
          followingResponse &&
          (followingResponse.length > 0 ? (
            <>
              <span className={styles.heading}>Following:</span>

              {followingResponse.map((following) => (
                <Link
                  to={`/profile/${following.following.cuid}`}
                  key={following.following.cuid}
                  className={styles.profileLink}
                >
                  <span>{following.following.name}</span>
                </Link>
              ))}
            </>
          ) : (
            <p className={styles.emptyMessage}>Not following anyone yet.</p>
          ))}
      </div>
    </>
  );
}

export default ProfileTabs;
