"use client";

import React from "react";
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
import {SessionData} from "@/components/calendar/types";

const TimeblockTabs = ({
                         data,
                         initialTab,
                       }: {
  data: SessionData[];
  initialTab?: string;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = initialTab || searchParams.get("tab") || "calendar";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`/my-schedule?${params.toString()}`);
  };

  return (
    <Tabs
      value={currentTab}
      onValueChange={handleTabChange}
      className="flex flex-col flex-1 min-h-0 space-y-4"
    >
      <TabsList className="mx-auto flex-shrink-0">
        <TabsTrigger value="calendar" className="cursor-pointer">
          <IconCalendar className="mr-2 h-4 w-4"/>
          Calendar View
        </TabsTrigger>
        <TabsTrigger value="templates" className="cursor-pointer">
          <IconCalendarEvent className="mr-2 h-4 w-4"/>
          My Schedule
        </TabsTrigger>
        <TabsTrigger value="add-event" className="cursor-pointer">
          <IconCalendarPlus className="mr-2 h-4 w-4"/>
          Add Event
        </TabsTrigger>
      </TabsList>

      <TabsContent value="calendar" className="flex-1 min-h-0 overflow-y-auto">
        <Calendar data={data}/>
      </TabsContent>

      <TabsContent value="templates" className="flex-1 min-h-0 overflow-y-auto">
        <ScheduleBuilder/>
        {/*<ScheduleTemplateBuilder />*/}
      </TabsContent>

      <TabsContent value="add-event" className="flex-1 min-h-0 overflow-y-auto">
        <SessionScheduler data={data}/>
      </TabsContent>
    </Tabs>
  );
};

export default TimeblockTabs;
