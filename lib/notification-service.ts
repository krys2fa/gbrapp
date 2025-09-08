// lib/notification-service.ts
import { prisma } from "@/app/lib/prisma";

export interface NotificationData {
  to: string;
  subject?: string;
  message: string;
  type: "email" | "sms";
}

export class NotificationService {
  private static emailServiceUrl = process.env.EMAIL_SERVICE_URL;
  private static smsServiceUrl = process.env.SMS_SERVICE_URL;
  private static emailApiKey = process.env.EMAIL_API_KEY;
  private static smsApiKey = process.env.SMS_API_KEY;

  static async sendEmail(
    to: string,
    subject: string,
    message: string
  ): Promise<boolean> {
    try {
      if (!this.emailServiceUrl || !this.emailApiKey) {
        console.warn(
          "Email service not configured, logging notification instead"
        );
        console.log(
          `EMAIL TO: ${to}, SUBJECT: ${subject}, MESSAGE: ${message}`
        );
        return true;
      }

      const response = await fetch(this.emailServiceUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.emailApiKey}`,
        },
        body: JSON.stringify({
          to,
          subject,
          html: message.replace(/\n/g, "<br>"),
        }),
      });

      return response.ok;
    } catch (error) {
      console.error("Email sending failed:", error);
      return false;
    }
  }

  static async sendSMS(to: string, message: string): Promise<boolean> {
    try {
      if (!this.smsServiceUrl || !this.smsApiKey) {
        console.warn(
          "SMS service not configured, logging notification instead"
        );
        console.log(`SMS TO: ${to}, MESSAGE: ${message}`);
        return true;
      }

      const response = await fetch(this.smsServiceUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.smsApiKey}`,
        },
        body: JSON.stringify({
          to,
          message,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error("SMS sending failed:", error);
      return false;
    }
  }

  static async notifySuperAdmins(
    subject: string,
    message: string
  ): Promise<void> {
    try {
      // Get all super admin users
      const superAdmins = await prisma.user.findMany({
        where: {
          role: "SUPERADMIN",
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      const notifications = superAdmins.map(async (admin: any) => {
        const promises = [];

        // For now, send email to all super admins (we'll add preference fields later)
        if (admin.email) {
          promises.push(this.sendEmail(admin.email, subject, message));
        }

        // TODO: Add SMS support when phone field is available
        // if (admin.smsNotifications && admin.phone) {
        //   promises.push(this.sendSMS(admin.phone, message))
        // }

        return Promise.all(promises);
      });

      await Promise.all(notifications);
      console.log(`Notifications sent to ${superAdmins.length} super admins`);
    } catch (error) {
      console.error("Failed to notify super admins:", error);
    }
  }

  static async notifyExchangeRateApproval(
    exchangeRateId: string,
    exchangeName: string,
    rate: number,
    weekStart: string,
    submittedBy: string
  ): Promise<void> {
    const subject = `Exchange Rate Approval Required: ${exchangeName}`;
    const message = `
New exchange rate requires approval:

Exchange: ${exchangeName}
Rate: ${rate}
Week: ${weekStart}
Submitted By: ${submittedBy}

Please review and approve/reject this rate in the system.

This is an automated notification from GBR Application.
    `.trim();

    await this.notifySuperAdmins(subject, message);
  }

  static async notifyExchangeRateApproved(
    exchangeRateId: string,
    exchangeName: string,
    rate: number,
    approvedBy: string
  ): Promise<void> {
    const subject = `Exchange Rate Approved: ${exchangeName}`;
    const message = `
Exchange rate has been approved:

Exchange: ${exchangeName}
Rate: ${rate}
Approved By: ${approvedBy}

The rate is now active and can be used for assays and invoicing.

This is an automated notification from GBR Application.
    `.trim();

    await this.notifySuperAdmins(subject, message);
  }

  static async notifyExchangeRateRejected(
    exchangeRateId: string,
    exchangeName: string,
    rate: number,
    rejectedBy: string,
    reason: string
  ): Promise<void> {
    const subject = `Exchange Rate Rejected: ${exchangeName}`;
    const message = `
Exchange rate has been rejected:

Exchange: ${exchangeName}
Rate: ${rate}
Rejected By: ${rejectedBy}
Reason: ${reason}

Please review the rejection reason and submit a new rate if needed.

This is an automated notification from GBR Application.
    `.trim();

    await this.notifySuperAdmins(subject, message);
  }
}
