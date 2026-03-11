import "./styles.css";

import { bootstrapApp } from "./bootstrap/app-bootstrap";

const root = document.querySelector<HTMLDivElement>("#app");

if (!root) {
  throw new Error("Missing #app root element.");
}

void bootstrapApp(root);
