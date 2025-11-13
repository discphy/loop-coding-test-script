/**
 * 🔧 수동 집계 핸들러 (관리자 전용)
 * /코테집계 명령어로 집계를 수동으로 실행합니다.
 *
 * 사용법:
 * - /코테집계               → 오늘 날짜 집계 (조회만)
 * - /코테집계 2025-10-22    → 특정 날짜 집계 실행 (저장 + 통계 업데이트 + Slack 알림)
 *
 * 권한: 관리자 채널에서만 사용 가능 (ADMIN_CHANNEL_ID)
 */

function handleManualAggregation(parameters) {
  const channelId = parameters.channel_id;
  const dateParam = parameters.text ? parameters.text.trim() : "";

  // 관리자 권한 확인 (ADMIN_CHANNEL_ID가 설정된 경우에만 체크)
  const adminChannelId = getAdminChannelId();
  if (adminChannelId && channelId !== adminChannelId) {
    return respond(Messages.error.noPermission());
  }

  // 날짜 파라미터 처리
  let targetDate;
  let isActualAggregation = false;

  if (dateParam) {
    // 날짜 형식 검증 (yyyy-MM-dd)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(dateParam)) {
      return respond(Messages.error.invalidDateFormat());
    }

    // 날짜가 오늘 이전인지 검증
    const inputDate = new Date(dateParam);
    const today = new Date();
    const todayOnly = new Date(formatDate(today, "yyyy-MM-dd")); // 시간 정보 제거

    if (inputDate >= todayOnly) {
      return respond(Messages.error.futureDateNotAllowed(dateParam));
    }

    targetDate = dateParam;
    isActualAggregation = true; // 날짜 지정 시 실제 집계 실행
  } else {
    // 날짜 없으면 오늘 날짜로 조회만
    targetDate = formatDate(new Date(), "yyyy-MM-dd");
    isActualAggregation = false;
  }

  try {
    // 실제 집계 실행 모드인 경우 즉시 응답 후 백그라운드 처리
    if (isActualAggregation) {
      // 사전 검증: 챌린저 시트와 기본 데이터 확인
      if (!hasSheet(SheetNames.CHALLENGERS)) {
        return respond(Messages.error.noChallengerSheet());
      }

      const challengersSheet = getSheet(SheetNames.CHALLENGERS);
      const challengersData = challengersSheet.getDataRange().getValues();

      // 챌린저가 1명이라도 있는지 확인 (헤더 제외)
      if (challengersData.length <= 1) {
        return respond(Messages.error.noChallengersToAggregate());
      }

      // 중복 집계 확인
      const aggregationSheet = ensureSheet(SheetNames.AGGREGATION);
      if (aggregationSheet.getLastRow() > 0) {
        const aggregationData = aggregationSheet.getDataRange().getValues();
        for (let i = 1; i < aggregationData.length; i++) {
          const [date] = aggregationData[i];
          const dateStr = date instanceof Date ? formatDate(date, "yyyy-MM-dd") : String(date);
          if (dateStr === targetDate) {
            return respond(Messages.error.alreadyAggregated(targetDate));
          }
        }
      }

      // 검증 통과: 즉시 응답 반환 (3초 타임아웃 방지)
      const immediateResponse = respond(Messages.success.aggregationStarted(targetDate));

      // 백그라운드에서 집계 실행
      executeAggregationAsync(targetDate);

      return immediateResponse;
    }

    // 조회 모드 (빠르게 처리되므로 동기 실행)
    const result = executeAggregation(targetDate, false);

    // 실패 처리
    if (!result.success) {
      switch (result.error) {
        case "noChallengerSheet":
          return respond(Messages.error.noChallengerSheet());
        case "noChallengersToAggregate":
          return respond(Messages.error.noChallengersToAggregate());
        case "alreadyAggregated":
          return respond(Messages.error.alreadyAggregated(result.targetDate));
        default:
          return respond(Messages.error.aggregationFailed());
      }
    }

    // 조회 결과 반환
    return respond(
      Messages.success.manualAggregation(
        result.targetDate,
        result.totalChallengers,
        result.successCount,
        result.missedCount,
        result.successRate,
        result.submittedMentions,
        result.missingMentions
      )
    );

  } catch (error) {
    Logger.log(`Manual aggregation error: ${error}`);
    return respond(Messages.error.aggregationFailed());
  }
}

/**
 * 비동기 집계 실행 (Webhook으로 결과 전송)
 * @param {string} targetDate - 집계할 날짜 (yyyy-MM-dd)
 */
function executeAggregationAsync(targetDate) {
  try {
    const result = executeAggregation(targetDate, true);

    if (result.success) {
      // 일반 Slack 알림 (간단 요약)
      sendSlackNotification(Messages.webhook.dailySummary(result.successCount, result.missedCount));

      // 상세 집계 결과를 Slack에 전송
      const detailedMessage = Messages.webhook.aggregationComplete(
        result.targetDate,
        result.totalChallengers,
        result.successCount,
        result.missedCount,
        result.successRate,
        result.submittedMentions,
        result.missingMentions
      );
      sendSlackNotification(detailedMessage);

      Logger.log(`[수동 집계] ${targetDate} 집계 완료: 챌린저 ${result.totalChallengers}명, 성공 ${result.successCount}명, 미제출 ${result.missedCount}명`);
    } else {
      // 실패 시 관리자 채널로 알림
      let errorMessage = "❌ 집계 실패: ";
      switch (result.error) {
        case "noChallengerSheet":
          errorMessage += "챌린저 시트가 존재하지 않습니다.";
          break;
        case "noChallengersToAggregate":
          errorMessage += "집계 대상 챌린저가 없습니다.";
          break;
        case "alreadyAggregated":
          errorMessage += `${result.targetDate}은(는) 이미 집계되었습니다.`;
          break;
        default:
          errorMessage += "알 수 없는 오류가 발생했습니다.";
      }
      sendManageNotification(errorMessage);
      Logger.log(`[집계 실패] ${errorMessage}`);
    }
  } catch (error) {
    Logger.log(`Async aggregation error: ${error}`);
    sendManageNotification(`❌ 집계 중 오류 발생: ${error.message}`);
  }
}
