import React from 'react';
import ReactDatePicker from 'react-datepicker';
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
    <div className={clsx("relative", className)}> {/* Apply the passed className to the wrapper div */}
      <ReactDatePicker
        selected={selected}
        onChange={onChange}
        minDate={minDate}
        maxDate={maxDate}
        placeholderText={placeholderText}
        dateFormat="MM/dd/yyyy"
        className={clsx( // Styles for the input element itself
          "block w-full rounded-lg shadow-sm py-2 px-14 transition-colors text-center border border-gray-300", // Ensure input text is centered, input takes full width, added border-2, changed pl-10 to pl-4, rounded-md to rounded-xl
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          error 
            ? "border-red-400 text-red-900 placeholder-red-300 bg-red-50"  // Matched Input.tsx error style
            : "border-gray-200 text-gray-900 placeholder-gray-400", // Matched Input.tsx default style
          disabled && "bg-gray-100 text-gray-500 cursor-not-allowed"
        )}
        disabled={disabled}
      />
    </div>
  );
};

export default DatePicker;