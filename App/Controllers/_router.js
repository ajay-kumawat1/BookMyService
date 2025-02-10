import express from "express";
import Auth from "./Auth/_route.js";
import User from "./User/_route.js";

const app = express();
app.use(express.json());

app.use("/auth", Auth);
app.use('/user', User);

export default app;
