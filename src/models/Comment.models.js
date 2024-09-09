import mongoose,{Schema} from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const commentSchema = new Schema.create({
    content:{
        type: String,
        required: true
    },
    video:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video'
    },
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamp: true})
commentSchema.plugin(mongooseAggregatePaginate)
export const Comment = mongoose.model("comment",commentSchema);