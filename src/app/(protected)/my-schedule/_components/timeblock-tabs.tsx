"use client";

import React, {useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {
  IconCalendar,
  IconCalendarEvent,
  IconCalendarPlus,
} from "@tabler/icons-react";
import ScheduleBuilder from "@/app/(protected)/my-schedule/_components/schedule-builder";
import Calendar from "@/components/calendar/calendar";
import SessionScheduler from "@/app/(protected)/my-schedule/_components/session-scheduler";
import {SessionData, AvailableSlotData} from "@/components/calendar/types";

const TimeblockTabs = ({
                         data,
                         availableSlots,
                         initialTab,
                       }: {
  data: SessionData[];
  availableSlots: AvailableSlotData[];
  initialTab?: string;
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
    <Tabs
      value={currentTab}
      defaultValue="calendar"
      onValueChange={handleTabChange}
      className="flex flex-col flex-1 min-h-0 space-y-4"
    >
      <TabsList className="mx-auto flex-shrink-0 h-auto p-1 gap-1 bg-muted/60 border border-border/50 rounded-xl">
        <TabsTrigger
          value="calendar"
          className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg px-4 py-2 text-sm font-medium transition-all"
        >
          <IconCalendar className="mr-2 h-4 w-4"/>
          Calendar View
        </TabsTrigger>
        <TabsTrigger
          value="templates"
          className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg px-4 py-2 text-sm font-medium transition-all"
        >
          <IconCalendarEvent className="mr-2 h-4 w-4"/>
          My Schedule
        </TabsTrigger>
        <TabsTrigger
          value="add-event"
          className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg px-4 py-2 text-sm font-medium transition-all"
        >
          <IconCalendarPlus className="mr-2 h-4 w-4"/>
          Add Event
        </TabsTrigger>
      </TabsList>

      <TabsContent value="calendar" className="flex-1 min-h-0 overflow-hidden">
        <Calendar data={data} availableSlots={availableSlots}/>
      </TabsContent>

      <TabsContent value="templates" className="flex-1 min-h-0 overflow-hidden">
        <ScheduleBuilder/>
      </TabsContent>

      <TabsContent value="add-event" className="flex-1 min-h-0 overflow-hidden">
        <SessionScheduler data={data} availableSlots={availableSlots}/>
      </TabsContent>
    </Tabs>
  );
};

export default TimeblockTabs;
