// src/api/messagesApi.js
import request from "./apiClient";

const MESSAGES_ENDPOINT = "/messages";

export const getConversations = () =>
  request(`${MESSAGES_ENDPOINT}/conversations`);

export const getThread = (counterpart) =>
  request(`${MESSAGES_ENDPOINT}/conversations/${encodeURIComponent(counterpart)}`);

export const sendReply = (counterpart, text) =>
  request(`${MESSAGES_ENDPOINT}/conversations/${encodeURIComponent(counterpart)}/reply`, {
    method: "POST",
    body: { text },
  });
