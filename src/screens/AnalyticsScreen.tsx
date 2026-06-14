import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useLocationSelection } from "../contexts/LocationContext";
import { useWeather } from "../contexts/WeatherContext";
import { analysisResults, RegionRiskScore } from "../data/analysisResults";
import { calculateHeatIllnessRisk } from "../utils/heatIllnessRisk";
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

function getAverageIntegratedScore() {
  const total = analysisResults.regionRiskScores.reduce((sum, item) => sum + item.integratedHeatRiskScore, 0);

  return total / analysisResults.regionRiskScores.length;
}

function getAverageComparison(score: number) {
  const average = getAverageIntegratedScore();
  if (score > average + 5) return "5개 지역 평균보다 높은 편입니다.";
  if (score < average - 5) return "5개 지역 평균보다 낮은 편입니다.";
  return "5개 지역 평균과 비슷한 수준입니다.";
}

function getMainRiskFactors(item?: RegionRiskScore) {
  if (!item) return ["지역 종합 취약도", "현재 기상 조건"];

  const factors = [
    { label: "기상 위험", value: item.weatherRiskScore },
    { label: "폭염일수", value: item.heatwaveScore },
    { label: "온열질환 이력", value: item.heatIllnessScore },
    { label: "취약계층", value: item.elderlyScore }
  ];

  return factors
    .sort((a, b) => b.value - a.value)
    .slice(0, 2)
    .map((factor) => factor.label);
}

function getTopRegionComparison(region: string) {
  if (region === analysisResults.integratedHeatRiskTopRegion) {
    return `${region}은 5개 지역 중 종합 취약도가 가장 높아 고온 노출과 쉼터 이용 판단이 특히 중요합니다.`;
  }

  return `${region}은 ${analysisResults.integratedHeatRiskTopRegion}보다 종합 취약도는 낮더라도, 현재 기온과 체감온도가 높으면 온열질환 위험이 커질 수 있습니다.`;
}

function getShortAverageComparison(score: number) {
  const average = getAverageIntegratedScore();
  if (score > average + 5) return "평균보다 높은 편";
  if (score < average - 5) return "평균보다 낮은 편";
  return "평균과 비슷한 수준";
}

function getKeyInterpretations(region: string) {
  if (region === "부산") {
    return [
      "고령인구 비율이 높아 취약계층 보호가 중요합니다.",
      "다만 종합 폭염 취약도는 대구·서울보다 낮게 나타났습니다.",
      "체감온도가 높아지는 시간대에는 가까운 쉼터 이용을 권장합니다."
    ];
  }

  if (region === "대전") {
    return [
      "중간 수준의 폭염 취약도로 나타났습니다.",
      "대구보다는 낮지만, 기온과 체감온도가 높을 때 위험이 증가할 수 있습니다.",
      "야외 이동 시간이 길다면 가까운 쉼터를 먼저 확인하세요."
    ];
  }

  if (region === "대구") {
    return [
      "5개 지역 중 종합 폭염 취약도가 가장 높습니다.",
      "고온 노출과 폭염일수 영향이 크게 반영됐습니다.",
      "무리한 야외활동을 줄이고 쉼터 이용을 우선 권장합니다."
    ];
  }

  if (region === "서울") {
    return [
      "온열질환 이력 지표가 높게 반영된 지역입니다.",
      "종합 취약도는 5개 지역 중 상위권으로 나타났습니다.",
      "혼잡한 시간대에는 가까운 쉼터를 미리 확인하는 것이 좋습니다."
    ];
  }

  return [
    `${region}은 ${analysisResults.integratedHeatRiskTopRegion}보다 종합 취약도는 낮게 나타났습니다.`,
    "현재 체감온도가 높으면 온열질환 위험이 커질 수 있습니다.",
    "가까운 쉼터 이용을 권장합니다."
  ];
}

export function AnalyticsScreen() {
  const { selectedRegionOption, analysisRegionLabel, effectiveRegionOption } = useLocationSelection();
  const weather = useWeather();
  const selectedRegionName = analysisRegionLabel;
  const selectedScore =
    analysisResults.regionRiskScores.find((item) => item.region === selectedRegionName)?.integratedHeatRiskScore ??
    effectiveRegionOption.analysisScore ??
    0;
  const selectedRegionRisk = analysisResults.regionRiskScores.find((item) => item.region === selectedRegionName);
  const selectedRank = analysisResults.regionRiskScores.findIndex((item) => item.region === selectedRegionName) + 1 || 1;
  const heatIllnessRisk = calculateHeatIllnessRisk({
    feelsLikeTemperature: weather.feelsLikeTemperature,
    humidity: weather.humidity,
    heatAlertStatus: weather.heatAlertStatus,
    vulnerabilityScore: effectiveRegionOption.analysisScore
  });

  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.content}>
      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>현재 선택 지역 분석 요약</Text>
        {selectedRegionOption.key === "current" ? (
          <Text style={[sharedStyles.muted, { marginTop: 6 }]}>
            현재 위치 기준으로 가장 가까운 분석 지역: {selectedRegionName}
          </Text>
        ) : null}
        <View style={styles.selectedRegionHeader}>
          <View>
            <Text style={styles.selectedRegionName}>{selectedRegionName}</Text>
            <Text style={styles.selectedRegionScore}>종합 폭염 취약도 {selectedScore}점</Text>
          </View>
          <Text style={styles.selectedRegionRank}>5개 지역 중 {selectedRank}위</Text>
        </View>
        <View style={styles.averageBox}>
          <Text style={styles.averageLabel}>평균 대비</Text>
          <Text style={styles.averageValue}>{getShortAverageComparison(selectedScore)}</Text>
          <Text style={styles.averageCopy}>{getAverageComparison(selectedScore)}</Text>
        </View>

        <View style={styles.interpretationBox}>
          <Text style={styles.interpretationTitle}>주요 해석</Text>
          {getKeyInterpretations(selectedRegionName).map((item) => (
            <Text key={item} style={styles.interpretationText}>• {item}</Text>
          ))}
        </View>

        <Text style={styles.factorTitle}>주요 위험 요인</Text>
        <View style={styles.factorWrap}>
          {getMainRiskFactors(selectedRegionRisk).map((factor) => (
            <Tag key={factor} label={factor} tone="orange" />
          ))}
        </View>
        <View style={styles.selectedScoreBar}>
          <ScoreBar score={selectedScore} danger={selectedScore >= 70} />
        </View>
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>현재 온열질환 위험</Text>
        <Text style={styles.heatRiskHeadline}>
          현재 {selectedRegionName}의 온열질환 위험: {heatIllnessRisk.level}
        </Text>
        <Text style={[sharedStyles.muted, { marginTop: 5 }]}>체감온도와 지역 취약도를 함께 반영했습니다.</Text>
        <Text style={[sharedStyles.body, { marginTop: 8 }]}>야외활동을 줄이고 가까운 쉼터 이용을 권장합니다.</Text>
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>지역별 위험도 TOP 5</Text>
        {analysisResults.regionRiskScores.map((item, index) => (
          <RiskScoreBar key={item.region} item={item} rank={index + 1} />
        ))}
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>데이터 분석 기준</Text>
        <View style={styles.tagWrap}>
          <Tag label="기상청 ASOS 종관기상관측 데이터" tone="gray" />
          <Tag label="질병관리청 온열질환 감시 데이터" tone="gray" />
        </View>
        <View style={styles.metricGrid}>
          <Metric
            label="최고 취약 지역"
            value={`${analysisResults.integratedHeatRiskTopRegion} ${analysisResults.integratedHeatRiskTopScore}점`}
            tone="danger"
          />
          <Metric label="분석 기간" value={analysisResults.analysisPeriod} />
          <Metric label="최고기온-온열질환 상관관계" value={analysisResults.temperatureHeatIllnessCorrelation.toFixed(4)} />
          <Metric label="폭염일수 최다 지역" value={`${analysisResults.heatwaveTopRegion} ${analysisResults.heatwaveTopRegionDays}일`} tone="warning" />
          <Metric label="고령인구 비율 최고 지역" value={`${analysisResults.elderlyRateTopRegion} ${analysisResults.elderlyRateTopValue}%`} />
          <Metric label="총 온열질환자 수" value={`${analysisResults.totalHeatIllnessCases.toLocaleString()}명`} tone="danger" />
        </View>
      </View>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>앱 추천과의 연결</Text>
        {analysisResults.recommendationBreakdown.map((item) => (
          <ScoreRule key={item.label} label={item.label} value={`${item.score}%`} description={item.description} />
        ))}
        <Text style={[sharedStyles.muted, { marginTop: 10 }]}>
          앱의 쉼터 추천은 거리, 운영 여부, 냉방 상태, 혼잡도, 접근성, 물 제공 여부와 맞춤 조건을 함께 반영합니다.
        </Text>
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
  selectedRegionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 12
  },
  selectedRegionName: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 35,
    fontWeight: "900"
  },
  selectedRegionScore: {
    color: colors.blue,
    marginTop: 4,
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "900"
  },
  selectedRegionRank: {
    color: colors.blue,
    backgroundColor: colors.blueSoft,
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: "900"
  },
  averageBox: {
    marginTop: 16,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe"
  },
  averageLabel: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "900"
  },
  averageValue: {
    color: colors.blue,
    marginTop: 3,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "900"
  },
  averageCopy: {
    color: colors.text,
    marginTop: 4,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "800"
  },
  interpretationBox: {
    marginTop: 14,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa"
  },
  interpretationTitle: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "900"
  },
  interpretationText: {
    color: colors.text,
    marginTop: 8,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "800"
  },
  factorTitle: {
    color: colors.text,
    marginTop: 14,
    fontSize: 15,
    fontWeight: "900"
  },
  factorWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 9
  },
  heatRiskHeadline: {
    color: colors.danger,
    marginTop: 10,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "900"
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
