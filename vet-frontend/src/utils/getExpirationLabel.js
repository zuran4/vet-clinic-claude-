// utils/getExpirationLabel.js
import dayjs from "dayjs";

export const getExpirationLabel = (expirationDate) => {
  if (!expirationDate) return "-";

  const now = dayjs();
  const date = dayjs(expirationDate);
  const days = date.diff(now, "day");

  const label = date.format("DD/MM/YYYY");
  if (days < 0) return `${label} (έληξε)`;
  return `${label} (${days} μέρες)`;
};
