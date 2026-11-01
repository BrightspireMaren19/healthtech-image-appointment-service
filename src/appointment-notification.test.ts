import assert from "node:assert/strict";
import { decideNotification, type AppointmentRequest } from "./healthtech-image-service.ts";

const now = new Date("2026-10-24T08:00:00.000Z");
const request: AppointmentRequest = {
  patientReference: "patient-42",
  appointmentAt: "2026-10-24T20:00:00.000Z",
  imagePrompt: "A calm, non-identifying diagram of a telehealth check-in",
  consentForEducationalImage: true,
};

const decision = decideNotification(request, now);
assert.deepEqual(decision, {
  send: true,
  reason: "appointment-near",
  message: "Your appointment is within 24 hours. Please review the care image prepared for your visit.",
});

assert.equal(
  decideNotification({ ...request, consentForEducationalImage: false }, now).reason,
  "consent-required",
);
console.log("appointment notification decision: pass");
