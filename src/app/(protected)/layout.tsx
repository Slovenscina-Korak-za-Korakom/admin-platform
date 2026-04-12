import {AppSidebar} from "@/components/app-sidebar";
import {SiteHeader} from "@/components/site-header";
import {SidebarInset, SidebarProvider} from "@/components/ui/sidebar";
import React from "react";
import {currentUser} from "@clerk/nextjs/server";
import {notFound} from "next/navigation";
import {cookies} from "next/headers";

const ProtectedLayout = async ({children}: { children: React.ReactNode }) => {

  const user = await currentUser();
  if (!user) {
    throw notFound();
  }

  const adminUsers = process.env.ADMIN_USERS?.split(",");
  const isAdmin = adminUsers?.includes(user.emailAddresses[0].emailAddress);

  if (!isAdmin) {
    throw notFound();
  }

  const cookieStore = await cookies();
  const sidebarCookie = cookieStore.get("sidebar_state")?.value;
  const defaultSidebarOpen = sidebarCookie !== undefined ? sidebarCookie === "true" : true;

  return (
    <SidebarProvider
      defaultOpen={defaultSidebarOpen}
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="sidebar"/>
      <SidebarInset>
        <SiteHeader/>
        <div className={"h-[calc(100vh-var(--header-height))]"}>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default ProtectedLayout;
