// require('dotenv').config({path:'./env'})
import dotenv from 'dotenv';
import connectDB from "./database/dbConnection.js";
import {app} from './app.js'

dotenv.config({ path: './.env' });

connectDB()   // ConnectDB is an async function so it will return a promise.
.then(()=> {
    app.on("error",(error) =>{
        console.error(error)
        throw error  // Rethrow the error to make it bubble up to the catch block in index.js. This will stop the application from crashing.
    })
    app.listen(process.env.PORT || 8000, ()=> {
        console.log("Server running on port " + process.env.PORT)
    })
})
.catch((err)=> {
    console.error("Failed to connect to MongoDB", err.message);
    process.exit(1);  // Exit application with an error code
})




// // Connect to MongoDB
// // ; before for code cleaning purpose
// ;(async()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}${DB_NAME}`);
//         app.on("error",(error)=>{
//             console.error(error)
//             throw error
//         })
//         app.listen(process.env.PORT,()=>{
//             console.log("listening on port " + process.env.PORT)
//         })
//     }
//     catch(err){
//         console.error("Failed to connect to MongoDB",err);
//         process.exit(1);
//     }

// })()