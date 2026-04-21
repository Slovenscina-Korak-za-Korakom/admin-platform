"use client";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Dialog, DialogContent, DialogHeader, DialogTitle,} from "@/components/ui/dialog";
import {useState} from "react";
import {Lock} from "lucide-react";
import {IconDots} from "@tabler/icons-react";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu";
import PasswordForm from "@/app/(protected)/settings/_components/password-form";

const PasswordCard = () => {
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleOpenDialog = () => {
    setDropdownOpen(false);
    setOpen(true);
  };

  return (
    <Card className="w-full max-w-4xl rounded-2xl p-1 bg-accent border-none">
      <CardHeader className="pt-5">
        <CardTitle>Password</CardTitle>
      </CardHeader>
      <CardContent
        className="bg-white dark:bg-background border border-foreground/10 rounded-2xl px-4 py-6 flex items-center justify-between">
        <div className="inline-flex justify-start items-center gap-2 text-foreground/80 text-xl">
          <Lock size={14} className="text-foreground/60"/> ••••••••••••••
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger
              className="p-1 cursor-pointer rounded-sm border bg-white dark:bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:hover:bg-input/50">
              <IconDots size={14}/>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="shadow-lg w-fit">
              <DropdownMenuItem className="py-0 px-2 text-nowrap" onClick={handleOpenDialog}>
                Change password
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DialogContent
            className="rounded-2xl px-0"
            onPointerDownOutside={(e) => {
              e.preventDefault();
            }}
            onEscapeKeyDown={(e) => {
              e.preventDefault();
            }}
            showCloseButton={false}>
            <DialogHeader className="hidden">
              <DialogTitle>Change password</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col w-full justify-center items-center px-6">
              <PasswordForm setOpen={setOpen}/>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default PasswordCard;
