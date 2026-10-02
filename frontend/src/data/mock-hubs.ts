export interface HubInfo {
  id: string;
  code: string;
  name: string;
  sector: string;
  province: string;
  active: boolean;
  latitude: number;
  longitude: number;
}

export const MOCK_HUBS: HubInfo[] = [
  {
    id: "hub-01",
    code: "DEP-PLG",
    name: "Peliyagoda Central Hub",
    sector: "Western Province",
    province: "Western",
    active: true,
    latitude: 6.9654,
    longitude: 79.9042,
  },
  {
    id: "hub-02",
    code: "DEP-KDY",
    name: "Kandy Regional Depot",
    sector: "Central Province",
    province: "Central",
    active: false,
    latitude: 7.2906,
    longitude: 80.6337,
  },
  {
    id: "hub-03",
    code: "DEP-GLE",
    name: "Galle Southern Depot",
    sector: "Southern Province",
    province: "Southern",
    active: false,
    latitude: 6.0535,
    longitude: 80.221,
  },
];
