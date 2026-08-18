import { useEffect, useState, type FormEvent } from "react";
import { apiRequest, fetchMasterData } from "../../lib/api";
import { emptyRoom, type Room, type RoomPayload } from "../../types/management";

type RoomFormProps = {
  room: Room | null;
  onClose: () => void;
  onSaved: () => void;
};

const ROOM_TYPES_DEFAULT = ["Giảng đường", "Phòng máy tính", "Phòng thí nghiệm", "Hội trường", "Phòng thực hành"];
const ROOM_STATUSES_DEFAULT = [
  { value: "ACTIVE", label: "Hoạt động", color: "text-emerald-300" },
  { value: "MAINTENANCE", label: "Đang bảo trì", color: "text-amber-300" },
  { value: "INACTIVE", label: "Tạm khóa", color: "text-red-300" },
];

export function RoomForm({ room, onClose, onSaved }: RoomFormProps) {
  const [form, setForm] = useState<RoomPayload>(
    room
      ? {
          roomCode: room.roomCode || "",
          name: room.name || "",
          building: room.building || "",
          capacity: room.capacity || 40,
          roomType: room.roomType || "Giảng đường",
          status: room.status || "ACTIVE",
          description: room.description || "",
        }
      : emptyRoom
  );
  const [buildings, setBuildings] = useState<{ id: string; name: string }[]>([]);
  const [roomTypes, setRoomTypes] = useState<string[]>(ROOM_TYPES_DEFAULT);
  const [roomStatuses, setRoomStatuses] = useState<{ value: string; label: string }[]>(ROOM_STATUSES_DEFAULT);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchMasterData("BUILDING")
      .then((opts) => setBuildings(opts.map((o) => ({ id: o.value, name: o.label }))))
      .catch(() => setBuildings([]));

    void fetchMasterData("ROOM_TYPE")
      .then((opts) => setRoomTypes(opts.map((o) => o.label)))
      .catch(() => setRoomTypes(ROOM_TYPES_DEFAULT));

    void fetchMasterData("ROOM_STATUS")
      .then((opts) => setRoomStatuses(opts.map((o) => ({ value: o.value, label: o.label }))))
      .catch(() => setRoomStatuses(ROOM_STATUSES_DEFAULT));
  }, []);

  function update<K extends keyof RoomPayload>(key: K, value: RoomPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiRequest<Room>(room ? `/rooms/${room.id}` : "/rooms", {
        method: room ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu thông tin phòng học.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 dark:bg-slate-50 dark:bg-slate-950/70 p-4 backdrop-blur-xl animate-in fade-in duration-200">
      <form
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 p-6 shadow-2xl text-slate-900 dark:text-white"
      >
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold">{room ? "Cập nhật phòng học" : "Tạo phòng học mới"}</h2>
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">Thiết lập mã phòng, tòa nhà, sức chứa và trạng thái hoạt động.</p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer">
            ✕
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Mã phòng học *" value={form.roomCode} onChange={(v) => update("roomCode", v)} required placeholder="VD: A2-402, LAB_03" />
          <Field label="Tên phòng học *" value={form.name} onChange={(v) => update("name", v)} required placeholder="VD: Phòng học A2-402" />

          {buildings.length > 0 ? (
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
              Tòa nhà *
              <select
                value={form.building || ""}
                onChange={(e) => update("building", e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
              >
                <option value="" className="bg-white dark:bg-slate-900 text-slate-400">-- Chọn tòa nhà --</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <Field label="Tòa nhà *" value={form.building || ""} onChange={(v) => update("building", v)} required placeholder="VD: Tòa A2, Tòa B1" />
          )}

          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
            Sức chứa (Sinh viên) *
            <input
              type="number"
              min={1}
              max={500}
              required
              value={form.capacity || 40}
              onChange={(e) => update("capacity", Number(e.target.value))}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
            />
          </label>

          {/* Loại phòng */}
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
            Loại phòng học *
            <select
              value={form.roomType || "Giảng đường"}
              onChange={(e) => update("roomType", e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
            >
              {roomTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          {/* Cột Trạng thái */}
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
            Trạng thái phòng *
            <select
              value={form.status || "ACTIVE"}
              onChange={(e) => update("status", e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400 font-bold"
            >
              {roomStatuses.map((st) => (
                <option key={st.value} value={st.value}>
                  ● {st.label}
                </option>
              ))}
            </select>
          </label>

          <div className="sm:col-span-2">
            <Field label="Ghi chú / Thiết bị" value={form.description || ""} onChange={(v) => update("description", v)} placeholder="VD: Trang bị máy chiếu, điều hòa, 45 máy PC..." />
          </div>
        </div>

        {error && <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">{error}</p>}

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer">
            Hủy
          </button>
          <button
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white shadow-md disabled:opacity-50 cursor-pointer"
          >
            {saving && <span className="size-3 rounded-full border-2 border-white border-t-transparent animate-spin" />}
            <span>{saving ? "Đang lưu..." : "Lưu phòng học"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
      {label}
      <input
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs placeholder-slate-500 outline-none focus:border-cyan-400"
      />
    </label>
  );
}
