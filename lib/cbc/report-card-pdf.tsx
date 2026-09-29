import * as React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { CbcReportCardData } from './mock-data';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#10243C',
    backgroundColor: '#FFFFFF',
  },
  // Top brand band
  headerTopBand: {
    height: 4,
    backgroundColor: '#C4530F',
    marginBottom: 12,
  },
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#123F70',
    paddingBottom: 10,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 52,
    height: 52,
    objectFit: 'contain',
  },
  schoolName: {
    fontSize: 16,
    fontWeight: 'black',
    color: '#123F70',
  },
  motto: {
    fontSize: 8,
    color: '#C4530F',
    textTransform: 'uppercase',
    marginTop: 2,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  schoolMeta: {
    fontSize: 7.5,
    color: '#49607D',
    marginTop: 2,
  },
  headerRight: {
    textAlign: 'right',
    alignItems: 'flex-end',
  },
  docTitleBadge: {
    backgroundColor: '#123F70',
    color: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  reportMeta: {
    fontSize: 8,
    color: '#49607D',
    marginTop: 4,
  },
  // Student Meta Grid
  learnerCard: {
    backgroundColor: '#F7F0E1',
    borderWidth: 1,
    borderColor: '#D4C3A3',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },
  learnerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 6.5,
    color: '#49607D',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  metaValue: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#10243C',
    marginTop: 1,
  },
  // Rubric Key
  rubricKeyContainer: {
    backgroundColor: '#EDF6FF',
    borderWidth: 1,
    borderColor: '#B9DCFE',
    borderRadius: 4,
    padding: 6,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rubricKeyItem: {
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  rubricKeyTitle: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#123F70',
  },
  rubricKeyDesc: {
    fontSize: 6.5,
    color: '#49607D',
    marginTop: 1,
  },
  // Table
  table: {
    borderWidth: 1,
    borderColor: '#123F70',
    borderRadius: 4,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#123F70',
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 7.5,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 4.5,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  colArea: { width: '28%' },
  colStrands: { width: '24%' },
  colScore: { width: '10%', textAlign: 'center' },
  colRubric: { width: '12%', textAlign: 'center' },
  colRemarks: { width: '26%' },
  rubricBadge: {
    paddingVertical: 1.5,
    paddingHorizontal: 5,
    borderRadius: 3,
    fontSize: 7.5,
    fontWeight: 'bold',
    textAlign: 'center',
    alignSelf: 'center',
  },
  rubricEE: { backgroundColor: '#EBFAEE', color: '#003703' },
  rubricME: { backgroundColor: '#E7F9FD', color: '#004459' },
  rubricAE: { backgroundColor: '#FDFBF2', color: '#6B5200' },
  rubricBE: { backgroundColor: '#FFEDE9', color: '#700000' },
  // Remarks & Endorsement
  endorsementSection: {
    borderWidth: 1,
    borderColor: '#D4C3A3',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  endorsementTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#123F70',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  endorsementText: {
    fontSize: 8,
    color: '#10243C',
    fontStyle: 'italic',
    lineHeight: 1.3,
  },
  signGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  signBlock: {
    flex: 1,
  },
  signLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#123F70',
    width: '80%',
    height: 20,
    marginBottom: 4,
  },
  signLabel: {
    fontSize: 7,
    color: '#49607D',
    fontWeight: 'bold',
  },
  stampBox: {
    width: 75,
    height: 45,
    borderWidth: 1,
    borderColor: '#C4530F',
    borderStyle: 'dashed',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  stampText: {
    fontSize: 6,
    color: '#C4530F',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#49607D',
  },
});

export function CbcReportCardPdf({ data }: { data: CbcReportCardData }) {
  const getBadgeStyle = (level: string) => {
    switch (level) {
      case 'EE':
        return [styles.rubricBadge, styles.rubricEE];
      case 'ME':
        return [styles.rubricBadge, styles.rubricME];
      case 'AE':
        return [styles.rubricBadge, styles.rubricAE];
      default:
        return [styles.rubricBadge, styles.rubricBE];
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Top 10% Accent Marigold Band */}
        <View style={styles.headerTopBand} />

        {/* School Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View>
              <Text style={styles.schoolName}>DORICE SMART ACADEMY</Text>
              <Text style={styles.motto}>Inspire • Achieve • Flourish</Text>
              <Text style={styles.schoolMeta}>
                P.O. Box Private Bag, Kipkaren River, Kenya • Tel: +254 700 000 000
              </Text>
              <Text style={styles.schoolMeta}>
                Ministry of Education Reg No: DSA/PRI/2021 • CBC Compliant
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docTitleBadge}>CBC Learner Report Card</Text>
            <Text style={styles.reportMeta}>
              {data.term} — Academic Year {data.academicYear}
            </Text>
            <Text style={styles.reportMeta}>Date Issued: {data.dateOfIssue}</Text>
          </View>
        </View>

        {/* Learner Identification Card */}
        <View style={styles.learnerCard}>
          <View style={styles.learnerRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Learner&apos;s Full Name</Text>
              <Text style={styles.metaValue}>{data.studentName}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Admission Number</Text>
              <Text style={styles.metaValue}>{data.admissionNumber}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Class & Stream</Text>
              <Text style={styles.metaValue}>{data.className}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Curriculum Level</Text>
              <Text style={styles.metaValue}>{data.gradeLevel}</Text>
            </View>
          </View>
          <View style={[styles.learnerRow, { marginBottom: 0 }]}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Attendance Record</Text>
              <Text style={styles.metaValue}>
                {data.attendanceDays} of {data.totalDays} Days ({Math.round((data.attendanceDays / data.totalDays) * 100)}%)
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Overall Term Assessment</Text>
              <Text style={[styles.metaValue, { color: '#003703' }]}>
                {data.overallLevel === 'EE' && 'Exceeding Expectations (EE)'}
                {data.overallLevel === 'ME' && 'Meeting Expectations (ME)'}
                {data.overallLevel === 'AE' && 'Approaching Expectations (AE)'}
                {data.overallLevel === 'BE' && 'Below Expectations (BE)'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Next Term Commences</Text>
              <Text style={styles.metaValue}>{data.nextTermBegins}</Text>
            </View>
          </View>
        </View>

        {/* CBC 4-Level Rubric Key */}
        <View style={styles.rubricKeyContainer}>
          <View style={styles.rubricKeyItem}>
            <Text style={styles.rubricKeyTitle}>EE • Exceeding Expectations</Text>
            <Text style={styles.rubricKeyDesc}>80% - 100% • 4 Stars (High Mastery)</Text>
          </View>
          <View style={styles.rubricKeyItem}>
            <Text style={styles.rubricKeyTitle}>ME • Meeting Expectations</Text>
            <Text style={styles.rubricKeyDesc}>65% - 79% • 3 Stars (Grade Standard)</Text>
          </View>
          <View style={styles.rubricKeyItem}>
            <Text style={styles.rubricKeyTitle}>AE • Approaching Expectations</Text>
            <Text style={styles.rubricKeyDesc}>50% - 64% • 2 Stars (Needs Practice)</Text>
          </View>
          <View style={styles.rubricKeyItem}>
            <Text style={styles.rubricKeyTitle}>BE • Below Expectations</Text>
            <Text style={styles.rubricKeyDesc}>0% - 49% • 1 Star (Requires Intervention)</Text>
          </View>
        </View>

        {/* Learning Areas Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colArea}>Learning Area / Subject</Text>
            <Text style={styles.colStrands}>Key Strands Assessed</Text>
            <Text style={styles.colScore}>Formative</Text>
            <Text style={styles.colScore}>Summative</Text>
            <Text style={styles.colRubric}>CBC Rubric</Text>
            <Text style={styles.colRemarks}>Facilitator Remarks</Text>
          </View>

          {data.learningAreas.map((area, idx) => (
            <View
              key={idx}
              style={[
                styles.tableRow,
                { backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' },
              ]}
            >
              <View style={styles.colArea}>
                <Text style={{ fontWeight: 'bold', color: '#123F70', fontSize: 8 }}>
                  {area.name}
                </Text>
                <Text style={{ fontSize: 6.5, color: '#49607D' }}>{area.code}</Text>
              </View>

              <View style={styles.colStrands}>
                <Text style={{ fontSize: 7, color: '#10243C' }}>
                  {area.strands.join(' • ')}
                </Text>
              </View>

              <Text style={[styles.colScore, { fontSize: 8, fontFamily: 'Courier' }]}>
                {area.formativeScore}%
              </Text>

              <Text style={[styles.colScore, { fontSize: 8, fontFamily: 'Courier', fontWeight: 'bold' }]}>
                {area.summativeScore}%
              </Text>

              <View style={styles.colRubric}>
                <Text style={getBadgeStyle(area.rubricLevel)}>
                  {area.rubricLevel}
                </Text>
              </View>

              <View style={styles.colRemarks}>
                <Text style={{ fontSize: 7, color: '#10243C', lineHeight: 1.2 }}>
                  {area.teacherRemarks}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Teacher & Headteacher Endorsements */}
        <View style={styles.endorsementSection}>
          <View style={{ marginBottom: 6 }}>
            <Text style={styles.endorsementTitle}>Class Teacher&apos;s Qualitative Assessment</Text>
            <Text style={styles.endorsementText}>
              &quot;{data.classTeacherRemarks}&quot;
            </Text>
            <Text style={{ fontSize: 7, color: '#49607D', marginTop: 2, fontWeight: 'bold' }}>
              Facilitator: {data.classTeacherName}
            </Text>
          </View>

          <View style={{ marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
            <Text style={styles.endorsementTitle}>Headteacher&apos;s Concluding Remarks</Text>
            <Text style={styles.endorsementText}>
              &quot;{data.headteacherRemarks}&quot;
            </Text>
            <Text style={{ fontSize: 7, color: '#49607D', marginTop: 2, fontWeight: 'bold' }}>
              {data.headteacherName}
            </Text>
          </View>

          {/* Signatures & Stamp */}
          <View style={styles.signGrid}>
            <View style={styles.signBlock}>
              <View style={styles.signLine} />
              <Text style={styles.signLabel}>Class Teacher Signature</Text>
            </View>

            <View style={styles.signBlock}>
              <View style={styles.signLine} />
              <Text style={styles.signLabel}>Headteacher Signature</Text>
            </View>

            <View style={styles.stampBox}>
              <Text style={styles.stampText}>OFFICIAL SCHOOL</Text>
              <Text style={styles.stampText}>STAMP SEAL</Text>
              <Text style={styles.stampText}>DORICE ACADEMY</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Official Dorice Smart Academy CBC Assessment System • Valid without alteration</Text>
          <Text>Report ID: {data.reportId}</Text>
        </View>
      </Page>
    </Document>
  );
}
