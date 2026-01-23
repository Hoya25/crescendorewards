import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { Web3Provider } from "./providers/Web3Provider";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <Web3Provider>
      <App />
    </Web3Provider>
  </HelmetProvider>
);
