import { model } from "mongoose";
import { UserSchema } from "./UserModel.js";
export default () => {
  model("users", UserSchema);
};
