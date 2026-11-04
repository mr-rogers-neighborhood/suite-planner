import { StrictMode } from "react";

import { createRoot } from "react-dom/client";

import { App } from "./App";
import { bootDocument } from "./store/snapshotStore";
import "./theme/styles.css";

const replica = await bootDocument();
const container = document.getElementById("root");

if (!container) throw new Error("Suite Planner: #root is missing");

createRoot(container).render(
  <StrictMode>
    <App replica={replica} />
  </StrictMode>,
);
