import mongoose from 'mongoose';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true,
        match: /^[a-zA-Z0-9]+$/,
        minlength: 3,
        maxlength: 30,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    fullName: {
        type: String,
        required: true
    },
    avatar: {
        type: String, // cloudinary
        required: true
    },
    coverImage: {
        type: String, // cloudinary
    },
    watchHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Videos"
        }
    ],
    password: {
        type: String,
        required: true,
        minlength: 8,
        maxlength: 100
    },
    refreshToken: {
        type: String,
        default: null
    }
}, { timestamps: true })

// We need to encrypt the password before storing into database.
//  For that we take help of mongoose hook like pre or post.
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    next();
})

// We need to create a methods for password comparison.
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

// Methods for Acess Token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            username: this.username,
            email: this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY })
}

// Methods for Refresh Token
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id
    },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY })
}
export const User = mongoose.model("User", userSchema)

