import * as React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#10243C',
    backgroundColor: '#FFFFFF',
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#123F70',
    paddingBottom: 12,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  schoolName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#123F70',
  },
  motto: {
    fontSize: 8,
    color: '#C4530F',
    textTransform: 'uppercase',
    marginTop: 2,
    fontWeight: 'bold',
  },
  schoolDetails: {
    fontSize: 8,
    color: '#49607D',
    marginTop: 4,
  },
  receiptTitleBlock: {
    textAlign: 'right',
  },
  receiptTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#123F70',
  },
  receiptNumber: {
    fontSize: 9,
    fontFamily: 'Courier',
    marginTop: 2,
  },
  receiptDate: {
    fontSize: 8,
    color: '#49607D',
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  metaGrid: {
    flexDirection: 'row',
    backgroundColor: '#F7F0E1',
    padding: 10,
    borderRadius: 6,
    marginBottom: 16,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 7,
    textTransform: 'uppercase',
    color: '#49607D',
    fontWeight: 'bold',
  },
  metaValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#10243C',
    marginTop: 2,
  },
  table: {
    width: '100%',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#123F70',
    padding: 6,
    borderRadius: 4,
  },
  tableHeaderCell: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EFE3CA',
    padding: 6,
  },
  colDesc: { flex: 3 },
  colRef: { flex: 2, textAlign: 'center' },
  colAmount: { flex: 2, textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    borderTopWidth: 2,
    borderTopColor: '#123F70',
    padding: 8,
    marginTop: 6,
  },
  totalLabel: {
    flex: 5,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'right',
    paddingRight: 10,
  },
  totalAmount: {
    flex: 2,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#123F70',
    textAlign: 'right',
  },
  footer: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#EFE3CA',
    paddingTop: 10,
    textAlign: 'center',
    fontSize: 8,
    color: '#49607D',
  },
  stampBox: {
    marginTop: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#49607D',
    padding: 10,
    width: 160,
    textAlign: 'center',
    alignSelf: 'flex-end',
    borderRadius: 4,
  },
});

export interface ReceiptPdfData {
  receiptNumber: string;
  date: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  guardianName: string;
  paymentMethod: string;
  referenceNumber: string;
  amount: number;
  remainingBalance: number;
}

export function ReceiptPdfDocument({ data }: { data: ReceiptPdfData }) {
  return (
    <Document title={`Receipt_${data.receiptNumber}`}>
      <Page size="A5" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.schoolName}>DORICE SMART ACADEMY</Text>
            <Text style={styles.motto}>Inspire, Achieve, Flourish</Text>
            <Text style={styles.schoolDetails}>P.O. Box 204, Kipkaren River, Kenya</Text>
            <Text style={styles.schoolDetails}>Ministry of Education Registered</Text>
          </View>
          <View style={styles.receiptTitleBlock}>
            <Text style={styles.receiptTitle}>OFFICIAL RECEIPT</Text>
            <Text style={styles.receiptNumber}>No: {data.receiptNumber}</Text>
            <Text style={styles.receiptDate}>Date: {data.date}</Text>
          </View>
        </View>

        {/* Student & Payment Metadata */}
        <View style={styles.metaGrid}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Learner Name</Text>
            <Text style={styles.metaValue}>{data.studentName}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Admission No.</Text>
            <Text style={styles.metaValue}>{data.admissionNumber}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Class</Text>
            <Text style={styles.metaValue}>{data.className}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Paid By</Text>
            <Text style={styles.metaValue}>{data.guardianName}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colRef]}>Payment Method & Ref</Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount Paid (KES)</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.colDesc}>School Fees Contribution — Term 1 2026</Text>
            <Text style={styles.colRef}>{data.paymentMethod.toUpperCase()} ({data.referenceNumber})</Text>
            <Text style={styles.colAmount}>{data.amount.toLocaleString()}.00</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL AMOUNT PAID:</Text>
            <Text style={styles.totalAmount}>KES {data.amount.toLocaleString()}.00</Text>
          </View>
        </View>

        {/* Remaining Balance & Stamp */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>
              Remaining Term Balance:{' '}
              {data.remainingBalance === 0 ? 'CLEARED' : `KES ${data.remainingBalance.toLocaleString()}.00`}
            </Text>
            <Text style={{ fontSize: 7, color: '#49607D', marginTop: 3 }}>
              Computer-generated official receipt. Valid without physical signature.
            </Text>
          </View>

          <View style={styles.stampBox}>
            <Text style={{ fontSize: 7, fontWeight: 'bold', color: '#123F70' }}>ACCOUNTS OFFICE</Text>
            <Text style={{ fontSize: 6, color: '#49607D', marginTop: 1 }}>DORICE SMART ACADEMY</Text>
            <Text style={{ fontSize: 6, color: '#1E7B45', fontWeight: 'bold', marginTop: 2 }}>PAID & VERIFIED</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for partnering with Dorice Smart Academy in nurturing learner potential.</Text>
        </View>
      </Page>
    </Document>
  );
}
