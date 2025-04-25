import { model } from "mongoose";
import { UserSchema } from "./UserModel.js";
import {BusinessSchema} from "./BusinessOwnerModel.js";
import { serviceSchema } from "./ServiceModel.js";
import {CardSchema} from "./Card.js";
import { UserBankSchema } from "./UserBank.js";
import { bookingSchema } from "./Booking.js";
export default () => {
  model("users", UserSchema);
  model("BusinessOwner",BusinessSchema , "BusinessOwners");
  model("services",serviceSchema,"servise")
  model("card",CardSchema,'Card')
  model("userBank",UserBankSchema,'UserBank');
  model("booking",bookingSchema,'booking')
};
