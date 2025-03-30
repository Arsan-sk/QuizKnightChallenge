import * as React from "react";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { Input } from "./input";
import { Label } from "./label";

interface DateTimePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  className?: string;
}

export function DateTimePicker({
  value,
  onChange,
  minDate,
  className,
}: DateTimePickerProps) {
  // Ensure we have a proper date object or undefined
  const safeDate = React.useMemo(() => {
    if (!value) return undefined;
    
    // If value is already a Date object, use it
    if (value instanceof Date) return value;
    
    // If value is a string (ISO format), convert it to Date
    if (typeof value === 'string') {
      try {
        return new Date(value);
      } catch (e) {
        console.error("Invalid date format:", e);
        return undefined;
      }
    }
    
    return undefined;
  }, [value]);
  
  const [date, setDate] = React.useState<Date | undefined>(safeDate);

  const handleSelect = (newDate: Date | undefined) => {
    if (!newDate) {
      setDate(undefined);
      onChange(null);
      return;
    }

    let updatedDate = new Date(newDate);
    
    if (date) {
      // Preserve the time when selecting a new date
      updatedDate.setHours(date.getHours());
      updatedDate.setMinutes(date.getMinutes());
    }

    setDate(updatedDate);
    onChange(updatedDate);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!date) return;

    const [hours, minutes] = e.target.value.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return;

    const newDate = new Date(date);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    setDate(newDate);
    onChange(newDate);
  };

  const formattedDate = date ? format(date, "PPP") : "Pick a date";
  const formattedTime = date ? format(date, "HH:mm") : "00:00";

  // Update internal date when value changes externally
  React.useEffect(() => {
    if (safeDate) {
      setDate(safeDate);
    } else {
      setDate(undefined);
    }
  }, [safeDate]);

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="grid grid-cols-2 gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "flex justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formattedDate}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSelect}
              disabled={(date) => minDate ? date < minDate : false}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <div className="grid gap-1">
          <Label htmlFor="time">Time</Label>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Input
              id="time"
              type="time"
              value={formattedTime}
              onChange={handleTimeChange}
              className="flex-1"
              disabled={!date}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 