import express from "express";
const app = express();
const port = 5001;

import { router } from "./routes/index.js";

app.use('/', router);

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
