import { createBrowserRouter } from "react-router";
import App from "./App";
import About from "./pages/About";
import ActionsSettings from "./pages/ActionsSettings";
import Home from "./pages/Home";
import Settings from "./pages/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "actions-settings",
        element: <ActionsSettings />,
      },
      {
        path: "about",
        element: <About />,
      },
    ],
  },
]);
