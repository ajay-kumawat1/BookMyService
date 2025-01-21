import config from "./config/config.js";
import express, { json, urlencoded } from "express";
const app = express();
const port = config.server.port || 5001;

import { router } from "./routes/index.js";
import cors from "cors";

// Middleware
app.use(cors({
  origin: config.server.cors.origin,
  credentials: config.server.cors.credentials,
}));
app.use(json({ limit: '50mb' }));
app.use(urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use("/", router);

app.listen(port, (err) => {
  err ? console.log(err) : console.log(`Server running on port http://localhost:${port}`);
});
