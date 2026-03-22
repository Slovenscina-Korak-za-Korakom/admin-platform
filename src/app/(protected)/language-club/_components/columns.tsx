/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { langClubTable } from "@/db/schema";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckedState } from "@radix-ui/react-checkbox";
import { toast } from "sonner";
import { deleteEvent } from "@/actions/language-club";
import { IconCalendarEvent, IconEdit, IconTrash } from "@tabler/icons-react";
import { useEditDialog } from "./edit-dialog-context";
import Link from "next/link";

const handleDeleteEvent = async (id: number, router: any) => {
  const res = await deleteEvent(id);
  if (res.success) {
    toast.success(res.message);
    router.refresh();
  } else {
    toast.error(res.message);
  }
};

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Event = typeof langClubTable.$inferSelect;

export const createColumns = (router: any): ColumnDef<Event>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          ((table.getIsSomePageRowsSelected() &&
            "indeterminate") as CheckedState)
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "theme",
    header: "Theme",
  },
  {
    accessorKey: "tutor",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Tutor
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("date") as Date;
      const formatted = new Date(date).toLocaleString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      return <div className="text-left font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "location",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Location
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "maxBooked",
    header: "Max Booked",
  },
  {
    accessorKey: "peopleBooked",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          People Booked
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "level",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Level
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "duration",
    header: "Duration",
  },
  {
    accessorKey: "price",
    header: () => <div className="text-right">Price</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("price"));
      const formatted = new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
      }).format(amount);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      // Move the cell content to a React component to use hooks safely
      function ActionsCell({ event }: { event: any }) {
        const { openDialog } = useEditDialog();
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="space-y-1">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() =>
                  navigator.clipboard.writeText(event.id.toString())
                }
              >
                Copy event ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer inline-flex items-center gap-2"
                onClick={() => openDialog(event.id)}
              >
                <IconEdit className="w-4 h-4" />
                Edit booking
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link
                  href={`/language-club/booking?id=${event.id}`}
                  className="inline-flex items-center gap-2"
                >
                  <IconCalendarEvent className="w-4 h-4" /> View booking
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer bg-red-100 hover:!bg-red-200 text-destructive hover:!text-destructive"
                onClick={() => handleDeleteEvent(event.id, router)}
              >
                <IconTrash className="w-4 h-4 text-destructive" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }

      return <ActionsCell event={row.original} />;
    },
  },
];

// Keep the old export for backward compatibility
export const columns = createColumns(null);
