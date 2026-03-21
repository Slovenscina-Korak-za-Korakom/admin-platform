"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import React, { useEffect, useState } from "react";
import AddEventForm from "./add-event-form";
import { useEditDialog } from "./edit-dialog-context";
import { getBookingById } from "@/actions/language-club";
import { Loader2 } from "lucide-react";
import { Booking } from "../booking/_components/bookings";

const EditEventDialog = () => {
  const { isOpen, closeDialog, editingEventId } = useEditDialog();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true);
      const response = await getBookingById(editingEventId as number);
      if (!response) {
        closeDialog();
        return;
      }
      setBooking(response);
      setLoading(false);
    };
    fetchBooking();
  }, [editingEventId, closeDialog]);

  if (!editingEventId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={closeDialog}>
      <DialogContent
        className="sm:max-w-[700px] p-0 gap-0 border-0 shadow-2xl rounded-2xl overflow-hidden [&>button:last-child]:hidden max-h-[92vh] sm:h-[640px] flex flex-col sm:flex-row"
      >
        <DialogTitle className="sr-only">Edit Event</DialogTitle>
        <DialogDescription className="sr-only">
          Update the event details below.
        </DialogDescription>
        {loading ? (
          <div className="flex-1 flex justify-center items-center min-h-[300px]">
            <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
          </div>
        ) : (
          <AddEventForm setIsOpen={closeDialog} booking={booking} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditEventDialog;
