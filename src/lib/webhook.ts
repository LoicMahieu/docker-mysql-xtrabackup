
import fetch from "node-fetch";

export async function triggerWebhook(webhook: string, options?: any) {
  console.log("Trigger webhook", webhook);
  try {
    const result = await fetch(webhook, options);
    console.log("Webhook result with statusCode = ", result.status);
  } catch (err) {
    console.error("Error during webhook");
    console.error(err);
  }
}
