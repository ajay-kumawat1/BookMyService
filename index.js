import "dotenv/config";
import express from "express";
import db from "./App/Database/db.js";
import models from "./App/Models/EloquentCollection.js";
import router from "./App/Web/routes.js";

const app = express();
db();
models();
router(app);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `⚡️[NodeJs server]: Server is running at http://localhost:${PORT}`
  );
});
