import { Resend } from "resend";

const client = new Resend(process.env.RESEND_API_KEY || "");

export const resend = {
  emails: {
    send: (...args: Parameters<typeof client.emails.send>) => {
      if (process.env.NODE_ENV === "development" && process.env.RESEND_DISABLED === "true") {
        console.log("[resend] email sending disabled, skipping.");
        return Promise.resolve({ data: null, error: null });
      }
      return client.emails.send(...args);
    },
  },
};
