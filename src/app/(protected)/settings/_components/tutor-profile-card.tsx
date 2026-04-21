"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getTutorProfile } from "@/actions/admin-actions";
import TutorProfileForm from "./tutor-profile-form";

type TutorProfile = {
  name: string;
  phone: string;
  bio: string;
  color: string;
} | null;

const FORM_ID = "tutor-profile-form";

const TutorProfileCard = () => {
  const [tutor, setTutor] = useState<TutorProfile>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    getTutorProfile().then((res) => {
      if (res.status === 200 && res.data) {
        setTutor({
          name: res.data.name,
          phone: res.data.phone,
          bio: res.data.bio,
          color: res.data.color,
        });
      }
      setIsLoaded(true);
    });
  }, []);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="px-6 py-5">
        <h2 className="text-sm font-semibold">Tutor Profile</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Update your display name, contact info, bio, and calendar color.
        </p>
      </div>

      <Separator />

      <div className="px-6 py-5">
        <TutorProfileForm tutor={tutor} isLoaded={isLoaded} formId={FORM_ID} />
      </div>

      <div className="flex items-center justify-end px-6 py-3.5 border-t border-border bg-muted/40">
        <Button type="submit" form={FORM_ID} size="sm">
          Save changes
        </Button>
      </div>
    </div>
  );
};

export default TutorProfileCard;