import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../components/app-shell";
import { notificationService } from "../services/notification.service";
import { apiRequest } from "../lib/api";
import type { User } from "../types/management";
import type { AppNotification, NotificationSendRequest, NotificationType, NotificationTargetType, NotificationPriority } from "../types/notification";
import { PlusIcon, SearchIcon } from "../components/icons";

const TYPE_MAP: Record<string, { label: string; icon: string; color: string }> = {
  ALL: { label: "Tất cả", icon: "📬", color: "bg-slate-500/10 text-slate-700 dark:text-slate-300" },
  SCHEDULE: { label: "Lịch học", icon: "📅", color: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30" },
  EXAM: { label: "Lịch thi", icon: "📝", color: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30" },
  ENROLLMENT: { label: "Đăng ký HP", icon: "🎓", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  GRADE: { label: "Điểm số", icon: "📊", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  SYSTEM: { label: "Hệ thống", icon: "⚡", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30" },
  ACADEMIC: { label: "Học vụ", icon: "📚", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  GENERAL: { label: "Chung", icon: "📢", color: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30" },
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<string>("ALL");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modal Send Notification (Admin / Teacher)
  const [showSendModal, setShowSendModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendForm, setSendForm] = useState<NotificationSendRequest>({
    title: "",
    content: "",
    type: "GENERAL",
    priority: "NORMAL",
    targetType: "ALL",
    targetValue: "",
    actionUrl: "",
  });
  const [sendMsg, setSendMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const rawRoleNames = (user?.roles || []).map((r) => (r.roleCode || r.name || "").toUpperCase());
  const userRoleNames = rawRoleNames.flatMap((r) => [r, r.replace(/^ROLE_/, "")]);
  const canSend = userRoleNames.includes("ADMIN") || userRoleNames.includes("ROLE_ADMIN") || userRoleNames.includes("TEACHER");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getMyNotifications(page, 20);
      setNotifications(res.content || []);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || 0);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void apiRequest<User>("/users/myInfo")
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    void loadData();
  }, [page]);

  const handleReadSingle = async (notif: AppNotification) => {
    if (!notif.read) {
      try {
        await notificationService.markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
        window.dispatchEvent(new CustomEvent("notifications-updated"));
      } catch {}
    }
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    } catch {}
  };

  const handleSendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendMsg(null);
    try {
      await notificationService.sendNotification(sendForm);
      setSendMsg({ text: "Gửi thông báo thành công!", type: "success" });
      window.dispatchEvent(new CustomEvent("notifications-updated"));
      setTimeout(() => {
        setShowSendModal(false);
        setSendMsg(null);
        setSendForm({
          title: "",
          content: "",
          type: "GENERAL",
          priority: "NORMAL",
          targetType: "ALL",
          targetValue: "",
          actionUrl: "",
        });
        void loadData();
      }, 1000);
    } catch (err: any) {
      setSendMsg({ text: err.message || "Gửi thông báo thất bại", type: "error" });
    } finally {
      setSending(false);
    }
  };

  // Client-side filtering
  const filteredNotifs = notifications.filter((item) => {
    if (selectedTab !== "ALL" && item.type !== selectedTab) return false;
    if (onlyUnread && item.read) return false;
    if (keyword.trim()) {
      const kw = keyword.toLowerCase();
      return (
        item.title.toLowerCase().includes(kw) ||
        item.content.toLowerCase().includes(kw) ||
        (item.senderName && item.senderName.toLowerCase().includes(kw))
      );
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppShell
      title="Trung tâm Thông báo"
      description="Xem và quản lý các thông báo học tập, lịch thi, sự kiện và tin tức đào tạo"
    >
      <div className="space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Tabs Filter */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-1.5 shadow-sm">
            {["ALL", "SCHEDULE", "EXAM", "ENROLLMENT", "SYSTEM"].map((tabKey) => {
              const cfg = TYPE_MAP[tabKey] || { label: tabKey, icon: "" };
              const isActive = selectedTab === tabKey;
              return (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => setSelectedTab(tabKey)}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{cfg.icon}</span>
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm transition-all cursor-pointer"
              >
                ✓ Đánh dấu tất cả đã đọc
              </button>
            )}

            {canSend && (
              <button
                type="button"
                onClick={() => setShowSendModal(true)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                <PlusIcon size={16} />
                <span>Soạn thông báo</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3 shadow-sm">
          <div className="relative flex-1 w-full">
            <span className="absolute inset-y-0 left-3.5 grid place-items-center text-slate-400">
              <SearchIcon size={16} />
            </span>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm kiếm thông báo theo tiêu đề, nội dung..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/50 py-2 pl-10 pr-4 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={onlyUnread}
              onChange={(e) => setOnlyUnread(e.target.checked)}
              className="size-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            <span>Chỉ xem thông báo chưa đọc</span>
          </label>
        </div>

        {/* Notification List */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-sm backdrop-blur-xl divide-y divide-slate-100 dark:divide-slate-800/60">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">
              Đang tải danh sách thông báo...
            </div>
          ) : filteredNotifs.length === 0 ? (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500">
              <p className="text-4xl mb-2">🔕</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Không có thông báo nào</p>
              <p className="text-xs mt-1">Bạn đã cập nhật tất cả thông báo mới nhất.</p>
            </div>
          ) : (
            filteredNotifs.map((item) => {
              const cfg = TYPE_MAP[item.type] || { label: item.type, icon: "📢", color: "bg-slate-500/10 text-slate-700" };
              return (
                <div
                  key={item.id}
                  onClick={() => handleReadSingle(item)}
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl transition-all cursor-pointer ${
                    item.read
                      ? "hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-85 hover:opacity-100"
                      : "bg-cyan-50/40 dark:bg-cyan-950/20 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 border border-cyan-200/60 dark:border-cyan-500/20"
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <span className="text-2xl mt-0.5 shrink-0">{cfg.icon}</span>
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-block rounded-lg px-2.5 py-0.5 text-[10px] font-bold border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        {!item.read && (
                          <span className="rounded-full bg-cyan-500 text-white px-2 py-0.2 text-[9px] font-extrabold uppercase tracking-wider shadow-[0_0_8px_#22d3ee]">
                            Mới
                          </span>
                        )}
                        {item.priority === "HIGH" || item.priority === "URGENT" ? (
                          <span className="rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20 px-2 py-0.2 text-[9px] font-bold">
                            Quan trọng
                          </span>
                        ) : null}
                      </div>

                      <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                        {item.content}
                      </p>

                      <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400 font-mono">
                        <span>👤 {item.senderName || "Hệ thống"}</span>
                        <span>•</span>
                        <span>
                          🕒{" "}
                          {new Date(item.createdAt).toLocaleString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {item.actionUrl && (
                    <button
                      type="button"
                      className="self-end sm:self-center shrink-0 rounded-xl border border-cyan-400/40 bg-cyan-50 dark:bg-cyan-950/40 px-3.5 py-1.5 text-xs font-bold text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 transition-all cursor-pointer"
                    >
                      Chi tiết →
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal: Soạn & Gửi thông báo */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                📢 Soạn Thông Báo Mới
              </h3>
              <button
                type="button"
                onClick={() => setShowSendModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {sendMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  sendMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {sendMsg.text}
              </div>
            )}

            <form onSubmit={handleSendSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Tiêu đề thông báo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={sendForm.title}
                  onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })}
                  placeholder="Ví dụ: Thông báo lịch thi cuối kỳ..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Loại thông báo
                  </label>
                  <select
                    value={sendForm.type}
                    onChange={(e) => setSendForm({ ...sendForm, type: e.target.value as NotificationType })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="GENERAL">Chung / Sự kiện</option>
                    <option value="SCHEDULE">Lịch học</option>
                    <option value="EXAM">Lịch thi</option>
                    <option value="ENROLLMENT">Đăng ký học phần</option>
                    <option value="ACADEMIC">Học vụ / Học phí</option>
                    <option value="SYSTEM">Hệ thống</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Mức độ ưu tiên
                  </label>
                  <select
                    value={sendForm.priority}
                    onChange={(e) => setSendForm({ ...sendForm, priority: e.target.value as NotificationPriority })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="NORMAL">Bình thường</option>
                    <option value="HIGH">Quan trọng</option>
                    <option value="URGENT">Khẩn cấp</option>
                    <option value="LOW">Thấp</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Đối tượng nhận
                  </label>
                  <select
                    value={sendForm.targetType}
                    onChange={(e) => {
                      const nextType = e.target.value as NotificationTargetType;
                      setSendForm({
                        ...sendForm,
                        targetType: nextType,
                        targetValue: nextType === "ROLE" ? "ROLE_STUDENT" : nextType === "ALL" ? "" : sendForm.targetValue,
                      });
                    }}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="ALL">Toàn trường (Tất cả)</option>
                    <option value="ROLE">Theo Vai trò (Role)</option>
                    <option value="USER">1 Cá nhân cụ thể (Username / Mã SV / Mã GV)</option>
                    <option value="SUBJECT_CLASS">Lớp học phần (ID)</option>
                    <option value="CLASS_GROUP">Lớp sinh hoạt (ID)</option>
                  </select>
                </div>

                {sendForm.targetType === "ROLE" && (
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Chọn vai trò nhận <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={sendForm.targetValue || "ROLE_STUDENT"}
                      onChange={(e) => setSendForm({ ...sendForm, targetValue: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="ROLE_STUDENT">Toàn bộ Sinh viên (STUDENT)</option>
                      <option value="ROLE_TEACHER">Toàn bộ Giảng viên (TEACHER)</option>
                      <option value="ROLE_ADMIN">Toàn bộ Quản trị viên (ADMIN)</option>
                      <option value="ROLE_USER">Toàn bộ Người dùng (USER)</option>
                    </select>
                  </div>
                )}

                {sendForm.targetType !== "ALL" && sendForm.targetType !== "ROLE" && (
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Giá trị đối tượng <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={sendForm.targetValue || ""}
                      onChange={(e) => setSendForm({ ...sendForm, targetValue: e.target.value })}
                      placeholder="VD: admin, student, SV24001, hoặc ID lớp"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Đường dẫn chuyển hướng (Action URL)
                </label>
                <input
                  type="text"
                  value={sendForm.actionUrl || ""}
                  onChange={(e) => setSendForm({ ...sendForm, actionUrl: e.target.value })}
                  placeholder="VD: /schedule/exam hoặc /schedule/class"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Nội dung chi tiết <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={sendForm.content}
                  onChange={(e) => setSendForm({ ...sendForm, content: e.target.value })}
                  placeholder="Nhập nội dung thông báo đầy đủ..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="rounded-xl px-4 py-2 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 font-bold text-white shadow-lg shadow-cyan-500/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {sending ? "Đang gửi..." : "Gửi thông báo ngay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
