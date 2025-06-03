import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { quoteEmailTemplate, policyEmailTemplate } from "@/lib/emailTemplates";
import path from "path";
import fs from "fs";

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
    let attachments = [];

    if (type === "quote") {
      template = quoteEmailTemplate(data);
    } else if (type === "policy") {
      template = policyEmailTemplate(data);
      const pdfPath = path.join(process.cwd(), "public", "base.pdf");
      if (fs.existsSync(pdfPath)) {
        attachments.push({
          filename: "policy_document.pdf", // You can customize the attached file name
          path: pdfPath,
          contentType: "application/pdf",
        });
      } else {
        console.warn("PDF file not found at:", pdfPath);
        // Optionally, you could return an error or send the email without the PDF
      }
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: SMTP_EMAIL,
        pass: SMTP_PASS,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Email template could not be generated." },
        { status: 500 }
      );
    }

    await transporter.sendMail({
      from: SMTP_EMAIL,
      to,
      subject: template.subject,
      text: template.text,
      html: template.html,
      attachments: attachments,
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
