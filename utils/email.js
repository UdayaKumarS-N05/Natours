const nodemailer = require('nodemailer');

const sendTokenByEmail = async (options) => {
  // 1. Create a transponder
  const ex = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    auth: {
      username: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  const transporter = nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: '3bd55ad26544d6',
      pass: 'bc87df9d5d2edf',
    },
  });

  // 2 Define options
  const mailOptions = {
    from: 'Natours.io <natours.io>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:true
  };
  // 3 Actuall send the mail
  await transporter.sendMail(mailOptions);
};

module.exports = sendTokenByEmail;
