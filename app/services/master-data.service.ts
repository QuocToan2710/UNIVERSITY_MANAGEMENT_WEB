import { apiRequest } from "../lib/api";
import type { ComboType, SelectOption } from "../types/response";

export const masterDataService = {
  async fetchOptions(
    type: ComboType,
    options?: { cascader?: string; codeSystem?: string; isCodeIsId?: boolean }
  ): Promise<SelectOption[]> {
    const params = new URLSearchParams({ type });
    if (options?.cascader) params.set("cascader", options.cascader);
    if (options?.codeSystem) params.set("codeSystem", options.codeSystem);
    if (options?.isCodeIsId) params.set("isCodeIsId", String(options.isCodeIsId));

    return apiRequest<SelectOption[]>(`/master-data?${params.toString()}`);
  },
};
