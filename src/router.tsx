
import { RouteObject } from "react-router-dom";
import Dashboard from "./pages/Dashboard";

export const router: RouteObject[] = [
  {
    path: "/",
    element: <Dashboard />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
];
