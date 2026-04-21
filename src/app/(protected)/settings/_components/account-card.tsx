"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PersonalForm from "./personal-form";
import Skeleton from "react-loading-skeleton";
import { Input } from "@/components/ui/input";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const AccountCard = () => {
  const { user, isLoaded } = useUser();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE_MB = 2;

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const fileSizeMB = file.size / (1024 * 1024);

    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      toast.error("File too large", {
        description: "Please upload an image smaller than 2MB.",
      });
      return;
    }

    try {
      setIsUploading(true);
      await user.setProfileImage({ file });
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
    <>
      <Card className="w-full max-w-4xl rounded-2xl p-1 bg-accent border-none">
        <CardHeader className="pt-5">
          <CardTitle className={"capitalize"}>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="bg-white dark:bg-background border-1 border-foreground/10 rounded-2xl">
          <div className="my-8">
            <div className="flex flex-row items-center gap-4">
              <div className="relative h-20 w-20 rounded-full overflow-hidden border">
                {isUploading ? (
                  <Skeleton width={80} height={80} circle  containerClassName="leading-0 block" />
                ) : (
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={user?.imageUrl} />
                    <AvatarFallback></AvatarFallback>
                  </Avatar>
                )}
              </div>

              <Input
                type="file"
                ref={fileInputRef}
                placeholder="Update avatar"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isUploading}
              />

              <div className="flex flex-col gap-1">
                <div className="flex flex-row justify-center items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer w-fit bg-white dark:bg-background capitalize"
                    onClick={handleFileClick}
                    disabled={isUploading}
                  >
                    {isUploading ? "Uploading" : "Update avatar"}
                  </Button>
                  <Button
                    variant="link"
                    className="cursor-pointer text-indigo-400"
                    size="sm"
                    onClick={async () => {
                      try {
                        setIsUploading(true);
                        await user?.setProfileImage({ file: null });

                        toast.success("Avatar removed", {
                          description:
                            "Your avatar has been reset to the default.",
                        });
                      } catch (err) {
                        console.error(err);
                        toast.error("Failed to remove avatar", {
                          description:
                            "Something went wrong while clearing your avatar.",
                        });
                      } finally {
                        setIsUploading(false);
                      }
                    }}
                    disabled={isUploading}
                  >
                    Clear
                  </Button>
                </div>
                <span className="text-xs text-foreground/50">
                  Recommended size 1:1, up to 2mb
                </span>
              </div>
            </div>
          </div>
          <PersonalForm user={user} isLoaded={isLoaded} />
        </CardContent>
      </Card>
    </>
  );
};

export default AccountCard;
