import express from "express";
import Auth from "./Auth/_route.js";
import User from "./User/_route.js";
import Service from "./Service/_route.js";
import BusinessOwner from "./BusinessOwner/_route.js"
const app = express();
app.use(express.json());

app.use("/auth", Auth);
app.use("/user", User);
app.use("/service", Service);
app.use("/business-owner", BusinessOwner);

export default app;
