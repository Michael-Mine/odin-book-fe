import App from "../App.jsx";
import RouteErrorPage from "../pages/RouteErrorPage.jsx";
import NotFound from "../pages/NotFound.jsx";
import Home from "../pages/Home.jsx";

const routes = [
  {
    path: "/",
    element: <App />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <Home /> },
      // { path: "profile/:userCuid", element: <Profile/> },
      // { path: "following", element: <Following/> },
      // { path: "new-post", element: <NewPost /> },
      // { path: "post/:postCuid", element: <Post /> },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
