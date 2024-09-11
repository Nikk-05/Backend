import mongoose from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const VideoSchema = new mongoose.Schema({
    videoFile:{
        type:String, 
        required:true,
    },
    thumbnail:{
        type:String,
        required:true
    },
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required:true
    },
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    duration:{
        type:Number, // Cloundinary
        required:true
    },
    views:{
        type:Number,
        default:0
    },
    isPublished:{
        type:Boolean,
        default:true
    }

},{timestamps:true})

// Create a text index on `title` and `description`
// This will help to find video using query string
VideoSchema.index({ title: 'text', description: 'text' });


VideoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model('Video',VideoSchema);