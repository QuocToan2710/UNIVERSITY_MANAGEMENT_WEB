export type RoomRequest = {
  roomCode: string;
  name: string;
  buildingId?: number | string;
  building?: string;
  floorId?: number | string;
  floor?: string;
  capacity?: number;
  roomType?: string;
  status: string;
  description?: string;
};

export type RoomPayload = RoomRequest;

export const emptyRoom: RoomPayload = {
  roomCode: '',
  name: '',
  buildingId: '',
  building: 'Tòa A2',
  floorId: '',
  floor: 'Tầng 1',
  capacity: 40,
  roomType: 'Giảng đường',
  status: 'ACTIVE',
  description: '',
};
