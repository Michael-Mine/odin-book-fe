import { useState } from "react";
import styles from "./LikeButton.module.css";

function LikeButton({ likeCount, postCuid }) {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  const submitLike = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    setSending(true);
    setError(null);

    fetch(`${apiUrl}v1/posts/${postCuid}/likes`, {
      method: "POST",
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }

        return response.json();
      })
      .then((response) => setResponse(response))
      .catch((error) => setError(error))
      .finally(() => setSending(false));
  };

  if (response?.like) {
    return (
      <button className={styles.liked} disabled>
        Liked
      </button>
    );
  }

  return (
    <>
      <button onClick={submitLike} disabled={sending}>
        {sending
          ? "Liking..."
          : `${likeCount} ${likeCount === 1 ? "Like" : "Likes"}`}
      </button>
      {error && <p role="alert">Unable to like this post. Please try again.</p>}
    </>
  );
}

export default LikeButton;
