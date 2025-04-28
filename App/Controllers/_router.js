import express from "express";
import Auth from "./Auth/_route.js";
import User from "./User/_route.js";
import Admin from "./Admin/_route.js";
import Service from "./Service/_route.js";
import BusinessOwner from "./BusinessOwner/_route.js"
import Booking from "./Booking/_route.js";
import { isAdminAuthenticated } from "../Middleware/auth.middleware.js";
import stripeRoutes from "../Controllers/Services/_route.js"
const app = express();
app.use(express.json());

app.use("/auth", Auth);
app.use("/user", User);
app.use("/admin", Admin);
app.use("/service", Service);
app.use("/business-owner", BusinessOwner);
app.use("/booking",Booking)
app.use('/stripe', stripeRoutes);
export default app;
