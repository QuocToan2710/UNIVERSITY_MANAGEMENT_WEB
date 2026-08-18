import { apiListRequest, apiRequest } from "../lib/api";
import type { RoomRequest } from "../types/request";
import type { RoomResponse } from "../types/response";

export const roomService = {
  async getAll(): Promise<RoomResponse[]> {
    return apiListRequest<RoomResponse>("/rooms?size=1000").catch(async () =>
      apiListRequest<RoomResponse>("/rooms")
    );
  },

  async getById(id: string | number): Promise<RoomResponse> {
    return apiRequest<RoomResponse>(`/rooms/${id}`);
  },

  async create(data: RoomRequest): Promise<RoomResponse> {
    return apiRequest<RoomResponse>("/rooms", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: string | number, data: RoomRequest): Promise<RoomResponse> {
    return apiRequest<RoomResponse>(`/rooms/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: string | number): Promise<void> {
    return apiRequest<void>(`/rooms/${id}`, {
      method: "DELETE",
    });
  },
};
