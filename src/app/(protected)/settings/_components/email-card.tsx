"use client";

import { useUser } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { VerifiedIcon } from "lucide-react";
import { IconMail } from "@tabler/icons-react";
import Skeleton from "react-loading-skeleton";

const EmailCard = () => {
  const { user, isLoaded } = useUser();

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="px-6 py-5">
        <h2 className="text-sm font-semibold">Email Addresses</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Email addresses associated with your account.
        </p>
      </div>

      <Separator />

      <div className="px-6 py-5">
        {!isLoaded ? (
          <div className="flex flex-wrap justify-between items-center gap-y-1">
            <div className="flex gap-3 items-center">
              <IconMail size={14} className="text-muted-foreground shrink-0" />
              <Skeleton width={200} height={14} />
              <Skeleton width={14} height={14} />
              <Skeleton width={64} height={14} />
            </div>
            <Skeleton width={120} height={12} />
          </div>
        ) : (
          <ul className="space-y-4">
            {user?.emailAddresses.map((email) => {
              const isPrimary = email.id === user?.primaryEmailAddressId;
              const isVerified = email.verification?.status === "verified";

              return (
                <li
                  key={email.id}
                  className="flex flex-wrap justify-between items-center gap-y-1"
                >
                  <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                    <IconMail size={14} className="text-muted-foreground shrink-0" />
                    <span className="text-sm break-all">{email.emailAddress}</span>
                    {isVerified ? (
                      <Tooltip>
                        <TooltipTrigger className="cursor-default">
                          <VerifiedIcon size={14} className="text-emerald-500" />
                        </TooltipTrigger>
                        <TooltipContent>Verified</TooltipContent>
                      </Tooltip>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Unverified</Badge>
                    )}
                    {isPrimary && (
                      <Badge variant="outline" className="text-emerald-600 text-xs">
                        Primary
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground text-nowrap">
                    Added{" "}
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-GB", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour12: false,
                        })
                      : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default EmailCard;
