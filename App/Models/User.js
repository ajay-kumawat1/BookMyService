import { model, Schema } from 'mongoose';
import jwt from 'jsonwebtoken';

export const UserSchema = new Schema(
    {
        first_name: {
            type: String,
            required: [true, 'The first name is required.'],
        },
        last_name: {
            type: String,
            default: null,
        },
        email: { type: String, required: true },
        password: { type: String, default: null },
        is_admin: {
            type: Boolean,
            default:false
        },
        is_verified :{
            type:Boolean,
            default:false
        }
    },
    {
        timestamps: true,
    },
);

UserSchema.methods.generateAuthToken = function () {
    return jwt.sign({ uid: this._id, is_admin: this.is_admin}, process.env.JWT_PRIVATE_KEY, {
        expiresIn: '24h',
    });
};

export default model('User', UserSchema);
