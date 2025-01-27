import path from "path";
import express, { json } from "express";
import cors from "cors";
import helmet from "helmet";
import router from "../Controllers/_router.js";
export default (app) => {
  app.use(cors());

  const __dirname = path.resolve();
  const publicDirectoryPath = path.join(__dirname, "public");
  app.use("/api/public", express.static(publicDirectoryPath));

  app.use("/api", router);

  app.use(helmet());
  app.use(json());

  app.use((_req, res) => {
    res.status(404).send({ message: "Url not found." });
  });
};
