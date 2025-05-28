import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { quoteEmailTemplate, policyEmailTemplate } from "@/lib/emailTemplates";

const SMTP_EMAIL = process.env.SMTP_EMAIL;
const SMTP_PASS = process.env.SMTP_PASS;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, type = "quote", data } = body;
    if (!to || !data) {
      return NextResponse.json(
        { error: "Missing recipient or data." },
        { status: 400 }
      );
    }
    let template;
    if (type === "policy") {
      template = policyEmailTemplate(data);
    } else {
      template = quoteEmailTemplate(data);
    }
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: SMTP_EMAIL,
        pass: SMTP_PASS,
      },
    });
    await transporter.sendMail({
      from: SMTP_EMAIL,
      to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to send email.",
      },
      { status: 500 }
    );
  }
}
