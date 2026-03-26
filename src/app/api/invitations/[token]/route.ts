import { NextRequest } from "next/server";
import db from "@/db";
import { regularInvitationsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";

function htmlResponse(title: string, message: string, status: number) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Slovenščina Korak za Korkom</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background-color: #fafafa;
      color: #1a1a1a;
    }
    .card {
      max-width: 440px;
      padding: 48px 40px;
      text-align: center;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      border: 1px solid #e5e7eb;
    }
    h1 { font-size: 24px; font-weight: 600; margin-bottom: 12px; }
    p { font-size: 16px; color: #6b7280; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;

  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const action = request.nextUrl.searchParams.get("action");

  if (!action || !["accept", "decline"].includes(action)) {
    return htmlResponse(
      "Invalid Request",
      "The link you followed is invalid. Please check the email and try again.",
      400
    );
  }

  try {
    const invitations = await db
      .select()
      .from(regularInvitationsTable)
      .where(eq(regularInvitationsTable.token, token))
      .limit(1);

    if (invitations.length === 0) {
      return htmlResponse(
        "Invitation Not Found",
        "This invitation link is invalid or has expired.",
        404
      );
    }

    const invitation = invitations[0];

    if (invitation.status !== "pending") {
      return htmlResponse(
        "Already Responded",
        `This invitation has already been ${invitation.status}. No further action is needed.`,
        200
      );
    }

    if (action === "accept") {
      let studentClerkId: string | null = null;

      try {
        const client = await clerkClient();
        const users = await client.users.getUserList({
          emailAddress: [invitation.studentEmail],
        });

        if (users.data.length > 0) {
          studentClerkId = users.data[0].id;
        }
      } catch {
        // Student may not have a Clerk account yet - that's ok
      }

      await db
        .update(regularInvitationsTable)
        .set({
          status: "accepted",
          studentClerkId,
          updatedAt: new Date(),
        })
        .where(eq(regularInvitationsTable.id, invitation.id));

      return htmlResponse(
        "Invitation Accepted",
        "You have accepted the recurring session invitation. Your tutor has been notified and the sessions will appear on your schedule.",
        200
      );
    } else {
      await db
        .update(regularInvitationsTable)
        .set({
          status: "declined",
          updatedAt: new Date(),
        })
        .where(eq(regularInvitationsTable.id, invitation.id));

      return htmlResponse(
        "Invitation Declined",
        "You have declined the session invitation. Your tutor has been notified.",
        200
      );
    }
  } catch (error) {
    console.error("Error processing invitation:", error);
    return htmlResponse(
      "Something Went Wrong",
      "An error occurred while processing your response. Please try again later.",
      500
    );
  }
}
