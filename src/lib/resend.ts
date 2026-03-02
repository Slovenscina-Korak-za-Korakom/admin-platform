import { Resend } from "resend";

const resendClient = new Resend(process.env.RESEND_API_KEY || "");

const emailsEnabled = process.env.SEND_EMAILS !== "false";

export const resend = {
  emails: {
    send: async (params: Parameters<typeof resendClient.emails.send>[0]) => {
      if (!emailsEnabled) {
        console.log("[Email skipped - SEND_EMAILS=false]", {
          to: params.to,
          subject: params.subject,
        });
        return { data: null, error: null };
      }
      return resendClient.emails.send(params);
    },
  },
};
