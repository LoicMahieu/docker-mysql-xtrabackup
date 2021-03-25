import fetch from "node-fetch";
import { log } from "./log";

interface IVariables {
  [s: string]: string;
}

export async function triggerWebhook(
  webhook: string,
  options?: any,
  variables?: IVariables
) {
  log("Trigger webhook", webhook);
  try {
    const webhookUri = template(webhook, variables);
    const result = await fetch(webhookUri, options);
    log("Webhook result with statusCode = ", result.status + "");
  } catch (err) {
    console.error("Error during webhook");
    console.error(err);
  }
}

function template(webhook: string, variables?: IVariables) {
  if (!variables) {
    return webhook;
  }

  return Object.keys(variables).reduce(
    (res, key) => res.replace(`%${key}%`, variables[key]),
    webhook
  );
}
