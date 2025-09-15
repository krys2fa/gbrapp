// lib/notification-scheduler.ts
import { prisma } from "@/app/lib/prisma";
import { NotificationService } from "./notification-service";

interface ScheduledNotification {
  id: string;
  timeoutId: NodeJS.Timeout;
  exchangeRateId: string;
  exchangeName: string;
  rate: number;
  weekStart: string;
  submittedBy: string;
}

export class NotificationScheduler {
  private static scheduledNotifications = new Map<string, ScheduledNotification>();

  /**
   * Schedule a delayed notification for an exchange rate that hasn't been approved
   */
  static scheduleDelayedNotification(
    exchangeRateId: string,
    exchangeName: string,
    rate: number,
    weekStart: string,
    submittedBy: string,
    delayMinutes: number = 5
  ): void {
    // Cancel any existing scheduled notification for this exchange rate
    this.cancelScheduledNotification(exchangeRateId);

    const timeoutId = setTimeout(async () => {
      try {
        // Check if the exchange rate is still pending approval
        const weeklyPrice = await prisma.weeklyPrice.findUnique({
          where: { id: exchangeRateId },
          select: { status: true }
        });

        // Only send notification if still pending
        if (weeklyPrice && weeklyPrice.status === "PENDING") {
          console.log(`Sending delayed notification for exchange rate ${exchangeRateId}`);
          await NotificationService.notifyExchangeRateApprovalDelayed(
            exchangeRateId,
            exchangeName,
            rate,
            weekStart,
            submittedBy
          );
        } else {
          console.log(`Exchange rate ${exchangeRateId} no longer pending, skipping delayed notification`);
        }
      } catch (error) {
        console.error(`Failed to send delayed notification for exchange rate ${exchangeRateId}:`, error);
      } finally {
        // Remove from scheduled notifications
        this.scheduledNotifications.delete(exchangeRateId);
      }
    }, delayMinutes * 60 * 1000); // Convert minutes to milliseconds

    // Store the scheduled notification
    const scheduledNotification: ScheduledNotification = {
      id: exchangeRateId,
      timeoutId,
      exchangeRateId,
      exchangeName,
      rate,
      weekStart,
      submittedBy,
    };

    this.scheduledNotifications.set(exchangeRateId, scheduledNotification);
    
    console.log(`Scheduled delayed notification for exchange rate ${exchangeRateId} in ${delayMinutes} minutes`);
  }

  /**
   * Cancel a scheduled notification (e.g., when exchange rate is approved/rejected)
   */
  static cancelScheduledNotification(exchangeRateId: string): void {
    const scheduledNotification = this.scheduledNotifications.get(exchangeRateId);
    
    if (scheduledNotification) {
      clearTimeout(scheduledNotification.timeoutId);
      this.scheduledNotifications.delete(exchangeRateId);
      console.log(`Cancelled scheduled notification for exchange rate ${exchangeRateId}`);
    }
  }

  /**
   * Get all currently scheduled notifications (for debugging)
   */
  static getScheduledNotifications(): ScheduledNotification[] {
    return Array.from(this.scheduledNotifications.values());
  }

  /**
   * Clear all scheduled notifications (useful for cleanup during shutdown)
   */
  static clearAllScheduledNotifications(): void {
    this.scheduledNotifications.forEach((notification) => {
      clearTimeout(notification.timeoutId);
    });
    this.scheduledNotifications.clear();
    console.log("Cleared all scheduled notifications");
  }
}