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

  // 관리자 권한 확인
  if (!isAdmin(channelId)) {
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
    targetDate = dateParam;
    isActualAggregation = true; // 날짜 지정 시 실제 집계 실행
  } else {
    // 날짜 없으면 오늘 날짜로 조회만
    targetDate = formatDate(new Date(), "yyyy-MM-dd");
    isActualAggregation = false;
  }

  try {
    // 스케줄러의 executeAggregation() 함수 재사용
    const result = executeAggregation(targetDate, isActualAggregation);

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

    // 성공 처리
    if (isActualAggregation) {
      // 실제 집계 완료 시 Slack 알림 전송
      sendSlackNotification(Messages.webhook.dailySummary(result.successCount, result.missedCount));
      Logger.log(`[수동 집계] ${targetDate} 집계 완료: 챌린저 ${result.totalChallengers}명, 성공 ${result.successCount}명, 미제출 ${result.missedCount}명`);

      return respond(
        Messages.success.actualAggregation(
          result.targetDate,
          result.totalChallengers,
          result.successCount,
          result.missedCount,
          result.successRate,
          result.submittedMentions,
          result.missingMentions
        )
      );
    } else {
      // 조회만
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
    }

  } catch (error) {
    Logger.log(`Manual aggregation error: ${error}`);
    return respond(Messages.error.aggregationFailed());
  }
}
