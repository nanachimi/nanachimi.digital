import twilio from "twilio";

const client =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

export async function sendVerificationSms(
  phone: string,
  code: string
): Promise<boolean> {
  if (!client) {
    console.log(`[Twilio][Mock] SMS to ${phone}: Code ${code}`);
    return true;
  }

  try {
    await client.messages.create({
      body: `Ihr Bestätigungscode für nanachimi.digital: ${code}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
    return true;
  } catch (err) {
    console.error("[Twilio] SMS send error:", err);
    return false;
  }
}
