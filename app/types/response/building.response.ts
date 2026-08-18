export type BuildingResponse = {
  id: number | string;
  buildingCode: string;
  name: string;
  totalFloors?: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' | string;
  description?: string;
};

export type Building = BuildingResponse;
