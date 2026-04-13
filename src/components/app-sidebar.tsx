"use client";

import * as React from "react";

import {NavMain} from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {SIDEBAR_DATA} from "@/lib/docs";
import {IconUserHexagon} from "@tabler/icons-react";
import {NavSecondary} from "./nav-secondary";

export function AppSidebar({...props}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border/50 px-3 py-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex justify-center items-center">
            <SidebarMenuButton
              size="lg"
              className="cursor-default pointer-events-none justify-start gap-3 px-3 h-auto py-2.5 hover:bg-transparent group-data-[collapsible=icon]:justify-center"
            >
              <div
                className="flex shrink-0 items-center justify-center size-8 rounded-lg text-white shadow-sm group-data-[collapsible=icon]:size-6 group-data-[collapsible=icon]:rounded-md"
                style={{
                  background: 'var(--sidebar-icon-gradient)'
                }}
              >
                <IconUserHexagon className="size-5 group-data-[collapsible=icon]:size-4"/>
              </div>
              <div className="flex flex-col items-start gap-0.5 group-data-[collapsible=icon]:hidden">
                <span className="text-xs font-semibold leading-none text-sidebar-foreground/90">
                  ADMIN
                </span>
                <span
                  className="text-[10px] font-medium leading-none text-sidebar-foreground/60 truncate max-w-[180px]">
                  Slovenščina Korak za Korakom
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={SIDEBAR_DATA.navMain}/>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/50 p-0">
        <NavSecondary items={SIDEBAR_DATA.navSecondary}/>
      </SidebarFooter>
    </Sidebar>
  );
}
