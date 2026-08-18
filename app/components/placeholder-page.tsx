import { Link } from "react-router";
import { AppShell } from "./app-shell";

type PlaceholderPageProps = {
  title: string;
  description: string;
  apiName: string;
};

export function PlaceholderPage({ title, description, apiName }: PlaceholderPageProps) {
  return (
    <AppShell title={title} description={description}>
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-blue-50 text-xl text-blue-600">+</div>
        <h2 className="mt-4 text-lg font-semibold">Khu vực {title.toLowerCase()}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Giao diện chính đã sẵn sàng. Ở bước tiếp theo, trang này sẽ kết nối API <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">{apiName}</code> để hiển thị và quản lý dữ liệu.
        </p>
        <Link className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-white hover:bg-blue-700" to="/">
          Quay về tổng quan
        </Link>
      </div>
    </AppShell>
  );
}
