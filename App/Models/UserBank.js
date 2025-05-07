import { model, Schema } from "mongoose";

export const UserBankSchema = new Schema({
    bank_number: { type: String, required: true },
    holder_name: { type: String, required: true }
});

export default  model("userBank", UserBankSchema);