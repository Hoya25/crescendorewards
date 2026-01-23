import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { Web3Provider } from "./providers/Web3Provider";
import { initUserback } from "./lib/userback";

// Ensure Userback has the token set as early as possible (before the async widget script finishes loading)
initUserback();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <Web3Provider>
      <App />
    </Web3Provider>
  </HelmetProvider>
);
