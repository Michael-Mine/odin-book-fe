import { useState } from "react";

function LikeButton({ likeCount, postCuid }) {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const submitLike = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    console.log("submitting like");

    fetch(`${apiUrl}v1/posts/${postCuid}/likes`, {
      method: "POST",
      credentials: "include",
    })
      .then((response) => response.json())
      .then((response) => setResponse({ ...response }))
      .catch((error) => setError(error));
  };

  if (error) return <h2>A network error was encountered</h2>;
  if (response && response.like) return <button>Liked</button>;

  if (likeCount == 1) return <button onClick={submitLike}>1 Like</button>;

  return <button onClick={submitLike}>{likeCount} Likes</button>;
}

export default LikeButton;
