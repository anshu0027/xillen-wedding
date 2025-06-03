// ---------------------PAGE 1-------------------------------
"use client"

export async function generateInsuranceDeclarationPDF() {
  const jsPDF = (await import("jspdf")).default

  try {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Logo circle (simplified as text)
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(2)
    doc.circle(30, 25, 12)
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text("W&F", 30, 22, { align: "center" })
    doc.text("ROYCE", 30, 28, { align: "center" })

    // Main Title
    doc.setFontSize(18)
    doc.setFont(undefined, "bold")
    doc.text("Special Event Insurance", pageWidth / 2, 20, { align: "center" })
    doc.text("Declaration", pageWidth / 2, 30, { align: "center" })

    // Named Insured & Agent Information boxes
    let yPos = 50

    // Named Insured box
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(1)
    doc.rect(15, yPos, 85, 25)
    doc.setFontSize(10)
    doc.setFont(undefined, "bold")
    doc.text("Named Insured & Address", 17, yPos + 5)

    // Yellow highlight for insured info
    doc.setFillColor(255, 255, 0)
    doc.rect(17, yPos + 7, 81, 15, "F")
    doc.setTextColor(0, 0, 0)
    doc.setFont(undefined, "bold")
    doc.text("Urvish Patel", 19, yPos + 12)
    doc.setFont(undefined, "normal")
    doc.text("11889 Main St.,", 19, yPos + 16)
    doc.text("Tampa, FL 33602", 19, yPos + 20)

    // Agent Information box
    doc.setDrawColor(0, 0, 0)
    doc.rect(105, yPos, 85, 25)
    doc.setFont(undefined, "bold")
    doc.text("Agent Information", 107, yPos + 5)

    // Yellow highlight for agent info
    doc.setFillColor(255, 255, 0)
    doc.rect(107, yPos + 7, 81, 15, "F")
    doc.setTextColor(0, 0, 0)
    doc.setFont(undefined, "bold")
    doc.text("Aura Risk Management", 109, yPos + 12)
    doc.setFont(undefined, "normal")
    doc.text("904 W. Chapman Ave.", 109, yPos + 16)
    doc.text("Orange, CA 94025", 109, yPos + 20)

    yPos += 35

    // Policy Information Header
    doc.setFillColor(47, 79, 79)
    doc.rect(15, yPos, pageWidth - 30, 8, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFont(undefined, "bold")
    doc.text("POLICY INFORMATION", 17, yPos + 5)

    yPos += 8

    // Policy Information Content
    doc.setDrawColor(47, 79, 79)
    doc.setLineWidth(1)
    doc.rect(15, yPos, pageWidth - 30, 35)
    doc.setTextColor(0, 0, 0)
    doc.setFont(undefined, "bold")
    doc.text("Policy Number:", 17, yPos + 8)

    // Yellow highlight for policy number
    doc.setFillColor(255, 255, 0)
    doc.rect(55, yPos + 5, 35, 5, "F")
    doc.setTextColor(0, 0, 0)
    doc.text("WCP018024-00", 57, yPos + 8)

    doc.setTextColor(0, 0, 0)
    doc.text("Policy Period:", 120, yPos + 5)
    doc.text("Issue Date:", 120, yPos + 12)

    // Yellow highlights for dates
    doc.setFillColor(255, 255, 0)
    doc.rect(145, yPos + 9, 25, 5, "F")
    doc.text("08/13/2024", 147, yPos + 12)

    doc.setTextColor(0, 0, 0)
    doc.text("Event Date:", 175, yPos + 12)
    doc.setFillColor(255, 255, 0)
    doc.rect(195, yPos + 9, 20, 5, "F")
    doc.text("11/0/2024", 197, yPos + 12)

    doc.setTextColor(0, 0, 0)
    doc.text("Insurance Company:", 17, yPos + 18)
    doc.setFont(undefined, "normal")
    doc.text("Certain Underwriters At Lloyd's", 17, yPos + 22)

    doc.setFont(undefined, "bold")
    doc.text("Customer Service: 1-888-888-0888", 120, yPos + 18)
    doc.text("Claims Service: 1-888-888-0889", 120, yPos + 22)

    // Total Premium
    doc.setDrawColor(0, 0, 0)
    doc.line(17, yPos + 25, pageWidth - 17, yPos + 25)
    doc.setFontSize(12)
    doc.text("Total Policy Premium: $1,200.00 (EXCLUDING ANY FEES OR TAXES)", pageWidth / 2, yPos + 32, {
      align: "center",
    })

    yPos += 45

    // Policy Limits of Liability Header
    doc.setFillColor(47, 79, 79)
    doc.rect(15, yPos, pageWidth - 30, 8, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont(undefined, "bold")
    doc.text("POLICY LIMITS OF LIABILITY", 17, yPos + 5)

    yPos += 8

    // Table headers
    doc.setFillColor(240, 240, 240)
    doc.rect(15, yPos, pageWidth - 30, 8, "F")
    doc.setTextColor(0, 0, 0)
    doc.text("EVENT CANCELLATION COVERAGE", 17, yPos + 5)
    doc.text("LIMITS OF LIABILITY", 120, yPos + 5, { align: "center" })
    doc.text("PREMIUM", 170, yPos + 5, { align: "center" })

    yPos += 8

    // Table rows
    const tableData = [
      ["Cancellation/postponement", "$25,000", "$400"],
      ["Additional Expense", "$5,000", "$50"],
      ["Event Photography/Video", "$5,000", "$50"],
      ["Event Gifts", "$5,000", "$100"],
      ["Special Attire", "$10,000", "$50"],
      ["Special Jewelry", "$25,000", "$150"],
      ["Lost Deposit", "$5,000", "$100"],
      ["Event Coverage Premium", "", "$900"],
    ]

    tableData.forEach((row, index) => {
      doc.setDrawColor(128, 128, 128)
      doc.rect(15, yPos, pageWidth - 30, 6)
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, "normal")
      doc.text(row[0], 17, yPos + 4)

      if (row[1]) {
        doc.setFillColor(255, 255, 0)
        doc.rect(110, yPos + 1, 30, 4, "F")
        doc.text(row[1], 125, yPos + 4, { align: "center" })
      }

      doc.setFillColor(255, 255, 0)
      doc.rect(160, yPos + 1, 30, 4, "F")
      doc.setFont(undefined, index === tableData.length - 1 ? "bold" : "normal")
      doc.text(row[2], 175, yPos + 4, { align: "center" })

      yPos += 6
    })

    yPos += 10

    // Optional Endorsements Header
    doc.setFillColor(47, 79, 79)
    doc.rect(15, yPos, pageWidth - 30, 8, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFont(undefined, "bold")
    doc.text("OPTIONAL ENDORSEMENTS & COVERAGES", 17, yPos + 5)

    yPos += 8

    // Endorsements table headers
    doc.setFillColor(240, 240, 240)
    doc.rect(15, yPos, pageWidth - 30, 8, "F")
    doc.setTextColor(0, 0, 0)
    doc.text("ENDORSEMENTS", 17, yPos + 5)
    doc.text("LIMITS OF LIABILITY", 120, yPos + 5, { align: "center" })
    doc.text("PREMIUM", 170, yPos + 5, { align: "center" })

    yPos += 8

    // Endorsements content
    doc.setDrawColor(128, 128, 128)
    doc.rect(15, yPos, pageWidth - 30, 25)
    doc.setTextColor(0, 0, 0)
    doc.setFont(undefined, "bold")
    doc.text("Special Event Liability: Effective 12:01 AM", 17, yPos + 4)
    doc.setFont(undefined, "normal")
    doc.text("standard time on the Event Date: 11/01/2024", 17, yPos + 8)
    doc.text("until 2:00 am standard time on 11/02/2024", 17, yPos + 12)
    doc.setFont(undefined, "bold")
    doc.text("Property Damage Liability Sublimit", 17, yPos + 16)
    doc.text("Liquor Liability Coverage", 17, yPos + 20)
    doc.text("Number of Guest (50-65)", 17, yPos + 24)

    // Liability limits
    const liabilityData = ["$1,000,000 per Occurrence", "$1,000,000 General", "Aggregate", "$50,000", "$50,000"]

    liabilityData.forEach((item, index) => {
      doc.setFillColor(255, 255, 0)
      doc.rect(110, yPos + index * 4 + 1, 30, 4, "F")
      doc.setTextColor(0, 0, 0)
      doc.text(item, 125, yPos + index * 4 + 4, { align: "center" })
    })

    // Premium for endorsements
    doc.setFillColor(255, 255, 0)
    doc.rect(160, yPos + 10, 30, 6, "F")
    doc.setFont(undefined, "bold")
    doc.text("$300.00", 175, yPos + 13, { align: "center" })

    yPos += 35

    // Coverages Header
    doc.setFillColor(47, 79, 79)
    doc.rect(15, yPos, pageWidth - 30, 8, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFont(undefined, "bold")
    doc.text("COVERAGES", 17, yPos + 5)

    yPos += 8

    // Extended Territory row
    doc.setDrawColor(128, 128, 128)
    doc.rect(15, yPos, pageWidth - 30, 6)
    doc.setTextColor(0, 0, 0)
    doc.setFont(undefined, "bold")
    doc.text("Extended Territory", 17, yPos + 4)
    doc.setFont(undefined, "normal")
    doc.text("Not Applicable", 125, yPos + 4, { align: "center" })
    doc.text("Included", 175, yPos + 4, { align: "center" })

    // Footer
    doc.setTextColor(128, 128, 128)
    doc.setFontSize(8)
    doc.text("AU -DEC (08-24)", 15, pageHeight - 10)
    doc.text("1", pageWidth - 15, pageHeight - 10, { align: "right" })

    // Save the PDF
    doc.save("Special_Event_Insurance_Declaration.pdf")
  } catch (error) {
    console.error("Error generating PDF:", error)
  }
}

// Component to trigger PDF generation
export default function InsuranceDeclarationPDFGenerator() {
  const handleGeneratePDF = () => {
    generateInsuranceDeclarationPDF()
  }

  return (
    <div className="p-8">
      <button
        onClick={handleGeneratePDF}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Generate Insurance Declaration PDF
      </button>
    </div>
  )
}




// ---------------------PAGE 2-------------------------------
"use client"

export async function generateInsuranceDeclarationPage2PDF() {
  const jsPDF = (await import("jspdf")).default

  try {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Logo circle (simplified as text)
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(2)
    doc.circle(30, 25, 12)
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text("W&F", 30, 22, { align: "center" })
    doc.text("ROYCE", 30, 28, { align: "center" })

    let yPos = 50

    // Policy Forms and Endorsements Header
    doc.setFillColor(47, 79, 79)
    doc.rect(15, yPos, pageWidth - 30, 8, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont(undefined, "bold")
    doc.text("POLICY FORMS AND ENDORSEMENTS", 17, yPos + 5)

    yPos += 8

    // Policy Forms and Endorsements Table
    const policyForms = [
      ["AU - 1 (08-24)", "Special Event Insurance"],
      ["AU - 200 (08-24)", "Special Event Liability"],
      ["AU - 200LL (08-24)", "Special Event Liquor Liability"],
      ["AU - 400FL (08-24)", "Special Event Liability FL Provision"],
      ["AU - 201 (08-24)", "Additional Insured"],
    ]

    policyForms.forEach((row) => {
      doc.setDrawColor(128, 128, 128)
      doc.rect(15, yPos, 60, 6)
      doc.rect(75, yPos, pageWidth - 90, 6)
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, "bold")
      doc.text(row[0], 17, yPos + 4)
      doc.setFont(undefined, "normal")
      doc.text(row[1], 77, yPos + 4)
      yPos += 6
    })

    yPos += 10

    // Event Information Header
    doc.setFillColor(47, 79, 79)
    doc.rect(15, yPos, pageWidth - 30, 8, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFont(undefined, "bold")
    doc.text("EVENT INFORMATION", 17, yPos + 5)

    yPos += 8

    // Event Information Table Headers
    doc.setDrawColor(128, 128, 128)
    doc.rect(15, yPos, (pageWidth - 30) / 2, 6)
    doc.rect(15 + (pageWidth - 30) / 2, yPos, (pageWidth - 30) / 2, 6)
    doc.setTextColor(0, 0, 0)
    doc.setFont(undefined, "bold")
    doc.text("INSURED EVENT", 17, yPos + 4)
    doc.text("HONOREE(S)", 17 + (pageWidth - 30) / 2 + 2, yPos + 4)

    yPos += 6

    // Event Information Table Content
    doc.setDrawColor(128, 128, 128)
    doc.rect(15, yPos, (pageWidth - 30) / 2, 6)
    doc.rect(15 + (pageWidth - 30) / 2, yPos, (pageWidth - 30) / 2, 6)

    // Yellow highlight for event and honorees
    doc.setFillColor(255, 255, 0)
    doc.rect(15 + 1, yPos + 1, (pageWidth - 30) / 2 - 2, 4, "F")
    doc.rect(15 + (pageWidth - 30) / 2 + 1, yPos + 1, (pageWidth - 30) / 2 - 2, 4, "F")

    doc.setTextColor(0, 0, 0)
    doc.setFont(undefined, "bold")
    doc.text("Wedding", 17, yPos + 4)
    doc.text("Family Members", 17 + (pageWidth - 30) / 2 + 2, yPos + 4)

    yPos += 15

    // Event Location(s) Header
    doc.setTextColor(0, 0, 0)
    doc.setFont(undefined, "bold")
    doc.text("EVENT LOCATION(S)", 15, yPos)
    doc.setLineWidth(0.5)
    doc.line(15, yPos + 1, 60, yPos + 1)

    yPos += 5

    // Event Location Table
    for (let i = 1; i <= 4; i++) {
      doc.setDrawColor(128, 128, 128)
      doc.rect(15, yPos, 10, 6)
      doc.rect(25, yPos, pageWidth - 40, 6)
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, "bold")
      doc.text(`${i}.`, 17, yPos + 4)

      // Yellow highlight for first location
      if (i === 1) {
        doc.setFillColor(255, 255, 0)
        doc.rect(26, yPos + 1, pageWidth - 42, 4, "F")
        doc.text("123 Main St. Tampa, FL 33601", 27, yPos + 4)
      }

      yPos += 6
    }

    yPos += 10

    // Additional Insured(s) Header
    doc.setTextColor(0, 0, 0)
    doc.setFont(undefined, "bold")
    doc.text("ADDITIONAL INSURED(S)", 15, yPos)
    doc.setLineWidth(0.5)
    doc.line(15, yPos + 1, 70, yPos + 1)

    yPos += 5

    // Additional Insured Table
    for (let i = 1; i <= 4; i++) {
      doc.setDrawColor(128, 128, 128)
      doc.rect(15, yPos, 10, 6)
      doc.rect(25, yPos, pageWidth - 40, 6)
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, "bold")

      // Yellow highlight for first number
      if (i === 1) {
        doc.setFillColor(255, 255, 0)
        doc.rect(15 + 1, yPos + 1, 8, 4, "F")
      }

      doc.text(`${i}.`, 17, yPos + 4)
      yPos += 6
    }

    yPos += 10

    // Event Information Header (second occurrence)
    doc.setFillColor(47, 79, 79)
    doc.rect(15, yPos, pageWidth - 30, 8, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFont(undefined, "bold")
    doc.text("EVENT INFORMATION", 17, yPos + 5)

    yPos += 8

    // Event Information Fees Table
    const feeData = [
      ["Policy Fee", "$50.00"],
      ["Surplus Lines Taxes", "$48.00"],
      ["Stamping Fee", "$5.00"],
      ["Total Premium", "$1,303.00"],
    ]

    feeData.forEach((row, index) => {
      doc.setDrawColor(128, 128, 128)
      doc.rect(15, yPos, (pageWidth - 30) * 0.7, 6)
      doc.rect(15 + (pageWidth - 30) * 0.7, yPos, (pageWidth - 30) * 0.3, 6)
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, "bold")
      doc.text(row[0], 17, yPos + 4)

      // Yellow highlight for fee amounts
      doc.setFillColor(255, 255, 0)
      doc.rect(15 + (pageWidth - 30) * 0.7 + 1, yPos + 1, (pageWidth - 30) * 0.3 - 2, 4, "F")
      doc.text(row[1], 15 + (pageWidth - 30) * 0.7 + (pageWidth - 30) * 0.3 - 5, yPos + 4, { align: "right" })

      yPos += 6
    })

    // Footer
    doc.setTextColor(128, 128, 128)
    doc.setFontSize(8)
    doc.text("AU -DEC (08-24)", 15, pageHeight - 10)
    doc.text("2", pageWidth - 15, pageHeight - 10, { align: "right" })

    // Save the PDF
    doc.save("Special_Event_Insurance_Declaration_Page2.pdf")
  } catch (error) {
    console.error("Error generating PDF:", error)
  }
}

// Component to trigger PDF generation
export default function InsuranceDeclarationPage2PDFGenerator() {
  const handleGeneratePDF = () => {
    generateInsuranceDeclarationPage2PDF()
  }

  return (
    <div className="p-8">
      <button
        onClick={handleGeneratePDF}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Generate Insurance Declaration Page 2 PDF
      </button>
    </div>
  )
}
