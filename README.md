# 휴숨 MVP

Expo React Native TypeScript 기반 폭염 쉼터 추천 MVP입니다.

## 환경변수 설정

프로젝트 루트에서 `.env.example`을 참고해 `.env` 파일을 만듭니다.

```env
EXPO_PUBLIC_NAVER_MAP_CLIENT_ID=your_naver_map_client_id_here
EXPO_PUBLIC_SHELTER_API_KEY=your_public_data_service_key_here
EXPO_PUBLIC_WEATHER_API_KEY=your_weather_api_key_here
EXPO_PUBLIC_SPECIAL_WEATHER_API_KEY=your_special_weather_api_key_here
```

- `EXPO_PUBLIC_NAVER_MAP_CLIENT_ID`: Expo Web에서 네이버 지도 JavaScript SDK를 불러오기 위한 Client ID입니다.
- `EXPO_PUBLIC_SHELTER_API_KEY`: 통합대피소 API 호출에 사용하는 공공데이터 서비스 키입니다.
- `EXPO_PUBLIC_WEATHER_API_KEY`: 홈 화면의 현재 날씨, 기온, 체감온도, 습도 표시에 사용하는 기상 API 키입니다.
- `EXPO_PUBLIC_SPECIAL_WEATHER_API_KEY`: 폭염주의보와 폭염경보 안내에 사용하는 기상특보 API 키입니다.

API 키가 없거나 호출에 실패하면 앱은 사용자 화면에 오류 문구를 표시하지 않고 기본 데이터를 사용합니다.

Expo Web에서 `EXPO_PUBLIC_` 접두어가 붙은 환경변수는 브라우저 번들에 포함될 수 있습니다. MVP에서는 `.env`로 관리하지만, 실제 서비스에서는 공공데이터 API 키를 서버 또는 프록시 뒤에 두어 보호해야 합니다. 실제 API 키를 소스 코드, README, 커밋 기록에 남기지 마세요.

## 실행 방법

```bash
npm install
npx expo start --web
```

기본 포트가 이미 사용 중이면 8090 포트로 실행할 수 있습니다.

```bash
npx expo start --web --port 8090 -c
```

## 검증 명령

```bash
npm run typecheck
npx expo export --platform web
```

## 데이터와 API

홈과 지도 화면의 쉼터 추천 후보는 `ShelterDataContext`가 제공하는 `shelters`를 사용합니다.

현재 구조는 다음 순서로 동작합니다.

1. 통합대피소 API 키가 있고 응답을 정상 변환할 수 있으면 API 결과를 사용합니다.
2. API 키가 없거나 응답이 없거나 변환이 정상 처리되지 않으면 앱에 포함된 기본 쉼터 데이터를 사용합니다.
3. 선택한 지역이 있으면 해당 지역 쉼터만 추천 후보로 사용합니다.

`data-analysis` 폴더의 무더위쉼터 CSV는 분석 보조 자료입니다. 홈과 지도 추천 후보로 직접 import하거나 런타임에서 읽지 않습니다. 분석 탭은 CSV/XLSX 분석 결과를 정리한 `src/data/analysisResults.ts` 값을 표시합니다.

KOSIS OpenAPI는 이번 MVP 앱에서 직접 호출하지 않습니다. 현재는 CSV/XLSX 기반 분석 결과를 사용하고, KOSIS 통계 자동 갱신은 실서비스 확장 항목으로 유지합니다.
