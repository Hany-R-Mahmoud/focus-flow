import { Analytics } from "@vercel/analytics/react";
import "@fontsource-variable/geist/wght.css";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { PwaProvider } from "./pwa/PwaContext";
import { restoreHashFromLocation } from "./pwa/pwa";

restoreHashFromLocation();

if (import.meta.env.DEV) {
  void import("react-grab");
  void import("react-scan");
}

createRoot(document.getElementById("root")!).render(
  <>
    <PwaProvider>
      <App />
    </PwaProvider>
    <Analytics />
  </>
);
