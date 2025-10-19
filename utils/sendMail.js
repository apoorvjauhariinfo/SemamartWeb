// utils/sendMail.js
const mailjet = require("node-mailjet");

const mj = mailjet.apiConnect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_SECRET_KEY
);

const sendMail = async ({ email, subject, html }) => {
  try {
    if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
      throw new Error("Mailjet API keys missing from environment");
    }

    const result = await mj.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: "hintelsemamart@gmail.com", // working sender
            Name: "Semamart",
          },
          To: [{ Email: email }],
          Subject: subject,
          HTMLPart: html,
        },
      ],
    });

    console.log(
      "✅ Mail sent successfully:",
      result.body.Messages[0].To[0].Email
    );
    console.log("📬 Mail status:", result.body.Messages[0].Status);
  } catch (err) {
    console.error("❌ Mailjet error:", err.response?.body || err.message);
  }
};

module.exports = sendMail;
