function getWebhookUrl() {
  const scriptProperties = PropertiesService.getScriptProperties();
  return scriptProperties.getProperty('SLACK_WEBHOOK_URL');
}

function getManageWebhookUrl() {
  const scriptProperties = PropertiesService.getScriptProperties();
  return scriptProperties.getProperty('SLACK_MANAGE_WEBHOOK_URL');
}

/**
 * 🔔 Slack 관리자 채널에 메시지 전송
 * @param {string} message - 전송할 메시지
 */
function sendManageNotification(message) {
  const webhookUrl = getManageWebhookUrl();

  if (!webhookUrl) {
    Logger.log("⚠️ SLACK_MANAGE_WEBHOOK_URL이 설정되지 않았습니다.");
    return;
  }

  const payload = {
    text: message
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  };

  try {
    UrlFetchApp.fetch(webhookUrl, options);
    Logger.log("✅ Slack 관리자 알림 전송 완료");
  } catch (error) {
    Logger.log(`❌ Slack 관리자 알림 전송 실패: ${error}`);
  }
}

/**
 * 📢 Slack 일반 채널에 메시지 전송
 * @param {string} message - 전송할 메시지
 */
function sendSlackNotification(message) {
  const webhookUrl = getWebhookUrl();

  if (!webhookUrl) {
    Logger.log("⚠️ SLACK_WEBHOOK_URL이 설정되지 않았습니다.");
    return;
  }

  const payload = {
    text: message
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  };

  try {
    UrlFetchApp.fetch(webhookUrl, options);
    Logger.log("✅ Slack 알림 전송 완료");
  } catch (error) {
    Logger.log(`❌ Slack 알림 전송 실패: ${error}`);
  }
}
