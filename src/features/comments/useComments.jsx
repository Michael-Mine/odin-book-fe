import { useEffect, useState } from "react";

const useComments = (postCuid) => {
  const [comments, setComments] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previousPostCuid, setPreviousPostCuid] = useState(postCuid);

  if (postCuid !== previousPostCuid) {
    setPreviousPostCuid(postCuid);
    setComments(null);
    setError(null);
    setLoading(true);
  }

  useEffect(() => {
    const controller = new AbortController();
    const apiUrl = import.meta.env.VITE_API_URL;

    fetch(`${apiUrl}v1/posts/${postCuid}/comments`, {
      method: "GET",
      credentials: "include",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }
        return response.json();
      })
      .then((response) => {
        if (!controller.signal.aborted) {
          setComments(response.comments);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== "AbortError") {
          setError(error);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [postCuid]);

  return { comments, error, loading };
};

export default useComments;
