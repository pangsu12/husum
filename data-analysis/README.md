# 휴숨 실제 공공데이터 분석 폴더

이 폴더는 휴숨 앱의 추천 알고리즘과 보고서 작성을 위한 실제 공공데이터 분석 작업 공간입니다. 앱 코드는 수정하지 않고, 원본 CSV/XLSX/API 응답을 `data-analysis/raw`에 넣은 뒤 Python 스크립트로 분석합니다.

## 폴더 구조

```text
data-analysis/
  raw/       실제 CSV, XLSX, API 원본 응답 저장
  output/    분석 결과 md 파일과 그래프 저장
  scripts/   데이터 수집 및 분석 스크립트
```

## .env 설정

프로젝트 루트의 `.env` 파일에 API 키를 저장합니다. API 키는 코드에 직접 쓰지 않습니다.

```env
SHELTER_API_KEY=발급받은_무더위쉼터_API_키
WEATHER_API_KEY=발급받은_기상청_API_키
AIR_QUALITY_API_KEY=발급받은_에어코리아_API_키
```

## 무더위쉼터 데이터 분석 완료

현재 `행정안전부_무더위쉼터.csv` 실제 데이터 100개 분석이 완료되어 있습니다.

- 전체 쉼터 수: 100개
- 평균 이용가능인원: 27.7명
- 총 이용가능인원: 2,773명
- 총 에어컨 수: 211대
- 총 선풍기 수: 209대
- 지역 상위: 경상남도 하동군 6개, 전북특별자치도 고창군 5개, 경상남도 진주시 4개
- 이용가능인원 1위: 봉담도서관 139명
- 에어컨 수 1위: 봉담도서관 82대

```bash
python data-analysis/scripts/analyze_real_shelter_data.py
```

## 기상 데이터 수집

기상청_단기예보 조회서비스의 초단기실황조회와 초단기예보조회를 호출합니다. 기본 위치는 대전 기준 `nx=67`, `ny=100`입니다.

```bash
python data-analysis/scripts/fetch_weather_api.py
```

생성되는 raw 파일:

```text
data-analysis/raw/weather_ultra_srt_ncst_raw.json
data-analysis/raw/weather_ultra_srt_fcst_raw.json
data-analysis/raw/weather.csv
```

`weather.csv` 컬럼:

```text
datetime, region, nx, ny, temperature, humidity, wind_speed, rainfall,
sky, precipitation_type, apparent_temperature, heat_risk_score, source
```

## 대기질 데이터 수집

한국환경공단_에어코리아_대기오염정보의 시도별 실시간 측정정보조회를 호출합니다. 기본 지역은 대전입니다.

```bash
python data-analysis/scripts/fetch_air_quality_api.py
```

생성되는 raw 파일:

```text
data-analysis/raw/air_quality_raw.json
data-analysis/raw/air_quality.csv
```

`air_quality.csv` 컬럼:

```text
datetime, region, station, pm10, pm25, ozone,
air_quality_index, air_risk_score, source
```

## 수동 파일 추가

API 대신 실제 CSV/XLSX 파일을 직접 넣어도 분석할 수 있습니다.

기상 파일명 예:

```text
data-analysis/raw/weather.csv
data-analysis/raw/weather.xlsx
data-analysis/raw/기상.csv
data-analysis/raw/날씨.xlsx
data-analysis/raw/폭염.csv
```

대기질 파일명 예:

```text
data-analysis/raw/air_quality.csv
data-analysis/raw/air_quality.xlsx
data-analysis/raw/대기질.csv
data-analysis/raw/에어코리아.xlsx
data-analysis/raw/미세먼지.csv
```

## 통합 분석

```bash
python data-analysis/scripts/analyze_weather_air_quality.py
```

기상 또는 대기질 실제 CSV/XLSX 파일이 없으면 샘플 데이터를 만들지 않고 다음 안내만 출력합니다.

```text
data-analysis/raw 폴더에 기상 또는 대기질 실제 CSV/XLSX 파일을 넣어주세요.
```

생성되는 output 파일:

```text
data-analysis/output/weather_air_quality_analysis_summary.md
data-analysis/output/hourly_temperature.png
data-analysis/output/hourly_heat_risk.png
data-analysis/output/air_quality_risk.png
data-analysis/output/climate_air_total_risk.png
```

## 분석 기준

- 폭염 위험도는 기온, 습도, 체감온도를 기반으로 `heat_risk_score` 0~100점으로 계산합니다.
- 대기질 위험도는 미세먼지, 초미세먼지, 오존, 통합대기환경지수를 기반으로 `air_risk_score` 0~100점으로 계산합니다.
- 통합 이동 위험도는 `climate_air_total_risk = heat_risk_score + air_risk_score` 기준으로 계산합니다.
- 종합 이동 위험도가 높은 시간대에는 가까운 쉼터와 냉방 설비가 좋은 쉼터를 우선 추천하는 방향으로 앱 추천 알고리즘에 반영할 수 있습니다.

## 오류 처리

API 호출 실패 시 스크립트는 상태코드, 응답 본문 일부, 실패 원인 추정을 출력합니다. 인증키 원문은 출력하지 않습니다.
