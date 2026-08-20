export type NotificationType =
  | 'ACADEMIC'
  | 'SCHEDULE'
  | 'EXAM'
  | 'ENROLLMENT'
  | 'GRADE'
  | 'SYSTEM'
  | 'GENERAL';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type NotificationTargetType =
  | 'ALL'
  | 'ROLE'
  | 'USER'
  | 'SUBJECT_CLASS'
  | 'CLASS_GROUP';

export interface AppNotification {
  id: number;
  notificationId: number;
  notificationCode: string;
  title: string;
  content: string;
  type: NotificationType;
  priority: NotificationPriority;
  targetType: NotificationTargetType;
  targetValue?: string;
  senderId?: string;
  senderName?: string;
  actionUrl?: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationSummary {
  unreadCount: number;
  recentNotifications: AppNotification[];
}

export interface NotificationSendRequest {
  title: string;
  content: string;
  type: NotificationType;
  priority?: NotificationPriority;
  targetType: NotificationTargetType;
  targetValue?: string;
  actionUrl?: string;
}
