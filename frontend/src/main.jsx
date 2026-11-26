//import React from 'react'
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import StoreContextProvider from "./Context/StoreContext";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <BrowserRouter>
      <ScrollToTop />
      <StoreContextProvider>
        <App />
      </StoreContextProvider>
    </BrowserRouter>
  </ErrorBoundary>
);
