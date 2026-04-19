"use server";

import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
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
  const version = "1.0.22";
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

export async function restoreBackup(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const file = formData.get("file") as File | null;
  if (!file) return { ok: false, error: "No file provided." };

  const buffer = Buffer.from(await file.arrayBuffer());

  // Validate SQLite magic header: first 16 bytes = "SQLite format 3\0"
  const magic = buffer.slice(0, 16).toString("utf8");
  if (!magic.startsWith("SQLite format 3")) {
    return { ok: false, error: "Invalid file: not a SQLite database." };
  }

  const dbPath = path.resolve(process.cwd(), "prisma/dev.db");

  try {
    // Write the new DB — volume-mounted in Docker so it persists
    fs.writeFileSync(dbPath, buffer);
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
