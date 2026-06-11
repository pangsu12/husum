import { createContext, ReactNode, useContext, useMemo, useState } from "react";

export type ShelterReport = {
  shelterId: string;
  isOpen: boolean;
  coolingGood: boolean;
  heatingGood: boolean;
  crowded: boolean;
  hasWater: boolean;
  wheelchairAccessible: boolean;
  hasRiskyRoute: boolean;
};

type ReportContextValue = {
  reports: ShelterReport[];
  addReport: (report: ShelterReport) => void;
  getReportsByShelter: (shelterId: string) => ShelterReport[];
};

const ReportContext = createContext<ReportContextValue | undefined>(undefined);

export function ReportProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<ShelterReport[]>([]);

  const value = useMemo<ReportContextValue>(
    () => ({
      reports,
      addReport: (report) => setReports((current) => [...current, report]),
      getReportsByShelter: (shelterId) =>
        reports.filter((report) => report.shelterId === shelterId)
    }),
    [reports]
  );

  return <ReportContext.Provider value={value}>{children}</ReportContext.Provider>;
}

export function useReports() {
  const context = useContext(ReportContext);

  if (!context) {
    throw new Error("useReports must be used within ReportProvider");
  }

  return context;
}
