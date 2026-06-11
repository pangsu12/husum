import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useLocationSelection } from "../contexts/LocationContext";
import { analysisResults, RegionRiskScore } from "../data/analysisResults";
import { ScoreBar, Tag } from "./ShelterUi";
import { colors, sharedStyles } from "./sharedStyles";

function getSelectedRegionCopy(region: string, score: number, rank: number) {
  if (region === "대구") {
    return "대구는 2020~2025년 분석에서 종합 폭염 취약도 71.1점으로 가장 높게 나타났습니다.";
  }
  if (region === "부산") {
    return "부산은 고령인구 비율이 높아 취약계층 보호가 중요한 지역입니다.";
  }

  return `${region}은 2020~2025년 분석에서 종합 폭염 취약도 ${score}점으로 전체 ${rank}번째로 나타났습니다.`;
}

export function AnalyticsScreen() {
  const { selectedRegionOption, regionLabel } = useLocationSelection();
  const selectedRegionName = selectedRegionOption.shortLabel === "현재 위치" ? "서울" : selectedRegionOption.shortLabel;
  const selectedScore =
    analysisResults.regionRiskScores.find((item) => item.region === selectedRegionName)?.integratedHeatRiskScore ??
    selectedRegionOption.analysisScore ??
    0;
  const selectedRank =
    analysisResults.regionRiskScores.findIndex((item) => item.region === selectedRegionName) + 1 || 1;

  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.content}>
      <View style={sharedStyles.elevatedCard}>
        <Text style={styles.eyebrow}>추천 근거</Text>
        <Text style={styles.heroTitle}>왜 이 쉼터를 추천했나요?</Text>
        <Text style={[sharedStyles.body, styles.heroCopy]}>
          현재 폭염 위험도와 쉼터 상태, 거리, 사용자 맞춤 조건을 함께 반영해 추천 적합도를 계산합니다.
        </Text>
        <View style={styles.tagWrap}>
          <Tag label="기상청 ASOS 종관기상관측 데이터" tone="gray" />
          <Tag label="질병관리청 온열질환 감시 데이터" tone="gray" />
        </View>
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>현재 선택 지역: {regionLabel}</Text>
        <Text style={[sharedStyles.body, { marginTop: 8 }]}>
          {getSelectedRegionCopy(selectedRegionName, selectedScore, selectedRank)}
        </Text>
        <View style={styles.selectedScoreBar}>
          <ScoreBar score={selectedScore} danger={selectedScore >= 70} />
        </View>
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>현재 폭염 위험 요약</Text>
        <View style={styles.metricGrid}>
          <Metric
            label="최고 취약 지역"
            value={`${analysisResults.integratedHeatRiskTopRegion} ${analysisResults.integratedHeatRiskTopScore}점`}
            tone="danger"
          />
          <Metric label="분석 기간" value={analysisResults.analysisPeriod} />
          <Metric label="33℃ 이상 일수" value={`${analysisResults.daysMaxTemp33OrMore}일`} tone="warning" />
          <Metric
            label="총 온열질환자 수"
            value={`${analysisResults.totalHeatIllnessCases.toLocaleString()}명`}
            tone="danger"
          />
        </View>
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>지역별 위험도 TOP 5</Text>
        {analysisResults.regionRiskScores.map((item, index) => (
          <RiskScoreBar key={item.region} item={item} rank={index + 1} />
        ))}
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>온열질환 위험 근거</Text>
        <View style={styles.metricGrid}>
          <Metric label="최고기온-온열질환 상관관계" value={analysisResults.temperatureHeatIllnessCorrelation.toFixed(4)} />
          <Metric label="폭염일수 최다 지역" value={`${analysisResults.heatwaveTopRegion} ${analysisResults.heatwaveTopRegionDays}일`} tone="warning" />
          <Metric label="고령인구 비율 최고 지역" value={`${analysisResults.elderlyRateTopRegion} ${analysisResults.elderlyRateTopValue}%`} />
          <Metric label="평균 최고기온" value={`${analysisResults.averageMaxTemperature}℃`} />
        </View>
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>추천 점수 계산 기준</Text>
        {analysisResults.recommendationBreakdown.map((item) => (
          <ScoreRule key={item.label} label={item.label} value={`${item.score}%`} description={item.description} />
        ))}
        <Text style={[sharedStyles.muted, { marginTop: 10 }]}>
          앱의 쉼터 추천은 거리, 운영 여부, 냉방 상태, 혼잡도, 접근성, 물 제공 여부와 맞춤 조건을 함께 반영합니다.
        </Text>
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>상세 분석 정보</Text>
        <Text style={[sharedStyles.muted, styles.sectionLead]}>
          아래 수치는 추천 근거를 보완하는 공공 데이터 분석 요약입니다.
        </Text>
        <Detail label="분석 지역" value={analysisResults.analysisRegions.join(", ")} />
        <Detail label="평균 습도" value={`${analysisResults.averageHumidity}%`} />
        <Detail label="최다 발생일" value={`${analysisResults.heatIllnessPeakDate} · ${analysisResults.heatIllnessPeakDateCases}명`} />
        <Detail
          label="쉼터 수용 정보"
          value={`${analysisResults.shelterReferenceSummary.totalShelters}곳 · ${analysisResults.shelterReferenceSummary.totalCapacity.toLocaleString()}명`}
        />
        <Detail
          label="냉방기·선풍기"
          value={`${analysisResults.shelterReferenceSummary.totalAirConditioners}대 / ${analysisResults.shelterReferenceSummary.totalFans}대`}
        />
      </View>
    </ScrollView>
  );
}

function Metric({
  label,
  value,
  tone = "default"
}: {
  label: string;
  value: string;
  tone?: "default" | "danger" | "warning" | "green";
}) {
  return (
    <View style={[styles.metric, tone === "danger" && styles.metricDanger, tone === "warning" && styles.metricWarning]}>
      <Text style={sharedStyles.metricLabel}>{label}</Text>
      <Text
        style={[
          sharedStyles.metricNumber,
          tone === "danger" && styles.metricValueDanger,
          tone === "warning" && styles.metricValueWarning,
          tone === "green" && styles.metricValueGreen
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function RiskScoreBar({ item, rank }: { item: RegionRiskScore; rank: number }) {
  return (
    <View style={styles.riskRow}>
      <View style={sharedStyles.row}>
        <Text style={styles.riskName}>
          {rank}. {item.region}
        </Text>
        <Text style={styles.riskScore}>{item.integratedHeatRiskScore}점</Text>
      </View>
      <ScoreBar score={item.integratedHeatRiskScore} danger={item.integratedHeatRiskScore >= 70} />
    </View>
  );
}

function ScoreRule({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <View style={styles.ruleRow}>
      <Text style={styles.ruleValue}>{value}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.ruleTitle}>{label}</Text>
        <Text style={sharedStyles.muted}>{description}</Text>
      </View>
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: "900"
  },
  heroTitle: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 31,
    marginTop: 6,
    fontWeight: "900"
  },
  heroCopy: {
    marginTop: 9
  },
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 12
  },
  sectionLead: {
    marginTop: 7
  },
  selectedScoreBar: {
    marginTop: 12
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12
  },
  metric: {
    width: "48%",
    minHeight: 82,
    justifyContent: "space-between",
    borderRadius: 12,
    padding: 11,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.line
  },
  metricDanger: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca"
  },
  metricWarning: {
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa"
  },
  metricValueDanger: {
    color: colors.danger
  },
  metricValueWarning: {
    color: colors.warning
  },
  metricValueGreen: {
    color: colors.green
  },
  riskRow: {
    marginTop: 13,
    gap: 7
  },
  riskName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  riskScore: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: "900"
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line
  },
  ruleValue: {
    width: 48,
    color: "#ffffff",
    textAlign: "center",
    borderRadius: 999,
    overflow: "hidden",
    paddingVertical: 7,
    backgroundColor: colors.blue,
    fontWeight: "900"
  },
  ruleTitle: {
    color: colors.text,
    fontWeight: "900"
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 9,
    borderBottomColor: colors.line,
    borderBottomWidth: 1
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800"
  },
  detailValue: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "900",
    textAlign: "right"
  }
});
