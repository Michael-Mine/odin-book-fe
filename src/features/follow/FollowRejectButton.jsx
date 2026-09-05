import { useState } from "react";
import styles from "./FollowRejectButton.module.css";

function FollowRejectButton({ userCuid }) {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const submitReject = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    console.log("submitting accept");

    fetch(`${apiUrl}v1/follow-requests/${userCuid}/reject`, {
      method: "POST",
      credentials: "include",
    })
      .then((response) => response.json())
      .then((response) => setResponse({ ...response }))
      .catch((error) => setError(error));
  };

  if (error) return <h2>A network error was encountered</h2>;
  if (response && response.follow)
    return <button className={styles.rejected}>Rejected</button>;
  if (response && response.message) return <p>{response.message}</p>;

  return <button onClick={submitReject}>Reject</button>;
}

export default FollowRejectButton;
