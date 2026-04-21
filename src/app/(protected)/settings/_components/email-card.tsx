"use client";

import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Skeleton from "react-loading-skeleton";
import { VerifiedIcon } from "lucide-react";
import { IconMail } from "@tabler/icons-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const EmailCard = () => {
  const { user, isLoaded } = useUser();

  return (
    <Card className="w-full max-w-4xl rounded-2xl p-1 bg-accent border-none">
      <CardHeader className="pt-5">
        <CardTitle>Email Addresses</CardTitle>
      </CardHeader>
      <CardContent className="bg-white dark:bg-background border border-foreground/10 rounded-2xl p-4">
        {!isLoaded ? (
          <div className="flex flex-wrap justify-between items-center gap-y-1">
            <div className="flex gap-3 flex-row justify-start items-center flex-wrap min-w-0">
              <IconMail size={16} className="shrink-0 text-foreground/50" />
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
                  <div className="flex text-foreground/50 gap-3 flex-row justify-start items-center flex-wrap min-w-0">
                    <IconMail size={16} className="shrink-0" />
                    <span className="text-sm break-all">{email.emailAddress}</span>
                    {isVerified ? (
                      <Tooltip>
                        <TooltipTrigger className="cursor-pointer">
                          <VerifiedIcon
                            size={16}
                            className="text-emerald-500"
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          This email is verified
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Unverified
                      </Badge>
                    )}
                    {isPrimary && (
                      <Badge
                        variant="outline"
                        className="text-emerald-500 text-xs"
                      >
                        Primary
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-foreground/50 text-nowrap">
                    Added on {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-GB", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour12: false
                      }
                    ) : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailCard;
