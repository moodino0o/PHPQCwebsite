
import React from "react";
import ReactDOM from "react-dom/client";
import { Router } from "wouter";
import { App } from "./app-main";
import "../css/app.css";

ReactDOM.createRoot(
  document.getElementById("app")!
).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);
