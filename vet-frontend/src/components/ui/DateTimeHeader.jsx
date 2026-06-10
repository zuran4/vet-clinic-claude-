import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/el"; // ελληνικά

dayjs.locale("el");

const DateTimeHeader = () => {
  const [now, setNow] = useState(dayjs());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(dayjs());
    }, 1000); // ανανέωση κάθε δευτερόλεπτο
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white dark:bg-win-surface rounded-2xl shadow-md px-6 py-3 text-center">
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
        {now.format("dddd D MMMM YYYY")}
      </h2>
      <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{now.format("HH:mm:ss")}</p>
    </div>
  );
};

export default DateTimeHeader;
