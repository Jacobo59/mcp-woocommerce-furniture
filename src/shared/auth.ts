export function getBasicAuthHeader(
  consumerKey: string,
  consumerSecret: string
): string {
  const token = Buffer.from(
    `${consumerKey}:${consumerSecret}`
  ).toString("base64");

  return `Basic ${token}`;
}
