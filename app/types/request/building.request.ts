export type BuildingRequest = {
  buildingCode: string;
  name: string;
  totalFloors?: number;
  status: string;
  description?: string;
};

export type BuildingPayload = BuildingRequest;

export const emptyBuilding: BuildingPayload = {
  buildingCode: '',
  name: '',
  totalFloors: 5,
  status: 'ACTIVE',
  description: '',
};
