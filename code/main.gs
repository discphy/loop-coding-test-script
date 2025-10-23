function doPost(e) {
	const parameters = e.parameter;
  const command = parameters.command;

  switch (command) {
    case "/코테챌린지참여":
      return handleRegister(parameters);
    case "/코테챌린지참여확인":
      return handleCheckChallenger(parameters);
    case "/코테챌린지현황":
      return handleChallengeStatus(parameters);
    case "/코테제출":
      return handleSubmit(parameters);
    case "/코테제출수정":
      return handleUpdateSubmit(parameters);
    case "/코테제출확인":
      return handleCheckSubmit(parameters);
    case "/코테집계":
      return handleManualAggregation(parameters);
    default:
      return respond(Messages.error.unknownCommand(command));
  }
}