# 휴숨 데이터 분석 폴더

이 폴더는 휴숨 MVP의 폭염 위험도와 쉼터 추천 근거를 만들기 위한 오프라인 CSV/XLSX 분석 작업 공간입니다. 앱 화면 코드는 `src`에 있고, 원본 데이터와 분석 스크립트, 산출물은 `data-analysis`에서 관리합니다.

## 실행

```bash
cd data-analysis
py scripts/analyze_heat_risk.py
```

## 산출 파일

- `output/analysis_result.json`
- `output/summary.md`
- `output/weather_region_summary.csv`
- `output/heatwave_region_summary.csv`
- `output/heat_illness_region_summary.csv`
- `output/vulnerable_region_summary.csv`
- `output/integrated_heat_risk_by_region.csv`
- `output/weather_temperature_trend.png`
- `output/heat_illness_trend.png`
- `output/heatwave_days_by_region.png`
- `output/elderly_rate_by_region.png`
- `output/integrated_heat_risk_by_region.png`

## 핵심 분석 결과

- 분석 기간: 2020~2025년 여름철
- 분석 지역: 서울, 대전, 대구, 부산, 광주
- 평균 최고기온: 29.54℃
- 평균 습도: 76.47%
- 최고기온 33℃ 이상 일수: 706일
- 총 온열질환자 수: 2,516명
- 온열질환 최다 날짜: 2025-07-08, 39명
- 최고기온-온열질환 상관관계: 0.4057
- 폭염일수 최다 지역: 대구 233일
- 고령인구 비율 최고 지역: 부산 25.3%
- 종합 폭염 취약도 최고 지역: 대구 71.1점

## 지역별 종합 폭염 취약도

1. 대구: 71.1점
2. 서울: 48.63점
3. 대전: 39.73점
4. 광주: 33.04점
5. 부산: 24.21점

## 사용한 원본 파일

- `asos_weather.csv`
- `asos_daegu.csv`
- `heat_illness.csv`
- `heatwave_seoul.csv`
- `heatwave_daejeon.csv`
- `heatwave_daegu.csv`
- `heatwave_busan.csv`
- `heatwave_gwangju.csv`
- `kosis_elderly.csv`
- `kosis_children.csv`
- `kosis_single_household.xlsx`
- `행정안전부_무더위쉼터.csv`

`행정안전부_무더위쉼터.csv`는 분석 보조 자료로만 사용합니다. 앱의 홈/지도 추천 후보는 이 CSV를 직접 읽지 않고, `ShelterDataContext`에서 통합대피소 API 결과 또는 앱 기본 쉼터 데이터를 받아 사용합니다.

## 앱 반영 범위

분석 탭은 `analysis_result.json`에서 정리한 실제 분석 결과를 바탕으로 구성한 `src/data/analysisResults.ts` 값을 표시합니다.

앱 추천 후보의 런타임 흐름은 다음과 같습니다.

1. 통합대피소 API 결과를 정상 변환할 수 있으면 해당 쉼터 목록을 사용합니다.
2. API 키가 없거나 응답 변환이 불가능하면 앱 기본 쉼터 데이터를 사용합니다.
3. 지역 선택과 맞춤 설정은 추천 후보 필터링과 점수 계산에 반영합니다.

KOSIS OpenAPI는 현재 앱 런타임에서 호출하지 않습니다. 고령인구 등 취약계층 통계 자동 갱신은 실서비스 확장 항목입니다.
