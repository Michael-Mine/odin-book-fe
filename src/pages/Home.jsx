import { useOutletContext } from "react-router";
import Header from "../layouts/Header";
import Sidebar from "../layouts/Sidebar";

function Home() {
  const { user, setUser } = useOutletContext();

  return <></>;
}

export default Home;
