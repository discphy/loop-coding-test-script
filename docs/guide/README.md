# Google Apps Script 설정 가이드

코테 챌린지 시스템을 Google Apps Script에 배포하는 전체 가이드입니다.

---

## 📋 목차

1. [사전 준비](#1-사전-준비)
2. [Google Sheets 생성](#2-google-sheets-생성)
3. [Apps Script 프로젝트 생성](#3-apps-script-프로젝트-생성)
4. [코드 복사](#4-코드-복사)
5. [스크립트 속성 설정](#5-스크립트-속성-설정)
6. [웹 앱 배포](#6-웹-앱-배포)
7. [Slack 슬래시 커맨드 설정](#7-slack-슬래시-커맨드-설정)
8. [스케줄러 트리거 설정](#8-스케줄러-트리거-설정)
9. [테스트](#9-테스트)

---

## 1. 사전 준비

### 필요한 것들

- **Google 계정** - Google Sheets 및 Apps Script 사용
- **Slack 워크스페이스 관리자 권한** - 슬래시 커맨드 생성
- **Slack Webhook URL** - 일반 채널 알림용
- **Slack Manage Webhook URL** - 관리자 채널 알림용

### Slack Webhook URL 생성

1. [Slack API 페이지](https://api.slack.com/apps) 접속
2. "Create New App" 클릭
3. "From scratch" 선택
4. App 이름 입력 (예: "코테 챌린지 봇")
5. 워크스페이스 선택
6. "Incoming Webhooks" 메뉴 선택
7. "Activate Incoming Webhooks" 활성화
8. "Add New Webhook to Workspace" 클릭
9. 알림을 받을 채널 선택
   - 일반 채널: 전체 챌린저가 볼 채널
   - 관리자 채널: 관리자만 볼 채널
10. 생성된 Webhook URL 복사 (나중에 사용)

---

## 2. Google Sheets 생성

### 2.1 새 스프레드시트 생성

1. [Google Sheets](https://sheets.google.com) 접속
2. "빈 스프레드시트" 클릭
3. 스프레드시트 이름 변경 (예: "코테 챌린지 관리")

### 2.2 시트 생성 및 헤더 설정

다음 시트들을 생성하고 첫 번째 행에 헤더를 입력하세요:

#### `challengers` 시트
| 사용자명 | 등록일시 |
|---------|---------|
|         |         |

#### `daily-challenge` 시트
| 날짜 | 사용자명 | PR 링크 | 시간 |
|------|---------|---------|------|
|      |         |         |      |

#### `challenger-stats` 시트
| 챌린저명 | 총 제출 성공 | 총 미제출 | 누적 경고 | 상태 | 마지막 업데이트 |
|---------|------------|----------|----------|------|----------------|
|         |            |          |          |      |                |

#### `aggregation` 시트
| 날짜 | 챌린저 수 | 제출 성공 | 미제출 | 성공률(%) |
|------|----------|----------|--------|----------|
|      |          |          |        |          |

> **참고:** 시트 이름은 반드시 위와 동일하게 입력해야 합니다.

---

## 3. Apps Script 프로젝트 생성

1. Google Sheets에서 **확장 프로그램 > Apps Script** 클릭
2. 새 프로젝트가 생성되고 편집기가 열림
3. 프로젝트 이름 변경 (왼쪽 상단, 예: "코테 챌린지 시스템")

---

## 4. 코드 복사

### 4.1 파일 구조 생성

Apps Script 편집기에서 다음 파일들을 생성하고 코드를 복사합니다:

#### 메인 파일
1. 기본 `코드.gs` 파일 이름을 `main` 으로 변경
2. `code/main.gs` 내용 복사

#### 유틸리티 파일들
왼쪽 `+` 버튼 클릭하여 파일 추가:

- `utils` - `code/utils.gs` 내용 복사
- `messages` - `code/messages.gs` 내용 복사
- `sheet` - `code/sheet.gs` 내용 복사
- `slack` - `code/slack.gs` 내용 복사

#### 핸들러 파일들
- `registerHandler` - `code/handler/registerHandler.gs` 내용 복사
- `checkChallengerHandler` - `code/handler/checkChallengerHandler.gs` 내용 복사
- `challengeStatusHandler` - `code/handler/challengeStatusHandler.gs` 내용 복사
- `submitHandler` - `code/handler/submitHandler.gs` 내용 복사
- `updateSubmitHandler` - `code/handler/updateSubmitHandler.gs` 내용 복사
- `checkSubmitHandler` - `code/handler/checkSubmitHandler.gs` 내용 복사

#### 스케줄러 파일
- `dailyAggregationScheduler` - `code/scheduler/dailyAggregationScheduler.gs` 내용 복사

### 4.2 저장

모든 파일 추가 후 **Ctrl+S** (또는 Cmd+S) 로 저장

---

## 5. 스크립트 속성 설정

### 5.1 속성 추가

1. Apps Script 편집기에서 **프로젝트 설정** (⚙️) 클릭
2. **스크립트 속성** 탭 선택
3. **스크립트 속성 추가** 클릭
4. 다음 속성들을 추가:

| 속성 | 값 | 설명 |
|------|-----|------|
| `SLACK_WEBHOOK_URL` | `https://hooks.slack.com/services/...` | 일반 채널 Webhook URL |
| `SLACK_MANAGE_WEBHOOK_URL` | `https://hooks.slack.com/services/...` | 관리자 채널 Webhook URL |

5. **스크립트 속성 저장** 클릭

---

## 6. 웹 앱 배포

### 6.1 배포 설정

1. Apps Script 편집기 우측 상단 **배포 > 새 배포** 클릭
2. 배포 유형 선택: **웹 앱** 선택
3. 설정 입력:
   - **설명**: "코테 챌린지 시스템 v1.0"
   - **실행 권한**: "나"
   - **액세스 권한**: "모든 사용자" 선택
4. **배포** 클릭
5. 권한 승인:
   - "권한 검토" 클릭
   - Google 계정 선택
   - "고급" 클릭
   - "{프로젝트 이름}(안전하지 않음)으로 이동" 클릭
   - "허용" 클릭
6. **웹 앱 URL** 복사 (나중에 Slack 설정에 사용)
   - 형식: `https://script.google.com/macros/s/{SCRIPT_ID}/exec`

### 6.2 배포 URL 확인

- 배포 후 언제든지 **배포 > 배포 관리** 에서 URL 확인 가능

---

## 7. Slack 슬래시 커맨드 설정

### 7.1 Slack App 설정

1. [Slack API 페이지](https://api.slack.com/apps) 접속
2. 기존에 만든 App 선택 (또는 새로 생성)
3. 좌측 메뉴에서 **Slash Commands** 선택

### 7.2 각 명령어 추가

"Create New Command" 버튼을 클릭하여 다음 명령어들을 추가합니다:

#### /코테챌린지참여
- **Command**: `/코테챌린지참여`
- **Request URL**: `{웹 앱 URL}` (6단계에서 복사한 URL)
- **Short Description**: `코테 챌린지에 참여합니다`
- **Usage Hint**: (비워둠)

#### /코테챌린지참여확인
- **Command**: `/코테챌린지참여확인`
- **Request URL**: `{웹 앱 URL}`
- **Short Description**: `챌린지 참여 여부와 진행 일차를 확인합니다`

#### /코테챌린지현황
- **Command**: `/코테챌린지현황`
- **Request URL**: `{웹 앱 URL}`
- **Short Description**: `나의 챌린지 성공 횟수와 경고 횟수를 확인합니다`

#### /코테제출
- **Command**: `/코테제출`
- **Request URL**: `{웹 앱 URL}`
- **Short Description**: `코테 PR 링크를 제출합니다`
- **Usage Hint**: `https://github.com/org/repo/pull/123`

#### /코테제출수정
- **Command**: `/코테제출수정`
- **Request URL**: `{웹 앱 URL}`
- **Short Description**: `오늘 제출한 PR 링크를 수정합니다`
- **Usage Hint**: `https://github.com/org/repo/pull/456`

#### /코테제출확인
- **Command**: `/코테제출확인`
- **Request URL**: `{웹 앱 URL}`
- **Short Description**: `오늘 제출한 PR 링크를 확인합니다`

### 7.3 워크스페이스에 설치

1. 좌측 메뉴에서 **Install App** 선택
2. **Install to Workspace** 클릭
3. 권한 허용

---

## 8. 스케줄러 트리거 설정

매일 자정에 자동으로 집계를 실행하도록 트리거를 설정합니다.

### 8.1 트리거 추가

1. Apps Script 편집기 좌측 메뉴에서 **트리거** (⏰) 클릭
2. 우측 하단 **트리거 추가** 버튼 클릭
3. 설정 입력:
   - **실행할 함수**: `runDailyAggregation` 선택
   - **실행할 배포**: "Head" 선택
   - **이벤트 소스**: "시간 기반" 선택
   - **시간 기반 트리거 유형**: "일 타이머" 선택
   - **시간 선택**: "자정~오전 1시" 선택
4. **저장** 클릭
5. 필요시 권한 승인

### 8.2 트리거 확인

- 설정 완료 후 트리거 목록에서 확인 가능
- 매일 자정에 자동 실행됨

---

## 9. 테스트

### 9.1 Slack 명령어 테스트

Slack 채널에서 다음 명령어들을 테스트합니다:

1. `/코테챌린지참여` - 참여 신청
2. `/코테챌린지참여확인` - 1일차 확인
3. `/코테제출 https://github.com/test/repo/pull/1` - 제출
4. `/코테제출확인` - 제출 확인
5. `/코테챌린지현황` - 통계 확인 (첫 집계 전에는 "아직 통계가 없습니다" 표시)

### 9.2 Google Sheets 확인

각 시트에 데이터가 올바르게 기록되는지 확인:

- `challengers` - 사용자 정보 추가 확인
- `daily-challenge` - 제출 기록 확인

### 9.3 스케줄러 수동 테스트

1. Apps Script 편집기에서 `dailyAggregationScheduler` 파일 열기
2. 상단 함수 선택 드롭다운에서 `testDailyAggregation` 선택
3. **실행** (▶️) 버튼 클릭
4. 실행 로그 확인
5. Google Sheets 확인:
   - `aggregation` - 전체 집계 데이터 추가 확인
   - `challenger-stats` - 챌린저별 통계 추가 확인
6. Slack 채널 확인:
   - 일반 채널: "오늘 하루도 고생하셨습니다..." 메시지 확인
   - 관리자 채널: 경고 초과 시 알림 확인 (해당하는 경우)

---

## 트러블슈팅

### 문제: "권한이 없습니다" 오류

**해결:**
1. Apps Script 편집기에서 코드 실행
2. 권한 검토 팝업에서 "권한 검토" 클릭
3. Google 계정 선택 후 "허용" 클릭

### 문제: Slack 명령어가 작동하지 않음

**확인 사항:**
1. 웹 앱 배포가 올바르게 되었는지 확인
2. Slack 슬래시 커맨드의 Request URL이 정확한지 확인
3. Apps Script 실행 로그 확인 (보기 > 로그)

### 문제: 스케줄러가 실행되지 않음

**확인 사항:**
1. 트리거가 올바르게 설정되었는지 확인
2. 트리거 실행 기록 확인 (트리거 메뉴에서 확인 가능)
3. Apps Script 실행 로그 확인

### 문제: Slack 알림이 오지 않음

**확인 사항:**
1. 스크립트 속성에 Webhook URL이 올바르게 설정되었는지 확인
2. Webhook URL이 유효한지 확인 (Slack API 페이지에서)
3. Apps Script 로그에서 에러 확인

---

## 업데이트 및 재배포

코드를 수정한 후 재배포하는 방법:

1. Apps Script 편집기에서 코드 수정
2. **Ctrl+S** (또는 Cmd+S)로 저장
3. **배포 > 배포 관리** 클릭
4. 활성 배포 옆 연필(✏️) 아이콘 클릭
5. **버전 > 새 버전** 선택
6. **배포** 클릭

> **참고:** Slack 슬래시 커맨드의 URL은 변경되지 않으므로 재설정 불필요

---

## 주의사항

- **Google Sheets 이름 변경 금지** - 시트 이름이 변경되면 코드가 작동하지 않습니다
- **스크립트 속성 보안** - Webhook URL은 외부에 노출되지 않도록 주의
- **배포 권한** - "모든 사용자" 권한으로 배포해야 Slack에서 접근 가능
- **트리거 시간대** - Apps Script는 Google 계정의 시간대를 따름 (한국 시간 확인)

---

## 추가 리소스

- [Google Apps Script 문서](https://developers.google.com/apps-script)
- [Slack API 문서](https://api.slack.com/docs)
- [명령어 가이드](../command/README.md)
- [스케줄러 설정 가이드](../scheduler/README.md)
