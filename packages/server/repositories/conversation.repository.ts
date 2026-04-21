const conversations = new Map<string, string>();

export const conversationRepository = {
  getLastResponseId,
  setLastResponseId,
};

function getLastResponseId(conversationId: string): string | undefined {
  return conversations.get(conversationId);
}

function setLastResponseId(conversationId: string, responseId: string): void {
  conversations.set(conversationId, responseId);
}
