import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import UsersLiked from "./UsersLiked";
import LikeButton from "./LikeButton";

function Likes({ likeCount }) {
  let { postCuid } = useParams();
  const [showLikes, setShowLikes] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const requestRef = useRef(null);

  useEffect(() => {
    return () => {
      requestRef.current?.abort();
      requestRef.current = null;
    };
  }, []);

  const getLikes = () => {
    if (requestRef.current) return;

    const controller = new AbortController();
    requestRef.current = controller;
    const apiUrl = import.meta.env.VITE_API_URL;
    setLoading(true);
    setError(null);

    fetch(`${apiUrl}v1/posts/${postCuid}/likes`, {
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
      .then((data) => {
        if (controller.signal.aborted) return;

        if (!Array.isArray(data?.likes)) {
          throw new Error("Likes response is missing a likes array");
        }

        setResponse(data);
        setShowLikes(true);
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== "AbortError") {
          setError(error);
        }
      })
      .finally(() => {
        if (requestRef.current === controller) {
          requestRef.current = null;
          setLoading(false);
        }
      });
  };

  return (
    <>
      <LikeButton likeCount={likeCount} postCuid={postCuid} />
      {showLikes && <UsersLiked likes={response?.likes} />}
      {likeCount > 0 && !showLikes && (
        <button onClick={getLikes} disabled={loading}>
          {loading ? "Loading likes..." : "Show Likes"}
        </button>
      )}
      {error && <h2>A network error was encountered</h2>}
    </>
  );
}

export default Likes;
