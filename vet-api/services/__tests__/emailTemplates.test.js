import { describe, it, expect } from "@jest/globals";

import {
  purchaseReminderHtml,
  appointmentReminderHtml,
} from "../emailTemplates.js";

describe("purchaseReminderHtml", () => {
  it("includes the reminder date in the rendered HTML", () => {
    // Regression: reminderDate was accepted as a parameter but never rendered,
    // so customers received purchase-reminder emails with no date information.
    const html = purchaseReminderHtml({
      clinicName: "Πετ Κλινική",
      clientName: "Γιώργος",
      productNames: ["Τροφή Α"],
      reminderDate: "15/06/2026",
    });

    expect(html).toContain("15/06/2026");
  });

  it("renders all product names as list items", () => {
    const html = purchaseReminderHtml({
      productNames: ["Augmentin", "Prednisolone"],
    });

    expect(html).toContain("Augmentin");
    expect(html).toContain("Prednisolone");
  });

  it("shows a generic item when productNames is empty", () => {
    const html = purchaseReminderHtml({ productNames: [] });

    expect(html).toContain("Γενική υπενθύμιση");
  });

  it("includes the optional note when provided", () => {
    const html = purchaseReminderHtml({ note: "Επείγον — δώσε αμέσως" });

    expect(html).toContain("Επείγον — δώσε αμέσως");
  });

  it("omits the note block when note is empty", () => {
    const html = purchaseReminderHtml({ note: "" });

    expect(html).not.toContain("font-style:italic");
  });

  it("works without any arguments (all defaults)", () => {
    expect(() => purchaseReminderHtml()).not.toThrow();
  });
});

describe("appointmentReminderHtml", () => {
  it("includes appointment date and time in the output", () => {
    const html = appointmentReminderHtml({
      clinicName: "Κτηνιατρείο",
      clientName: "Μαρία",
      animalName: "Ρεξ",
      date: "20/06/2026",
      time: "10:30",
      reason: "Εμβολιασμός",
    });

    expect(html).toContain("20/06/2026");
    expect(html).toContain("10:30");
    expect(html).toContain("Ρεξ");
  });
});
