import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { createThemeRoot } from "@/lib/utils";

// Set up theme from theme.json
createThemeRoot();

createRoot(document.getElementById("root")!).render(<App />);
