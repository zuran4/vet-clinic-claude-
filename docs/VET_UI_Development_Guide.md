# VET UI Development Guide

Αυτό το αρχείο περιέχει τα design patterns και τα UI presets του VET project.
Κάθε νέο component πρέπει να ακολουθεί αυτά τα patterns για συνέπεια.

---

## Βασικές Αρχές

- **Framework:** Tailwind CSS
- **Icons:** lucide-react
- **Border radius:** `rounded-2xl` παντού (cards, inputs, buttons, badges)
- **Shadows:** `shadow-sm` για cards, `shadow-xl` για modals
- **Fonts:** system default μέσω Tailwind

---

## Χρώματα ανά Domain

| Domain | Χρώμα | Tailwind |
|---|---|---|
| Ιατρείο | Πράσινο | `green-500 / emerald-400` |
| Grooming | Μπλε | `blue-500 / cyan-400` |
| Ραντεβού | Indigo | `indigo-500` |
| Προειδοποίηση | Κίτρινο | `amber-400` |
| Επιτυχία | Πράσινο | `green-400` |
| Σφάλμα | Κόκκινο | `red-400` |
| Ουδέτερο | Γκρι | `gray-400` |

---

## Χρώματα ανά Τύπο Ραντεβού

| Τύπος | Dot | Badge |
|---|---|---|
| Εξέταση | `bg-indigo-400` | `bg-indigo-100 text-indigo-700` |
| Εμβόλιο | `bg-green-400` | `bg-green-100 text-green-700` |
| Αποπαρασίτωση | `bg-amber-400` | `bg-amber-100 text-amber-700` |
| Χειρουργείο | `bg-red-400` | `bg-red-100 text-red-700` |
| Στείρωση | `bg-purple-400` | `bg-purple-100 text-purple-700` |
| Μπάνιο | `bg-sky-400` | `bg-sky-100 text-sky-700` |
| Κούρεμα | `bg-cyan-400` | `bg-cyan-100 text-cyan-700` |

---

## Pattern 1 — Gradient Header Card (Modal)

Χρησιμοποιείται σε: `AppointmentPreviewModal`

```
┌─────────────────────────────────┐
│  🎨 GRADIENT HEADER             │  ← έγχρωμο, με τίτλο + badge τύπου
│  Τίτλος / Κύρια πληροφορία      │
│  Δευτερεύουσα πληροφορία        │
├─────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐    │  ← δύο info cards δίπλα-δίπλα
│  │ Section A│  │ Section B│    │     bg-gray-50, rounded-2xl
│  └──────────┘  └──────────┘    │
├─────────────────────────────────┤
│  ⚠️ Notes section (amber)       │  ← μόνο αν υπάρχει περιεχόμενο
├─────────────────────────────────┤
│  🏷️ chip  🏷️ chip  🏷️ chip      │  ← chips για tags/κατοικίδια
└─────────────────────────────────┘
```

**Gradient ανά domain:**
```
Ιατρείο:  bg-gradient-to-r from-green-500 to-emerald-400
Grooming: bg-gradient-to-r from-blue-500 to-cyan-400
Γενικό:   bg-gradient-to-r from-indigo-500 to-violet-400
```

**Info Row μέσα σε card:**
```jsx
<div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
  <Icon className="w-4 h-4 text-{color}-400 flex-shrink-0" />
  <span className="text-xs text-gray-400 w-20 flex-shrink-0">Ετικέτα</span>
  <span className="text-sm font-medium text-gray-800">Τιμή</span>
</div>
```

**Section Header μέσα σε card:**
```jsx
<p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-3 pb-1">
  ΤΙΤΛΟΣ SECTION
</p>
```

---

## Pattern 2 — Quick Action Button (Dashboard)

Χρησιμοποιείται σε: `Dashboard.jsx`

```jsx
<button className="group w-full text-left rounded-2xl border bg-white p-4 shadow-sm
  border-gray-200 hover:border-gray-300 hover:shadow-md
  focus:outline-none focus:ring-2 focus:ring-indigo-300">
  <div className="flex items-start justify-between gap-3">
    <div className="inline-flex h-10 w-10 items-center justify-center
      rounded-xl border border-gray-200 bg-gray-50 text-gray-700">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <div className="font-semibold text-gray-900">{title}</div>
      <div className="text-sm text-gray-500">{description}</div>
    </div>
    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-400" />
  </div>
</button>
```

---

## Pattern 3 — Status Badge (Pill)

Χρησιμοποιείται σε: `RegistryStatus`, `TodayTimeline`, `MainLayout`

```jsx
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
  text-xs font-medium border
  bg-{color}-50 text-{color}-700 border-{color}-200">
  <Icon className="w-3.5 h-3.5" />
  Κείμενο
</span>
```

| Κατάσταση | Classes |
|---|---|
| Επιτυχία (OK) | `bg-green-50 text-green-700 border-green-200` |
| Προειδοποίηση | `bg-amber-50 text-amber-700 border-amber-200` |
| Σφάλμα | `bg-red-50 text-red-700 border-red-200` |
| Ουδέτερο | `bg-gray-50 text-gray-700 border-gray-200` |
| Info | `bg-indigo-50 text-indigo-700 border-indigo-200` |

---

## Pattern 4 — Timeline Item

Χρησιμοποιείται σε: `TodayTimeline.jsx`

```jsx
<li className="flex items-center gap-3 p-3 rounded-xl
  bg-gray-50 border border-gray-100">
  <div className="w-2.5 h-2.5 rounded-full bg-{color}-400 flex-shrink-0" />
  <span className="text-sm font-bold text-gray-700 w-12">{time}</span>
  <div className="flex-1 min-w-0">
    <p className="text-sm font-medium text-gray-800 truncate">{title}</p>
    <p className="text-xs text-gray-400 truncate">{subtitle}</p>
  </div>
  <span className="text-xs font-medium px-2 py-0.5 rounded-full
    bg-{color}-100 text-{color}-700">
    {badge}
  </span>
</li>
```

---

## Pattern 5 — Form Input

Χρησιμοποιείται παντού στις φόρμες.

```jsx
<input className="w-full border border-gray-200 p-2 rounded-2xl shadow-sm
  text-sm placeholder-gray-400
  focus:outline-none focus:ring-2 focus:ring-indigo-300" />

<select className="w-full border border-gray-200 p-2 rounded-2xl shadow-sm
  text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />

<textarea className="w-full border border-gray-200 p-2 rounded-2xl shadow-sm
  text-sm placeholder-gray-400
  focus:outline-none focus:ring-2 focus:ring-indigo-300" />
```

---

## Pattern 6 — Chip (Tag)

Χρησιμοποιείται για κατοικίδια, επιλεγμένο αντικείμενο.

```jsx
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
  bg-white border border-gray-200 text-sm text-gray-700 shadow-sm">
  <span className="font-medium">{label}</span>
  <span className="text-gray-400 text-xs">{sublabel}</span>
</span>
```

**Με X για αφαίρεση:**
```jsx
<div className="flex items-center gap-2 border border-indigo-200
  bg-indigo-50 rounded-2xl px-3 py-2 shadow-sm">
  <Icon className="w-4 h-4 text-indigo-500" />
  <span className="text-sm font-medium text-indigo-700 flex-1">{label}</span>
  <button onClick={onClear}>
    <X className="w-4 h-4 text-indigo-400 hover:text-indigo-700" />
  </button>
</div>
```

---

## Buttons

```jsx
// Κύρια ενέργεια (Αποθήκευση, Καταχώρηση)
<Button variant="success">Αποθήκευση</Button>  // πράσινο

// Ακύρωση
<Button variant="danger">Ακύρωση</Button>  // κόκκινο

// Δευτερεύουσα ενέργεια
<Button variant="primary">Ενέργεια</Button>  // indigo

// Διακριτικό
<Button variant="ghost">Κλείσιμο</Button>  // διαφανές
```

---

## Κανόνες

1. **Πάντα** `rounded-2xl` σε cards, inputs, buttons
2. **Ποτέ** plain `<ul>` με bullets — χρήση chips ή timeline items
3. **Ποτέ** hardcoded χρώματα — χρήση του παραπάνω πίνακα
4. **Πάντα** `focus:ring-2 focus:ring-indigo-300` στα inputs
5. **Ακύρωση** = κόκκινο, **Αποθήκευση** = πράσινο
6. **Sections** με `text-xs font-semibold text-gray-400 uppercase tracking-wide`
7. **Empty states** με διακεκομμένο border και ουδέτερο icon
