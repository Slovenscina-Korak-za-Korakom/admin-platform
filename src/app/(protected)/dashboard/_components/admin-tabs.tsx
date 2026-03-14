import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Suspense} from "react";
import {AdminDashboard} from "@/app/(protected)/dashboard/_components/admin-dashboard";
import {TimezoneSync} from "@/app/(protected)/dashboard/_components/timezone-sync";
import TutorDashboard from "@/app/(protected)/dashboard/_components/tutor-dashboard";


export const AdminTabs = ({filter, timezone}: { filter: string | undefined, timezone: string }) => {

  const TABS = [
    {
      value: "admin", label: "Admin", content: (
        <AdminDashboard filter={filter}/>
      )
    },
    {
      value: "tutor", label: "Tutor", content: (
        <>
          <Suspense><TimezoneSync/></Suspense>
          <TutorDashboard timezone={timezone}/>
        </>
      )
    }
  ];

  return (
    <Tabs
      defaultValue={"admin"}
      className="flex flex-col gap-2"
    >
      <TabsList
        className="mt-6 mr-6 ml-auto inline-flex rounded-xl border border-border text-xs font-medium overflow-hidden bg-transparent p-0 gap-0"
      >
        {TABS.map((tab, i) => (
          <TabsTrigger
            key={i}
            className=
              "px-3 py-1.5 transition-colors rounded-none data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white bg-background text-muted-foreground hover:bg-muted/60"
            value={tab.value}>{tab.label}</TabsTrigger>
        ))}
      </TabsList>
      {TABS.map((tab, i) => (
          <TabsContent key={i} value={tab.value}>
            {tab.content}
          </TabsContent>
      ))}
    </Tabs>
  );
};
