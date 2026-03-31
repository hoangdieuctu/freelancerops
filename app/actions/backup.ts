"use server";

import nodemailer from "nodemailer";
import path from "path";
import { prisma } from "@/lib/prisma";

export async function sendBackup(): Promise<{ ok: boolean; error?: string }> {
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });

  if (!settings?.smtpHost || !settings?.smtpPort || !settings?.smtpUser || !settings?.smtpPass) {
    return { ok: false, error: "SMTP is not configured. Please fill in all SMTP settings first." };
  }
  if (!settings.backupEmail) {
    return { ok: false, error: "Backup email address is not set." };
  }

  const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
  const now = new Date();
  const version = "1.0.17";
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const filename = `freelanceops-${version}-${dateStr}.db`;

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpPort === 465,
    auth: { user: settings.smtpUser, pass: settings.smtpPass },
  });

  try {
    await transporter.sendMail({
      from: settings.smtpUser,
      to: settings.backupEmail,
      subject: `FreelanceOps DB Backup — ${now.toUTCString()}`,
      text: `Database backup attached.\n\nGenerated: ${now.toUTCString()}`,
      attachments: [{ filename, path: dbPath }],
    });
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
