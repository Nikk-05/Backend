import mongoose,{Schema} from "mongoose"
import { User } from "./User.models"
const subscriptionSchema = new Schema({
    subscriber: {
        type: mongoose.Schema.Types.ObjectId,
        reference: User
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId,
        reference: User
    }
},{timestamps:true})

export const Subscription = mongoose.model("Subscription",subscriptionSchema)