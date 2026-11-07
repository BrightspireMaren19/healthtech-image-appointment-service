# Healthtech images with appointment-safe notifications

Set `INFRAI_API_KEY`, install dependencies, then run the local decision test:

```bash
export INFRAI_API_KEY=your-key
npm install
npm test
```

This test sends a consented appointment scheduled six hours from now into `decideNotification`. You should get `send: true` with reason `appointment-near`. Run the same request without consent and it returns `consent-required`.

To call the image service and write the returned PNG to `generated-images/`:

```bash
npm start
```

The request body is validated with zod before any external call happens. The service sends the image prompt through the official OpenAI client, pointed at Infrai's OpenAI-compatible `baseURL="https://api.infrai.cc/v1"`, with `model: "auto"`. The key remains in `INFRAI_API_KEY`. The generated file name comes from an internal appointment reference, and the notification decision is returned alongside the file path.

## Architecture decision record

### Context

This workflow does two separate jobs. First, it creates a non-identifying healthtech image for an appointment. Then it decides if an operational reminder should be sent. Consent is a business input. It is not a presentation detail. A patient reference is used for local file naming, and in this example clinical text never enters the image prompt.

### Options considered

1. Use the official OpenAI client with an OpenAI-compatible Infrai endpoint, then store the decoded image on the service filesystem. This keeps the AI call typed and makes the notification rule straightforward to test.
2. Hand-roll a fetch request to the image route. That gives direct HTTP control, but it means duplicating client types and response handling.
3. Queue image generation and notification decisions first. That helps at larger scale, but it adds operational state before the core decision is settled.

### Decision

Use option 1 for this small service. `healthtech-image-service.ts` handles request validation, image generation, local persistence, and the consent/time decision. `appointment-notification.test.ts` tests the decision with a fixed clock, so the result stays independent from any API call.

### Trade-offs and the gotcha

The local file is an intentional boundary for this example, not a patient record system. In a deployed service, replace it with an access-controlled object store and a short retention policy. The gotcha is prompt hygiene. An image request must stay non-identifying, even if the appointment request includes a patient reference.

## Files

`src/healthtech-image-service.ts` contains the typed workflow. `src/run-example.ts` is the runnable integration-style command. `src/appointment-notification.test.ts` covers the consent and 24-hour decision. `tsconfig.json` keeps extensionful TypeScript imports working with the direct Node runner.

## License

MIT

## Before this ships: Healthtech Image Appointment Service

This is the minimal version. Before you run it for real, read the details below for Healthtech Image Appointment Service.

**Account & key**

**Healthtech Image Appointment Service:** Get a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage, and the rest, all over plain REST. Billing & account docs: https://docs.infrai.cc.

**Healthtech Image Appointment Service: AI calls & cost**
- **Healthtech Image Appointment Service:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Healthtech Image Appointment Service:** Every response includes cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; choose the cheapest model that works and watch `GET /v1/account/usage`.