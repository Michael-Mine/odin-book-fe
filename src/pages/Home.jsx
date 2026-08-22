import { useOutletContext } from "react-router";
import Header from "../layouts/Header";

function Home() {
  const [user, setUser] = useOutletContext();

  return (
    <>
      <Header setUser={setUser} />
    </>
  );
}

export default Home;
