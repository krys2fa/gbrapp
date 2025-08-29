"use client";

import React, { useState } from "react";
import { Header } from "@/app/components/layout/header";
import { CheckCircle, Clock, FileText, Bell } from "lucide-react";

type Notification = {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
};

const initialNotifications: Notification[] = [
  {
    id: "n1",
    title: "Job Card Created",
    description: "New job card for Exporter ABC has been created.",
    time: "30 minutes ago",
    read: false,
  },
  {
    id: "n2",
    title: "Invoice Generated",
    description: "Invoice #INV-2025-042 generated for Exporter XYZ.",
    time: "2 hours ago",
    read: false,
  },
  {
    id: "n3",
    title: "Payment Received",
    description: "Payment of $15,000 received from Global Exports.",
    time: "6 hours ago",
    read: true,
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <>
      <Header
        title="Notifications"
        icon={<Bell className="h-5 w-5" />}
        subtitle="Recent system notifications and alerts."
      />

      <main className="py-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-black rounded-full flex items-center justify-center text-white">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Notifications</h2>
              <p className="text-sm text-gray-500">
                Recent system notifications and alerts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              className="text-sm px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-200"
            >
              Mark all read
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
          {notifications.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No notifications
            </div>
          )}

          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
                  n.read ? "opacity-70" : ""
                }`}
              >
                <div className="mt-1">
                  <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                    {n.title.includes("Job Card") ? (
                      <FileText className="h-5 w-5 text-amber-500" />
                    ) : n.title.includes("Invoice") ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-slate-500" />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {n.description}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400">{n.time}</div>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => toggleRead(n.id)}
                      className="text-xs px-2 py-1 border rounded-md text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50"
                    >
                      {n.read ? "Mark unread" : "Mark read"}
                    </button>
                    <button className="text-xs px-2 py-1 text-red-600 hover:underline">
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
