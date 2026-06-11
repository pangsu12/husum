# 휴숨 MVP

Expo React Native TypeScript 기반의 휴숨 MVP입니다.

## 환경변수 설정

프로젝트 루트에서 `.env.example`을 참고해 `.env` 파일을 만듭니다.

```env
EXPO_PUBLIC_NAVER_MAP_CLIENT_ID=your_naver_map_client_id_here
```

`EXPO_PUBLIC_NAVER_MAP_CLIENT_ID`는 Expo Web에서 네이버 지도 JavaScript SDK를 불러오기 위한 Client ID입니다. 네이버 클라우드 플랫폼에서 Maps Application을 만들고 Web Dynamic Map API를 활성화한 뒤 발급받은 Client ID를 넣습니다.

네이버 지도 애플리케이션의 서비스 URL에는 로컬 실행 주소를 등록합니다.

```text
http://localhost
http://localhost:8090
```

Client Secret은 프론트엔드 코드나 `.env`에 넣지 않습니다.

`.env`가 없거나 `EXPO_PUBLIC_NAVER_MAP_CLIENT_ID`가 비어 있으면 실제 네이버 지도 대신 fallback 지도 UI가 표시됩니다.

## 실행 방법

의존성을 설치합니다.

```bash
npm install
```

웹으로 실행합니다.

```bash
npx expo start --web
```

기본 포트인 `8081`이 이미 사용 중이면 `8090` 포트로 실행합니다.

```bash
npx expo start --web --port 8090 -c
```

## API 키 보안

Expo Web에서 클라이언트에 노출되는 환경변수는 `EXPO_PUBLIC_` 접두사가 필요합니다. 이 접두사가 붙은 값은 브라우저 번들에 포함될 수 있으므로 비밀값으로 취급하면 안 됩니다.

공공데이터 API 키는 MVP 단계에서는 `.env`로 관리할 수 있지만, 실제 서비스에서는 서버 또는 프록시를 통해 보호해야 합니다. 실제 API 키를 소스 코드, README, 커밋 기록에 남기지 마세요.

추후 API 연동 예정 변수는 `.env.example`에 주석으로만 남겨 두었습니다.

```env
# EXPO_PUBLIC_SHELTER_API_KEY=your_public_data_service_key_here
# EXPO_PUBLIC_WEATHER_API_KEY=your_weather_api_key_here
# EXPO_PUBLIC_SPECIAL_WEATHER_API_KEY=your_special_weather_api_key_here
# EXPO_PUBLIC_KOSIS_API_KEY=your_kosis_api_key_here
```

## 검증 명령어

TypeScript 오류를 확인합니다.

```bash
npm run typecheck
```

웹 정적 빌드를 생성합니다.

```bash
npx expo export --platform web
```
