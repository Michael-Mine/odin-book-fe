import { useState } from "react";
import styles from "./FollowCancelButton.module.css";

function FollowCancelButton({ userCuid }) {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const submitCancel = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    console.log("submitting cancel");

    fetch(`${apiUrl}v1/follow-requests/${userCuid}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((response) => response.json())
      .then((response) => setResponse({ ...response }))
      .catch((error) => setError(error));
  };

  if (error) return <h2>A network error was encountered</h2>;
  if (response && response.follow)
    return <button className={styles.cancelled}>Cancelled</button>;
  if (response && response.message) return <p>{response.message}</p>;

  return <button onClick={submitCancel}>Cancel</button>;
}

export default FollowCancelButton;
