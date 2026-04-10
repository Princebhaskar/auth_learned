import ErrorHandler from "../middleware/error.js";
import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import User from "../models/userModel.js";
import { sendEmail } from "../utils/sendEmail.js";
import twilio from "twilio";
import { sendToken } from "../utils/sendToken.js";
import crypto from "crypto";

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

export const registerUser = catchAsyncErrors(async (req, res, next) => {
    
    const { name, email, phone, password, verificationMethod } = req.body;

    if (!name || !email || !phone || !password || !verificationMethod) {
        return next(new ErrorHandler("Please fill all the fields", 400));
    }

    function validatePhoneNumber(phone) {
        const phoneRegex = /^(?:\+91|91)?[6-9]\d{9}$/;
        return phoneRegex.test(phone);
    }

    if (!validatePhoneNumber(phone)) {
        return next(new ErrorHandler("Invalid phone number", 400));
    }

    const existingUser = await User.findOne({
        $or: [
            { email, accountVerified: true },
            { phone, accountVerified: true }
        ]
    });

    if (existingUser) {
        return next(new ErrorHandler("User already exists", 400));
    }

    const registertionAttemptbyUser = await User.countDocuments({
        $or: [
            { email, accountVerified: false },
            { phone, accountVerified: false }
        ]
    });

    if (registertionAttemptbyUser > 3) {
        return next(new ErrorHandler("Too many registration attempts. Please try again later.", 400));
    }

    const userData = {
        name,
        email,
        phone,
        password,
    };

    const user = await User.create(userData);

    const verificationCode = user.generateVerificationCode();
    await user.save();

    await sendVerificationCode(verificationMethod, verificationCode, name, email, phone, res);
});


async function sendVerificationCode(verificationMethod, verificationCode, name, email, phone, res) {
    try {
        if (verificationMethod === "email") {

            const message = generateEmailTemplate(verificationCode);

            await sendEmail({
                email,
                subject: "Email Verification Code",
                message
            });

            return res.status(200).json({
                success: true,
                message: `Verification email successfully sent to ${name}`,
            });

        } else if (verificationMethod === "phone") {

            // ✅ FIX: ensure correct phone format
            const formattedPhone = phone.startsWith("+91") ? phone : `+91${phone}`;

            const verificationCodeWithSpace = verificationCode
                .toString()
                .split("")
                .join(" ");

            await client.messages.create({
                body: `Your verification code is ${verificationCodeWithSpace}.`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: formattedPhone,
            });

            return res.status(200).json({
                success: true,
                message: `OTP sent.`,
            });

        } else {
            return res.status(500).json({
                success: false,
                message: "Invalid verification method.",
            });
        }

    } catch (error) {
        console.log("TWILIO ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to send verification code. Please try again.",
        });
    }
}


function generateEmailTemplate(verificationCode) {
    return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: #333;">Email Verification</h2>
      
      <p>Hello,</p>
      
      <p>Your verification code is:</p>
      
      <h1 style="color: #4CAF50; letter-spacing: 5px;">
        ${verificationCode}
      </h1>
      
      <p>This code will expire in 5 minutes.</p>
      
      <p>If you did not request this, please ignore this email.</p>
      
      <br/>
      <p>Thanks,</p>
      <p><b>Your App Team</b></p>
    </div>
  `;
}

export const verifyUser = catchAsyncErrors(async (req, res, next) => {

    const { email, otp , phone } = req.body;
    function validatePhoneNumber(phone) {
        const phoneRegex = /^(?:\+91|91)?[6-9]\d{9}$/;
        return phoneRegex.test(phone);
    }

    if (!validatePhoneNumber(phone)) {
        return next(new ErrorHandler("Invalid phone number", 400));
    }

    try{
        const userAllEntries = await User.find({
            $or: [
                { email, accountVerified: false },
                { phone, accountVerified: false }
            ]
        }).sort({ createdAt: -1 });

        if (userAllEntries.length === 0) {
            return next(new ErrorHandler("User not found or already verified.", 400));
        }

        let user;

        if (userAllEntries.length > 1) {
            user = userAllEntries[0];
            await User.deleteMany({
                _id: { $ne: user._id },
                $or: [
                    { email, accountVerified: false },
                    { phone, accountVerified: false }
                ],
            });
        } else {
            user = userAllEntries[0];
        }

        if (!user.verificationCodeExpires) {
            return next(new ErrorHandler("OTP not found or already used", 400));
        }

        const currentTime = Date.now();
        const codeExpirationTime = new Date(user.verificationCodeExpires).getTime();

        if (currentTime > codeExpirationTime) {
            return next(new ErrorHandler("OTP has expired", 400));
        }

        if (user.verificationCode !== Number(otp)) {
            return next(new ErrorHandler("Invalid OTP", 400));
        }

        user.accountVerified = true;
        user.verificationCode = null;
        user.verificationCodeExpires = null;

        await user.save({ validateModifiedOnly: true });

        sendToken(user , 200 , "Account verified successfully." , res);

    }catch(error){
        return next(new ErrorHandler("Internal Server Error.", 500));
    }
});

export const login = catchAsyncErrors(async (req, res, next) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorHandler("Please provide email and password", 400));
    }

    const user = await User.findOne({ email, accountVerified: true }).select("+password");

    if (!user) {
        return next(new ErrorHandler("Invalid email or account not verified", 400));
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid password", 400));
    }

    sendToken(user, 200, "Login successful.", res);
});


export const logout = catchAsyncErrors(async (req, res, next) => {
    res.status(200).cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    }).json({
        success: true,
        message: "Logged out successfully.",
    });
});

export const getUserProfile = catchAsyncErrors(async (req, res, next) => {
    const user = req.user;

    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }
    res.status(200).json({
        success: true,
        user,
    });
}); 

export const forgotPassword = catchAsyncErrors(async (req, res, next) => {

    const { email } = req.body;

    // ✅ 1. Validate input first
    if (!email) {
        return next(new ErrorHandler("Please provide your email", 400));
    }

    // ✅ 2. Find user
    const user = await User.findOne({
        email,
        accountVerified: true
    });

    // ✅ 3. If user not found
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    // ✅ 4. Generate reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // ✅ 5. Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

    const message = `Your password reset token is:\n\n${resetUrl}\n\nIf you did not request this, ignore it.`;

    try {
        await sendEmail({
            email: user.email,
            subject: "Password Recovery",
            message,
        });

        res.status(200).json({
            success: true,
            message: `Email sent to ${user.email} successfully.`,
        });

    } catch (error) {

        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save({ validateBeforeSave: false });

        return next(new ErrorHandler(
            error.message || "Failed to send email",
            500
        ));
    }
});


export const resetPassword = catchAsyncErrors(async (req, res, next) => {

    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
        return next(new ErrorHandler("Please provide all fields", 400));
    }

    if (password !== confirmPassword) {
        return next(new ErrorHandler("Passwords do not match", 400));
    }

    const resetPasswordToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpires: { $gt: Date.now() },
        accountVerified: true 
    });

    if (!user) {
        return next(new ErrorHandler("Token invalid or expired", 400));
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    sendToken(user, 200, "Password reset successful", res);
});