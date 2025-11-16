import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface ExportPurchase {
  id: string;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
  package_name: string;
  claims_amount: number;
  amount_paid: number;
  status: string;
}

export const exportPurchasesToCSV = (purchases: ExportPurchase[], dateRangeLabel: string) => {
  if (purchases.length === 0) {
    toast.error('No data to export');
    return;
  }

  // Create CSV header
  const headers = ['Date', 'Time', 'Customer Name', 'Customer Email', 'Package', 'Claims', 'Amount', 'Status'];
  
  // Create CSV rows
  const rows = purchases.map(purchase => [
    format(new Date(purchase.created_at), 'MMM d, yyyy'),
    format(new Date(purchase.created_at), 'h:mm a'),
    purchase.profiles?.full_name || 'Unknown',
    purchase.profiles?.email || 'No email',
    purchase.package_name,
    purchase.claims_amount,
    `$${(purchase.amount_paid / 100).toFixed(2)}`,
    purchase.status
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `purchases_${dateRangeLabel.replace(/\s/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toast.success('CSV exported successfully');
};

export const exportPurchasesToPDF = async (
  purchases: ExportPurchase[],
  dateRangeLabel: string,
  totalRevenue: number,
  uniqueCustomers: number
) => {
  if (purchases.length === 0) {
    toast.error('No data to export');
    return;
  }

  try {
    toast.info('Generating PDF...');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Add title
    pdf.setFontSize(20);
    pdf.text('Purchase Report', 15, yPosition);
    yPosition += 10;

    // Add date range
    pdf.setFontSize(12);
    pdf.text(`Period: ${dateRangeLabel}`, 15, yPosition);
    yPosition += 7;
    pdf.text(`Generated: ${format(new Date(), 'MMM d, yyyy h:mm a')}`, 15, yPosition);
    yPosition += 10;

    // Add stats summary
    pdf.setFontSize(10);
    pdf.text(`Total Revenue: $${(totalRevenue / 100).toFixed(2)}`, 15, yPosition);
    pdf.text(`Total Purchases: ${purchases.length}`, 70, yPosition);
    pdf.text(`Unique Customers: ${uniqueCustomers}`, 125, yPosition);
    yPosition += 10;

    // Capture chart
    const chartElement = document.getElementById('revenue-chart');
    if (chartElement) {
      const canvas = await html2canvas(chartElement, {
        backgroundColor: '#ffffff',
        scale: 2
      });
      const chartImage = canvas.toDataURL('image/png');
      const chartWidth = pageWidth - 30;
      const chartHeight = (canvas.height * chartWidth) / canvas.width;
      
      pdf.addImage(chartImage, 'PNG', 15, yPosition, chartWidth, chartHeight);
      yPosition += chartHeight + 10;
    }

    // Add new page for table if needed
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = 20;
    }

    // Add table header
    pdf.setFontSize(14);
    pdf.text('Purchase Details', 15, yPosition);
    yPosition += 8;

    // Table headers
    pdf.setFontSize(8);
    pdf.setFont(undefined, 'bold');
    pdf.text('Date', 15, yPosition);
    pdf.text('Customer', 45, yPosition);
    pdf.text('Package', 95, yPosition);
    pdf.text('Claims', 140, yPosition);
    pdf.text('Amount', 165, yPosition);
    yPosition += 5;
    
    pdf.setFont(undefined, 'normal');

    // Table rows
    const maxRowsPerPage = Math.floor((pageHeight - yPosition - 20) / 6);
    purchases.slice(0, 50).forEach((purchase, index) => {
      if (index > 0 && index % maxRowsPerPage === 0) {
        pdf.addPage();
        yPosition = 20;
        
        // Repeat header on new page
        pdf.setFont(undefined, 'bold');
        pdf.text('Date', 15, yPosition);
        pdf.text('Customer', 45, yPosition);
        pdf.text('Package', 95, yPosition);
        pdf.text('Claims', 140, yPosition);
        pdf.text('Amount', 165, yPosition);
        yPosition += 5;
        pdf.setFont(undefined, 'normal');
      }

      const date = format(new Date(purchase.created_at), 'MMM d, yyyy');
      const customer = (purchase.profiles?.full_name || 'Unknown').substring(0, 20);
      const packageName = purchase.package_name.substring(0, 20);
      const claims = purchase.claims_amount.toString();
      const amount = `$${(purchase.amount_paid / 100).toFixed(2)}`;

      pdf.text(date, 15, yPosition);
      pdf.text(customer, 45, yPosition);
      pdf.text(packageName, 95, yPosition);
      pdf.text(claims, 140, yPosition);
      pdf.text(amount, 165, yPosition);
      yPosition += 6;
    });

    // Add footer note if more than 50 purchases
    if (purchases.length > 50) {
      pdf.setFontSize(8);
      pdf.text(`Note: Showing first 50 of ${purchases.length} purchases`, 15, pageHeight - 10);
    }

    pdf.save(`purchase_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF exported successfully');
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast.error('Failed to generate PDF');
  }
};
