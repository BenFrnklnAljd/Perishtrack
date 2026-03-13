import { useInventoryStore } from '@/stores/inventory'
import { useAuthStore } from '@/stores/auth'
import { today, formatDate } from '@/utils/date'

export function usePdf() {
  async function exportReport(period, productId) {
    const { jsPDF } = await import('jspdf')
    await import('jspdf-autotable')

    const inv  = useInventoryStore()
    const auth = useAuthStore()
    const doc  = new jsPDF({ unit: 'mm', format: 'a4' })

    const filteredSales = inv.getFilteredSales({ period, productId })
    const salesByProd   = inv.getSalesByProduct(filteredSales)
    const revenue = filteredSales.reduce((s, x) => s + x.qty * x.price, 0)
    const units   = filteredSales.reduce((s, x) => s + x.qty, 0)
    const loss    = inv.totalLossValue

    // ── Header ──
    doc.setFillColor(245, 166, 35)
    doc.rect(0, 0, 210, 22, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(15, 14, 12)
    doc.text('PerishTrack — Inventory Report', 14, 14)

    doc.setFontSize(8)
    doc.setTextColor(60, 55, 50)
    doc.text(`Generated: ${new Date().toLocaleString()}   Staff: ${auth.currentUser?.name}   Period: ${period.toUpperCase()}`, 14, 30)

    // ── Summary Table ──
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(15, 14, 12)
    doc.text('Summary', 14, 40)

    doc.autoTable({
      startY: 43,
      head: [['Metric', 'Value']],
      body: [
        ['Total Revenue', `PHP ${revenue.toFixed(2)}`],
        ['Units Sold', String(units)],
        ['Loss (Expired)', `PHP ${loss.toFixed(2)}`],
        ['Net Profit', `PHP ${(revenue - loss).toFixed(2)}`],
        ['Expired Units', String(inv.totalExpiredUnits)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [245, 166, 35], textColor: [15, 14, 12], fontStyle: 'bold' },
      styles: { fontSize: 10 },
      columnStyles: { 1: { halign: 'right' } }
    })

    // ── Sales Log ──
    const salesY = doc.lastAutoTable.finalY + 10
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Sales Log', 14, salesY)

    doc.autoTable({
      startY: salesY + 3,
      head: [['Date', 'Product', 'Qty', 'Unit Price', 'Total', 'Staff']],
      body: filteredSales.map(s => [
        s.date,
        inv.productName(s.productId),
        String(s.qty),
        `PHP ${s.price}`,
        `PHP ${(s.qty * s.price).toFixed(2)}`,
        s.staffName
      ]),
      theme: 'striped',
      headStyles: { fillColor: [36, 34, 32], textColor: [240, 237, 232] },
      styles: { fontSize: 9 }
    })

    // ── Inventory Balance ──
    const invY = doc.lastAutoTable.finalY + 10
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Inventory Balance', 14, invY)

    doc.autoTable({
      startY: invY + 3,
      head: [['Product', 'Category', 'Produced', 'Sold', 'Expired', 'Balance', 'Status']],
      body: inv.activeProducts.map(p => [
        p.name,
        p.category,
        String(inv.totalProduced(p.id)),
        String(inv.totalSold(p.id)),
        String(inv.expiredUnits(p.id)),
        String(inv.currentBalance(p.id)),
        inv.isExpired(p.id) ? 'PULLOUT' : 'OK'
      ]),
      theme: 'striped',
      headStyles: { fillColor: [36, 34, 32], textColor: [240, 237, 232] },
      styles: { fontSize: 9 },
      columnStyles: { 6: { fontStyle: 'bold' } }
    })

    // ── Sales by Product ──
    if (salesByProd.length) {
      const sbpY = doc.lastAutoTable.finalY + 10
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('Sales by Product', 14, sbpY)
      doc.autoTable({
        startY: sbpY + 3,
        head: [['Product', 'Revenue (PHP)']],
        body: salesByProd.map(x => [x.name, x.revenue.toFixed(2)]),
        theme: 'grid',
        headStyles: { fillColor: [245, 166, 35], textColor: [15, 14, 12] },
        styles: { fontSize: 9 }
      })
    }

    // ── Footer ──
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(122, 117, 112)
      doc.text(`PerishTrack · Page ${i} of ${pageCount}`, 14, 290)
      doc.text(`Exported ${today()}`, 140, 290)
    }

    doc.save(`perishtrack-report-${today()}.pdf`)
  }

  async function exportReceipt(saleItems, staffName) {
    const { jsPDF } = await import('jspdf')
    const inv = useInventoryStore()
    const doc = new jsPDF({ unit: 'mm', format: [80, 160] })

    doc.setFillColor(245, 166, 35)
    doc.rect(0, 0, 80, 14, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(15, 14, 12)
    doc.text('PerishTrack', 40, 9, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 95, 90)
    doc.text(`${new Date().toLocaleString()}`, 40, 18, { align: 'center' })
    doc.text(`Staff: ${staffName}`, 40, 22, { align: 'center' })

    let y = 28
    doc.setDrawColor(46, 44, 41)
    doc.line(4, y, 76, y); y += 4

    saleItems.forEach(s => {
      doc.setFontSize(9)
      doc.setTextColor(240, 237, 232)
      doc.text(`${inv.productName(s.productId)} x${s.qty}`, 4, y)
      doc.text(`PHP ${(s.qty * s.price).toFixed(2)}`, 76, y, { align: 'right' })
      y += 6
    })

    doc.line(4, y, 76, y); y += 6
    const total = saleItems.reduce((s, x) => s + x.qty * x.price, 0)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(245, 166, 35)
    doc.text('TOTAL', 4, y)
    doc.text(`PHP ${total.toFixed(2)}`, 76, y, { align: 'right' })

    doc.save(`receipt-${today()}.pdf`)
  }

  return { exportReport, exportReceipt }
}
