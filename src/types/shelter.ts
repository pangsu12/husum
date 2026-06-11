export type ShelterType = "cooling" | "heating" | "public" | "private";

export type CrowdLevel = "low" | "medium" | "high";

export type FacilityStatus = "good" | "weak" | "none";

export type Shelter = {
  id: string;
  name: string;
  type: ShelterType;
  address: string;
  distanceMeters: number;
  walkMinutes: number;
  operatingHours: string;
  isOpen: boolean;
  crowdLevel: CrowdLevel;
  coolingStatus: FacilityStatus;
  heatingStatus: FacilityStatus;
  hasWater: boolean;
  wheelchairAccessible: boolean;
  petAllowed: boolean;
  latitude: number;
  longitude: number;
  reportCount: number;
  positiveReportRate: number;
};

export type UserPreferences = {
  tags: string[];
  routePreference?: "shortest" | "accessible" | "shade";
};
