export type Province = {
  id: number | string;
  provinceCode: string;
  provinceName: string;
  provinceType?: string;
  districtCount?: number;
};

export type District = {
  id: number | string;
  districtCode: string;
  districtName: string;
  districtType?: string;
  provinceId: number | string;
  provinceName?: string;
  wardCount?: number;
};

export type Ward = {
  id: number | string;
  wardCode: string;
  wardName: string;
  wardType?: string;
  districtId: number | string;
  districtName?: string;
  provinceId?: number | string;
  provinceName?: string;
};
