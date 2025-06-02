// d:\xillentech\xillentech\wedding\wedding\src\components\SpecialEventInsurancePDF.tsx
'use client'; // Add this if you intend to use it directly in Next.js App Router and it uses client-side hooks

import React, { useState } from "react";
import { jsPDF } from "jspdf"; // Directly import jsPDF

const SpecialEventInsurancePDF = () => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const generateSpecialEventInsurancePdf = async () => {
    setIsGeneratingPdf(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 0; // Starting Y position

      // Helper to add text with specified styles
      const addText = (text: string, x: number, y: number, options: any = {}) => {
        doc.text(text, x, y, options);
      };

      // Helper to add a table
      const addTable = (
        startX: number,
        startY: number,
        headers: string[],
        data: string[][],
        columnWidths: number[],
        rowHeight: number,
        headerFillColor: [number, number, number] = [220, 220, 220],
        headerTextColor: [number, number, number] = [0, 0, 0], // Kept for consistency, but text color is set to black below
        bodyFillColor: [number, number, number] = [255, 255, 255],
        bodyTextColor: [number, number, number] = [0, 0, 0] // Kept for consistency, but text color is set to black below
      ) => {
        let currentY = startY;
        let initialStartX = startX; // Store the initial starting X

        // Draw header row
        doc.setFont("helvetica", "bold");
        doc.setFillColor(...headerFillColor);
        // doc.setTextColor(...headerTextColor); // Text color is explicitly set to black
        headers.forEach((header, colIndex) => {
          const cellWidth = columnWidths[colIndex];
          doc.rect(initialStartX, currentY, cellWidth, rowHeight, "F");
          doc.setTextColor(0, 0, 0); // Always black for text on header
          doc.text(
            header,
            initialStartX + 2,
            currentY + rowHeight / 2 + 3, // Adjusted for better vertical alignment
            { align: "left", baseline: "middle" }
          );
          initialStartX += cellWidth;
        });
        doc.setFont("helvetica", "normal");
        currentY += rowHeight;

        // Draw data rows
        data.forEach((row) => {
          let currentX = startX; // Reset X for each row to the original startX
          // doc.setFillColor(...bodyFillColor); // Set fill color for the row
          // doc.setTextColor(...bodyTextColor); // Set text color for the row (explicitly black below)
          row.forEach((cell, colIndex) => {
            const cellWidth = columnWidths[colIndex];
            doc.setFillColor(...bodyFillColor); // Fill for each cell
            doc.rect(currentX, currentY, cellWidth, rowHeight, "F");
            doc.setDrawColor(200, 200, 200); // Border color
            doc.rect(currentX, currentY, cellWidth, rowHeight, "S"); // Draw border
            doc.setTextColor(0, 0, 0); // Always black for text on body
            doc.text(
              cell,
              currentX + 2,
              currentY + rowHeight / 2 + 3, // Adjusted for better vertical alignment
              { align: "left", baseline: "middle" }
            );
            currentX += cellWidth;
          });
          currentY += rowHeight;
        });
        return currentY; // Return the Y position after the table
      };

      // --- Header Section ---
      yPos = 10;
      const logoWidth = 25;
      const logoHeight = 25;
      const logoX = 15;
      const logoY = yPos;

      doc.setDrawColor(0);
      doc.setFillColor(230, 230, 230); // Light grey for logo placeholder
      doc.rect(logoX, logoY, logoWidth, logoHeight, "F");
      doc.setFontSize(8);
      doc.setTextColor(50,50,50);
      addText("LOGO", logoX + logoWidth / 2, logoY + logoHeight / 2, { align: "center", baseline: "middle" });
      doc.setTextColor(0,0,0);

      // --- End Header Section ---

      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      addText("Special Event Insurance", pageWidth / 2, yPos + 10, {
        align: "center",
      });
      doc.setFontSize(14);
      addText("Declaration", pageWidth / 2, yPos + 20, { align: "center" });
      doc.setFont("helvetica", "normal");

      yPos = 50;

      const boxHeight = 35;
      const boxMargin = 10;
      const contentPadding = 2;
      const availableWidthForBoxes = pageWidth - (boxMargin * 3);
      const namedInsuredWidth = availableWidthForBoxes / 2;
      const agentInfoWidth = availableWidthForBoxes / 2;


      doc.setDrawColor(150, 150, 150); // Grey border
      doc.setLineWidth(0.3);

      doc.rect(boxMargin, yPos, namedInsuredWidth, boxHeight);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      addText("Named Insured & Address", boxMargin + contentPadding, yPos + 5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      addText("Urvish Patel", boxMargin + contentPadding, yPos + 15);
      addText("11889 Main St.,", boxMargin + contentPadding, yPos + 20);
      addText("Tampa, FL 33602", boxMargin + contentPadding, yPos + 25);

      const agentInfoX = boxMargin + namedInsuredWidth + boxMargin;
      doc.rect(
        agentInfoX,
        yPos,
        agentInfoWidth,
        boxHeight
      );
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      addText(
        "Agent Information",
        agentInfoX + contentPadding,
        yPos + 5
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      addText(
        "Aura Risk Management",
        agentInfoX + contentPadding,
        yPos + 15
      );
      addText(
        "904 W. Chapman Ave.",
        agentInfoX + contentPadding,
        yPos + 20
      );
      addText(
        "Orange, CA 94025",
        agentInfoX + contentPadding,
        yPos + 25
      );

      // --- End Named Insured & Address / Agent Information boxes ---
      yPos += boxHeight + 15;

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      addText("POLICY INFORMATION", 15, yPos);
      doc.setLineWidth(0.5);
      doc.line(15, yPos + 1.5, pageWidth - 15, yPos + 1.5);

      yPos += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      const policyInfoCol1X = 15;
      const policyInfoCol2X = 90;
      const policyInfoCol3X = 150; // Adjusted for better spacing

      addText("Policy Number:", policyInfoCol1X, yPos);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 100, 0);
      addText("WCP018024-00", policyInfoCol1X + 30, yPos);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");

      addText("Policy Period:", policyInfoCol2X, yPos);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 100, 0);
      addText("Issue Date:", policyInfoCol2X + 25, yPos);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      addText("08/13/2024", policyInfoCol2X + 45, yPos);

      addText("Event Date:", policyInfoCol3X, yPos);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 100, 0);
      addText("11/01/2024", policyInfoCol3X + 20, yPos); // Corrected typo from 11/0/2024
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");

      yPos += 7;
      addText("Insurance Company:", policyInfoCol1X, yPos);
      addText("Certain Underwriters At Lloyd's", policyInfoCol1X + 35, yPos);

      addText("Customer Service:", policyInfoCol2X, yPos);
      addText("1-888-888-0888", policyInfoCol2X + 35, yPos);

      yPos += 7;
      addText("Claims Service:", policyInfoCol2X, yPos); // Moved to align with Customer Service
      addText("1-888-888-0889", policyInfoCol2X + 35, yPos);


      yPos += 12; // Space before total premium
      doc.setFont("helvetica", "bold");
      doc.setFillColor(220, 220, 220);
      doc.rect(15, yPos - 4, pageWidth - 30, 8, "F");
      doc.setFontSize(10);
      doc.setTextColor(0,0,0);
      addText("Total Policy Premium: $1,200.00 (EXCLUDING ANY FEES OR TAXES)", pageWidth / 2, yPos, { align: "center" });
      doc.setFont("helvetica", "normal");
      yPos += 10;

      // --- End POLICY INFORMATION Section ---

      yPos += 10;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      addText("POLICY LIMITS OF LIABILITY", 15, yPos);
      doc.setLineWidth(0.5);
      doc.line(15, yPos + 1.5, pageWidth - 15, yPos + 1.5);

      yPos += 8;

      const policyLimitsHeaders = [
        "EVENT CANCELLATION COVERAGE",
        "LIMITS OF LIABILITY",
        "PREMIUM",
      ];
      const policyLimitsData = [
        ["Cancellation/postponement", "$25,000", "$100"],
        ["Additional Expense", "$2,000", "$50"],
        ["Event Photography/Video", "$5,000", "$50"],
        ["Event Gifts", "$5,000", "$100"],
        ["Special Attire", "$10,000", "$50"],
        ["Special Jewelry", "$25,000", "$150"],
        ["Lost Deposit", "$5,000", "$100"],
      ];

      const tableStartX = 15;
      const tableWidth = pageWidth - 30;
      const policyLimitsColumnWidths = [
        tableWidth * 0.5,  // Increased width for the first column
        tableWidth * 0.25,
        tableWidth * 0.25, // Adjusted to sum to tableWidth
      ];
      const policyLimitsRowHeight = 8; // Increased for readability

      yPos = addTable(
        tableStartX,
        yPos,
        policyLimitsHeaders,
        policyLimitsData,
        policyLimitsColumnWidths,
        policyLimitsRowHeight
      );

      doc.setFillColor(220, 220, 220);
      doc.rect(tableStartX, yPos, tableWidth, policyLimitsRowHeight, "F");
      doc.setDrawColor(200, 200, 200);
      doc.rect(tableStartX, yPos, tableWidth, policyLimitsRowHeight, "S");

      doc.setFont("helvetica", "bold");
      doc.setTextColor(0,0,0);
      doc.text(
        "Event Coverage Premium",
        tableStartX + 2,
        yPos + policyLimitsRowHeight / 2 + 3,
        { align: "left", baseline: "middle" }
      );
      doc.text(
        "$900",
        tableStartX + policyLimitsColumnWidths[0] + policyLimitsColumnWidths[1] + 2, // Align with premium column start
        yPos + policyLimitsRowHeight / 2 + 3,
        { align: "left", baseline: "middle" }
      );
      doc.setFont("helvetica", "normal");
      yPos += policyLimitsRowHeight;

      // --- End POLICY LIMITS OF LIABILITY Section ---
      yPos += 15;

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      addText("OPTIONAL ENDORSEMENTS & COVERAGES", 15, yPos);
      doc.setLineWidth(0.5);
      doc.line(15, yPos + 1.5, pageWidth - 15, yPos + 1.5);

      yPos += 8;

      const endorsementsHeaders = [
        "ENDORSEMENTS",
        "LIMITS OF LIABILITY",
        "PREMIUM",
      ];
      const endorsementsData = [
        [
          "Special Event Liability: Effective 12:01 AM standard time on the Event Date: 11/01/2024 until 2:00 AM standard time on 11/02/2024",
          "$1,000,000 per Occurrence",
          "$300.00",
        ],
        ["", "$1,000,000 General Aggregate", ""],
        ["Property Damage Liability Sublimit", "$50,000", ""],
        ["Liquor Liability Coverage", "$50,000", ""],
        ["Number of Guest (50-65)", "", ""],
      ];

      const endorsementsColumnWidths = [
        tableWidth * 0.5,  // Increased width for the first column
        tableWidth * 0.3,
        tableWidth * 0.2,  // Adjusted to sum to tableWidth
      ];
      const endorsementsRowHeight = 8; // Increased for readability

      yPos = addTable(
        tableStartX,
        yPos,
        endorsementsHeaders,
        endorsementsData,
        endorsementsColumnWidths,
        endorsementsRowHeight
      );

      // --- End OPTIONAL ENDORSEMENTS & COVERAGES Section ---
      yPos += 15;

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      addText("COVERAGES", 15, yPos);
      doc.setLineWidth(0.5);
      doc.line(15, yPos + 1.5, pageWidth - 15, yPos + 1.5);

      yPos += 8;

      const coveragesHeaders = ["COVERAGE DESCRIPTION", "STATUS", "NOTES"]; // More descriptive headers
      const coveragesData = [
        ["Extended Territory", "Not Applicable", "Included"]
      ];

      const coveragesColumnWidths = [
        tableWidth * 0.4,
        tableWidth * 0.3,
        tableWidth * 0.3,
      ];
      const coveragesRowHeight = 8;

      yPos = addTable(
        tableStartX,
        yPos,
        coveragesHeaders,
        coveragesData,
        coveragesColumnWidths,
        coveragesRowHeight,
        [255,255,255],
        [0,0,0],
        [255,255,255]
      );

      // --- End COVERAGES Section ---

      const footerY = pageHeight - 15;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      addText("AU-DEC (08-24)", 15, footerY);
      addText("Page 1 of 1", pageWidth - 15, footerY, { align: "right" }); // More standard page numbering
      // --- End Footer Section ---
      doc.save(`SpecialEventInsuranceDeclaration.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      // Consider adding user-facing error feedback here
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="my-4 p-4 border border-gray-300 rounded-md bg-gray-50">
      <h2 className="text-xl font-semibold text-gray-700 mb-3">
        Insurance Declaration
      </h2>
      <button
        onClick={generateSpecialEventInsurancePdf}
        disabled={isGeneratingPdf}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGeneratingPdf ? "Generating PDF..." : "Download Declaration PDF"}
      </button>
      <p className="text-sm text-gray-600 mt-2">
        Click the button to download your Special Event Insurance Declaration.
      </p>
    </div>
  );
};

export default SpecialEventInsurancePDF;
