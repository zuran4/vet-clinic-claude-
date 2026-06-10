import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "moment/locale/el";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { DateTime } from "luxon";

moment.locale("el");
const localizer = momentLocalizer(moment);

// Ώρες λειτουργίας του κτηνιατρείου
const workingHours = {
  1: [{ start: "10:00", end: "16:00" }],
  2: [
    { start: "10:00", end: "14:00" },
    { start: "17:00", end: "20:00" },
  ],
  3: [{ start: "10:00", end: "16:00" }],
  4: [
    { start: "10:00", end: "14:00" },
    { start: "17:00", end: "20:00" },
  ],
  5: [
    { start: "10:00", end: "14:00" },
    { start: "17:00", end: "20:00" },
  ],
};

function generateTimeSlots(date, slots) {
  const generated = [];
  slots.forEach(({ start, end }) => {
    const startTime = DateTime.fromISO(`${date}T${start}`);
    const endTime = DateTime.fromISO(`${date}T${end}`);

    for (
      let current = startTime;
      current < endTime;
      current = current.plus({ minutes: 30 })
    ) {
      generated.push({
        start: current.toJSDate(),
        end: current.plus({ minutes: 30 }).toJSDate(),
        title: `Διαθέσιμο: ${current.toFormat("HH:mm")} - ${current
          .plus({ minutes: 30 })
          .toFormat("HH:mm")}`,
        slot: true,
      });
    }
  });
  return generated;
}

function getAvailableSlots(appointments, startDate, endDate) {
  const available = [];
  let day = DateTime.fromJSDate(startDate).startOf("day");
  const end = DateTime.fromJSDate(endDate).endOf("day");

  while (day <= end) {
    const weekday = day.weekday;
    const dateStr = day.toISODate();
    const slots = workingHours[weekday];

    if (slots) {
      const generated = generateTimeSlots(dateStr, slots);
      const booked = appointments.map((appt) => ({
        start: DateTime.fromISO(appt.startTime),
        end: DateTime.fromISO(appt.endTime),
      }));

      generated.forEach((slot) => {
        const slotStart = DateTime.fromJSDate(slot.start);
        const slotEnd = DateTime.fromJSDate(slot.end);
        const overlaps = booked.some(
          (b) => slotStart < b.end && slotEnd > b.start
        );
        if (!overlaps) {
          available.push(slot);
        }
      });
    }

    day = day.plus({ days: 1 });
  }

  return available;
}

const AppointmentCalendar = ({ appointments }) => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const startOfWeek = moment().startOf("week").toDate();
    const endOfWeek = moment().endOf("week").toDate();
    updateEvents(startOfWeek, endOfWeek);
  }, [appointments]);

  const updateEvents = (start, end) => {
    const bookedEvents = appointments.map((appt) => ({
      title: `${appt.ownerName} - ${appt.animalName}`,
      start: new Date(appt.startTime),
      end: new Date(appt.endTime),
      backgroundColor: "red",
      slot: false,
    }));

    const available = getAvailableSlots(appointments, start, end);
    setEvents([...bookedEvents, ...available]);
  };

  const eventStyleGetter = (event) => {
    if (event.slot) {
      return {
        style: {
          backgroundColor: "#d4f5d4",
          color: "green",
          border: "1px solid green",
          fontWeight: "bold",
        },
      };
    }
    return {
      style: {
        backgroundColor: "red",
        color: "white",
        fontWeight: "bold",
      },
    };
  };

  return (
    <div className="p-4 bg-white dark:bg-win-surface rounded-xl shadow-md">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView="week"
        views={["week", "day"]}
        style={{ height: 700 }}
        step={30}
        timeslots={1}
        min={new Date(0, 0, 0, 10, 0)}
        max={new Date(0, 0, 0, 20, 0)}
        messages={{
          week: "Εβδομάδα",
          day: "Ημέρα",
          today: "Σήμερα",
          previous: "Προηγ.",
          next: "Επόμενη",
        }}
        eventPropGetter={eventStyleGetter}
        onRangeChange={(range) => {
          const start = Array.isArray(range) ? range[0] : range.start;
          const end = Array.isArray(range)
            ? range[range.length - 1]
            : range.end;
          updateEvents(start, end);
        }}
        culture="el"
        formats={{
          timeGutterFormat: "HH:mm",
          eventTimeRangeFormat: ({ start, end }) =>
            `${moment(start).format("HH:mm")} - ${moment(end).format("HH:mm")}`,
        }}
      />
    </div>
  );
};

export default AppointmentCalendar;
