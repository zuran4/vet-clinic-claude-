import { useState, useEffect } from "react";
import request from "../api/apiClient.js"; // ✅ κεντρικός API client

export function useAppointmentForm({ time, doctor, selectedDate, existingData, onSave }) {
  const [formData, setFormData] = useState({
    clientName: "",
    phone: "",
    animalName: "",
    type: [],
    duration: 30,
    notes: "",
  });

  const [ownerId, setOwnerId] = useState(
    existingData?.owner?._id || existingData?.owner || null
  );
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState("new");
  const [newPetSpecies, setNewPetSpecies] = useState("Σκύλος");
  const [newPetGender, setNewPetGender] = useState("Αρσενικό");
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
        type: doctor === "Grooming" ? ["Μπάνιο"] : ["Εξέταση"],
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
      return;
    }

    const fetchPets = async () => {
      try {
        const data = await request(`/pets/by-owner/${ownerId}`);
        setPets(data);
        // Auto-επιλογή πρώτου κατοικιδίου αν υπάρχουν
        if (data.length > 0) {
          setSelectedPetId(data[0]._id);
          setFormData((prev) => ({ ...prev, animalName: data[0].name }));
        }
      } catch (err) {
        console.error("❌ Σφάλμα κατοικιδίων:", err);
        setPets([]);
      }
    };

    fetchPets();
  }, [ownerId]);

  // 🔹 Slots
  useEffect(() => {
    if (!existingData) return;

    const fetchSlots = async () => {
      const selectedDateStr = date.toISOString().split("T")[0];
      try {
        const data = await request("/appointments");

        const dayAppointments = data.filter(
          (a) =>
            a.date === selectedDateStr &&
            a.doctor === (existingData?.doctor || doctor) &&
            a._id !== existingData?._id
        );
        const usedTimes = new Set(dayAppointments.map((a) => a.time));

        const slots = [];
        for (let h = 9; h < 17; h++) {
          for (let m = 0; m < 60; m += 30) {
            const hourStr = `${h.toString().padStart(2, "0")}:${m
              .toString()
              .padStart(2, "0")}`;
            slots.push({ time: hourStr, taken: usedTimes.has(hourStr) });
          }
        }

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

  const handleToggleType = (value) => {
    setFormData((prev) => {
      const has = prev.type.includes(value);
      const nextType = has
        ? prev.type.filter((t) => t !== value)
        : [...prev.type, value];
      return { ...prev, type: nextType };
    });
  };

  const handleSelectCustomer = (customer) => {
    if (!customer) {
      setFormData((prev) => ({ ...prev, clientName: "", phone: "", animalName: "" }));
      setOwnerId(null);
      setSelectedPetId("new");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      clientName: customer.name,
      phone: customer.phone || "",
    }));
    if (customer.id) setOwnerId(customer.id);
    setSelectedPetId("new");
  };

  const handlePetChange = (petId) => {
    setSelectedPetId(petId);
    if (petId === "new") {
      setFormData((prev) => ({ ...prev, animalName: "" }));
    } else {
      const selectedPet = pets.find((p) => p._id === petId);
      if (selectedPet) {
        setFormData((prev) => ({ ...prev, animalName: selectedPet.name }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalDate = date.toISOString().split("T")[0];

    // Αν είναι νέο κατοικίδιο, το δημιουργούμε πρώτα στη βάση
    if (selectedPetId === "new" && ownerId && formData.animalName) {
      try {
        await request("/pets", {
          method: "POST",
          body: {
            name: formData.animalName,
            owner: ownerId,
            species: newPetSpecies,
            gender: newPetGender,
          },
        });
      } catch (err) {
        console.error("❌ Σφάλμα δημιουργίας κατοικιδίου:", err);
      }
    }

    onSave(
      {
        ...formData,
        date: finalDate,
        time: selectedTime,
        doctor,
        owner: ownerId || null,
      },
      existingData?._id || null
    );
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
    setSelectedPetId,
    newPetSpecies,
    setNewPetSpecies,
    newPetGender,
    setNewPetGender,
    date,
    setDate,
    availableSlots,
    selectedTime,
    setSelectedTime,
    allCustomers,
    showPrescription,
    setShowPrescription,
    handleChange,
    handleToggleType,
    handleSelectCustomer,
    handlePetChange,
    handleSubmit,
    handlePrescriptionSubmit,
  };
}
