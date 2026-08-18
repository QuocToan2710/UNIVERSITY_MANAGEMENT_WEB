export type FloorResponse = {
  id: number | string;
  floorCode: string;
  name: string;
  buildingId?: number | string;
  buildingName?: string;
  floorNumber?: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' | string;
  description?: string;
};

export type Floor = FloorResponse;
