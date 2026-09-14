import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "./auth/AuthContext.jsx";
import AppRouter from "./routes/AppRouter.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </React.StrictMode>
);