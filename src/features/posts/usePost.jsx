import { useEffect, useState } from "react";

const usePost = (postCuid) => {
  const [post, setPost] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previousPostCuid, setPreviousPostCuid] = useState(postCuid);

  if (postCuid !== previousPostCuid) {
    setPreviousPostCuid(postCuid);
    setPost(null);
    setError(null);
    setLoading(true);
  }

  useEffect(() => {
    const controller = new AbortController();
    const apiUrl = import.meta.env.VITE_API_URL;

    fetch(`${apiUrl}v1/posts/${postCuid}`, {
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
      .then((response) => setPost(response.post))
      .catch((error) => {
        if (error.name !== "AbortError") {
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

  return { post, error, loading };
};

export default usePost;
