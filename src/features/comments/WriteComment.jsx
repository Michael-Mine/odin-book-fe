import { useState } from "react";
import { useParams } from "react-router";

function WriteComment() {
  let { postCuid } = useParams();
  const [formData, setFormData] = useState({
    content: "",
  });
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const url = `${apiUrl}v1/posts/${postCuid}/comments`;
    setResponse(null);
    setError(null);
    setSending(true);

    fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => {
        return response.json().then((data) => {
          if (!response.ok && !data.errors?.length) {
            throw new Error(`Response status: ${response.status}`);
          }

          return data;
        });
      })
      .then((response) => setResponse(response))
      .catch((error) => setError(error))
      .finally(() => setSending(false));
  };

  if (sending) return <h3>Sending...</h3>;

  if (response && response.comment) return <h3>Comment created</h3>;

  return (
    <div>
      <textarea
        className="input-field comment"
        data-testid="content-input"
        type="text"
        name="content"
        placeholder="Add a comment"
        value={formData.content}
        onChange={handleChange}
        maxLength="1000"
      />
      <div>
        <button onClick={handleSubmit}>Add Comment</button>
      </div>
      {error && <h3>A network error was encountered</h3>}
      {response &&
        response.errors &&
        response.errors.map((error, index) => {
          return <h3 key={`${error.message}-${index}`}>{error.message}</h3>;
        })}
    </div>
  );
}

export default WriteComment;
