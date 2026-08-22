import { useOutletContext } from "react-router";

function Home() {
  const [user, setUser] = useOutletContext();

  return <h1>Welcome {user.name}</h1>;
}

export default Home;
