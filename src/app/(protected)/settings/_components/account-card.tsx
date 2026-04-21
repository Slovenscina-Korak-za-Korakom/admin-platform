"use client";

import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import PersonalForm from "./personal-form";
import Skeleton from "react-loading-skeleton";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {updateTutorAvatar} from "@/actions/admin-actions";

const FORM_ID = "personal-info-form";

const AccountCard = () => {
  const { user, isLoaded } = useUser();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileClick = () => fileInputRef.current?.click();

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size / (1024 * 1024) > 2) {
      toast.error("File too large", {
        description: "Please upload an image smaller than 2MB.",
      });
      return;
    }

    try {
      setIsUploading(true);
      const { publicUrl } = await user.setProfileImage({ file });
      if (publicUrl) await updateTutorAvatar(publicUrl);
      toast.success("Avatar updated", {
        description: "Your profile image has been updated successfully.",
      });
    } catch (err) {
      console.error(err);
      toast.error("Upload failed", {
        description: "Something went wrong while uploading your avatar.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="px-6 py-5">
        <h2 className="text-sm font-semibold">Personal Information</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Update your name and profile picture.
        </p>
      </div>

      <Separator />

      <div className="px-6 py-5">
        <div className="flex items-center gap-5">
          {isUploading ? (
            <Skeleton width={64} height={64} circle containerClassName="leading-0 block shrink-0" />
          ) : (
            <Avatar className="w-16 h-16 shrink-0">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback>
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
          )}

          <Input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
            disabled={isUploading}
          />

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFileClick}
                disabled={isUploading}
              >
                {isUploading ? "Uploading…" : "Change avatar"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                disabled={isUploading}
                onClick={async () => {
                  try {
                    setIsUploading(true);
                    await user?.setProfileImage({ file: null });
                    toast.success("Avatar removed");
                  } catch (err) {
                    console.error(err);
                    toast.error("Failed to remove avatar");
                  } finally {
                    setIsUploading(false);
                  }
                }}
              >
                Remove
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Recommended 1:1 ratio, max 2 MB.
            </p>
          </div>
        </div>
      </div>

      <Separator />

      <div className="px-6 py-5">
        <PersonalForm user={user} isLoaded={isLoaded} formId={FORM_ID} />
      </div>

      <div className="flex items-center justify-end px-6 py-3.5 border-t border-border bg-muted/40">
        <Button type="submit" form={FORM_ID} size="sm">
          Save changes
        </Button>
      </div>
    </div>
  );
};

export default AccountCard;
