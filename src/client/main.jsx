import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./features/auth/context/AuthProvider";
import { StudentFavoritesProvider } from "./features/student/context/StudentFavoritesProvider";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <StudentFavoritesProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </StudentFavoritesProvider>
    </AuthProvider>
  </React.StrictMode>
);
