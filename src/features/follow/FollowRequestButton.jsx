import { useState } from "react";
import styles from "./FollowRequestButton.module.css";

function FollowRequestButton({ userCuid }) {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const submitFollow = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    console.log("submitting follow");

    fetch(`${apiUrl}v1/follow-requests/${userCuid}`, {
      method: "POST",
      credentials: "include",
    })
      .then((response) => response.json())
      .then((response) => setResponse({ ...response }))
      .catch((error) => setError(error));
  };

  if (error) return <h2>A network error was encountered</h2>;
  if (response && response.follow)
    return <button className={styles.requested}>Requested</button>;
  if (response && response.message) return <span>{response.message}</span>;

  return <button onClick={submitFollow}>Follow</button>;
}

export default FollowRequestButton;
