import { model } from "mongoose";
import { UserSchema } from "./UserModel.js";
import {BusinessSchema} from "./BusinessOwnerModel.js";
import { serviceSchema } from "./ServiceModel.js";

export default () => {
  model("users", UserSchema);
  model("BusinessOwner",BusinessSchema , "BusinessOwners");
  model("services",serviceSchema,"servise")

};
