import { useState, useEffect } from "react";
import dayjs from "dayjs";
import request from "../api/apiClient.js"; // ✅ κεντρικός API client
import { getSlotDuration } from "../utils/slotDuration.js";

const DEFAULT_HOURS = {
  monday:    { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
  tuesday:   { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
  wednesday: { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
  thursday:  { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
  friday:    { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
  saturday:  { enabled: true,  intervals: [{ start: "10:00", end: "14:00" }] },
  sunday:    { enabled: false, intervals: [{ start: "09:00", end: "17:00" }] },
};

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm || "").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export function useAppointmentForm({ time, doctor, selectedDate, existingData, onSave }) {
  const [formData, setFormData] = useState(() => ({
    clientName: "",
    phone: "",
    animalName: "",
    type: [],
    duration: getSlotDuration(doctor),
    notes: "",
  }));

  const [ownerId, setOwnerId] = useState(
    existingData?.owner?._id || existingData?.owner || null
  );
  const [pets, setPets] = useState([]);
  // Επεξεργασία υπάρχοντος ραντεβού: ένα κατοικίδιο (dropdown).
  const [selectedPetId, setSelectedPetId] = useState(null);
  // Νέο ραντεβού: 1 ή περισσότερα κατοικίδια του ίδιου πελάτη (checkboxes) —
  // δημιουργείται ένα ξεχωριστό ραντεβού ανά επιλεγμένο κατοικίδιο.
  const [selectedPetIds, setSelectedPetIds] = useState([]);
  const [date, setDate] = useState(() => {
    if (existingData) return new Date(existingData.date);
    // Χρησιμοποίησε την επιλεγμένη ημερομηνία από το calendar (αν υπάρχει)
    if (selectedDate) return new Date(selectedDate);
    return new Date();
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(existingData?.time || time);
  const [allCustomers, setAllCustomers] = useState([]);
  const [showPrescription, setShowPrescription] = useState(false);

  // 🔹 Φόρτωση πελατών
  useEffect(() => {
    if (existingData) {
      setFormData({
        clientName: existingData.clientName,
        phone: existingData.phone || "",
        animalName: existingData.animalName,
        type: Array.isArray(existingData.type)
          ? existingData.type
          : (existingData.type ? [existingData.type] : []),
        duration: existingData.duration,
        notes: existingData.notes || "",
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        type: doctor === "Grooming" ? ["Μπάνιο"] : ["Τακτικός έλεγχος"],
        duration: getSlotDuration(doctor),
      }));
    }

    const fetchCustomers = async () => {
      try {
        const data = await request("/customers");
        setAllCustomers(data);
      } catch (err) {
        console.error("❌ Σφάλμα πελατών:", err);
      }
    };

    fetchCustomers();
  }, [existingData, doctor]);

  // 🔹 Φόρτωση κατοικιδίων πελάτη
  useEffect(() => {
    if (!ownerId) {
      setPets([]);
      setSelectedPetId(null);
      setSelectedPetIds([]);
      return;
    }

    const fetchPets = async () => {
      try {
        const data = await request(`/pets/by-owner/${ownerId}`);
        setPets(data);

        if (data.length === 0) {
          setSelectedPetId(null);
          setSelectedPetIds([]);
        } else if (existingData) {
          // Επεξεργασία: διάλεξε το κατοικίδιο που ήδη έχει το ραντεβού
          // (με βάση το όνομα-snapshot) — όχι πάντα το πρώτο της λίστας.
          const match = data.find((p) => p.name === existingData.animalName);
          setSelectedPetId((match || data[0])._id);
        } else {
          // Νέο ραντεβού: auto-επιλογή πρώτου κατοικιδίου αν υπάρχουν
          setSelectedPetId(data[0]._id);
          setSelectedPetIds([data[0]._id]);
          setFormData((prev) => ({ ...prev, animalName: data[0].name }));
        }
      } catch (err) {
        console.error("❌ Σφάλμα κατοικιδίων:", err);
        setPets([]);
        setSelectedPetId(null);
        setSelectedPetIds([]);
      }
    };

    fetchPets();
  }, [ownerId, existingData]);

  // 🔹 Slots
  useEffect(() => {
    if (!existingData) return;

    const fetchSlots = async () => {
      const selectedDateStr = date.toISOString().split("T")[0];
      const activeDoctor = existingData?.doctor || doctor;
      const slotDuration = 30;

      try {
        const data = await request("/appointments");

        const dayAppointments = data.filter(
          (a) =>
            a.date === selectedDateStr &&
            a.doctor === activeDoctor &&
            a._id !== existingData?._id
        );

        // Πραγματικό ωράριο λειτουργίας (Ιατρείο/Grooming) από τις ρυθμίσεις,
        // ίδια πηγή με το κύριο ημερολόγιο (AppointmentSlots) — όχι σταθερό
        // εύρος 09:00-17:00.
        const storageKey = activeDoctor === "Grooming" ? "groomingWorkingHours" : "clinicWorkingHours";
        let workingHours = DEFAULT_HOURS;
        try {
          const saved = localStorage.getItem(storageKey);
          if (saved) workingHours = JSON.parse(saved);
        } catch {}

        const dayKey = dayjs(date).locale("en").format("dddd").toLowerCase();
        const daySchedule = workingHours?.[dayKey];
        const intervals = daySchedule?.intervals?.length
          ? daySchedule.intervals
          : [{ start: "09:00", end: "17:00" }];

        const slots = [];
        intervals.forEach(({ start, end }) => {
          let current = toMinutes(start);
          const endMin = toMinutes(end);

          while (current < endMin) {
            const hourStr = `${Math.floor(current / 60).toString().padStart(2, "0")}:${(current % 60).toString().padStart(2, "0")}`;
            // "Κατειλημμένο" αν κάποιο ραντεβού πέφτει μέσα σε αυτό το slot —
            // όχι μόνο ίδια ακριβή ώρα, ώστε να πιάνει και μη-στρογγυλές ώρες.
            const taken = dayAppointments.some((a) => {
              const apptMin = toMinutes(a.time);
              return apptMin >= current && apptMin < current + slotDuration;
            });
            slots.push({ time: hourStr, taken });
            current += slotDuration;
          }
        });

        setAvailableSlots(slots);
      } catch (err) {
        console.error("❌ Σφάλμα φόρτωσης slots:", err);
        setAvailableSlots([]);
      }
    };

    fetchSlots();
  }, [date, existingData, doctor]);

  // 🔹 Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "duration" ? Number(value) : value,
    }));
  };

  const handleSelectCustomer = (customer) => {
    if (!customer) {
      setFormData((prev) => ({ ...prev, clientName: "", phone: "", animalName: "" }));
      setOwnerId(null);
      setSelectedPetId(null);
      setSelectedPetIds([]);
      return;
    }
    setFormData((prev) => ({
      ...prev,
      clientName: customer.name,
      phone: customer.phone || "",
    }));
    if (customer.id) setOwnerId(customer.id);
  };

  // Edit mode: dropdown με ένα κατοικίδιο
  const handlePetChange = (petId) => {
    setSelectedPetId(petId);
    const selectedPet = pets.find((p) => p._id === petId);
    if (selectedPet) {
      setFormData((prev) => ({ ...prev, animalName: selectedPet.name }));
    }
  };

  // Create mode: checkboxes, 1 ή περισσότερα κατοικίδια
  const togglePetId = (petId) => {
    setSelectedPetIds((prev) =>
      prev.includes(petId) ? prev.filter((id) => id !== petId) : [...prev, petId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalDate = date.toISOString().split("T")[0];

    const baseDetails = {
      ...formData,
      date: finalDate,
      time: selectedTime,
      doctor,
      owner: ownerId || null,
    };

    if (existingData) {
      // Επεξεργασία: ένα ραντεβού, ένα κατοικίδιο.
      await onSave(baseDetails, existingData._id);
      return;
    }

    // Νέο ραντεβού: ένα ξεχωριστό ραντεβού ανά επιλεγμένο κατοικίδιο.
    for (const petId of selectedPetIds) {
      const pet = pets.find((p) => p._id === petId);
      if (!pet) continue;
      await onSave({ ...baseDetails, animalName: pet.name }, null);
    }
  };

  const handlePrescriptionSubmit = async (data) => {
    try {
      const finalDate = date.toISOString().split("T")[0];
      const payload = {
        date: finalDate,
        clientName: formData.clientName,
        animalName: formData.animalName,
        doctor: doctor,
        medicines: [
          data.medicine + (data.dosage ? ` (${data.dosage})` : ""),
        ],
        instructions: "",
        notes: data.notes || "",
      };

      const result = await request("/prescriptions", {
        method: "POST",
        body: payload,
      });

      console.log("💊 Συνταγή αποθηκεύτηκε:", result);
    } catch (err) {
      console.error("❌ Σφάλμα αποθήκευσης συνταγής:", err);
    }
  };

  return {
    formData,
    setFormData,
    ownerId,
    setOwnerId,
    pets,
    selectedPetId,
    selectedPetIds,
    togglePetId,
    date,
    setDate,
    availableSlots,
    selectedTime,
    setSelectedTime,
    allCustomers,
    showPrescription,
    setShowPrescription,
    handleChange,
    handleSelectCustomer,
    handlePetChange,
    handleSubmit,
    handlePrescriptionSubmit,
  };
}
