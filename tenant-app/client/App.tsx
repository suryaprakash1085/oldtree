import "./global.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./pages/Home";
import Checkout from "./pages/Checkout";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import StaticPage from "./pages/StaticPage";
import OrderConfirmation from "./pages/OrderConfirmation";
import TrackOrder from "./pages/TrackOrder";
import ProductsTable from "./pages/ProductsTable";

const router = createBrowserRouter(
  [
    { path: "/store/:tenantId", element: <Home /> },
    { path: "/", element: <Home /> },
    { path: "/checkout", element: <Checkout /> },
    { path: "/products", element: <ProductsTable /> },
    { path: "/order/:orderNumber", element: <OrderConfirmation /> },
    { path: "/track-order", element: <TrackOrder /> },
    { path: "/blog", element: <Blog /> },
    { path: "/blog/:slug", element: <BlogPost /> },
    { path: "/page/:slug", element: <StaticPage /> },
    { path: "*", element: <Home /> },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  }
);

export default function App() {
  return <RouterProvider router={router} future={{ v7_startTransition: true }} />;
}
