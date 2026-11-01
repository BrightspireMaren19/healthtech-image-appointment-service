import { generateAndStoreHealthtechImage } from "./healthtech-image-service.ts";

const body = {
  patientReference: "demo-appointment",
  appointmentAt: new Date(Date.now() + 6 * 3_600_000).toISOString(),
  imagePrompt: "A clean, non-identifying illustration for a telehealth appointment reminder",
  consentForEducationalImage: true,
};

const result = await generateAndStoreHealthtechImage(body);
console.log(JSON.stringify(result, null, 2));
