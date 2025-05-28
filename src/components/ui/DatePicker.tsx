import React from 'react';
import ReactDatePicker from 'react-datepicker';
import { Calendar } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import clsx from 'clsx';

interface DatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholderText?: string;
  error?: boolean;
  disabled?: boolean;
  className?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  selected,
  onChange,
  minDate,
  maxDate,
  placeholderText = 'Select date',
  error = false,
  disabled = false,
  className = '',
}) => {
  // Format date as MM/DD/YYYY for the input display
  // const formatDate = (date: Date): string => {
  //   const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  //   const day = String(date.getDate()).padStart(2, '0');
  //   const year = date.getFullYear();
  //   return `${month}/${day}/${year}`;
  // };


  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
        <Calendar size={16} />
      </div>
      <ReactDatePicker
        selected={selected}
        onChange={onChange}
        minDate={minDate}
        maxDate={maxDate}
        placeholderText={placeholderText}
        dateFormat="MM/dd/yyyy"
        className={clsx(
          "block w-full rounded-md shadow-sm pl-10 pr-3 py-2 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          error 
            ? "border-red-300 text-red-900 placeholder-red-300" 
            : "border-gray-300 text-gray-900 placeholder-gray-400",
          disabled && "bg-gray-100 text-gray-500 cursor-not-allowed",
          className
        )}
        disabled={disabled}
      />
    </div>
  );
};

export default DatePicker;