
import fetch from "node-fetch";

interface IVariables {
  [s: string]: string;
}

export async function triggerWebhook(webhook: string, options?: object, variables?: IVariables) {
  console.log("Trigger webhook", webhook);
  try {
    const webhookUri = template(webhook, variables);
    const result = await fetch(webhookUri, options);
    console.log("Webhook result with statusCode = ", result.status);
  } catch (err) {
    console.error("Error during webhook");
    console.error(err);
  }
}

function template(webhook: string, variables?: IVariables) {
  if (!variables) {
    return webhook;
  }

  return Object.keys(variables)
    .reduce((res, key) => res.replace(`%${key}%`, variables[key]), webhook);
}
