
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}
const mailjet = require("node-mailjet");

if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
  throw new Error("Mailjet API keys missing from environment");
}

const mj = mailjet.apiConnect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_SECRET_KEY
);

const sendEmail = async ({ to, subject, html, text }) => {
  if (!to) throw new Error("Recipient email is required");


  try {
    const request = {
      Messages: [
        {
          From: {
            Email: "hintelsemamart@gmail.com", 
            Name: "Semamart",
          },
          To: [{ Email: to }],
          Subject: subject,
          HTMLPart: html,
          TextPart: text || html.replace(/<[^>]*>/g, ""),
        },
      ],
    };

    const result = await mj.post("send", { version: "v3.1" }).request(request);
   
  } catch (err) {
    console.error("❌ Mailjet error:", err.response?.body || err.message);
  }
};



module.exports = sendEmail;
