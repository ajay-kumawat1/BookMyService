import express, { json, urlencoded } from "express";
const app = express();
const port = 5001;

import { router } from "./routes/index.js";

// Middleware
app.use(json({ limit: '50mb' }));
app.use(urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use("/", router);

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
