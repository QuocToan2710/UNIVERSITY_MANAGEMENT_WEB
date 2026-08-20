import { apiRequest } from "../lib/api";
import type { AppNotification, NotificationSummary, NotificationSendRequest } from "../types/notification";

export const notificationService = {
  async getMyNotifications(page: number = 0, size: number = 20): Promise<{ content: AppNotification[]; totalElements: number; totalPages: number }> {
    return apiRequest<{ content: AppNotification[]; totalElements: number; totalPages: number }>(
      `/notifications/my?page=${page}&size=${size}`
    );
  },

  async getMySummary(): Promise<NotificationSummary> {
    return apiRequest<NotificationSummary>("/notifications/summary");
  },

  async getUnreadCount(): Promise<number> {
    return apiRequest<number>("/notifications/unread-count");
  },

  async markAsRead(id: number): Promise<void> {
    return apiRequest<void>(`/notifications/${id}/read`, {
      method: "PATCH",
    });
  },

  async markAllAsRead(): Promise<void> {
    return apiRequest<void>("/notifications/read-all", {
      method: "PATCH",
    });
  },

  async sendNotification(data: NotificationSendRequest): Promise<AppNotification> {
    return apiRequest<AppNotification>("/notifications/send", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async deleteNotification(id: number): Promise<void> {
    return apiRequest<void>(`/notifications/${id}`, {
      method: "DELETE",
    });
  },
};
