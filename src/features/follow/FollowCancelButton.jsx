import { useState } from "react";
import styles from "./FollowCancelButton.module.css";

function FollowCancelButton({ userCuid }) {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  const submitCancel = () => {
    if (pending) return;

    setPending(true);
    setError(null);

    const apiUrl = import.meta.env.VITE_API_URL;

    fetch(`${apiUrl}v1/follow-requests/${userCuid}`, {
      method: "DELETE",
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

  if (error) return <h2>Unable to cancel follow request</h2>;
  if (response && response.follow)
    return <button className={styles.cancelled}>Cancelled</button>;
  if (response && response.message) return <p>{response.message}</p>;

  return (
    <button onClick={submitCancel} disabled={pending}>
      {pending ? "Cancelling..." : "Cancel"}
    </button>
  );
}

export default FollowCancelButton;
