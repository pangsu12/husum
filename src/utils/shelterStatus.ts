import { Shelter } from "../types/shelter";

export type ShelterOpenPhase = "open" | "before" | "closed" | "unknown";

export type ShelterOpenStatus = {
  phase: ShelterOpenPhase;
  isOpen: boolean;
  label: string;
};

function getKoreaMinutes(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const [hour, minute] = formatter.format(date).split(":").map(Number);

  return hour * 60 + minute;
}

function parseTime(value: string) {
  const match = value.trim().match(/^(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) return undefined;

  const hour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : 0;
  if (hour > 24 || minute > 59) return undefined;
  if (hour === 24 && minute !== 0) return undefined;

  return hour * 60 + minute;
}

export function parseOperatingHours(operatingHours: string) {
  const normalized = operatingHours
    .replace(/[－–—]/g, "-")
    .replace(/[~∼～]/g, "-")
    .replace(/\s/g, "");
  const match = normalized.match(/(\d{1,2}:?\d{0,2})-(\d{1,2}:?\d{0,2})/);
  if (!match) return undefined;

  const opensAt = parseTime(match[1]);
  const closesAt = parseTime(match[2]);
  if (opensAt === undefined || closesAt === undefined || opensAt === closesAt) return undefined;

  return { opensAt, closesAt };
}

export function getShelterOpenStatus(shelter: Pick<Shelter, "operatingHours" | "isOpen">, date = new Date()): ShelterOpenStatus {
  const parsed = parseOperatingHours(shelter.operatingHours);

  if (!parsed) {
    return shelter.isOpen
      ? { phase: "unknown", isOpen: true, label: "운영시간 정보 확인 필요" }
      : { phase: "unknown", isOpen: false, label: "운영시간 정보 확인 필요" };
  }

  const now = getKoreaMinutes(date);
  const { opensAt, closesAt } = parsed;
  const isOvernight = closesAt < opensAt;
  const isOpen = isOvernight ? now >= opensAt || now < closesAt : now >= opensAt && now < closesAt;

  if (isOpen) return { phase: "open", isOpen: true, label: "운영중" };
  if (!isOvernight && now < opensAt) return { phase: "before", isOpen: false, label: "운영 전" };

  return { phase: "closed", isOpen: false, label: "운영 종료" };
}

export function getFacilityCountLabel(shelter: Pick<Shelter, "airConditionerCount" | "fanCount">) {
  const parts: string[] = [];

  if (typeof shelter.airConditionerCount === "number") parts.push(`냉방기 ${shelter.airConditionerCount}대`);
  if (typeof shelter.fanCount === "number") parts.push(`선풍기 ${shelter.fanCount}대`);

  return parts.join(" · ");
}
