# TRIP_PLAN — 2026 일본 여행 실행 계획

계획 버전: 2026-10-06-r3 · 기준: 사용자 제공 최신 6일 일정
기간: 2026-12-22(화)~12-27(일), 5박 6일 · 2명 · Asia/Tokyo

## 0. 적용 원칙

- 본 문서는 이전 TRIP_PLAN을 대체한다. 동선·시간은 사용자가 제공한 계획값을 보존한다.
- 장소 선정, 시간표 검증, 예약 완료는 서로 다른 상태다. 식당이 정해졌다고 예약 완료로 표시하지 않는다.
- 아라하마 해안·초등학교 및 이를 위한 아라이역 왕복 일정·준비 항목은 운영 일정에서 완전히 제외한다.
- 12/24~26 숙소는 APA Hotel Ueno Ekikita로 변경한다. 칸데오 숙소와 기존 우구이스다니 이동 경로를 새 일정에 남기지 않는다.
- 식당은 계획서의 고정 목록으로 제공한다. 현재 지정 식사는 각 1곳이며 복수 식당 기능을 채우려고 임의 후보를 추가하지 않는다.
- 아침은 숙소/편의점이 기본. 예외는 1일차 요시노야(충돌 미해결), 3일차 사칸 조식, 4일차 코메다(지점 미정)다.
- 지출·정산·후보 식당 편집 기능을 복원하지 않는다. 이전 요금 총계는 새 동선과 맞지 않으므로 삭제하고 검증된 요금만 나중에 참고값으로 입력한다.
- 본 문서는 신규 예약이나 항공·열차 시각 검증 완료를 뜻하지 않는다. 실제 예약번호·좌석·QR·개인정보는 인증된 사이트에서 입력한다.

## 1. 항공 및 숙박

| 구분 | 날짜 | 대상 | 사용자 제공 시간 / 숙박 |
|---|---|---|---|
| 출국 | 12/22 | 대구 → 나리타 | 11:10~13:20 |
| 귀국 | 12/27 | 나리타 → 대구 | 14:20~16:50 |
| 숙소 | 12/22 | APA 호텔 TKP 센다이 에키기타 | 1박, 12/23 체크아웃 |
| 숙소 | 12/23 | 호텔 사칸 | 1박, 12/24 체크아웃 |
| 숙소 | 12/24~26 | APA Hotel Ueno Ekikita | 3박, 12/27 체크아웃 |

## 2. 적용 전 확인할 항목

| 항목 | 현재 처리 | 확인할 내용 |
|---|---|---|
| 1일차 요시노야 아침 | 시간 없는 확인 필요 항목으로 보존 | 일본 도착 13:20이므로 일본에서의 아침은 불가능. 날짜/장소를 사용자가 결정 |
| 코메다 | 식사 일정만 생성, place_key 없음 | 방문 지점 및 시바공원 이동 가능 시간 |
| 돈키호테·일부 쇼핑점 | 이름만 보존, 지점 핀 없음 | 정확한 지점과 이동 거리 |
| 2일차 점심 | 13:45~14:35 원안 보존 | 50분 내 대기·주문·식사 가능한지, 짐 수령 후 15:30 셔틀 연결 |
| 사칸 셔틀 | 원안의 편도 45분 보존 | 이전 약 50분 안내와 차이. 실제 예약 안내를 기준으로 도착시각 검증 |
| 아키우 버스 | 09:20 전후 / 10:23 원안 보존 | 이용일 겨울 평일 시각표, 정류장, 폭포에서 정류장 복귀시간 |
| 카이치 점심 | 아키우 본점 기준 | 라이라이쿄에서 10분 이동 가능 여부, 당일 영업 및 대기 |
| 열차 | 사용자 제공 호수·시각 보존 | N’EX 30/17, Hayabusa 33/26의 12월 운행·발권 |
| 일루미네이션 | 방문 계획 유지 | 2026 개최일·점등시간·입장 조건 |
| 오다이바 일몰 | 17~18시 원안 보존 | 실제 일몰시각 확인 후 촬영 계획 조정 여부 결정 |
| 귀국 터미널 | T1은 요청값으로 표시 | 항공사·편명과 실제 터미널 확인; 수속시간 여유 검토 |

시간이 미정인 식사는 현재/다음 일정 자동 계산에서 제외한다. ‘예약 확정’ 배지로 표시하지 않는다. 동선이 빠듯하다는 이유로 기획서 시간이나 식당을 자동 교체하지 않는다. 변경 필요사항은 별도로 제안한다.

## 3. 장소 및 Google Maps 연결표

아래 링크는 **장소명 기반 Google Maps 검색 링크**다. 사용자가 열어 정확한 지점을 확인해야 하며, Place ID 또는 좌표가 검증됐다는 뜻이 아니다. API 키 없이 열리는 기본 링크로 사용한다. 검증한 지점 URL을 확보하면 같은 place_key의 링크를 교체한다. 모든 google_place_id/좌표는 확인 전 null이다.

코메다·요시노야·돈키호테·SOU・SOU·GU·유니클로의 지점은 추정하지 않는다. 특정 식당이 없는 간단식은 지도 버튼을 숨긴다. 센다이역 지도는 사칸 셔틀의 정확한 승차 위치를 대신하지 않으며 승차 안내는 예약자료에서 제공한다.

| place_key | 장소 | 종류 | 지도 |
|---|---|---|---|
| `daegu-airport` | 대구공항 | AIRPORT | [지도 검색](https://www.google.com/maps/search/?api=1&query=%EB%8C%80%EA%B5%AC%EA%B5%AD%EC%A0%9C%EA%B3%B5%ED%95%AD) |
| `narita-airport` | 나리타공항 | AIRPORT | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%88%90%E7%94%B0%E5%9B%BD%E9%9A%9B%E7%A9%BA%E6%B8%AF) |
| `tokyo-station` | 도쿄역 | STATION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%9D%B1%E4%BA%AC%E9%A7%85) |
| `sendai-station` | 센다이역 | STATION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E4%BB%99%E5%8F%B0%E9%A7%85) |
| `apa-sendai` | APA 호텔 TKP 센다이 에키기타 | HOTEL | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E3%82%A2%E3%83%91%E3%83%9B%E3%83%86%E3%83%AB+TKP%E4%BB%99%E5%8F%B0%E9%A7%85%E5%8C%97) |
| `sakan` | 호텔 사칸 | HOTEL | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E4%BC%9D%E6%89%BF%E5%8D%83%E5%B9%B4%E3%81%AE%E5%AE%BF+%E4%BD%90%E5%8B%98+%E7%A7%8B%E4%BF%9D) |
| `apa-ueno` | APA Hotel Ueno Ekikita | HOTEL | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E3%82%A2%E3%83%91%E3%83%9B%E3%83%86%E3%83%AB+%E4%B8%8A%E9%87%8E%E9%A7%85%E5%8C%97) |
| `umami-tasuke` | 우마미 타스케 | RESTAURANT | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%97%A8%E5%91%B3%E5%A4%AA%E5%8A%A9+%E4%BB%99%E5%8F%B0) |
| `jozenji` | 조젠지도리 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E5%AE%9A%E7%A6%85%E5%AF%BA%E9%80%9A+%E4%BB%99%E5%8F%B0) |
| `ichibancho` | 이치반초 | SHOPPING | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E4%B8%80%E7%95%AA%E7%94%BA+%E4%BB%99%E5%8F%B0) |
| `nakanosakae` | 나카노사카에역 | STATION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E4%B8%AD%E9%87%8E%E6%A0%84%E9%A7%85) |
| `aquarium` | 센다이 우미노모리 수족관 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E4%BB%99%E5%8F%B0%E3%81%86%E3%81%BF%E3%81%AE%E6%9D%9C%E6%B0%B4%E6%97%8F%E9%A4%A8) |
| `oyama-sendai` | 하카타 모츠나베 오오야마 센다이점 | RESTAURANT | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E5%8D%9A%E5%A4%9A%E3%82%82%E3%81%A4%E9%8D%8B%E3%81%8A%E3%81%8A%E3%82%84%E3%81%BE+%E4%BB%99%E5%8F%B0%E5%BA%97) |
| `akiu-sato` | 아키우·사토센터 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E7%A7%8B%E4%BF%9D+%E9%87%8C%E3%82%BB%E3%83%B3%E3%82%BF%E3%83%BC) |
| `akiu-falls` | 아키우 대폭포 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E7%A7%8B%E4%BF%9D%E5%A4%A7%E6%BB%9D) |
| `rairaikyo` | 라이라이쿄 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E7%A3%8A%E3%80%85%E5%B3%A1) |
| `kaichi-honten` | 仙台中華そば 銘店嘉一 本店 | RESTAURANT | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E4%BB%99%E5%8F%B0%E4%B8%AD%E8%8F%AF%E3%81%9D%E3%81%B0+%E9%8A%98%E5%BA%97%E5%98%89%E4%B8%80+%E6%9C%AC%E5%BA%97+%E7%A7%8B%E4%BF%9D) |
| `ueno-station` | 우에노역 | STATION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E4%B8%8A%E9%87%8E%E9%A7%85) |
| `ark-hills` | 아크 힐즈 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E3%82%A2%E3%83%BC%E3%82%AF%E3%83%92%E3%83%AB%E3%82%BA) |
| `tsujihan-ark` | 츠지한 아크 힐즈점 | RESTAURANT | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%97%A5%E6%9C%AC%E6%A9%8B%E6%B5%B7%E9%AE%AE%E4%B8%BC+%E3%81%A4%E3%81%98%E5%8D%8A+%E3%82%A2%E3%83%BC%E3%82%AF%E3%83%92%E3%83%AB%E3%82%BA%E5%BA%97) |
| `roppongi-hills` | 롯폰기 힐즈 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E5%85%AD%E6%9C%AC%E6%9C%A8%E3%83%92%E3%83%AB%E3%82%BA) |
| `keyakizaka` | 게야키자카 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E5%85%AD%E6%9C%AC%E6%9C%A8%E3%81%91%E3%82%84%E3%81%8D%E5%9D%82%E9%80%9A%E3%82%8A) |
| `shiba-park` | 시바공원 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E8%8A%9D%E5%85%AC%E5%9C%92+%E6%9D%B1%E4%BA%AC) |
| `tokyo-tower` | 도쿄타워 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%9D%B1%E4%BA%AC%E3%82%BF%E3%83%AF%E3%83%BC) |
| `shibuya` | 시부야 | SHOPPING | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%B8%8B%E8%B0%B7+%E6%9D%B1%E4%BA%AC) |
| `sushiro-shibuya` | 스시로 시부야역앞점 | RESTAURANT | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E3%82%B9%E3%82%B7%E3%83%AD%E3%83%BC+%E6%B8%8B%E8%B0%B7%E9%A7%85%E5%89%8D%E5%BA%97) |
| `shibuya-parco` | 시부야 PARCO | SHOPPING | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%B8%8B%E8%B0%B7PARCO) |
| `hachiko` | 하치코 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E5%BF%A0%E7%8A%AC%E3%83%8F%E3%83%81%E5%85%AC%E5%83%8F) |
| `scramble` | 시부야 스크램블 교차로 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%B8%8B%E8%B0%B7%E3%82%B9%E3%82%AF%E3%83%A9%E3%83%B3%E3%83%96%E3%83%AB%E4%BA%A4%E5%B7%AE%E7%82%B9) |
| `nihonbashi` | 니혼바시 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%97%A5%E6%9C%AC%E6%A9%8B+%E6%9D%B1%E4%BA%AC) |
| `hajime` | 니혼바시 돈카츠 하지메 | RESTAURANT | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%97%A5%E6%9C%AC%E6%A9%8B+%E3%81%A8%E3%82%93%E3%81%8B%E3%81%A4+%E4%B8%80+HAJIME) |
| `marunouchi` | 마루노우치 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E4%B8%B8%E3%81%AE%E5%86%85+%E4%BB%B2%E9%80%9A%E3%82%8A+%E6%9D%B1%E4%BA%AC) |
| `ueno-park` | 우에노공원 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E4%B8%8A%E9%87%8E%E6%81%A9%E8%B3%9C%E5%85%AC%E5%9C%92) |
| `ameyoko` | 아메요코 | SHOPPING | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E3%82%A2%E3%83%A1%E6%A8%AA+%E6%9D%B1%E4%BA%AC) |
| `unatoto-ueno` | 나다이 우나토토 우에노점 | RESTAURANT | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E5%90%8D%E4%BB%A3+%E5%AE%87%E5%A5%88%E3%81%A8%E3%81%A8+%E4%B8%8A%E9%87%8E%E5%BA%97) |
| `shinbashi` | 신바시역 | STATION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%96%B0%E6%A9%8B%E9%A7%85) |
| `odaiba` | 오다이바 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E3%81%8A%E5%8F%B0%E5%A0%B4+%E6%9D%B1%E4%BA%AC) |
| `moheji-ueno` | 츠키시마 몬자 모헤지 우에노점 | RESTAURANT | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%9C%88%E5%B3%B6%E3%82%82%E3%82%93%E3%81%98%E3%82%83+%E3%82%82%E3%81%B8%E3%81%98+%E4%B8%8A%E9%87%8E%E5%BA%97) |
| `kokyo` | 고쿄 외원 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E7%9A%87%E5%B1%85%E5%A4%96%E8%8B%91) |
| `nijubashi` | 니주바시 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E7%9A%87%E5%B1%85+%E4%BA%8C%E9%87%8D%E6%A9%8B) |

## 4. 6일 전체 일정

표의 일정 키는 제목·시간·순서가 바뀌어도 유지한다. 장소 키가 여러 개면 순서대로 출발/도착 또는 연결 장소이며, 자동으로 이동 출발지/도착지로 판단하지 말고 일정 종류와 설명에 따라 연결한다. 모든 식당/장소 편집은 개발 과정에서만 수행한다.

### 1일차 · 2026-12-22 · 대구 → 나리타 → 도쿄 → 센다이

숙소: APA 호텔 TKP 센다이 에키기타

| 일정 키 | 시간 | 종류 | 일정 | 연결 장소 키 | 확인·비고 |
|---|---|---|---|---|---|
| `d1-yoshinoya` | 아침·시간 미정 | MEAL | 요시노야 아침 | — | 위치·항공편 충돌: 확인 필요. 방문 완료나 예약 확정 처리 금지 |
| `d1-arrive-airport` | 08:50 | OTHER | 대구공항 도착 | daegu-airport | 출국 일정 시작 |
| `d1-checkin-flight` | 08:50~10:30 | OTHER | 체크인·출국수속 | daegu-airport | 항공사 카운터 확인 |
| `d1-flight-out` | 11:10~13:20 | FLIGHT | 대구 → 나리타 | daegu-airport, narita-airport | 사용자 제공 항공시간; 편명·예약자료 입력 필요 |
| `d1-immigration` | 13:20~14:20 | OTHER | 입국심사·수하물 수령 | narita-airport | 이후 열차 연결 여유 확인 |
| `d1-nex-out` | 14:45~15:45 | TRAIN | 나리타공항 → 도쿄역 / N'EX 30호 | narita-airport, tokyo-station | 이용일 운행시각·출발 터미널·좌석 확인 |
| `d1-transfer-tokyo` | 15:45~16:20 | OTHER | 신칸센 환승 | tokyo-station | 승강장·개찰 이동 |
| `d1-hayabusa-out` | 16:20~17:51 | TRAIN | 도쿄 → 센다이 / Hayabusa 33호 | tokyo-station, sendai-station | 이용일 운행시각·좌석 확인 |
| `d1-hotel-transfer` | 17:51~18:05 | TRANSIT | 호텔 이동 | sendai-station, apa-sendai | 도보 예상시간 확인 |
| `d1-hotel-checkin` | 18:05~18:25 | HOTEL | 체크인·짐 정리 | apa-sendai | 예약자료 확인 |
| `d1-meal-transfer` | 18:25~18:45 | TRANSIT | 우마미 타스케 이동 | apa-sendai, umami-tasuke | — |
| `d1-dinner` | 18:45~19:40 | MEAL | 우마미 타스케 저녁 | umami-tasuke | 방문 계획; 예약 완료를 뜻하지 않음 |
| `d1-lights-transfer` | 19:40~19:55 | TRANSIT | 조젠지도리 이동 | umami-tasuke, jozenji | — |
| `d1-pageant` | 19:55~21:00 | ATTRACTION | 센다이 빛의 페이전트 | jozenji | 2026 개최일·점등시간 재확인 |
| `d1-walk` | 21:00~21:30 | WALK | 이치반초 중심가 산책 | ichibancho | — |
| `d1-hotel-return` | 21:30~22:00 | TRANSIT | 호텔 복귀 | ichibancho, apa-sendai | — |
| `d1-rest` | 22:00~ | FREE_TIME | 휴식 | apa-sendai | 다음 날 짐 보관 준비 |

점심은 이동 중 간단식이며 고정 시각·장소가 없다. 시간 없는 식사 메모로 표시하고 열차 이동 중의 독립된 충돌 일정은 만들지 않는다.

### 2일차 · 2026-12-23 · 우미노모리 수족관 → 센다이 점심 → 사칸

숙소: 호텔 사칸

| 일정 키 | 시간 | 종류 | 일정 | 연결 장소 키 | 확인·비고 |
|---|---|---|---|---|---|
| `d2-breakfast` | 07:30~08:15 | MEAL | 호텔 조식 또는 편의점 | — | 특정 식당 지정 없음 |
| `d2-checkout` | 08:15~08:30 | HOTEL | 체크아웃·캐리어 호텔 보관 | apa-sendai | 보관 가능 여부 확인 |
| `d2-station-transfer` | 08:30~08:45 | TRANSIT | 센다이역 이동 | apa-sendai, sendai-station | — |
| `d2-train-aquarium` | 08:45~09:10 | TRAIN | 센다이 → 나카노사카에 | sendai-station, nakanosakae | 시간은 계획값 |
| `d2-walk-aquarium` | 09:10~09:30 | TRANSIT | 수족관 이동 | nakanosakae, aquarium | 도보·버스 수단과 소요시간 확인 |
| `d2-entry` | 09:30~10:00 | OTHER | 입장 준비·주변 여유시간 | aquarium | 12/23 영업시간 확인 |
| `d2-aquarium` | 10:00~13:00 | ATTRACTION | 센다이 우미노모리 수족관 관람 | aquarium | 아라하마 일정 없이 약 3시간 |
| `d2-walk-station` | 13:00~13:20 | TRANSIT | 나카노사카에역 이동 | aquarium, nakanosakae | — |
| `d2-train-sendai` | 13:20~13:45 전후 | TRAIN | 나카노사카에 → 센다이 | nakanosakae, sendai-station | 도착시각은 근사값 |
| `d2-lunch` | 13:45~14:35 | MEAL | 하카타 모츠나베 오오야마 센다이점 점심 | oyama-sendai | 대기·조리시간 포함 50분 확보 여부 확인 |
| `d2-hotel-transfer` | 14:35~14:45 | TRANSIT | 호텔 이동 | oyama-sendai, apa-sendai | — |
| `d2-luggage` | 14:45~14:55 | OTHER | 캐리어 수령 | apa-sendai | 짐 누락 확인 |
| `d2-shuttle-transfer` | 14:55~15:10 | TRANSIT | 센다이역 동쪽 출구 이동 | apa-sendai, sendai-station | 역 핀과 실제 셔틀 승차장은 별개 |
| `d2-shuttle-wait` | 15:10~15:25 | OTHER | 사칸 셔틀 대기 | sendai-station | 정확한 승차 위치를 예약자료로 확인 |
| `d2-shuttle` | 15:30~16:15 | SHUTTLE | 센다이역 → 사칸 무료 셔틀 | sendai-station, sakan | 사용자 계획 45분; 이전 약 50분과 차이 있어 도착 재확인 |
| `d2-hotel-checkin` | 16:15~16:40 | HOTEL | 사칸 체크인 | sakan | 석식·조식·다음날 셔틀 안내 확인 |
| `d2-walk` | 16:40~17:30 | WALK | 아키우 온천마을 산책 | sakan | 짧은 주변 산책 |
| `d2-onsen` | 17:30~18:30 | OTHER | 온천·휴식 | sakan | 숙소 안내 준수 |
| `d2-dinner` | 18:30~20:00 | MEAL | 사칸 료칸 석식 | sakan | 숙박 플랜 포함 여부·실제 식사시간 확인 |
| `d2-rest` | 20:00~21:00 | FREE_TIME | 객실 휴식 | sakan | — |
| `d2-night-onsen` | 21:00~22:00 | OTHER | 야간 온천 | sakan | 운영시간 확인 |

### 3일차 · 2026-12-24 · 아키우 대폭포 → 라이라이쿄 → 카이치 → 도쿄 → 롯폰기

숙소: APA Hotel Ueno Ekikita

| 일정 키 | 시간 | 종류 | 일정 | 연결 장소 키 | 확인·비고 |
|---|---|---|---|---|---|
| `d3-breakfast` | 07:00~08:00 | MEAL | 사칸 조식 | sakan | 실제 조식시간 확인 |
| `d3-packing` | 08:00~08:35 | OTHER | 객실 정리·외출 준비 | sakan | — |
| `d3-checkout` | 08:35~08:50 | HOTEL | 체크아웃·캐리어 사칸 보관 | sakan | 짐 수령 시각 전달 |
| `d3-sato-transfer` | 08:50~09:10 | TRANSIT | 아키우·사토센터 이동 | sakan, akiu-sato | 실제 버스 정류장 확인 |
| `d3-bus-falls` | 09:20 전후~약 09:45 | BUS | 아키우 대폭포 이동·도착 | akiu-sato, akiu-falls | 목요일·겨울 운행편 검증 필요 |
| `d3-falls` | 09:45~10:20 | ATTRACTION | 아키우 대폭포 관람 | akiu-falls | 10:23 버스 전 정류장 도착 가능 범위로 관람 |
| `d3-bus-return` | 10:23~약 10:50 | BUS | 아키우 대폭포 → 아키우 온천 | akiu-falls, akiu-sato | 시각표 미검증; 정류장 위치 확인 |
| `d3-rairaikyo` | 10:50~11:30 | WALK | 라이라이쿄 협곡 산책 | rairaikyo | 결빙·통행 상황 확인 |
| `d3-meal-transfer` | 11:30~11:40 | TRANSIT | 카이치 라멘 이동 | rairaikyo, kaichi-honten | 10분 이동 가능 여부 확인 |
| `d3-lunch` | 11:40~12:40 | MEAL | 仙台中華そば 銘店嘉一 本店 | kaichi-honten | 아키우 본점 기준; 국분초점과 혼동 금지 |
| `d3-village` | 12:40~13:25 | WALK | 아키우 온천마을·기념품 구경 | akiu-sato | — |
| `d3-sakan-transfer` | 13:25~13:50 | TRANSIT | 사칸 이동 | akiu-sato, sakan | — |
| `d3-luggage` | 13:50~14:00 | OTHER | 캐리어 수령 | sakan | — |
| `d3-shuttle-wait` | 14:00~14:20 | OTHER | 셔틀 승차 준비 | sakan | 14:20~14:30 승차 여유 |
| `d3-shuttle` | 14:30~15:15 | SHUTTLE | 사칸 → 센다이역 | sakan, sendai-station | 도착은 계획값; 예약자료 재확인 |
| `d3-train-transfer` | 15:15~15:45 | OTHER | 신칸센 승강장 이동 | sendai-station | 15:45~15:57 탑승 여유 |
| `d3-hayabusa-return` | 15:57~17:32 | TRAIN | 센다이 → 도쿄 / Hayabusa 26 | sendai-station, tokyo-station | 이용일 운행시각·좌석 확인 |
| `d3-ueno-transfer` | 17:32~18:00 | TRAIN | 우에노 이동 | tokyo-station, ueno-station, apa-ueno | 기존 우구이스다니 경로를 자동 재사용하지 않음 |
| `d3-hotel-checkin` | 18:00~18:20 | HOTEL | APA Hotel Ueno Ekikita 체크인 | apa-ueno | 3박 예약자료 연결 |
| `d3-rest` | 18:20~19:00 | FREE_TIME | 휴식 | apa-ueno | — |
| `d3-ark-transfer` | 19:00~19:40 | TRANSIT | 아크 힐즈 이동 | apa-ueno, ark-hills | — |
| `d3-dinner` | 19:40~20:40 | MEAL | 츠지한 아크 힐즈점 | tsujihan-ark | 대기와 이용일 영업시간 확인 |
| `d3-hills-transfer` | 20:40~21:00 | TRANSIT | 롯폰기 힐즈 이동 | ark-hills, roppongi-hills | — |
| `d3-lights` | 21:00~22:00 | ATTRACTION | 롯폰기 힐즈·게야키자카 일루미네이션 | roppongi-hills, keyakizaka | 2026 개최일·점등 종료시간 확인 |
| `d3-hotel-return` | 22:00~22:40 | TRANSIT | 호텔 복귀 | roppongi-hills, apa-ueno | — |
| `d3-night-rest` | 22:40~ | FREE_TIME | 휴식 | apa-ueno | — |

### 4일차 · 2026-12-25 · 코메다 → 도쿄타워 → 시부야 → 니혼바시 → 마루노우치

숙소: APA Hotel Ueno Ekikita

| 일정 키 | 시간 | 종류 | 일정 | 연결 장소 키 | 확인·비고 |
|---|---|---|---|---|---|
| `d4-breakfast` | 08:00~09:00 | MEAL | KOMEDA’S Coffee 아침 | — | 지점 미정. 조식 예외로 별도 식당 지정 |
| `d4-shiba-transfer` | 09:00~09:40 | TRANSIT | 시바공원 이동 | shiba-park | 코메다 지점 확정 후 출발지 설정 |
| `d4-tower` | 09:40~11:15 | ATTRACTION | 시바공원·도쿄타워 주변 | shiba-park, tokyo-tower | 전망대 입장 예약은 별도 요청 전 생성하지 않음 |
| `d4-shibuya-transfer` | 11:15~12:00 | TRANSIT | 시부야 이동 | shiba-park, shibuya | — |
| `d4-lunch` | 12:00~13:00 | MEAL | 스시로 시부야역앞점 | sushiro-shibuya | 입장 대기 확인 |
| `d4-shopping` | 13:00~17:00 | SHOPPING | 시부야 쇼핑: PARCO·SOU・SOU·GU·유니클로 등 | shibuya, shibuya-parco | 각 매장 지점·동선 미확정. SOU・SOU를 PARCO 입점으로 단정하지 않음 |
| `d4-scramble` | 17:00~17:40 | ATTRACTION | 하치코·스크램블 교차로 | hachiko, scramble | — |
| `d4-nihonbashi-transfer` | 17:40~18:15 | TRANSIT | 니혼바시 이동 | shibuya, nihonbashi | — |
| `d4-dinner` | 18:15~19:15 | MEAL | 니혼바시 돈카츠 하지메 | hajime | 정확한 지점·영업시간 확인 |
| `d4-marunouchi-transfer` | 19:15~19:35 | TRANSIT | 마루노우치 이동 | hajime, marunouchi | — |
| `d4-lights` | 19:35~21:00 | ATTRACTION | 도쿄역·마루노우치 크리스마스 | tokyo-station, marunouchi | 2026 행사 확인 |
| `d4-hotel-return` | 21:00~21:30 | TRANSIT | 호텔 복귀 | marunouchi, apa-ueno | — |
| `d4-rest` | 21:30~ | FREE_TIME | 휴식 | apa-ueno | — |

### 5일차 · 2026-12-26 · 우에노 → 아메요코 → 장어덮밥 → 오다이바 → 몬자

숙소: APA Hotel Ueno Ekikita

| 일정 키 | 시간 | 종류 | 일정 | 연결 장소 키 | 확인·비고 |
|---|---|---|---|---|---|
| `d5-breakfast` | 08:00~09:00 | MEAL | 숙소 조식 또는 편의점 | — | 별도 식당 지정 없음 |
| `d5-park-transfer` | 09:00~09:20 | TRANSIT | 우에노공원 이동 | apa-ueno, ueno-park | — |
| `d5-park` | 09:20~11:00 | ATTRACTION | 우에노공원 | ueno-park | — |
| `d5-ameyoko` | 11:00~12:20 | SHOPPING | 아메요코 | ameyoko | — |
| `d5-meal-transfer` | 12:20~12:30 | TRANSIT | 식당 이동 | ameyoko, unatoto-ueno | — |
| `d5-lunch` | 12:30~13:30 | MEAL | 나다이 우나토토 우에노점 | unatoto-ueno | — |
| `d5-shinbashi-transfer` | 13:30~13:45 | TRAIN | 우에노 → 신바시 | ueno-station, shinbashi | 식당에서 역 이동 포함 가능 여부 확인 |
| `d5-yurikamome` | 13:45~14:20 | TRAIN | 신바시 → 오다이바 / 유리카모메 | shinbashi, odaiba | 하차역 미정 |
| `d5-odaiba` | 14:20~17:00 | ATTRACTION | 오다이바 관광 | odaiba | 세부 방문지 미정 |
| `d5-nightview` | 17:00~18:00 | ATTRACTION | 도쿄만 일몰·야경 | odaiba | 시간대는 요청값. 실제 일몰 전후 시각 재확인 |
| `d5-ueno-return` | 18:00~18:50 | TRANSIT | 우에노 이동 | odaiba, ueno-station | 18:50~19:00 식당 이동 여유 |
| `d5-dinner` | 19:00~20:15 | MEAL | 츠키시마 몬자 모헤지 우에노점 | moheji-ueno | — |
| `d5-shopping` | 20:15~21:30 | SHOPPING | 돈키호테 기념품 쇼핑 | — | 우에노권 방문 지점 미정 |
| `d5-hotel-return` | 21:30~21:50 | TRANSIT | 호텔 복귀 | apa-ueno | 쇼핑 지점 확정 후 출발지 설정 |
| `d5-packing` | 21:50~ | OTHER | 귀국 짐 정리 | apa-ueno | 다음날 항공·N'EX·수하물 점검 |

### 6일차 · 2026-12-27 · 고쿄 → 나리타 → 대구

숙소: 숙박 없음 · 귀국

| 일정 키 | 시간 | 종류 | 일정 | 연결 장소 키 | 확인·비고 |
|---|---|---|---|---|---|
| `d6-breakfast` | 06:30~07:15 | MEAL | 간단한 아침 | — | 숙소 또는 편의점 |
| `d6-checkout` | 07:15~07:30 | HOTEL | 체크아웃 | apa-ueno | 소지품 최종 확인 |
| `d6-tokyo-transfer` | 07:30~08:00 | TRAIN | 우에노 → 도쿄역 | apa-ueno, ueno-station, tokyo-station | 호텔에서 역 도보 포함 확인 |
| `d6-locker` | 08:00~08:10 | OTHER | 코인락커에 캐리어 보관 | tokyo-station | 락커 위치·빈자리 미확정 |
| `d6-kokyo-transfer` | 08:10~08:25 | TRANSIT | 고쿄 외원 이동 | tokyo-station, kokyo | — |
| `d6-kokyo` | 08:25~09:10 | ATTRACTION | 고쿄 외원·니주바시 | kokyo, nijubashi | 외원 산책; 내부 관람 예약으로 처리하지 않음 |
| `d6-station-return` | 09:10~09:25 | TRANSIT | 도쿄역 복귀 | kokyo, tokyo-station | — |
| `d6-luggage` | 09:25~09:40 | OTHER | 캐리어 수령 | tokyo-station | 락커 전부 비웠는지 확인 |
| `d6-platform` | 09:40~10:10 | OTHER | 간식·N'EX 승강장 이동 | tokyo-station | 10:10~10:33 탑승 여유 |
| `d6-nex-return` | 10:33~11:27 | TRAIN | 도쿄 → 나리타공항 T1 / N'EX 17호 | tokyo-station, narita-airport | T1은 요청값. 실제 항공사 터미널·열차 운행시각 확인 |
| `d6-checkin-flight` | 11:27~11:45 | OTHER | 체크인 | narita-airport | 카운터 위치·체크인 마감 확인 |
| `d6-lunch` | 11:45~12:30 | MEAL | 간단한 점심 | — | 공항. 수속 지연 시 식사 단축 |
| `d6-security` | 12:30~13:35 | OTHER | 출국심사·면세점 | narita-airport | 항공사 마감·탑승시간 우선 |
| `d6-gate` | 13:35~14:00 | OTHER | 탑승구 이동 | narita-airport | 게이트 변경 확인 |
| `d6-flight-return` | 14:20~16:50 | FLIGHT | 나리타 → 대구 | narita-airport, daegu-airport | 사용자 제공 항공시간; 예약자료 입력 필요 |
| `d6-arrival` | 16:50~ | OTHER | 귀국 | daegu-airport | 수하물 수령 |

## 5. 일정별 준비물·할 일

각 행은 해당 일정 상세에 표시할 준비물/행동 제안이다. 사용자가 입력한 예약 완료 여부를 추측하지 않는다. 공통 준비물은 복제하지 않고 같은 준비물 정의를 연결한다. 같은 물건 이름을 무조건 합치지 말고 개인별 항목은 분리한다.

준비물과 할 일은 별도 데이터다. 공통 준비물의 ‘출국 전 짐 싸기’와 매일 ‘오늘 휴대함’은 별도 상태다. 모든 추가 항목은 초기 미완료이며 기존 연결 항목의 체크 상태는 보존한다. 담당자는 물건별 개인/공동으로 지정하고, 아직 결정되지 않은 공동 업무는 SHARED로 둔다.

| 일정 키 | 준비물·자료 | 해야 할 일 |
|---|---|---|
| `d1-yoshinoya` | — | 식사 날짜 또는 장소 확정 전 실행 일정으로 안내하지 않기 |
| `d1-arrive-airport` | 공통 준비물 | 해당 일정 내용 확인 |
| `d1-checkin-flight` | 여권·항공권 | 출국 수속·위탁 수하물 처리 |
| `d1-flight-out` | 여권·탑승권·휴대 수하물 | 항공편·터미널·탑승 마감·수하물 확인 |
| `d1-immigration` | 여권·입국 관련 자료 | 수하물 수령·통신 작동·JR 이동 확인 |
| `d1-nex-out` | N’EX 출국일 티켓·캐리어 | 나리타 출발역·차량·좌석 확인 |
| `d1-transfer-tokyo` | 공통 준비물 | 해당 일정 내용 확인 |
| `d1-hayabusa-out` | Hayabusa 33 티켓·캐리어 | 차량·좌석·발권 방식 확인 |
| `d1-hotel-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d1-hotel-checkin` | 여권·숙소 예약자료·캐리어 | 체크인/아웃 및 짐 보관 확인 |
| `d1-meal-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d1-dinner` | 결제수단 | 지정 지점·대기시간 확인 |
| `d1-lights-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d1-pageant` | 휴대전화·방한용품 | 관람 범위·운영시간·다음 이동 확인 |
| `d1-walk` | 방한용품·편한 신발 | 복귀 시각·길 상태 확인 |
| `d1-hotel-return` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d1-rest` | — | — |
| `d2-breakfast` | 결제수단 | 다음 일정 전 간단히 식사 |
| `d2-checkout` | 여권·숙소 예약자료·캐리어 | 체크인/아웃 및 짐 보관 확인 |
| `d2-station-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d2-train-aquarium` | 교통카드 또는 해당 열차 티켓 | 출발시각·승강장·방향 확인 |
| `d2-walk-aquarium` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d2-entry` | 공통 준비물 | 해당 일정 내용 확인 |
| `d2-aquarium` | 수족관 티켓·휴대전화 | 입장권 종류·공연시간·13:00 퇴장 확인 |
| `d2-walk-station` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d2-train-sendai` | 교통카드 또는 해당 열차 티켓 | 출발시각·승강장·방향 확인 |
| `d2-lunch` | 결제수단 | 입장 시 14:35 식사 종료 가능 여부 확인 |
| `d2-hotel-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d2-luggage` | 짐 보관증 | 캐리어 수령 후 셔틀 승차장 이동 |
| `d2-shuttle-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d2-shuttle-wait` | 셔틀 확인자료 | 두 명 탑승 장소 도착·예약자 확인 |
| `d2-shuttle` | 셔틀 확인자료·캐리어 | 예약 인원·탑승 위치·출발시각 확인 |
| `d2-hotel-checkin` | 여권·숙소 예약자료·캐리어 | 체크인/아웃 및 짐 보관 확인 |
| `d2-walk` | 방한용품·편한 신발 | 복귀 시각·길 상태 확인 |
| `d2-onsen` | 공통 준비물 | 해당 일정 내용 확인 |
| `d2-dinner` | 결제수단 | 지정 지점·대기시간 확인 |
| `d2-rest` | — | — |
| `d2-night-onsen` | 공통 준비물 | 해당 일정 내용 확인 |
| `d3-breakfast` | 결제수단 | 지정 지점·대기시간 확인 |
| `d3-packing` | 공통 준비물 | 해당 일정 내용 확인 |
| `d3-checkout` | 여권·숙소 예약자료·캐리어 | 체크인/아웃 및 짐 보관 확인 |
| `d3-sato-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d3-bus-falls` | 교통카드 또는 현금·시각표 | 정류장·방향·복귀편 확인 |
| `d3-falls` | 미끄럽지 않은 신발·장갑·시각표 | 10:23 버스 전 정류장 복귀; 결빙 시 관람 범위 축소 |
| `d3-bus-return` | 교통카드 또는 현금·시각표 | 정류장·방향·복귀편 확인 |
| `d3-rairaikyo` | 방한용품·편한 신발 | 복귀 시각·길 상태 확인 |
| `d3-meal-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d3-lunch` | 결제수단 | 아키우 본점 여부·영업 여부·셔틀 전 복귀 확인 |
| `d3-village` | 방한용품·편한 신발 | 복귀 시각·길 상태 확인 |
| `d3-sakan-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d3-luggage` | 짐 보관증 | 캐리어 수령·객실 보관품 누락 확인 |
| `d3-shuttle-wait` | 공통 준비물 | 해당 일정 내용 확인 |
| `d3-shuttle` | 셔틀 확인자료·캐리어 | 예약 인원·탑승 위치·출발시각 확인 |
| `d3-train-transfer` | 공통 준비물 | 해당 일정 내용 확인 |
| `d3-hayabusa-return` | Hayabusa 26 티켓·캐리어 | 차량·좌석·실제 출발시각 확인 |
| `d3-ueno-transfer` | 교통카드 또는 해당 열차 티켓 | 출발시각·승강장·방향 확인 |
| `d3-hotel-checkin` | 여권·APA 우에노역북 3박 예약자료 | 호텔 지점명·숙박일·인원 확인 |
| `d3-rest` | — | — |
| `d3-ark-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d3-dinner` | 결제수단 | 지정 지점·대기시간 확인 |
| `d3-hills-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d3-lights` | 휴대전화·방한용품 | 관람 범위·운영시간·다음 이동 확인 |
| `d3-hotel-return` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d3-night-rest` | — | — |
| `d4-breakfast` | 결제수단 | 코메다 지점 확정·08:00 방문 가능 여부 확인 |
| `d4-shiba-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d4-tower` | 휴대전화·방한용품 | 관람 범위·운영시간·다음 이동 확인 |
| `d4-shibuya-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d4-lunch` | 결제수단 | 지정 지점·대기시간 확인 |
| `d4-shopping` | 결제수단·장바구니·필요시 여권 | 구매 목록·다음 일정 확인 |
| `d4-scramble` | 휴대전화·방한용품 | 관람 범위·운영시간·다음 이동 확인 |
| `d4-nihonbashi-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d4-dinner` | 결제수단 | 지정 지점·대기시간 확인 |
| `d4-marunouchi-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d4-lights` | 휴대전화·방한용품 | 관람 범위·운영시간·다음 이동 확인 |
| `d4-hotel-return` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d4-rest` | — | — |
| `d5-breakfast` | 결제수단 | 다음 일정 전 간단히 식사 |
| `d5-park-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d5-park` | 휴대전화·방한용품 | 관람 범위·운영시간·다음 이동 확인 |
| `d5-ameyoko` | 결제수단·장바구니·필요시 여권 | 구매 목록·다음 일정 확인 |
| `d5-meal-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d5-lunch` | 결제수단 | 지정 지점·대기시간 확인 |
| `d5-shinbashi-transfer` | 교통카드 또는 해당 열차 티켓 | 출발시각·승강장·방향 확인 |
| `d5-yurikamome` | 교통카드 또는 해당 열차 티켓 | 출발시각·승강장·방향 확인 |
| `d5-odaiba` | 휴대전화·방한용품 | 관람 범위·운영시간·다음 이동 확인 |
| `d5-nightview` | 휴대전화·방한용품 | 관람 범위·운영시간·다음 이동 확인 |
| `d5-ueno-return` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d5-dinner` | 결제수단 | 지정 지점·대기시간 확인 |
| `d5-shopping` | 결제수단·장바구니·필요시 여권 | 구매 목록·다음 일정 확인 |
| `d5-hotel-return` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d5-packing` | 캐리어·충전기·귀국 항공 및 N’EX 자료 | 객실 물품 정리·수하물 규정·다음날 터미널 확인 |
| `d6-breakfast` | 결제수단 | 다음 일정 전 간단히 식사 |
| `d6-checkout` | 여권·숙소 예약자료·캐리어 | 체크인/아웃 및 짐 보관 확인 |
| `d6-tokyo-transfer` | 교통카드 또는 해당 열차 티켓 | 출발시각·승강장·방향 확인 |
| `d6-locker` | 캐리어·락커 결제수단 | 락커 번호·위치·수령 방법 저장 |
| `d6-kokyo-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d6-kokyo` | 휴대전화·방한용품 | 관람 범위·운영시간·다음 이동 확인 |
| `d6-station-return` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d6-luggage` | 락커 영수증·열쇠 또는 인증자료 | 락커 짐 전부 수령 |
| `d6-platform` | 공통 준비물 | 해당 일정 내용 확인 |
| `d6-nex-return` | N’EX 17 티켓·캐리어 | 실제 도착 터미널·차량·좌석 확인 |
| `d6-checkin-flight` | 공통 준비물 | 해당 일정 내용 확인 |
| `d6-lunch` | 결제수단 | 다음 일정 전 간단히 식사 |
| `d6-security` | 여권·탑승권 | 보안검색·출국심사 완료 후 게이트 확인 |
| `d6-gate` | 여권·탑승권·기내 수하물 | 탑승 마감 전 게이트 도착 |
| `d6-flight-return` | 여권·탑승권·휴대 수하물 | 항공편·터미널·탑승 마감·수하물 확인 |
| `d6-arrival` | 공통 준비물 | 해당 일정 내용 확인 |

## 6. 여행 전 체크리스트와 공통 준비물

PRE_TRIP은 여행 전체에서 1회 완료하는 할 일이다. 아래 권장 확인일은 준비를 위한 제안이며 예약 오픈일을 의미하지 않는다. 담당자는 SHARED가 기본이며 실제 분담은 두 사용자가 설정한다.

| item_key | 권장 확인일 | 할 일 |
|---|---|---|
| pre-passport | 11/22까지 | 여권·필요한 입국 서류 확인 |
| pre-flights | 11/22까지 | 왕복 항공권·편명·실제 터미널·수하물 조건 확인 |
| pre-hotels | 11/22까지 | 세 숙소 예약일·인원·조식/석식 포함 여부 확인 |
| pre-shuttles | 11/22까지 | 사칸 왕복 셔틀 예약 절차·운행·승차장 확인 |
| pre-trains | 11/22부터 확인 | N’EX·신칸센 이용일 운행과 판매/예약 가능 시점 확인 |
| pre-food | 12/15까지 | 코메다 지점, 요시노야 일정 충돌, 각 식당 지점·영업 확인 |
| pre-aquarium | 12/15까지 | 수족관 12/23 영업·티켓·공연·역에서 접근 확인 |
| pre-akiu | 12/15까지 | 폭포 왕복 버스·관람 동선·카이치 점심 이동 확인 |
| pre-events | 12/15까지 | 센다이·롯폰기·마루노우치 행사 개최/운영 확인 |
| pre-network | 12/15까지 | 통신 수단 준비 및 설치 안내 저장 |
| pre-payment | 12/15까지 | 해외결제 수단·교통카드·현금 준비 |
| pre-insurance | 12/15까지 | 보험 필요사항 결정·가입 시 증권/연락처 저장 |
| pre-documents | 12/20까지 | 예약 텍스트·필요한 파일을 일정에 연결 |
| pre-test | 12/20까지 | 두 계정 로그인·지도 링크·예약 파일 열림 확인 |
| pre-download | 12/21까지 | 필요한 티켓·예약자료를 휴대전화에 별도 다운로드 |
| pre-weather | 12/21 및 매일 | 기상·교통 운행·관람 가능 여부 확인 |
| pre-luggage | 12/21까지 | 항공사 안내에 따라 짐·배터리·액체류 분류 |
| pre-conflicts | 12/21까지 | 미확정 항목과 이동 연결 최종 확인 |

공통 준비물 정의:

| item_key | 준비물 | 담당/상태 기준 | 적용 |
|---|---|---|---|
| pack-passport | 여권 | 개인별 | 출입국·숙박·필요시 구매 |
| pack-phone | 휴대전화 | 개인별, 일별 | 여행 전일 |
| pack-wallet | 결제카드·현금 | 개인별, 일별 | 여행 전일 |
| pack-ic | 교통 IC카드 또는 사용 수단 | 개인별, 일별 | 대중교통 |
| pack-battery | 보조배터리 | 개인 또는 공동 지정, 일별 | 여행 전일 |
| pack-cable | 충전기·케이블·필요한 어댑터 | 개인 또는 공동 지정 | 짐 싸기·숙소 이동 |
| pack-coat | 외투·장갑·목도리 | 개인별, 일별 | 야외 일정 |
| pack-shoes | 편한 신발·필요시 미끄럼 대응 | 개인별 | 산책·폭포 |
| pack-umbrella | 우산 | 개인 또는 공동, 날씨 조건 | 필요한 날짜 |
| pack-medicine | 개인 복용약·개인용품 | 개인별 | 필요한 날짜 |
| pack-bag | 작은 가방·장바구니 | 개인 또는 공동 | 외출·쇼핑 |
| pack-luggage | 캐리어·보관증 | 개인별 | 숙소 이동·락커 |

‘오늘’은 공통 일별 준비물 + 해당 날짜 모든 일정의 준비물/할 일을 합산한다. PRE_TRIP은 별도 영역에 표시하고 모든 날짜에 반복 복제하지 않는다. 요시노야 미확정 항목은 출발 전 확인 과제로 안내하며 당일 실행 체크리스트와 구분한다.

## 7. 예약·첨부 연결표

모든 아래 항목은 자료 입력 슬롯이다. reservation_number, booker_name, seat, QR 등은 실제 입력 전 null이며 BOOKED/CONFIRMED로 자동 설정하지 않는다. 본 문서에 개인정보·확인 URL·예약 비밀번호를 넣지 않는다.

| reservation_key | 대상 | 연결 schedule_key | 자료 |
|---|---|---|---|
| res-flight-out | 출국 항공 | d1-checkin-flight, d1-flight-out | 항공사·편명·터미널·예약번호·티켓 |
| res-flight-return | 귀국 항공 | d6-checkin-flight, d6-security, d6-gate, d6-flight-return | 동일, 수하물 조건 |
| res-hotel-sendai | APA 센다이 | d1-hotel-checkin, d2-checkout, d2-luggage | 예약 확인·짐 보관 안내 |
| res-hotel-sakan | 사칸 | d2-hotel-checkin, d2-dinner, d3-breakfast, d3-checkout, d3-luggage | 숙박·식사·짐 보관 안내 |
| res-hotel-ueno | APA 우에노역북 3박 | d3-hotel-checkin, d6-checkout | 12/24 입실~12/27 퇴실 단일 예약 가능 |
| res-nex-out | N’EX 30호 계획 | d1-nex-out | 실제 열차·차량·좌석·티켓 |
| res-hayabusa-out | Hayabusa 33 계획 | d1-hayabusa-out | 실제 열차·차량·좌석·발권 |
| res-shuttle-out | 사칸행 셔틀 | d2-shuttle-wait, d2-shuttle | 예약자·인원·승차장·시간 |
| res-shuttle-return | 센다이행 셔틀 | d3-shuttle-wait, d3-shuttle | 예약자·인원·승차장·시간 |
| res-hayabusa-return | Hayabusa 26 계획 | d3-hayabusa-return | 실제 열차·차량·좌석·발권 |
| res-nex-return | N’EX 17호 계획 | d6-nex-return | 실제 열차·터미널·차량·좌석 |
| res-aquarium | 수족관 | d2-entry, d2-aquarium | 구매 시 티켓·입장 안내 |

버스·일반 전철은 예약 불필요한 구간일 수 있으므로 가짜 예약을 만들지 않는다. 버스 시각표·환승 메모 같은 비예약 이동자료도 일정에서 저장 가능해야 한다. 기존 예약 첨부 구조를 재사용하면 OTHER 자료묶음임을 구분하고 예약 완료로 오인시키지 않는다.

왕복권 하나로 두 이동을 커버하면 하나의 자료를 여러 일정에 연결한다. 파일을 복제하거나 같은 예약을 중복 생성하지 않는다. 보험·긴급연락처는 여행 공통 자료로 관리한다. 사이트 저장 자료의 온라인 조회와 사전 다운로드를 지원하며 사업자의 원본 앱·동적 QR이 필요한 경우 안내를 유지한다.

## 8. 개발 반영 계약

1. plan_version은 2026-10-06-r3. 본 문서의 키가 안정 식별자이며 배열 위치·제목·시각으로 다시 만들지 않는다.
2. 표를 명시적으로 구조화한 데이터로 변환한다. 기존 정규식 기반 Seed 생성기에 그대로 입력해 성공했다고 가정하지 않는다.
3. schedule_key, place_key, item_key, reservation_key를 DB ID와 매핑한다. 기존 UUID가 있으면 가능한 한 보존한다.
4. 시간의 ‘전후’, ‘약’, 끝시간 없는 표현은 time_label에 그대로 남긴다. 숫자 시각은 정렬용일 뿐 검증 완료를 뜻하지 않는다. 현재시간 판정은 Asia/Tokyo를 사용한다.
5. SHUTTLE/BUS는 기존 스키마가 지원하지 않으면 일정 type=TRANSIT와 transport_type=SHUTTLE/BUS로 매핑한다. 표의 모든 type을 검증 없이 DB enum에 넣지 않는다.
6. API 키 없이 열리는 지도 검색 링크를 기본 저장한다. 지점 검증 전 좌표/Place ID를 임의 생성하지 않는다. 미정 지점에 임의 마커를 만들지 않는다.
7. 호텔·열차·셔틀의 plan_time_locked는 자동 길찾기/정렬에 의해 시간을 바꾸지 않는다는 뜻이다. booking_status와 분리한다.
8. 기존 Seed의 ON CONFLICT DO NOTHING만 재실행해서 변경 완료라고 보고하지 않는다. 계획 필드만 upsert하고 사용자 예약·첨부·준비 상태는 보존한다.
9. 제거 일정은 활성 화면·지도·오늘 집계에서 제외한다. 연결된 사용자 자료는 미분류 자료함이나 보관 관계로 이관하고 cascade 삭제하지 않는다.
10. 유지되는 일정에 연결된 준비 항목·파일·예약은 기존 관계를 보존한다. 숙소 교체 자료를 신규 호텔의 예약인 것처럼 자동 표시하지 않는다.
11. 같은 계획 재적용 시 중복 일정·준비 항목이 생성되지 않아야 한다.
12. 오늘·일정·지도·준비·예약 허브는 동일한 활성 계획 버전을 조회한다.
13. 기능·디자인은 SENKYO_RENEWAL_PLAN.md의 겨울 테마와 UX 기준을 적용한다.

## 9. 반영 후 검증

- 2일차 활성 일정에 아라하마/아라이역 구간이 없고 수족관은 10:00~13:00이다.
- 2일차 점심은 오오야마 센다이점, 셔틀 출발은 계획값 15:30이다.
- 3~5일차 숙소는 APA 우에노역북, 6일차 체크아웃까지 같은 숙소다.
- 3일차 카이치 본점·츠지한, 4일차 코메다·스시로·하지메, 5일차 우나토토·모헤지가 각각 올바른 식사에 연결된다.
- 다른 날 아침에 임의 식당을 추가하지 않는다. 1일차 요시노야와 코메다 지점 미정 상태가 보존된다.
- 모든 일정별 준비 항목이 상세와 해당 날짜 전체보기에서 일치한다.
- 지도 API 실패 시에도 고정 검색 링크가 동작하고 미정 장소에는 잘못된 핀이 없다.
- 삭제한 일정의 준비물과 옛 숙소는 오늘의 집계에 남지 않는다. 기존 개인 자료는 보존된다.
- 이전 비용 합계·정산·후보 등록 지침이 UI와 문서에서 부활하지 않는다.
- 일정 재적용 후 데이터 보존과 중복 방지를 검증한다.

## 10. 확인 근거 및 남은 확인

2026-10-06 일부 공식 페이지의 존재와 지점 안내를 확인했다. 이는 여행일 영업, 모든 지점의 Google 지도 연결, 12월 열차 운행을 전부 검증했다는 뜻이 아니다.

- APA Hotel Ueno Ekikita 공식: https://www.apahotel.com/hotel/shutoken/tokyo/ueno-ekikita/
- 수족관 영업·요금 확인: https://www.uminomori.jp/umino/info/
- 츠지한 공식 지점 목록: https://www.tsujihan-jp.com/blank
- 아크 힐즈 입점 안내: https://www.arkhills.com/gourmet_shops/0077.html
- 아키우 관광시설 안내: https://akiuonsenkumiai.com/areainfo/

일정상의 여유 평가는 이동방법·대기·운행 확인 이후 판단한다. ‘2일차가 안정적’이라고 확정하지 않는다. 항공·셔틀 같은 다음 고정 이동이 임박하면 관광·쇼핑·식사 시간을 줄이는 판단이 필요하지만, 본 계획의 시간을 사용자 동의 없이 자동 교체하지 않는다.

여행 종료 할 일: 필요 예약자료 정리, 사진 백업, 분실물 확인, 여행 메모 작성. 지출 입력·공동 정산 항목은 포함하지 않는다.
