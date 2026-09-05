import { useState } from "react";
import styles from "./UnfollowButton.module.css";

function UnfollowButton({ userCuid }) {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const submitUnfollow = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    console.log("submitting unfollow");

    fetch(`${apiUrl}v1/follow-requests/${userCuid}/unfollow`, {
      method: "POST",
      credentials: "include",
    })
      .then((response) => response.json())
      .then((response) => setResponse({ ...response }))
      .catch((error) => setError(error));
  };

  if (error) return <h2>A network error was encountered</h2>;
  if (response && response.follow)
    return <button className={styles.accepted}>Unfollowed</button>;
  if (response && response.message) return <p>{response.message}</p>;

  return <button onClick={submitUnfollow}>Unfollow</button>;
}

export default UnfollowButton;
