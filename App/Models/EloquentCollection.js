import { model } from "mongoose";
import { UserSchema } from "./User.js";
export default () => {
  model("users", UserSchema);
};
