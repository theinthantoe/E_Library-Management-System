const nodemailer = require('nodemailer');
const dotenv = require("dotenv");
import {SmtpConfig} from "../models/SmtpConfig";
dotenv.config();

async function sendOtpEmail(email : any, otp :any) {
    try {
        // Fetch SMTP configuration dynamically from the database
        const config = await SmtpConfig.findOne(); // Assuming only one config exists

        if (!config) {
            throw new Error("SMTP configuration not found.");
        }

        // Create the transporter dynamically based on the configuration
        const transporter = nodemailer.createTransport({
            host: config.emailEngine, // Dynamic host, e.g., "smtp.gmail.com" or "smtppro.zoho.com"
            port: config.smtpPort,
            secure: config.smtpSecurity.toLowerCase() === 'ssl', // Use secure connection for SSL
            auth: {
                user: config.smtpUsername,
                pass: config.smtpPassword, // Ensure this is decrypted if stored encrypted
            },
        });

        // Email options
        const mailOptions = {
            from: config.smtpUsername, // Use the dynamic "from" address
            to: email,
            subject: "Verify Your Email Address",
            text: `${otp} is your Digital Library verification code`,
        };

        // Send the email
        await transporter.sendMail(mailOptions);
        console.log(`OTP email sent successfully to ${email}`);
    } catch (error : any) {
        console.error("Failed to send OTP email:", error.message);
        throw error; // Propagate error to handle it upstream
    }
}
export  default sendOtpEmail;
