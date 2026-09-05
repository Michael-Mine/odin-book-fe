import { useState } from "react";
import styles from "./FollowAcceptButton.module.css";

function FollowAcceptButton({ userCuid }) {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const submitAccept = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    console.log("submitting accept");

    fetch(`${apiUrl}v1/follow-requests/${userCuid}/accept`, {
      method: "POST",
      credentials: "include",
    })
      .then((response) => response.json())
      .then((response) => setResponse({ ...response }))
      .catch((error) => setError(error));
  };

  if (error) return <h2>A network error was encountered</h2>;
  if (response && response.follow)
    return <button className={styles.accepted}>Accepted</button>;
  if (response && response.message) return <p>{response.message}</p>;

  return <button onClick={submitAccept}>Accept</button>;
}

export default FollowAcceptButton;
