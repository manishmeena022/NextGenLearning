import nodemailer from "nodemailer";

// ── Transporter ───────────────────────────────────────────
const createTransporter = () => {
    // Development: use Ethereal (fake SMTP, emails are captured at ethereal.email)
    if (process.env.NODE_ENV !== "production") {
        return nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            auth: {
                user: process.env.ETHEREAL_USER,
                pass: process.env.ETHEREAL_PASS,
            },
        });
    }

    // Production: use your real SMTP provider
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_PORT === "465", // true for port 465, false for 587
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

// ── Send ──────────────────────────────────────────────────
export const sendEmail = async ({ to, subject, html, text }) => {
    try {
        const transporter = createTransporter();

        const info = await transporter.sendMail({
            from: `"LearnFlow" <${process.env.EMAIL_FROM ?? "no-reply@learnflow.dev"}>`,
            to,
            subject,
            html,
            text: text ?? html.replace(/<[^>]*>/g, ""), // plain text fallback
        });

        // In dev, log the Ethereal preview URL
        if (process.env.NODE_ENV !== "production") {
            console.log(`📧 Email preview: ${nodemailer.getTestMessageUrl(info)}`);
        }

        return info;
    } catch (error) {
        console.error("sendEmail error:", error);
        throw error;
    }
};