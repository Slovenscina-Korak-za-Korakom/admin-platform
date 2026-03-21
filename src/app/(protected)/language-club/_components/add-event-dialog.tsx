import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import React, { useState } from "react";
import AddEventForm from "./add-event-form";

const AddEventDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        size="sm"
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-sm shadow-blue-500/25 rounded-xl gap-1.5"
      >
        <IconPlus className="w-4 h-4" />
        New Event
      </Button>
      <DialogContent
        className="sm:max-w-[700px] p-0 gap-0 border-0 shadow-2xl rounded-2xl overflow-hidden [&>button:last-child]:hidden max-h-[92vh] sm:h-[640px] flex flex-col sm:flex-row"
      >
        <DialogTitle className="sr-only">Add New Event</DialogTitle>
        <DialogDescription className="sr-only">
          Fill in the details to create a new language club event.
        </DialogDescription>
        <AddEventForm setIsOpen={setIsOpen} />
      </DialogContent>
    </Dialog>
  );
};

export default AddEventDialog;
