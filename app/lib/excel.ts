import * as XLSX from "xlsx";

/**
 * Utility to export an array of JSON objects to an Excel file (.xlsx)
 * @param data Array of items to export
 * @param fileName Name of output Excel file (without extension)
 * @param sheetName Name of the sheet inside Excel
 * @param columns Optional mapping of field keys to display column headers
 */
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  fileName: string = "export_data",
  sheetName: string = "Sheet1",
  columns?: { key: keyof T; header: string }[]
) {
  if (!data || data.length === 0) {
    alert("Không có dữ liệu để xuất Excel!");
    return;
  }

  let formattedData: Record<string, unknown>[] = [];

  if (columns && columns.length > 0) {
    formattedData = data.map((item) => {
      const row: Record<string, unknown> = {};
      columns.forEach((col) => {
        row[col.header] = item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : "";
      });
      return row;
    });
  } else {
    formattedData = data;
  }

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Auto-fit column widths for better appearance
  const colWidths = Object.keys(formattedData[0] || {}).map((key) => {
    const maxLen = Math.max(
      key.length,
      ...formattedData.map((row) => String(row[key] || "").length)
    );
    return { wch: Math.min(Math.max(maxLen + 3, 12), 40) };
  });
  worksheet["!cols"] = colWidths;

  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
