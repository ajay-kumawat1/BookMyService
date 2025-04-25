import { model, Schema } from "mongoose";
export const CardSchema = new Schema({
    number: { type: String, required: true },
    cvv: { type: String, required: true },
    expiration: { type: String, required: true }
});
export default  model("card", CardSchema);