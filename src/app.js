import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()
const PORT = process.env.PORT || 8001

app.use(cors({
    origin: process.env.CROS_ORIGIN,
}))

// Handle data send trough URL request
app.use(express.json({ limit: '100kb' }))

// It ensure that the url encoded data should be handled correctly.
app.use(express.urlencoded({
    extended: true,
    limit: '100kb'
}))
// To store the assets in local storage
app.use(express.static("public"))

// To use the cookie which sever can perform CURD operations.
app.use(cookieParser()) 


// import Routes
import userRouter from './routes/user.routes.js';

// routes declaration
app.use('/api/v1/users', userRouter); // we seperated the router then we have to this
// This will be url
// http://localhost:3010/api/v1/users/register

export {app} 