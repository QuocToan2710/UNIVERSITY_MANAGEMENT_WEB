import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getToken } from "../lib/auth";
import type { AppNotification } from "../types/notification";

const rawApiUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080";
const API_URL = rawApiUrl.endsWith("/") ? rawApiUrl.slice(0, -1) : rawApiUrl;

class WebSocketService {
  private client: Client | null = null;
  private listeners: Set<(notification: AppNotification) => void> = new Set();
  private isConnecting: boolean = false;

  public connect(): void {
    const token = getToken();
    if (!token) return;

    if (this.client && this.client.active) {
      return;
    }

    if (this.isConnecting) return;
    this.isConnecting = true;

    this.client = new Client({
      webSocketFactory: () => new SockJS(`${API_URL}/ws-notifications`),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (msg) => {
        if (import.meta.env.DEV) {
          console.debug("[WebSocket]", msg);
        }
      },
      onConnect: () => {
        this.isConnecting = false;
        console.info("[WebSocket] Connected successfully.");

        // Subscribe to broadcast topic (for ALL, ROLE, etc.)
        this.client?.subscribe("/topic/notifications", (message) => {
          try {
            const notification: AppNotification = JSON.parse(message.body);
            this.notifyListeners(notification);
          } catch (e) {
            console.error("[WebSocket] Parse error on /topic/notifications", e);
          }
        });

        // Subscribe to user-specific queue (for individual / group targets)
        this.client?.subscribe("/user/queue/notifications", (message) => {
          try {
            const notification: AppNotification = JSON.parse(message.body);
            this.notifyListeners(notification);
          } catch (e) {
            console.error("[WebSocket] Parse error on /user/queue/notifications", e);
          }
        });
      },
      onStompError: (frame) => {
        this.isConnecting = false;
        console.error("[WebSocket] Broker error:", frame.headers["message"], frame.body);
      },
      onWebSocketClose: () => {
        this.isConnecting = false;
      },
    });

    this.client.activate();
  }

  public disconnect(): void {
    if (this.client) {
      try {
        this.client.deactivate();
      } catch (e) {
        console.error("[WebSocket] Disconnect error", e);
      }
      this.client = null;
      this.isConnecting = false;
    }
  }

  public subscribe(callback: (notification: AppNotification) => void): () => void {
    this.listeners.add(callback);
    // Connect if not already active
    if (!this.client || !this.client.active) {
      this.connect();
    }
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(notification: AppNotification): void {
    // Notify all active component listeners
    this.listeners.forEach((listener) => {
      try {
        listener(notification);
      } catch (e) {
        console.error("[WebSocket] Listener callback error", e);
      }
    });

    // Also dispatch custom DOM event for other components listening
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("realtime-notification", { detail: notification })
      );
      window.dispatchEvent(new Event("notifications-updated"));
    }
  }
}

export const webSocketService = new WebSocketService();