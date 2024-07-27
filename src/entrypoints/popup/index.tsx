import React from "react";
import { createRoot } from "react-dom/client";
import { POC } from "./poc";

const root = createRoot(document.getElementById("app")!);
root.render(<POC />);
