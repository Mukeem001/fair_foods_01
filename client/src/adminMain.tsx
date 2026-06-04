import { createRoot } from "react-dom/client";
import Admin from "@/pages/admin";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(<Admin />);
