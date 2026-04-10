import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({

    name: String,
    email: String,
    password:{
        type: String,
        minLength: [8 , 'Password must be at least 8 characters long'],
        maxLength: [20 , 'Password must be at most 20 characters long'],
        select: false,
    },
    phone: String,
    accountVerified:{
        type: Boolean,
        default: false
    },
    verificationCode: Number,
    verificationCodeExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    createdAt:{
        type: Date,
        default: Date.now
    },
});

userSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        return ;
    }  
    this.password =  await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function(candidatePassword){
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateVerificationCode = function(){
    function generateRandonFiveDigitNumber(){
        const firstDigit = Math.floor(Math.random() * 9) + 1;
        const remainingDigits = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');

        return parseInt(firstDigit + remainingDigits);
    }

    const verificationCode = generateRandonFiveDigitNumber();
    this.verificationCode = verificationCode;
    this.verificationCodeExpires = Date.now() + 5 * 60 * 1000; // Code expires in 5 minutes

    return verificationCode;
}
userSchema.methods.generateToken = function () {
    return jwt.sign(
        { id: this._id },
        process.env.JWT_SECRET_KEY,
        { expiresIn: process.env.JWT_EXPIRE }
    );
};

userSchema.methods.getResetPasswordToken = function () {

    // 1. Generate token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // 2. Hash token and save in DB
    this.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    // 3. Expiry (10 minutes)
    this.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

export default mongoose.model('User', userSchema);