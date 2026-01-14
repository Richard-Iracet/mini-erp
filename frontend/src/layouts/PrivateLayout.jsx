import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";
import PrivateRoute from "../routes/PrivateRoute";

export default function PrivateLayout() {
  return (
    <PrivateRoute>
      <div style={{ display: "flex" }}>
        <Navbar />
        <main style={{ padding: 30, flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </PrivateRoute>
  );
}
