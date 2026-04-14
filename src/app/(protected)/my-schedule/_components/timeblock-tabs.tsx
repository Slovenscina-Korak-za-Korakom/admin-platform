"use client";

import React, {useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {AnimatedButtonGroup, AnimatedButtonGroupItem} from "@/components/ui/animated-button-group";
import {IconCalendar, IconCalendarEvent, IconCalendarPlus,} from "@tabler/icons-react";
import ScheduleBuilder from "@/app/(protected)/my-schedule/_components/schedule-builder";
import Calendar from "@/components/calendar/calendar";
import SessionScheduler from "@/app/(protected)/my-schedule/_components/session-scheduler";
import {AvailableSlotData, ScheduleData, SessionData, StudentInfo} from "@/components/calendar/types";

const TABS = [
  {value: "calendar", hex: "#2563eb", lightColor: "#eff6ff", Icon: IconCalendar, label: "Calendar View"},
  {value: "templates", hex: "#5025eb", lightColor: "#eff6ff", Icon: IconCalendarEvent, label: "My Schedule"},
  {value: "add-event", hex: "#259feb", lightColor: "#eff6ff", Icon: IconCalendarPlus, label: "Add Event"},
] as const;


const TimeblockTabs = ({
                         data,
                         availableSlots,
                         initialTab,
                         schedule,
                         studentsInfo,
                       }: {
  data: SessionData[];
  availableSlots: AvailableSlotData[];
  schedule: ScheduleData | null;
  initialTab?: string;
  studentsInfo: Record<string, StudentInfo | null>;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentTab, setCurrentTab] = useState(
    initialTab || searchParams.get("tab") || "calendar"
  );

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`/my-schedule?${params.toString()}`);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-4">
      <AnimatedButtonGroup
        value={currentTab}
        onChange={handleTabChange}
        className="mx-auto flex-shrink-0"
      >
        {TABS.map(({value, hex, lightColor, Icon, label}) => (
          <AnimatedButtonGroupItem key={value} value={value} hex={hex} lightColor={lightColor}>
            <Icon className="h-4 w-4"/>
            {label}
          </AnimatedButtonGroupItem>
        ))}
      </AnimatedButtonGroup>

      <div className="flex-1 min-h-0 overflow-hidden">
        {currentTab === "calendar" && <Calendar data={data} availableSlots={availableSlots} studentsInfo={studentsInfo}/>}
        {currentTab === "templates" && schedule && <ScheduleBuilder schedule={schedule}/>}
        {currentTab === "add-event" && <SessionScheduler data={data} availableSlots={availableSlots}/>}
      </div>
    </div>
  );
};

export default TimeblockTabs;
