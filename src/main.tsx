import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./pwa/registerSW";
import { installOfflineAutoFlush } from "./lib/offline/queue";

createRoot(document.getElementById("root")!).render(<App />);

void registerServiceWorker();
installOfflineAutoFlush();
