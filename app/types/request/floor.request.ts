export type FloorRequest = {
  floorCode: string;
  name: string;
  buildingId?: number | string;
  floorNumber?: number;
  status: string;
  description?: string;
};

export type FloorPayload = FloorRequest;

export const emptyFloor: FloorPayload = {
  floorCode: '',
  name: '',
  buildingId: '',
  floorNumber: 1,
  status: 'ACTIVE',
  description: '',
};
