# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Slack과 Google Sheets를 활용한 자동화된 코딩 테스트 챌린지 관리 시스템입니다. **Google Apps Script** 기반으로 작동하며, Slack 슬래시 커맨드를 통해 챌린지 참여, PR 제출, 통계 조회 등의 기능을 제공합니다. 매일 자정 자동 집계 및 Slack 알림 기능이 포함되어 있습니다.

## 아키텍처

### 핵심 컴포넌트

**메인 진입점 (`code/main.gs`)**
- `doPost(e)` - Slack 슬래시 커맨드를 처리하는 HTTP POST 핸들러
- switch 문을 통해 명령어별 핸들러로 라우팅
- 지원 명령어 7개:
  - `/코테챌린지참여` → `handleRegister()`
  - `/코테챌린지참여확인` → `handleCheckChallenger()`
  - `/코테챌린지현황` → `handleChallengeStatus()`
  - `/코테제출` → `handleSubmit()`
  - `/코테제출수정` → `handleUpdateSubmit()`
  - `/코테제출확인` → `handleCheckSubmit()`
  - 알 수 없는 명령어 → 에러 메시지 반환

**시트 관리 (`code/sheet.gs`)**
- `SheetNames` 객체에 시트 이름 상수 중앙 관리
- 4가지 시트 타입:
  - `DAILY` (daily-challenge) - 일일 제출 기록
  - `CHALLENGERS` (challengers) - 챌린저 명단
  - `AGGREGATION` (aggregation) - 일일 전체 집계
  - `CHALLENGER_STATS` (challenger-stats) - 챌린저별 통계
- 헬퍼 함수: `getSheet()`, `hasSheet()`, `ensureSheet()`
- 일관성을 위해 모든 시트 작업은 이 헬퍼들을 사용해야 함

**메시지 템플릿 (`code/messages.gs`)**
- `Messages` 객체에 모든 메시지 템플릿 중앙 관리
- 3가지 카테고리로 구분:
  - `success` - 성공 메시지 (제출 완료, 참여 완료 등)
  - `error` - 에러 메시지 (중복 제출, 링크 오류 등)
  - `webhook` - Slack Webhook 메시지 (일일 요약, 경고 알림)
- 모든 메시지는 한국어, 이모지 포함
- 메시지 수정 시 이 파일만 변경하면 전체 시스템에 반영

**유틸리티 (`code/utils.gs`)**
- `respond(text)` - Slack용 JSON 응답 생성 (ephemeral 메시지)
- `formatDate(date, format)` - "Asia/Seoul" 타임존으로 날짜 포맷팅

**Slack 연동 (`code/slack.gs`)**
- `getWebhookUrl()` - 일반 채널 Webhook URL 가져오기 (`SLACK_WEBHOOK_URL`)
- `getManageWebhookUrl()` - 관리자 채널 Webhook URL 가져오기 (`SLACK_MANAGE_WEBHOOK_URL`)
- `sendSlackNotification(message)` - 일반 채널로 메시지 전송 (일일 요약)
- `sendManageNotification(message)` - 관리자 채널로 메시지 전송 (퇴출 알림)

**핸들러 (`code/handler/`)**
- 각 명령어는 고유한 핸들러 파일을 가짐
- 모든 핸들러는 Slack의 `parameters` 객체를 받음 (구조는 `docs/slack/슬랙_파라미터.json` 참조)
- 현재 핸들러:
  - `registerHandler.gs` - 챌린지 참여 신청, 중복 확인
  - `checkChallengerHandler.gs` - 참여 여부 및 진행 일차 확인
  - `challengeStatusHandler.gs` - 개인 통계 조회 (성공 수, 경고 수)
  - `submitHandler.gs` - PR 제출 (하루 1회 제한, 중복 링크 방지)
  - `updateSubmitHandler.gs` - 당일 제출 수정
  - `checkSubmitHandler.gs` - 오늘 제출 이력 확인

**스케줄러 (`code/scheduler/`)**
- `dailyAggregationScheduler.gs` - 매일 자정 자동 실행
- 주요 함수:
  - `runDailyAggregation()` - 메인 집계 함수 (트리거 설정 대상)
  - `updateChallengerStats()` - 챌린저별 통계 업데이트 및 경고 누적
  - `removeFromChallengers()` - 챌린저 제거 (수동 퇴출용)
  - `testDailyAggregation(dateString)` - 테스트용 함수
- 경고 임계값: `MAX_WARNINGS = 2` (2회 초과 시 관리자 알림)

### 데이터 흐름

**명령어 처리 흐름:**
1. Slack이 배포된 웹 앱에 슬래시 커맨드와 함께 POST 요청 전송
2. `doPost()`가 명령어 추출 후 switch 문으로 핸들러 라우팅
3. 핸들러가 요청 처리:
   - 유효성 검증 (PR 링크 형식, 중복 확인 등)
   - Google Sheets 데이터 조회/수정
   - 비즈니스 로직 실행
4. 핸들러가 `respond()` 유틸리티를 통해 응답 생성
5. 응답이 Slack에 ephemeral 메시지로 표시

**일일 집계 흐름:**
1. 매일 자정 트리거가 `runDailyAggregation()` 실행
2. 전날 날짜 기준으로 챌린저 목록과 제출 기록 비교
3. 챌린저별 제출 여부 확인:
   - 제출 성공 → 성공 카운트 +1
   - 미제출 → 미제출 카운트 +1, 경고 +1
4. 경고 2회 초과 시 → 관리자 채널로 알림 전송
5. 전체 집계 결과 → `aggregation` 시트에 저장
6. 챌린저별 통계 → `challenger-stats` 시트에 업데이트
7. 일반 채널로 결과 요약 전송

## 설정

**스크립트 속성** (Apps Script 프로젝트 설정 > 스크립트 속성)
- `SLACK_WEBHOOK_URL` - 일반 채널 Webhook URL (결과 요약 전송용)
- `SLACK_MANAGE_WEBHOOK_URL` - 관리자 채널 Webhook URL (퇴출 알림용)

**Google Sheets 구조**
- `challengers` - 챌린저 명단: [사용자명, 등록일시]
- `daily-challenge` - 일일 제출: [날짜, 사용자명, PR 링크, 시간]
- `challenger-stats` - 챌린저 통계: [챌린저명, 총 제출 성공, 총 미제출, 누적 경고, 상태, 마지막 업데이트]
- `aggregation` - 일일 집계: [날짜, 챌린저 수, 제출 성공, 미제출, 성공률(%)]

**트리거 설정**
- 함수: `runDailyAggregation`
- 이벤트: 시간 기반 > 일 타이머 > 자정~오전 1시

## 개발 가이드라인

### 새 명령어 추가하기

1. **핸들러 함수 생성** - `code/handler/` 디렉토리에 새 파일 생성
   ```javascript
   function handleNewCommand(parameters) {
     const user = parameters.user_name;
     // 로직 구현
     return respond(Messages.success.newCommand());
   }
   ```

2. **라우팅 추가** - `code/main.gs`의 switch 문에 case 추가
   ```javascript
   case "/새명령어":
     return handleNewCommand(parameters);
   ```

3. **메시지 추가** - `code/messages.gs`에 메시지 템플릿 추가
   ```javascript
   Messages.success.newCommand = () => `✅ 성공 메시지`;
   Messages.error.newCommandError = () => `❌ 에러 메시지`;
   ```

4. **시트 작업** - 모든 시트 작업에 헬퍼 함수 사용
   ```javascript
   const sheet = getSheet("DAILY");  // 또는 ensureSheet()
   const data = sheet.getDataRange().getValues();
   ```

5. **날짜 포맷팅** - 일관된 날짜 포맷을 위해 `formatDate()` 사용
   ```javascript
   const today = formatDate(new Date(), "yyyy-MM-dd");
   const time = formatDate(new Date(), "HH:mm:ss");
   ```

6. **응답 생성** - 항상 `respond()` 유틸리티 사용
   ```javascript
   return respond(Messages.success.newCommand());
   ```

### 코딩 규칙

**용어 통일**
- "챌린저" 사용 (❌ "참여자", "사용자")
- 변수명: `challengerName`, `challengersSheet`, `challengerStats`
- 시트명: `challengers`, `challenger-stats`

**메시지 관리**
- 모든 사용자 대면 메시지는 `messages.gs`에서 관리
- 하드코딩된 메시지 문자열 사용 금지
- 메시지 카테고리: `success`, `error`, `webhook`

**시트 작업**
- 직접 시트명 사용 금지 → `SheetNames` 상수 사용
- `getSheet()`, `hasSheet()`, `ensureSheet()` 헬퍼 함수 사용
- 헤더 행은 항상 인덱스 0, 데이터는 인덱스 1부터 시작

**날짜/시간**
- 항상 "Asia/Seoul" 타임존 사용
- `formatDate()` 함수로 일관된 포맷 유지
- 날짜: "yyyy-MM-dd", 시간: "HH:mm:ss"

### 테스트

**Slack 명령어 테스트**
1. 웹 앱으로 배포 (배포 > 새 배포)
2. Slack에서 각 명령어 실행
3. Google Sheets에서 데이터 확인
4. 응답 메시지 확인

**스케줄러 테스트**
1. Apps Script 편집기에서 `testDailyAggregation()` 실행
2. 실행 로그 확인 (보기 > 로그)
3. `aggregation` 및 `challenger-stats` 시트 확인
4. Slack 채널에 메시지 전송 확인

**디버깅**
- `Logger.log()` 사용하여 로그 출력
- 실행 로그는 "보기 > 로그" 또는 "보기 > Stackdriver 로깅"에서 확인
- 에러 발생 시 스택 트레이스 확인

## 주요 정책

**제출 정책**
- 하루 1회 제출 제한 (당일 중복 제출 불가)
- GitHub PR 링크만 허용: `https://github.com/{owner}/{repo}/pull/{number}`
- 중복 링크 금지 (과거 제출한 PR 링크 재사용 불가)
- 당일 제출은 `/코테제출수정`으로 수정 가능

**경고 정책**
- 미제출 시 경고 1회 자동 누적
- 경고 임계값: 2회 (코드에서 `MAX_WARNINGS` 상수로 관리)
- 경고 초과 시 자동 퇴출 없음 → 관리자 채널로 알림만 전송
- 수동 퇴출: 관리자가 `challengers` 시트에서 직접 제거

**집계 정책**
- 매일 자정 자동 실행 (전날 데이터 집계)
- 챌린저 등록일이 집계 날짜 이후인 경우 집계 제외
- 집계 결과는 `aggregation` 시트에 저장
- 챌린저별 통계는 `challenger-stats` 시트에 누적

## 문서 구조

- `README.md` - 프로젝트 전체 개요 및 빠른 시작
- `CLAUDE.md` (이 파일) - 개발자를 위한 아키텍처 가이드
- `docs/command/README.md` - 모든 Slack 명령어 상세 가이드
- `docs/guide/README.md` - Google Apps Script 설정 및 배포 가이드
- `docs/scheduler/README.md` - 스케줄러 설정 및 트리거 가이드
- `docs/slack/슬랙_파라미터.json` - Slack 파라미터 구조 예시

## 알려진 제약사항

- Google Apps Script 실행 시간 제한: 최대 6분
- Google Sheets API 할당량: 일일 제한 있음
- Slack Webhook 응답 시간: 3초 이내 권장
- 시트 이름 변경 시 코드 수정 필요 (`SheetNames` 상수 업데이트)

## 개선 아이디어

- 주말/휴일 자동 제외 기능
- 제출 전 리마인더 알림 (오후 9시 등)
- 월간/주간 통계 리포트
- 랭킹 시스템 (연속 성공 일수, 총 성공 횟수)
- 통계 대시보드 (Google Data Studio 연동)
