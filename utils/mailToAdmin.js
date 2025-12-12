const sendMail = require("./sendMail");

async function sentMailToAdmin(subject, body) {
  try {
    const adminEmail = "vibeko4429@alexida.com"; // TODO
    sendMail({ email: adminEmail, subject: subject, html: body });
  } catch (err) {
    console.log("failed to send mail to admin")
    console.log(err);
  }
}

module.exports = sentMailToAdmin;
