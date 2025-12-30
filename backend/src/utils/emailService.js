import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USERNAME, // your email
        pass: process.env.EMAIL_PASSWORD,  // your email password
    },
});

const sendEmail = (to, subject, text) => {
    const mailOptions = {
        from: process.env.EMAIL_USERNAME, // sender address
        to: to,                       // receiver address
        subject: subject,
        text: text,
    };

    return transporter.sendMail(mailOptions);
};

export {sendEmail}
