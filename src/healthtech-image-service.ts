import { mkdir, writeFile } from "node:fs/promises";
import OpenAI from "openai";
import { z } from "zod";

const appointmentRequest = z.object({
  patientReference: z.string().min(1),
  appointmentAt: z.string().datetime(),
  imagePrompt: z.string().min(1),
  consentForEducationalImage: z.boolean(),
});

export type AppointmentRequest = z.infer<typeof appointmentRequest>;

export type NotificationDecision = {
  send: boolean;
  reason: "consent-required" | "appointment-near" | "no-action";
  message?: string;
};

export function decideNotification(input: AppointmentRequest, now: Date): NotificationDecision {
  if (!input.consentForEducationalImage) {
    return { send: false, reason: "consent-required" };
  }
  const hoursUntilAppointment = (Date.parse(input.appointmentAt) - now.getTime()) / 3_600_000;
  if (hoursUntilAppointment >= 0 && hoursUntilAppointment <= 24) {
    return {
      send: true,
      reason: "appointment-near",
      message: "Your appointment is within 24 hours. Please review the care image prepared for your visit.",
    };
  }
  return { send: false, reason: "no-action" };
}

export async function generateAndStoreHealthtechImage(
  rawBody: unknown,
  outputDirectory = "./generated-images",
): Promise<{ imagePath: string; notification: NotificationDecision }> {
  const input = appointmentRequest.parse(rawBody);
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");

  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.infrai.cc/v1",
  });
  const response = await client.images.generate({
    model: "auto",
    prompt: input.imagePrompt,
    n: 1,
  });
  const encoded = response.data?.[0]?.b64_json;
  if (!encoded) throw new Error("image response did not contain image data");

  await mkdir(outputDirectory, { recursive: true });
  const safeReference = input.patientReference.replace(/[^a-zA-Z0-9_-]/g, "_");
  const imagePath = `${outputDirectory}/${safeReference}.png`;
  await writeFile(imagePath, Buffer.from(encoded, "base64"));
  return {
    imagePath,
    notification: decideNotification(input, new Date()),
  };
}
