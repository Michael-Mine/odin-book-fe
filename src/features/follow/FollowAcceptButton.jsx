import { useState } from "react";
import styles from "./FollowAcceptButton.module.css";

function FollowAcceptButton({ userCuid }) {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  const submitAccept = () => {
    if (pending) return;

    setPending(true);
    setError(null);

    const apiUrl = import.meta.env.VITE_API_URL;

    fetch(`${apiUrl}v1/follow-requests/${userCuid}/accept`, {
      method: "POST",
      credentials: "include",
    })
      .then((response) =>
        response.json().then((data) => {
          if (!response.ok) {
            throw new Error(
              data.message || `Response status: ${response.status}`,
            );
          }

          return data;
        }),
      )
      .then((data) => setResponse(data))
      .catch((error) => setError(error))
      .finally(() => setPending(false));
  };

  if (error) return <h2>Unable to accept follow request</h2>;
  if (response && response.follow)
    return <button className={styles.accepted}>Accepted</button>;
  if (response && response.message) return <p>{response.message}</p>;

  return (
    <button onClick={submitAccept} disabled={pending}>
      {pending ? "Accepting..." : "Accept"}
    </button>
  );
}

export default FollowAcceptButton;
