import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import logo from "@/assets/logo.png";
import { useEffect, useState } from "react";

function SplashApp() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 1400);
    return () => window.clearTimeout(t);
  }, []);

  if (!ready) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center bg-background"
        style={{ backgroundColor: "hsl(var(--background))" }}
      >
        <div className="flex flex-col items-center gap-3">
          <img src={logo} alt="FairFoods" className="w-16 h-16 drop-shadow-md" />
          <div className="text-sm font-semibold text-foreground opacity-80">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return <App />;
}

createRoot(document.getElementById("root")!).render(<SplashApp />);

