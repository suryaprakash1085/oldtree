import "./global.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Checkout from "./pages/Checkout";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import StaticPage from "./pages/StaticPage";
import OrderConfirmation from "./pages/OrderConfirmation";
import TrackOrder from "./pages/TrackOrder";
import ProductsTable from "./pages/ProductsTable";
import ThemeETemplate from "./templates/ThemeETemplate"; 
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/store/:tenantId" element={<ThemeETemplate />} />
        <Route path="/" element={<Home />} />

        <Route path="/checkout" element={<Checkout />} />
        <Route path="/products" element={<ProductsTable />} />
        <Route path="/order/:orderNumber" element={<OrderConfirmation />} />
        <Route path="/track-order" element={<TrackOrder />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/page/:slug" element={<StaticPage />} />
        <Route path="*" element={<Home />} />
      
      </Routes>
    </BrowserRouter>
  );
}
