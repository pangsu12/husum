# 휴숨 데이터 분석 폴더

이 폴더는 휴숨 MVP의 폭염 위험도와 쉼터 추천 근거를 만들기 위한 실제 CSV/XLSX 분석 작업 공간입니다. 앱 화면 코드는 `src`에 두고, 원본 데이터와 분석 스크립트, 산출물은 `data-analysis`에서 관리합니다.

## 실행

```bash
cd data-analysis
py scripts/analyze_heat_risk.py
```

## output 파일

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

## 핵심 결과

- 분석 기간: 2020~2025년 여름철
- 분석 지역: 서울, 대전, 대구, 부산, 광주
- 평균 최고기온: 29.54도
- 평균 습도: 76.47%
- 최고기온 33도 이상 일수: 706일
- 총 온열질환자 수: 2,516명
- 온열질환 최다 날짜: 2025-07-08, 39명
- 최고기온-온열질환 상관관계: 0.4057
- 폭염일수 최다 지역: 대구, 233일
- 고령인구 비율 최고 지역: 부산, 25.3%
- 종합 폭염 취약도 최고 지역: 대구, 71.1점

## 지역별 종합 폭염 취약도

1. 대구: 71.1점
2. 서울: 48.63점
3. 대전: 39.73점
4. 광주: 33.04점
5. 부산: 24.21점

## 사용한 raw 파일

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
- `행정안전부_무더위쉼터.csv`는 보조 분석으로만 사용

## 실제 분석값과 확장 예정 예시 구분

현재 앱 분석 탭에는 `analysis_result.json`의 실제 분석값을 우선 반영합니다.

실제 반영값:

- 지역별 종합 폭염 취약도
- 평균 최고기온, 평균 습도, 33도 이상 일수
- 총 온열질환자 수와 최다 날짜
- 최고기온-온열질환 상관관계
- 폭염일수 최다 지역
- 고령인구 비율 최고 지역
- 무더위쉼터 보조 분석

확장 예정 예시:

- 어린이/유소년 지역별 비율
- 1인가구 지역별 비율
- 통합대피소 API 기반 실시간 쉼터 후보
- 기상특보 API 기반 최신 위험도 보정

## 취약계층 지표 처리

지역별 종합 폭염 취약도에는 `kosis_elderly.csv`의 고령인구 비율을 사용합니다. 고령층은 폭염 건강 피해에 취약하고, 현재 파일 구조가 지역별 병합에 적합하기 때문입니다.

`kosis_children.csv`와 `kosis_single_household.xlsx`는 현재 전국 단위 구조라 서울·대전·대구·부산·광주 지역별 위험도 계산에는 포함하지 않았습니다.

## 앱 반영

분석 결과는 앱 분석 탭에 반영됩니다. 통합대피소 API는 지도 마커와 쉼터 추천 후보 생성에 활용할 예정이며, 시민 제보와 맞춤 설정은 추천 점수 보정에 연결됩니다.
