import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { SummaryPdfData } from "./pdfExportTypes";

// --- Design Tokens ---
const colors = {
  brand: "#2563eb",
  black: "#020617",
  dark: "#0f172a",
  gray: "#64748b",
  lightGray: "#94a3b8",
  muted: "#f8fafc",
  border: "#e2e8f0",
  white: "#ffffff",
  green: "#059669",
  greenBg: "#d1fae5",
  blue: "#2563eb",
  blueBg: "#dbeafe",
  amber: "#d97706",
  amberBg: "#fef3c7",
  red: "#dc2626",
  redBg: "#fee2e2",
  indigo: "#4f46e5",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 50,
    paddingBottom: 45,
    paddingHorizontal: 35,
    backgroundColor: colors.white,
    fontFamily: "Helvetica",
  },
  // Fixed Page Header
  header: {
    position: "absolute",
    top: 15,
    left: 35,
    right: 35,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 4,
  },
  headerLogo: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoMatur: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.brand,
  },
  logoAi: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.dark,
  },
  headerTitle: {
    fontSize: 7.5,
    color: colors.gray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Fixed Page Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 35,
    right: 35,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
  },
  footerText: {
    fontSize: 6.5,
    color: colors.lightGray,
  },
  footerPageNum: {
    fontSize: 6.5,
    color: colors.lightGray,
    textAlign: "right",
  },
  // Page Title Area
  titleContainer: {
    marginTop: 5,
    marginBottom: 10,
  },
  reportSubtitle: {
    fontSize: 8,
    color: colors.brand,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontWeight: "bold",
    marginBottom: 2,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.black,
    marginBottom: 4,
  },
  metaGrid: {
    flexDirection: "row",
    gap: 15,
    marginTop: 3,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
  },
  metaItem: {
    minWidth: 100,
  },
  metaLabel: {
    fontSize: 6.5,
    color: colors.gray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  metaValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.dark,
  },
  // Disclaimer Box
  disclaimerBox: {
    backgroundColor: colors.muted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },
  disclaimerText: {
    fontSize: 7,
    color: colors.gray,
    lineHeight: 1.25,
  },
  // Sections General
  sectionContainer: {
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.dark,
    borderLeftWidth: 2.5,
    borderLeftColor: colors.brand,
    paddingLeft: 5,
    marginBottom: 6,
  },
  narrativeText: {
    fontSize: 8.5,
    color: colors.dark,
    lineHeight: 1.35,
    marginBottom: 8,
    fontStyle: "italic",
    backgroundColor: "#f0f4ff",
    padding: 8,
    borderRadius: 4,
    borderLeftWidth: 1.5,
    borderLeftColor: colors.brand,
  },
  // Profile Row
  profileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    backgroundColor: colors.muted,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  profileItem: {
    flex: 1,
    flexDirection: "column",
  },
  // Hero Cards
  cardRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 4,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 10,
    alignItems: "center",
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: 1,
  },
  cardLabel: {
    fontSize: 7.5,
    color: colors.gray,
    textTransform: "uppercase",
  },
  // Framework Alignment
  frameworkRow: {
    flexDirection: "row",
    gap: 8,
  },
  frameworkItem: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 8,
  },
  fwTitle: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: 4,
  },
  fwBarTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  fwBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  fwMeta: {
    fontSize: 7,
    color: colors.gray,
  },
  fwPercentage: {
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 2,
  },
  // Strengths & Gaps (2 columns)
  strengthGapRow: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 10,
  },
  strengthGapCol: {
    flex: 1,
  },
  strengthGapList: {
    flexDirection: "column",
    gap: 4,
  },
  strengthGapItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 4,
  },
  sgName: {
    fontSize: 8.5,
    color: colors.dark,
  },
  sgScore: {
    fontSize: 9,
    fontWeight: "bold",
  },
  // Snapshot lines
  snapshotRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 8,
    backgroundColor: colors.muted,
  },
  snapshotVal: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.dark,
  },
});

// Formatting Helpers
const getTrafficLightColor = (percentage: number | null): string => {
  if (percentage === null) return colors.gray;
  if (percentage >= 60) return colors.green;
  if (percentage >= 30) return colors.amber;
  return colors.red;
};

const getTrafficLightBg = (percentage: number | null): string => {
  if (percentage === null) return colors.muted;
  if (percentage >= 60) return colors.greenBg;
  if (percentage >= 30) return colors.amberBg;
  return colors.redBg;
};

const getRiskColor = (rating: string): string => {
  const r = rating ? rating.toLowerCase() : "";
  if (r === "critical" || r === "high" || r === "unacceptable") return colors.red;
  if (r === "medium" || r === "limited") return colors.amber;
  return colors.blue;
};

const getRiskBg = (rating: string): string => {
  const r = rating ? rating.toLowerCase() : "";
  if (r === "critical" || r === "high" || r === "unacceptable") return colors.redBg;
  if (r === "medium" || r === "limited") return colors.amberBg;
  return colors.blueBg;
};

interface CrcSummaryPdfDocumentProps {
  data: SummaryPdfData;
  isEU: boolean;
}

export const CrcSummaryPdfDocument: React.FC<CrcSummaryPdfDocumentProps> = ({ data, isEU }) => {
  const {
    projectName,
    projectDescription,
    timestamp,
    systemProfile,
    heroMetrics,
    frameworkReadiness,
    strengthsAndGaps,
    riskRegisterSnapshot,
    componentSnapshot,
  } = data;

  const today = new Date(timestamp);
  const formattedDate = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = today.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const overallColor = getTrafficLightColor(heroMetrics.overallPercentage);
  const overallBg = getTrafficLightBg(heroMetrics.overallPercentage);

  return (
    <Document title={`Executive CRC Report - ${projectName}`}>
      {/* PAGE 1: System Profile, Hero Metrics, Framework Readiness */}
      <Page size={isEU ? "A4" : "LETTER"} style={styles.page}>
        {/* Fixed Header */}
        <View style={styles.header} fixed>
          <View style={styles.headerLogo}>
            <Text style={styles.logoMatur}>MATUR</Text>
            <Text style={styles.logoAi}>.ai</Text>
          </View>
          <Text style={styles.headerTitle}>Executive Governance Summary</Text>
        </View>

        {/* Fixed Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Data current as of {formattedDate} {formattedTime}. Regenerate at matur.ai for current data.
          </Text>
          <Text
            style={styles.footerPageNum}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>

        {/* Title Area */}
        <View style={styles.titleContainer}>
          <Text style={styles.reportSubtitle}>Executive Briefing</Text>
          <Text style={styles.reportTitle}>Compliance Readiness Executive Summary</Text>
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Project Name</Text>
              <Text style={styles.metaValue}>{projectName}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Date Generated</Text>
              <Text style={styles.metaValue}>{formattedDate}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>EU Risk Tier</Text>
              <Text style={styles.metaValue}>{systemProfile.euRiskTier}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Internal Risk Tier</Text>
              <Text style={styles.metaValue}>{systemProfile.internalRiskTier}</Text>
            </View>
          </View>
        </View>

        {/* Legal Disclaimer */}
        <View style={styles.disclaimerBox} wrap={false}>
          <Text style={styles.disclaimerText}>
            This document is generated by MATUR.ai based on internal inputs and self-assessment data. It does not
            constitute legal advice, regulatory certification, or third-party verification. Framework compliance
            determinations require assessment by qualified legal and compliance professionals. MATUR.ai makes no
            representations regarding the organization's regulatory compliance status. Data current as of {timestamp}.
          </Text>
        </View>

        {/* System Profile Summary */}
        <View style={styles.sectionContainer} wrap={false}>
          <Text style={styles.sectionHeading}>System Profile Summary</Text>
          {systemProfile.narrative ? (
            <Text style={styles.narrativeText}>{systemProfile.narrative}</Text>
          ) : null}
          <View style={styles.profileRow}>
            <View style={styles.profileItem}>
              <Text style={styles.metaLabel}>Governance Scope</Text>
              <Text style={styles.metaValue}>{systemProfile.governanceScope}</Text>
            </View>
            <View style={styles.profileItem}>
              <Text style={styles.metaLabel}>Regulatory Role</Text>
              <Text style={styles.metaValue}>{systemProfile.regulatoryRole}</Text>
            </View>
            <View style={styles.profileItem}>
              <Text style={styles.metaLabel}>EU AI Act Tier</Text>
              <Text style={[styles.metaValue, { color: getRiskColor(systemProfile.euRiskTier) }]}>
                {systemProfile.euRiskTier}
              </Text>
            </View>
            <View style={styles.profileItem}>
              <Text style={styles.metaLabel}>Internal Tier</Text>
              <Text style={[styles.metaValue, { color: getRiskColor(systemProfile.internalRiskTier) }]}>
                {systemProfile.internalRiskTier}
              </Text>
            </View>
          </View>
        </View>

        {/* Governance Metrics */}
        <View style={styles.sectionContainer} wrap={false}>
          <Text style={styles.sectionHeading}>Overall Governance Posture</Text>
          {heroMetrics.narrative ? (
            <Text style={styles.narrativeText}>{heroMetrics.narrative}</Text>
          ) : null}
          <View style={styles.cardRow}>
            <View style={[styles.card, { backgroundColor: overallBg, borderColor: overallColor }]}>
              <Text style={[styles.cardValue, { color: overallColor }]}>
                {heroMetrics.overallPercentage !== null ? `${heroMetrics.overallPercentage}%` : "—"}
              </Text>
              <Text style={styles.cardLabel}>Readiness Score</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardValue}>{heroMetrics.evidencePercentage}%</Text>
              <Text style={styles.cardLabel}>Evidence Uploaded</Text>
            </View>
            <View style={styles.card}>
              <Text style={[styles.cardValue, { color: heroMetrics.openRisksCount > 0 ? colors.red : colors.green }]}>
                {heroMetrics.openRisksCount}
              </Text>
              <Text style={styles.cardLabel}>Active Risks</Text>
            </View>
          </View>
        </View>

        {/* Framework Alignment */}
        <View style={styles.sectionContainer} wrap={false}>
          <Text style={styles.sectionHeading}>Framework Alignment</Text>
          {frameworkReadiness.narrative ? (
            <Text style={styles.narrativeText}>{frameworkReadiness.narrative}</Text>
          ) : null}
          <View style={styles.frameworkRow}>
            {[
              { label: "EU AI Act", percentage: frameworkReadiness.euAiAct, color: colors.blue },
              { label: "NIST AI RMF", percentage: frameworkReadiness.nistAiRmf, color: colors.indigo },
              { label: "ISO 42001", percentage: frameworkReadiness.iso42001, color: colors.green },
            ].map(fw => (
              <View key={fw.label} style={styles.frameworkItem} wrap={false}>
                <Text style={styles.fwTitle}>{fw.label}</Text>
                <View style={styles.fwBarTrack}>
                  <View
                    style={[
                      styles.fwBarFill,
                      {
                        width: `${fw.percentage ?? 0}%`,
                        backgroundColor: fw.color,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.fwPercentage, { color: fw.color }]}>
                  {fw.percentage !== null ? `${fw.percentage}%` : "—"}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Page>

      {/* PAGE 2: Strengths, Gaps, Risks, Components */}
      <Page size={isEU ? "A4" : "LETTER"} style={styles.page}>
        {/* Fixed Header */}
        <View style={styles.header} fixed>
          <View style={styles.headerLogo}>
            <Text style={styles.logoMatur}>MATUR</Text>
            <Text style={styles.logoAi}>.ai</Text>
          </View>
          <Text style={styles.headerTitle}>Executive Governance Summary</Text>
        </View>

        {/* Fixed Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Data current as of {formattedDate} {formattedTime}. Regenerate at matur.ai for current data.
          </Text>
          <Text
            style={styles.footerPageNum}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>

        {/* Strengths & Priority Gaps */}
        <View style={styles.strengthGapRow}>
          {/* Top 3 Strengths */}
          <View style={styles.strengthGapCol} wrap={false}>
            <Text style={[styles.sectionHeading, { borderLeftColor: colors.green }]}>Top 3 Strengths</Text>
            {strengthsAndGaps.strengths.length > 0 && strengthsAndGaps.strengths[0].narrative ? (
              <Text style={[styles.narrativeText, { backgroundColor: "#eefdf5", borderLeftColor: colors.green, fontSize: 8.2 }]}>
                {strengthsAndGaps.strengths[0].narrative}
              </Text>
            ) : null}
            <View style={styles.strengthGapList}>
              {strengthsAndGaps.strengths.map((str, idx) => (
                <View key={idx} style={styles.strengthGapItem}>
                  <Text style={styles.sgName}>{str.categoryName}</Text>
                  <Text style={[styles.sgScore, { color: colors.green }]}>{str.percentage}%</Text>
                </View>
              ))}
              {strengthsAndGaps.strengths.length === 0 ? (
                <Text style={[styles.sgName, { fontStyle: "italic", color: colors.gray }]}>No strengths data available.</Text>
              ) : null}
            </View>
          </View>

          {/* Priority Gaps */}
          <View style={styles.strengthGapCol} wrap={false}>
            <Text style={[styles.sectionHeading, { borderLeftColor: colors.red }]}>Priority Gaps</Text>
            {strengthsAndGaps.gaps.length > 0 && strengthsAndGaps.gaps[0].narrative ? (
              <Text style={[styles.narrativeText, { backgroundColor: "#fff5f5", borderLeftColor: colors.red, fontSize: 8.2 }]}>
                {strengthsAndGaps.gaps[0].narrative}
              </Text>
            ) : null}
            <View style={styles.strengthGapList}>
              {strengthsAndGaps.gaps.map((gap, idx) => (
                <View key={idx} style={styles.strengthGapItem}>
                  <Text style={styles.sgName}>{gap.categoryName}</Text>
                  <Text style={[styles.sgScore, { color: colors.red }]}>{gap.percentage}%</Text>
                </View>
              ))}
              {strengthsAndGaps.gaps.length === 0 ? (
                <Text style={[styles.sgName, { fontStyle: "italic", color: colors.gray }]}>No gaps data available.</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Risk Register Snapshot */}
        <View style={styles.sectionContainer} wrap={false}>
          <Text style={styles.sectionHeading}>Risk Register Snapshot</Text>
          {riskRegisterSnapshot.narrative ? (
            <Text style={styles.narrativeText}>{riskRegisterSnapshot.narrative}</Text>
          ) : null}
          <View style={styles.snapshotRow}>
            <View style={styles.profileItem}>
              <Text style={styles.metaLabel}>Critical Risks</Text>
              <Text style={[styles.snapshotVal, { color: colors.red }]}>
                {riskRegisterSnapshot.counts.critical}
              </Text>
            </View>
            <View style={styles.profileItem}>
              <Text style={styles.metaLabel}>High Risks</Text>
              <Text style={[styles.snapshotVal, { color: colors.red }]}>
                {riskRegisterSnapshot.counts.high}
              </Text>
            </View>
            <View style={styles.profileItem}>
              <Text style={styles.metaLabel}>Medium Risks</Text>
              <Text style={[styles.snapshotVal, { color: colors.amber }]}>
                {riskRegisterSnapshot.counts.medium}
              </Text>
            </View>
            <View style={styles.profileItem}>
              <Text style={styles.metaLabel}>Low Risks</Text>
              <Text style={[styles.snapshotVal, { color: colors.blue }]}>
                {riskRegisterSnapshot.counts.low}
              </Text>
            </View>
            <View style={styles.profileItem}>
              <Text style={styles.metaLabel}>Total Active Risks</Text>
              <Text style={styles.snapshotVal}>
                {riskRegisterSnapshot.counts.total}
              </Text>
            </View>
          </View>
        </View>

        {/* Component Inventory Snapshot */}
        <View style={styles.sectionContainer} wrap={false}>
          <Text style={styles.sectionHeading}>Component & Vendor Risk Snapshot</Text>
          {componentSnapshot.narrative ? (
            <Text style={styles.narrativeText}>{componentSnapshot.narrative}</Text>
          ) : null}
          <View style={styles.snapshotRow}>
            <View style={styles.profileItem}>
              <Text style={styles.metaLabel}>Total Components</Text>
              <Text style={styles.snapshotVal}>
                {componentSnapshot.totalComponents}
              </Text>
            </View>
            <View style={styles.profileItem}>
              <Text style={styles.metaLabel}>Critical-Risk Components</Text>
              <Text style={[styles.snapshotVal, { color: colors.red }]}>
                {componentSnapshot.criticalRiskComponents}
              </Text>
            </View>
            <View style={styles.profileItem}>
              <Text style={styles.metaLabel}>High-Risk Components</Text>
              <Text style={[styles.snapshotVal, { color: colors.red }]}>
                {componentSnapshot.highRiskComponents}
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
