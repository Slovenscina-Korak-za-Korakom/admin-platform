"use client";

import {useEffect} from "react";
import {useRouter, useSearchParams} from "next/navigation";

export const TimezoneSync = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (searchParams.get("tz") !== tz) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tz", tz);
      router.replace(`?${params.toString()}`);
    }
  }, []);

  return null;
};
