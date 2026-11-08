import { StrictMode } from "react";

import { createRoot } from "react-dom/client";

import { App } from "./App";
import { bootDocument } from "./store/snapshotStore";
import "./theme/styles.css";
import { initTheme } from "./theme/theme";

// Before the first paint: the stored preset is applied to the root, so the window opens in
// the theme it was left in rather than flashing the fallback.
initTheme();

const replica = await bootDocument();
const container = document.getElementById("root");

if (!container) throw new Error("Suite Planner: #root is missing");

createRoot(container).render(
  <StrictMode>
    <App replica={replica} />
  </StrictMode>,
);
