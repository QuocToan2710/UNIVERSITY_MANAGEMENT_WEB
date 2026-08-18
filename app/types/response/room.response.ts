export type RoomResponse = {
  id: number | string;
  roomCode: string;
  name: string;
  buildingId?: number | string;
  building?: string;
  floorId?: number | string;
  floor?: string;
  capacity?: number;
  roomType?: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' | string;
  description?: string;
};

export type Room = RoomResponse;
