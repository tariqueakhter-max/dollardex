import jsPDF from "jspdf";

export function generateInvoicePDF(invoice: any, customer: any) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("AJ COMPUTERS BILLING", 20, 20);

  doc.setFontSize(12);
  doc.text(`Customer: ${customer.customerName}`, 20, 40);
  doc.text(`Amount: ₹${invoice.amount}`, 20, 50);
  doc.text(`Status: ${invoice.status}`, 20, 60);
  doc.text(`Date: ${invoice.billing_date}`, 20, 70);

  doc.save(`invoice-${invoice.id}.pdf`);
}