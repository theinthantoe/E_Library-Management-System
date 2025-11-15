import mongoose from 'mongoose';

const smtpConfigSchema = new mongoose.Schema({
    emailEngine: { type: String, required: true, default: "smtp" }, // e.g., 'smtp'
    smtpUsername: { type: String, required: true },  // e.g., 'example@gmail.com'
    smtpPassword: { type: String, required: true },                // Encrypted or plain text
    smtpPort: { type: Number, required: true, default: 587 },      // Default SMTP port
    smtpSecurity: { type: String, required: true, default: "TLS" },// e.g., 'TLS' or 'SSL'
});

// Check if the model is already defined to avoid the OverwriteModelError
const SmtpConfig =mongoose.model("SmtpConfig", smtpConfigSchema);

export { SmtpConfig };