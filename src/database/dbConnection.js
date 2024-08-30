import mongoose from "mongoose";
import {DB_NAME} from "../constants.js";

const connectDB = async () =>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI + DB_NAME}`);
        console.log("Connect to DB localhost: " + connectionInstance.connection.port)
    }
    catch(error){
        console.error("Failed to connect to MongoDB", error.message);
        process.exit(1); 
    }
}

export default connectDB;