import { useState } from "react";
import styles from "./NewPost.module.css";

function NewPost() {
  const [formData, setFormData] = useState({
    content: "",
    picURL: "",
  });
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addPost = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const url = `${apiUrl}v1/posts`;
    setSending(true);
    setError(null);

    fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((response) => setResponse({ ...response }))
      .catch((error) => setError(error))
      .finally(() => setSending(false));
  };

  if (sending) return <h3>Sending...</h3>;
  if (response && response.message === "post created")
    return <h3>{response.message}</h3>;

  return (
    <div className={styles.container}>
      <h2>New Post</h2>
      <div className="input-container">
        <label htmlFor="picURL">Picture URL:</label>
        <input
          className="input-field"
          id="picURL"
          name="picURL"
          data-testid="picURL-input"
          type="text"
          value={formData.picURL}
          onChange={handleChange}
        />
      </div>
      <textarea
        className="input-field post"
        data-testid="content-input"
        type="text"
        name="content"
        placeholder="Write post"
        value={formData.content}
        onChange={handleChange}
        maxLength="5000"
      />
      <div>
        <button onClick={addPost}>Add Post</button>
      </div>
      {error && <p className="characters">A network error was encountered</p>}
      {response &&
        response.errors &&
        response.errors.map((error) => {
          return <p className="characters">{error.message}</p>;
        })}
    </div>
  );
}

export default NewPost;
