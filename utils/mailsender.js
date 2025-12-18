const Brevo = require("@getbrevo/brevo");
const ejs = require("ejs");
const path = require("path");

// Create Brevo instance
const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.EmailSending
);

async function sendOtpEmail(email, otp) {
  try {
    const templatePath = path.join(__dirname, "../View/otp.ejs");

    const htmlContent = await ejs.renderFile(templatePath, {
      otp,
      year: new Date().getFullYear(),
    });

    const emailData = new Brevo.SendSmtpEmail();

    emailData.subject = "Your OTP - Brad Jewellery";
    emailData.sender = { name: "Brad Jewellery", email: "padariyakrish800@gmail.com" };
    emailData.to = [{ email }];
    emailData.htmlContent = htmlContent;

    const res = await apiInstance.sendTransacEmail(emailData);
    console.log("Email Sent: ", res);

    return { success: true };
  } catch (error) {
    console.error("Email Error:", error.response?.body || error);
    return { success: false };
  }
}

module.exports = {
  sendOtpEmail,
};
