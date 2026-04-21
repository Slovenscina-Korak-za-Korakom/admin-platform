"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Lock } from "lucide-react";
import PasswordForm from "@/app/(protected)/settings/_components/password-form";

const PasswordCard = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="px-6 py-5">
          <h2 className="text-sm font-semibold">Password</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Change the password used to sign in to your account.
          </p>
        </div>

        <Separator />

        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock size={14} className="shrink-0" />
            <span className="text-base tracking-[0.2em]">••••••••••••</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            Change password
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="rounded-2xl px-0"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          showCloseButton={false}
        >
          <DialogHeader className="hidden">
            <DialogTitle>Change password</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col w-full justify-center items-center px-6">
            <PasswordForm setOpen={setOpen} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PasswordCard;
