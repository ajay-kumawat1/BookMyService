import path from "path";
import express, { json } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";
import router from "../Controllers/_router.js";
import "../Config/passport.js"; // Import passport configuration

export default (app) => {
  app.use(cors({
    origin: [
      "http://localhost:5173",
      "https://book-my-service-client.vercel.app"
    ],
    credentials: true
  }));
  app.use(helmet());
  app.use(json());
  app.use(express.json());
  app.use(cookieParser());

  // Initialize Passport
  app.use(passport.initialize());

  const __dirname = path.resolve();
  const publicDirectoryPath = path.join(__dirname, "public");
  app.use("/api/public", express.static(publicDirectoryPath));

  app.get("/", (_req, res) => {
    res.send({ message: "Welcome to the API" });
  });

  app.use("/api", router);

  // Handle 404 errors
  app.use((_req, res) => {
    res.status(404).send({ message: "Url not found." });
  });
};
