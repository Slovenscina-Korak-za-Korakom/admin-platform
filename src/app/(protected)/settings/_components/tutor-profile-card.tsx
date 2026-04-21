"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTutorProfile } from "@/actions/admin-actions";
import TutorProfileForm from "./tutor-profile-form";

type TutorProfile = {
  name: string;
  phone: string;
  bio: string;
  color: string;
} | null;

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
    <Card className="w-full max-w-4xl rounded-2xl p-1 bg-accent border-none">
      <CardHeader className="pt-5">
        <CardTitle>Tutor Profile</CardTitle>
      </CardHeader>
      <CardContent className="bg-white dark:bg-background border-1 border-foreground/10 rounded-2xl">
        <div className="my-8">
          <TutorProfileForm tutor={tutor} isLoaded={isLoaded} />
        </div>
      </CardContent>
    </Card>
  );
};

export default TutorProfileCard;