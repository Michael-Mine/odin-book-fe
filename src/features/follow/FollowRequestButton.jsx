import { useState } from "react";
import styles from "./FollowRequestButton.module.css";

function FollowRequestButton({ userCuid }) {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  const submitFollow = () => {
    if (pending) return;

    setPending(true);
    setError(null);

    const apiUrl = import.meta.env.VITE_API_URL;

    fetch(`${apiUrl}v1/follow-requests/${userCuid}`, {
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

  if (error) return <h2>Unable to complete follow request</h2>;
  if (response && response.follow)
    return <button className={styles.requested}>Requested</button>;
  if (response && response.message) return <p>{response.message}</p>;

  return (
    <button onClick={submitFollow} disabled={pending}>
      {pending ? "Following..." : "Follow"}
    </button>
  );
}

export default FollowRequestButton;
