import path from "path";
import express, { json } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import router from "../Controllers/_router.js";
export default (app) => {
  app.use(cors());

  const __dirname = path.resolve();
  const publicDirectoryPath = path.join(__dirname, "public");
  app.use("/api/public", express.static(publicDirectoryPath));

  // routes
  app.get("/", (_req, res) => {
    res.send({ message: "Welcome to the API" });
  });
  app.use("/api", router);

  app.use(helmet());
  app.use(json());
  app.use(express.json());
  app.use(cookieParser());

  app.use((_req, res) => {
    res.status(404).send({ message: "Url not found." });
  });
};

