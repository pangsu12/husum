import { mockShelters } from "../data/mockShelters";
import { Shelter } from "../types/shelter";
import { mapShelterApiResponse } from "../utils/mapShelterApiResponse";

declare const process: {
  env: {
    EXPO_PUBLIC_SHELTER_API_KEY?: string;
  };
};

const API_KEY = process.env.EXPO_PUBLIC_SHELTER_API_KEY?.trim();
const SHELTER_API_URL = "https://www.safetydata.go.kr/V2/api/DSSP-IF-10942";
const SHELTER_INFO_MESSAGE =
  "일부 쉼터 정보는 공공데이터와 현장 제보를 바탕으로 업데이트됩니다.";

export type ShelterDataResult = {
  shelters: Shelter[];
  source: "api" | "mock";
  message: string;
};

export async function fetchSheltersFromApi(): Promise<ShelterDataResult> {
  if (!API_KEY) {
    return {
      shelters: mockShelters,
      source: "mock",
      message: SHELTER_INFO_MESSAGE
    };
  }

  try {
    const url = `${SHELTER_API_URL}?serviceKey=${encodeURIComponent(API_KEY)}&pageNo=1&numOfRows=50&type=json`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Shelter API failed: ${response.status}`);
    }

    const payload = await response.json();
    const shelters = mapShelterApiResponse(payload);

    if (shelters.length === 0) {
      return {
        shelters: mockShelters,
        source: "mock",
        message: SHELTER_INFO_MESSAGE
      };
    }

    return {
      shelters,
      source: "api",
      message: SHELTER_INFO_MESSAGE
    };
  } catch {
    return {
      shelters: mockShelters,
      source: "mock",
      message: SHELTER_INFO_MESSAGE
    };
  }
}
