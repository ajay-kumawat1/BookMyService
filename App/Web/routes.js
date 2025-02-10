import path from "path";
import express, { json } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import router from "../Controllers/_router.js";

export default (app) => {
  // ✅ Set up security & parsing middleware before routes
  app.use(cors({ origin: "http://localhost:3000", credentials: true })); // Enable CORS with credentials
  app.use(helmet());
  app.use(json());
  app.use(express.json());
  app.use(cookieParser()); // ✅ Move cookieParser before routes

  const __dirname = path.resolve();
  const publicDirectoryPath = path.join(__dirname, "public");
  app.use("/api/public", express.static(publicDirectoryPath));

  // ✅ Define routes after middleware
  app.get("/", (_req, res) => {
    res.send({ message: "Welcome to the API" });
  });

  app.use("/api", router);

  // Handle 404 errors
  app.use((_req, res) => {
    res.status(404).send({ message: "Url not found." });
  });
};
