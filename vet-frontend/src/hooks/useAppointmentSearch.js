import { useState, useEffect, useCallback, useRef } from "react";
import request from "../api/apiClient.js";

export function useAppointmentSearch() {
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [doctor, setDoctor] = useState("");
  const [page, setPage] = useState(1);

  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef(null);

  const doSearch = useCallback(async (params) => {
    try {
      setLoading(true);
      const sp = new URLSearchParams();
      if (params.q)      sp.set("q", params.q);
      if (params.from)   sp.set("from", params.from);
      if (params.to)     sp.set("to", params.to);
      if (params.doctor) sp.set("doctor", params.doctor);
      sp.set("page", String(params.page || 1));

      const data = await request(`/appointments/search?${sp.toString()}`);
      setResults(data.results || []);
      setTotal(data.total || 0);
      setPages(data.pages || 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce the text query, but apply date/doctor/page changes immediately
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch({ q, from, to, doctor, page });
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [q, from, to, doctor, page, doSearch]);

  // Reset page when filters change
  const setQAndReset     = (v) => { setQ(v);      setPage(1); };
  const setFromAndReset  = (v) => { setFrom(v);   setPage(1); };
  const setToAndReset    = (v) => { setTo(v);     setPage(1); };
  const setDoctorAndReset = (v) => { setDoctor(v); setPage(1); };

  return {
    q, setQ: setQAndReset,
    from, setFrom: setFromAndReset,
    to, setTo: setToAndReset,
    doctor, setDoctor: setDoctorAndReset,
    page, setPage,
    results, total, pages, loading,
  };
}
