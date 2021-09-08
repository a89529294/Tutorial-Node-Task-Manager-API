const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: "a89529294@hotmail.com",
    subject: "Thanks for joining in!",
    text: `Welcome to the app, ${name}. Let me know how you get along with the app.`,
  });
};

const sendCancelationEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: "a89529294@hotmail.com",
    subject: "Sorry to see you go",
    text: `We are sorry to see you go, ${name}. Let me know why you decided to deactivate your account.`,
  });
};

module.exports = {
  sendWelcomeEmail,
  sendCancelationEmail,
};

// const msg = {
//   to: "a89529294@gmail.com",
//   from: "a89529294@hotmail.com",
//   subject: "First creation",
//   text: "I hope this one gets to you",
// };

// sgMail
//   .send(msg)
//   .then(() => {
//     console.log("Email sent");
//   })
//   .catch((error) => {
//     console.error(error);
//   });
