import { useState } from "react";
import styles from "./FollowRejectButton.module.css";

function FollowRejectButton({ userCuid }) {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  const submitReject = () => {
    if (pending) return;

    setPending(true);
    setError(null);

    const apiUrl = import.meta.env.VITE_API_URL;

    fetch(`${apiUrl}v1/follow-requests/${userCuid}/reject`, {
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

  if (error) return <h2>Unable to reject follow request</h2>;
  if (response && response.follow)
    return <button className={styles.rejected}>Rejected</button>;
  if (response && response.message) return <p>{response.message}</p>;

  return (
    <button onClick={submitReject} disabled={pending}>
      {pending ? "Rejecting..." : "Reject"}
    </button>
  );
}

export default FollowRejectButton;
