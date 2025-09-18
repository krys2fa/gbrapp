// lib/notification-service.ts
import { prisma } from "@/app/lib/prisma";
import { logger, LogCategory, LogLevel } from "./logger";

export interface NotificationData {
  to: string;
  subject?: string;
  message: string;
  type: "email" | "sms";
}

export class NotificationService {
  private static emailServiceUrl = process.env.EMAIL_SERVICE_URL;
  private static emailApiKey = process.env.EMAIL_API_KEY;
  private static smsApiKey = process.env.SMS_API_KEY;

  /**
   * Validate if a phone number is in a valid format for SMS
   * Accepts international format with or without + prefix
   * Minimum 10 digits, maximum 15 digits (E.164 standard)
   */
  private static isValidPhoneNumber(phone: string | null | undefined): boolean {
    if (!phone || typeof phone !== "string") {
      return false;
    }

    // Remove all non-digit characters
    const cleanedPhone = phone.replace(/\D/g, "");

    // Check if it's between 10-15 digits (international standard)
    if (cleanedPhone.length < 10 || cleanedPhone.length > 15) {
      return false;
    }

    // Must start with digits (country codes are typically 1-4 digits)
    return /^\d+$/.test(cleanedPhone);
  }

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
      // Validate phone number first
      if (!this.isValidPhoneNumber(to)) {
        await logger.warn(
          LogCategory.SMS,
          `Invalid phone number format: ${to} - SMS not sent`,
          {
            phoneNumber: to,
            reason: "invalid_format",
          }
        );
        console.warn(`📱 Invalid phone number format: ${to} - SMS not sent`);
        return false;
      }

      if (!this.smsApiKey) {
        await logger.warn(
          LogCategory.SMS,
          "SMS service not configured - API key missing",
          {
            phoneNumber: to,
          }
        );
        console.warn(
          "SMS service not configured, logging notification instead"
        );
        console.log(`SMS TO: ${to}, MESSAGE: ${message}`);
        return true;
      }

      // Arkesel SMS API endpoint
      const arkeselEndpoint = "https://sms.arkesel.com/api/v2/sms/send";

      // Ensure phone number is in international format (remove leading + if present)
      const cleanedPhoneNumber = to.startsWith("+") ? to.substring(1) : to;

      const response = await fetch(arkeselEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": this.smsApiKey,
        },
        body: JSON.stringify({
          sender: "GBR System",
          message: message,
          recipients: [cleanedPhoneNumber],
        }),
      });

      const result = await response.json();

      if (response.ok && result.code === "ok") {
        await logger.info(LogCategory.SMS, `SMS sent successfully`, {
          phoneNumber: to,
          messageLength: message.length,
          cost: result.data?.cost,
          balance: result.data?.balance,
        });
        console.log(`SMS sent successfully to ${to}`);
        return true;
      } else {
        await logger.error(LogCategory.SMS, `SMS sending failed`, {
          phoneNumber: to,
          error: result,
          responseStatus: response.status,
        });
        console.error(`SMS sending failed:`, result);
        return false;
      }
    } catch (error) {
      console.error("SMS sending failed:", error);
      return false;
    }
  }

  static async notifyUsersWithRoles(
    roles: (
      | "SUPERADMIN"
      | "CEO"
      | "DEPUTY_CEO"
      | "ADMIN"
      | "USER"
      | "TELLER"
      | "FINANCE"
    )[],
    subject: string,
    message: string,
    notificationType: "email" | "sms" | "both" = "both"
  ): Promise<void> {
    try {
      console.log(`🔍 Looking for users with roles: ${roles.join(", ")}`);
      const users = await prisma.user.findMany({
        where: {
          role: {
            in: roles,
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      });
      console.log(`📱 Found ${users.length} users with required roles:`);
      users.forEach((user) => {
        console.log(
          `  - ${user.name} (${user.role}): phone=${
            user.phone || "NO PHONE"
          }, email=${user.email}`
        );
      });

      const notifications = users.map(async (user) => {
        const promises = [];

        if (notificationType === "email" || notificationType === "both") {
          if (user.email) {
            promises.push(this.sendEmail(user.email, subject, message));
          } else {
            console.warn(
              `📧 No email address for user ${user.name} (${user.role})`
            );
          }
        }

        if (notificationType === "sms" || notificationType === "both") {
          if (user.phone && this.isValidPhoneNumber(user.phone)) {
            console.log(
              `📱 Sending SMS to ${user.name} (${user.role}): ${user.phone}`
            );
            promises.push(this.sendSMS(user.phone, message));
          } else if (user.phone) {
            console.warn(
              `📱 Invalid phone number for user ${user.name} (${user.role}): ${user.phone} - SMS not sent`
            );
          } else {
            console.warn(
              `📱 No phone number for user ${user.name} (${user.role}) - SMS not sent`
            );
          }
        }

        return Promise.all(promises);
      });

      await Promise.all(notifications);

      // Log summary of SMS delivery attempts
      const smsEligibleUsers = users.filter(
        (user) => user.phone && this.isValidPhoneNumber(user.phone)
      );
      const invalidPhoneUsers = users.filter(
        (user) => user.phone && !this.isValidPhoneNumber(user.phone)
      );
      const noPhoneUsers = users.filter((user) => !user.phone);

      if (notificationType === "sms" || notificationType === "both") {
        console.log(`📊 SMS Delivery Summary:`);
        console.log(`  ✅ Valid phone numbers: ${smsEligibleUsers.length}`);
        console.log(`  ❌ Invalid phone numbers: ${invalidPhoneUsers.length}`);
        console.log(`  📵 No phone numbers: ${noPhoneUsers.length}`);
      }
    } catch (error) {
      console.error("Failed to notify users with roles:", error);
      throw error;
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
//     const message = `
// New exchange rate requires approval:

// Exchange: ${exchangeName}
// Rate: ${rate}
// Week: ${weekStart}
// Submitted By: ${submittedBy}

// Please review and approve/reject this week's exchange rate at https://gbrapp.vercel.app/setup/pending-approvals.
//     `.trim();

const message = `
Exchange rate approval required:

Exchange: ${exchangeName}
Rate: ${rate}

Please review and approve/reject this week's exchange rate at https://gbrapp.vercel.app/setup/pending-approvals.
    `.trim();

    // Send immediate SMS notification to SUPERADMIN, CEO, and DEPUTY_CEO
    await this.notifyUsersWithRoles(
      ["SUPERADMIN", "CEO", "DEPUTY_CEO"],
      subject,
      message,
      "sms"
    );
  }

  static async notifyExchangeRateApprovalDelayed(
    exchangeRateId: string,
    exchangeName: string,
    rate: number,
    weekStart: string,
    submittedBy: string
  ): Promise<void> {
    const subject = `URGENT: Exchange Rate Still Pending Approval: ${exchangeName}`;
//     const message = `
// URGENT: An exchange rate has been pending approval for 5 minutes:

// Exchange: ${exchangeName}
// Rate: ${rate}
// Week: ${weekStart}
// Submitted By: ${submittedBy}

// This rate requires immediate attention. Please review and approve/reject via https://gbrapp.vercel.app/setup/pending-approvals.
//     `.trim();

const message = `
URGENT: Exchange rate approval pending for 5 minutes:

Exchange: ${exchangeName}
Rate: ${rate}

Immediate attention required. Please review via https://gbrapp.vercel.app/setup/pending-approvals.
    `.trim();

    // Send delayed SMS notification to DEPUTY_CEO and SUPERADMIN
    await this.notifyUsersWithRoles(
      ["DEPUTY_CEO", "SUPERADMIN"],
      subject,
      message,
      "sms"
    );
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

  /**
   * Check SMS readiness for users with specific roles
   * Returns count of users with valid phone numbers
   */
  static async checkSMSReadiness(
    roles: (
      | "SUPERADMIN"
      | "CEO"
      | "DEPUTY_CEO"
      | "ADMIN"
      | "USER"
      | "TELLER"
      | "FINANCE"
    )[]
  ): Promise<{
    totalUsers: number;
    validPhoneUsers: number;
    invalidPhoneUsers: number;
    noPhoneUsers: number;
    users: Array<{
      name: string;
      role: string;
      phone: string | null;
      phoneValid: boolean;
    }>;
  }> {
    try {
      const users = await prisma.user.findMany({
        where: {
          role: {
            in: roles,
          },
        },
        select: {
          name: true,
          role: true,
          phone: true,
        },
      });

      const userDetails = users.map((user) => ({
        name: user.name,
        role: user.role,
        phone: user.phone,
        phoneValid: this.isValidPhoneNumber(user.phone),
      }));

      const validPhoneUsers = userDetails.filter((u) => u.phoneValid).length;
      const invalidPhoneUsers = userDetails.filter(
        (u) => u.phone && !u.phoneValid
      ).length;
      const noPhoneUsers = userDetails.filter((u) => !u.phone).length;

      return {
        totalUsers: users.length,
        validPhoneUsers,
        invalidPhoneUsers,
        noPhoneUsers,
        users: userDetails,
      };
    } catch (error) {
      console.error("Failed to check SMS readiness:", error);
      throw error;
    }
  }
}
