import {SmtpConfig} from "../models/SmtpConfig";
const initializeSmtpData = async () => {
    const defaultSmtpConfig = {
        emailEngine: "smtp.gmail.com",
        smtpUsername: "theinthantoe.dev@gmail.com",
        smtpPassword: "tguj jyaw hnuh nsgr",
        smtpPort: 587,
        smtpSecurity: "TLS",
    };

    try {
        // Upsert logic to ensure no duplicate entrie
        await SmtpConfig.findOneAndUpdate(
            { smtpUsername: defaultSmtpConfig.emailEngine }, // Find by unique username
            defaultSmtpConfig,                                // Update fields
            { upsert: true, new: true }                       // Create if not exists
        );

        console.log("SMTP configuration initialized successfully!");
    } catch (error) {
        console.error("Failed to initialize SMTP configuration:", error);
    }
};

export  default initializeSmtpData;
