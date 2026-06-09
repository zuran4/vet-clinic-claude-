import React from "react";
import dayjs from "dayjs";
import "dayjs/locale/el";
dayjs.locale("el");

const AppointmentDateTitle = ({ date }) => {
  return (
    <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 text-center tracking-wide">
      📆 {dayjs(date).format("dddd D MMMM")}
    </h3>
  );
};

export default AppointmentDateTitle;
