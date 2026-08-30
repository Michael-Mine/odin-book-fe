import { useState } from "react";
import { useParams } from "react-router";
import UsersLiked from "./UsersLiked";
import LikeButton from "./LikeButton";

function Likes({ likeCount }) {
  let { postCuid } = useParams();
  const [showLikes, setShowLikes] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const getLikes = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    console.log("getting likes");

    fetch(`${apiUrl}v1/posts/${postCuid}/likes`, {
      method: "GET",
      credentials: "include",
    })
      .then((response) => response.json())
      .then((response) => setResponse({ ...response }))
      .catch((error) => setError(error))
      .finally(() => setShowLikes(true));
  };

  return (
    <>
      <LikeButton likeCount={likeCount} postCuid={postCuid} />
      {showLikes && <UsersLiked likes={response?.likes} />}
      {likeCount > 0 && !showLikes && (
        <button onClick={getLikes}>Show Likes</button>
      )}
      {error && <h2>A network error was encountered</h2>}
    </>
  );
}

export default Likes;
