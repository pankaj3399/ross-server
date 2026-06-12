import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { FullPdfData } from "./pdfExportTypes";

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
    paddingTop: 65,
    paddingBottom: 60,
    paddingHorizontal: 35,
    backgroundColor: colors.white,
    fontFamily: "Helvetica",
  },
  // Fixed Page Header
  header: {
    position: "absolute",
    top: 20,
    left: 35,
    right: 35,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 6,
  },
  headerLogo: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoMatur: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.brand,
  },
  logoAi: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.dark,
  },
  headerTitle: {
    fontSize: 8,
    color: colors.gray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Fixed Page Footer
  footer: {
    position: "absolute",
    bottom: 25,
    left: 35,
    right: 35,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: colors.lightGray,
  },
  footerPageNum: {
    fontSize: 7,
    color: colors.lightGray,
    textAlign: "right",
  },
  // Page 1 Title Area
  titleContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  reportSubtitle: {
    fontSize: 9,
    color: colors.brand,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontWeight: "bold",
    marginBottom: 4,
  },
  reportTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.black,
    marginBottom: 8,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
    marginTop: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 15,
  },
  metaItem: {
    minWidth: 120,
  },
  metaLabel: {
    fontSize: 7,
    color: colors.gray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.dark,
  },
  // Disclaimer Box
  disclaimerBox: {
    backgroundColor: colors.muted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 10,
    marginBottom: 20,
  },
  disclaimerTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: colors.red,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 8,
    color: colors.gray,
    lineHeight: 1.3,
  },
  // Sections General
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: "bold",
    color: colors.dark,
    borderLeftWidth: 3,
    borderLeftColor: colors.brand,
    paddingLeft: 6,
    marginBottom: 10,
  },
  narrativeText: {
    fontSize: 9.5,
    color: colors.dark,
    lineHeight: 1.4,
    marginBottom: 12,
    fontStyle: "italic",
    backgroundColor: "#f0f4ff",
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 2,
    borderLeftColor: colors.brand,
  },
  // System Profile Grid
  profileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
  },
  profileCol: {
    width: "50%",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
  },
  profileLabel: {
    fontSize: 8,
    color: colors.gray,
    width: "40%",
  },
  profileVal: {
    fontSize: 8,
    fontWeight: "bold",
    color: colors.dark,
    width: "60%",
  },
  // Hero Cards
  cardRow: {
    flexDirection: "row",
    gap: 12,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  cardValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: 2,
  },
  cardLabel: {
    fontSize: 8,
    color: colors.gray,
    textTransform: "uppercase",
    textAlign: "center",
  },
  // Framework Row
  frameworkRow: {
    flexDirection: "column",
    gap: 10,
  },
  frameworkItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fwTitleCol: {
    width: "40%",
  },
  fwTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.dark,
  },
  fwMeta: {
    fontSize: 7,
    color: colors.gray,
    marginTop: 2,
  },
  fwBarCol: {
    width: "45%",
  },
  fwBarTrack: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  fwBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  fwScoreCol: {
    width: "15%",
    alignItems: "flex-end",
  },
  fwScore: {
    fontSize: 12,
    fontWeight: "bold",
  },
  // Table Styling
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.muted,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  thText: {
    fontSize: 7,
    fontWeight: "bold",
    color: colors.gray,
    textTransform: "uppercase",
  },
  tbText: {
    fontSize: 8,
    color: colors.dark,
  },
  // Section specific tables
  colCatName: { width: "70%" },
  colCatScore: { width: "30%", textAlign: "right" },
  // Controls list table
  colCtrlId: { width: "12%" },
  colCtrlTitle: { width: "32%" },
  colCtrlFlag: { width: "13%" },
  colCtrlAns: { width: "13%" },
  colCtrlEvid: { width: "15%" },
  colCtrlAudit: { width: "15%" },
  // Risks table
  colRiskTitle: { width: "25%" },
  colRiskCat: { width: "15%" },
  colRiskRating: { width: "10%" },
  colRiskOwner: { width: "15%" },
  colRiskDesc: { width: "35%" },
  // Components table
  colCompName: { width: "25%" },
  colCompType: { width: "20%" },
  colCompProvider: { width: "15%" },
  colCompRole: { width: "25%" },
  colCompRisk: { width: "15%" },
  // Vendors table
  colVendorName: { width: "25%" },
  colVendorComp: { width: "25%" },
  colVendorScore: { width: "15%" },
  colVendorRisk: { width: "15%" },
  colVendorStatus: { width: "20%" },
  // Badge helper
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 7,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  // Bias Grid
  biasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  biasItem: {
    flex: 1,
    minWidth: 90,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 8,
    alignItems: "center",
  },
});

// --- Formatting Helpers ---
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
  const r = rating.toLowerCase();
  if (r === "critical" || r === "high") return colors.red;
  if (r === "medium") return colors.amber;
  return colors.blue;
};

const getRiskBg = (rating: string): string => {
  const r = rating.toLowerCase();
  if (r === "critical" || r === "high") return colors.redBg;
  if (r === "medium") return colors.amberBg;
  return colors.blueBg;
};

interface CrcFullPdfDocumentProps {
  data: FullPdfData;
  isEU: boolean;
}

export const CrcFullPdfDocument: React.FC<CrcFullPdfDocumentProps> = ({ data, isEU }) => {
  const {
    projectName,
    projectDescription,
    timestamp,
    systemProfile,
    heroMetrics,
    frameworkReadiness,
    categoryBreakdown,
    controlList = [],
    riskRegister,
    componentInventory,
    vendorAssessments,
    biasAndVulnerability,
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
    <Document title={`CRC Governance Report - ${projectName}`}>
      <Page size={isEU ? "A4" : "LETTER"} style={styles.page}>
        {/* Fixed Header */}
        <View style={styles.header} fixed>
          <View style={styles.headerLogo}>
            <Text style={styles.logoMatur}>MATUR</Text>
            <Text style={styles.logoAi}>.ai</Text>
          </View>
          <Text style={styles.headerTitle}>Full Governance & Readiness Report</Text>
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

        {/* Page 1 Content */}
        <View style={styles.titleContainer}>
          <Text style={styles.reportSubtitle}>CRC Compliance Dashboard</Text>
          <Text style={styles.reportTitle}>Comprehensive Assessment Report</Text>
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Project Name</Text>
              <Text style={styles.metaValue}>{projectName}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Generated On</Text>
              <Text style={styles.metaValue}>{formattedDate}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>System Scope</Text>
              <Text style={styles.metaValue}>{systemProfile.data.governanceScope}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>EU Risk Tier</Text>
              <Text style={styles.metaValue}>{systemProfile.data.euRiskTier}</Text>
            </View>
          </View>
        </View>

        {/* Legal Disclaimer */}
        <View style={styles.disclaimerBox} wrap={false}>
          <Text style={styles.disclaimerTitle}>Legal Disclaimer</Text>
          <Text style={styles.disclaimerText}>
            This document is generated by MATUR.ai based on internal inputs and self-assessment data. It does not
            constitute legal advice, regulatory certification, or third-party verification. Framework compliance
            determinations require assessment by qualified legal and compliance professionals. MATUR.ai makes no
            representations regarding the organization's regulatory compliance status. Data current as of {timestamp}.
          </Text>
        </View>

        {/* Section 1: System Profile */}
        <View style={styles.sectionContainer} wrap={false}>
          <Text style={styles.sectionHeading}>1. System Profile</Text>
          {systemProfile.narrative ? (
            <Text style={styles.narrativeText}>{systemProfile.narrative}</Text>
          ) : null}
          <View style={styles.profileGrid}>
            <View style={styles.profileCol}>
              <Text style={styles.profileLabel}>Regulatory Role</Text>
              <Text style={styles.profileVal}>{systemProfile.data.regulatoryRole}</Text>
            </View>
            <View style={styles.profileCol}>
              <Text style={styles.profileLabel}>Automation Level</Text>
              <Text style={styles.profileVal}>{systemProfile.data.automationLevel}</Text>
            </View>
            <View style={styles.profileCol}>
              <Text style={styles.profileLabel}>Primary Use Case</Text>
              <Text style={styles.profileVal}>{systemProfile.data.useCase}</Text>
            </View>
            <View style={styles.profileCol}>
              <Text style={styles.profileLabel}>Scale</Text>
              <Text style={styles.profileVal}>{systemProfile.data.scale}</Text>
            </View>
            <View style={styles.profileCol}>
              <Text style={styles.profileLabel}>Third-Party Models</Text>
              <Text style={styles.profileVal}>{systemProfile.data.usesThirdPartyModels}</Text>
            </View>
            <View style={styles.profileCol}>
              <Text style={styles.profileLabel}>Biometric Use</Text>
              <Text style={styles.profileVal}>{systemProfile.data.biometricUse}</Text>
            </View>
            <View style={[styles.profileCol, { width: "100%" }]}>
              <Text style={[styles.profileLabel, { width: "20%" }]}>EU Risk Reason</Text>
              <Text style={[styles.profileVal, { width: "80%" }]}>{systemProfile.data.euRiskReason}</Text>
            </View>
          </View>
        </View>

        {/* Section 2: Hero Metrics */}
        <View style={styles.sectionContainer} wrap={false}>
          <Text style={styles.sectionHeading}>2. Overall Governance Metrics</Text>
          {heroMetrics.narrative ? (
            <Text style={styles.narrativeText}>{heroMetrics.narrative}</Text>
          ) : null}
          <View style={styles.cardRow}>
            <View style={[styles.card, { backgroundColor: overallBg, borderColor: overallColor }]}>
              <Text style={[styles.cardValue, { color: overallColor }]}>
                {heroMetrics.overallPercentage !== null ? `${heroMetrics.overallPercentage}%` : "—"}
              </Text>
              <Text style={styles.cardLabel}>Overall Readiness</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardValue}>{heroMetrics.evidencePercentage}%</Text>
              <Text style={styles.cardLabel}>Evidence Uploaded</Text>
            </View>
            <View style={styles.card}>
              <Text style={[styles.cardValue, { color: heroMetrics.openRisksCount > 0 ? colors.red : colors.green }]}>
                {heroMetrics.openRisksCount}
              </Text>
              <Text style={styles.cardLabel}>Open Risks</Text>
            </View>
          </View>
        </View>

        {/* Section 3: Framework Readiness */}
        <View style={styles.sectionContainer} wrap={false}>
          <Text style={styles.sectionHeading}>3. Framework Readiness</Text>
          {frameworkReadiness.narrative ? (
            <Text style={styles.narrativeText}>{frameworkReadiness.narrative}</Text>
          ) : null}
          <View style={styles.frameworkRow}>
            {[
              { label: "EU AI Act Compliance", data: frameworkReadiness.euAiAct, color: colors.blue },
              { label: "NIST AI Risk Management Framework", data: frameworkReadiness.nistAiRmf, color: colors.indigo },
              { label: "ISO/IEC 42001 Standard Alignment", data: frameworkReadiness.iso42001, color: colors.green },
            ].map(fw => (
              <View key={fw.label} style={styles.frameworkItem} wrap={false}>
                <View style={styles.fwTitleCol}>
                  <Text style={styles.fwTitle}>{fw.label}</Text>
                  <Text style={styles.fwMeta}>
                    {fw.data.scored} of {fw.data.applicable} controls scored
                  </Text>
                </View>
                <View style={styles.fwBarCol}>
                  <View style={styles.fwBarTrack}>
                    <View
                      style={[
                        styles.fwBarFill,
                        {
                          width: `${fw.data.percentage ?? 0}%`,
                          backgroundColor: fw.color,
                        },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.fwScoreCol}>
                  <Text style={[styles.fwScore, { color: fw.color }]}>
                    {fw.data.percentage !== null ? `${fw.data.percentage}%` : "—"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Section 4: Category Breakdown */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>4. Category Performance</Text>
          {categoryBreakdown.narrative ? (
            <Text style={styles.narrativeText}>{categoryBreakdown.narrative}</Text>
          ) : null}
          <View style={styles.tableHeader}>
            <View style={styles.colCatName}>
              <Text style={styles.thText}>Category</Text>
            </View>
            <View style={styles.colCatScore}>
              <Text style={[styles.thText, { textAlign: "right" }]}>Readiness Score</Text>
            </View>
          </View>
          {categoryBreakdown.categories.map((cat, idx) => (
            <View key={idx} style={styles.tableRow} wrap={false}>
              <View style={styles.colCatName}>
                <Text style={styles.tbText}>{cat.categoryName}</Text>
              </View>
              <View style={styles.colCatScore}>
                <Text style={[styles.tbText, { fontWeight: "bold", color: getTrafficLightColor(cat.percentage), textAlign: "right" }]}>
                  {cat.percentage !== null ? `${cat.percentage}%` : "—"}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Section 5: Risk Register */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>5. Active Risks & Mitigations</Text>
          {riskRegister.narrative ? (
            <Text style={styles.narrativeText}>{riskRegister.narrative}</Text>
          ) : null}
          {riskRegister.risks.length > 0 ? (
            <View>
              <View style={styles.tableHeader}>
                <View style={styles.colRiskTitle}><Text style={styles.thText}>Risk Title</Text></View>
                <View style={styles.colRiskCat}><Text style={styles.thText}>Category</Text></View>
                <View style={styles.colRiskRating}><Text style={styles.thText}>Rating</Text></View>
                <View style={styles.colRiskOwner}><Text style={styles.thText}>Owner</Text></View>
                <View style={styles.colRiskDesc}><Text style={styles.thText}>Description</Text></View>
              </View>
              {riskRegister.risks.map((risk, idx) => (
                <View key={idx} style={styles.tableRow} wrap={false}>
                  <View style={styles.colRiskTitle}><Text style={[styles.tbText, { fontWeight: "bold" }]}>{risk.title}</Text></View>
                  <View style={styles.colRiskCat}><Text style={styles.tbText}>{risk.category}</Text></View>
                  <View style={styles.colRiskRating}>
                    <View style={[styles.badge, { backgroundColor: getRiskBg(risk.rating) }]}>
                      <Text style={[styles.badgeText, { color: getRiskColor(risk.rating) }]}>{risk.rating}</Text>
                    </View>
                  </View>
                  <View style={styles.colRiskOwner}><Text style={styles.tbText}>{risk.owner}</Text></View>
                  <View style={styles.colRiskDesc}><Text style={styles.tbText}>{risk.description}</Text></View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.tbText, { fontStyle: "italic", color: colors.gray }]}>
              No open risks registered.
            </Text>
          )}
        </View>

        {/* Section 6: Component Inventory */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>6. Component Inventory</Text>
          {componentInventory.narrative ? (
            <Text style={styles.narrativeText}>{componentInventory.narrative}</Text>
          ) : null}
          {componentInventory.components.length > 0 ? (
            <View>
              <View style={styles.tableHeader}>
                <View style={styles.colCompName}><Text style={styles.thText}>Component Name</Text></View>
                <View style={styles.colCompType}><Text style={styles.thText}>Type</Text></View>
                <View style={styles.colCompProvider}><Text style={styles.thText}>Provider</Text></View>
                <View style={styles.colCompRole}><Text style={styles.thText}>Role in System</Text></View>
                <View style={styles.colCompRisk}><Text style={styles.thText}>Risk Tier</Text></View>
              </View>
              {componentInventory.components.map((comp, idx) => (
                <View key={idx} style={styles.tableRow} wrap={false}>
                  <View style={styles.colCompName}><Text style={[styles.tbText, { fontWeight: "bold" }]}>{comp.componentName}</Text></View>
                  <View style={styles.colCompType}><Text style={styles.tbText}>{comp.componentType}</Text></View>
                  <View style={styles.colCompProvider}><Text style={styles.tbText}>{comp.provider}</Text></View>
                  <View style={styles.colCompRole}><Text style={styles.tbText}>{comp.roleInSystem}</Text></View>
                  <View style={styles.colCompRisk}>
                    <View style={[styles.badge, { backgroundColor: getRiskBg(comp.riskTier) }]}>
                      <Text style={[styles.badgeText, { color: getRiskColor(comp.riskTier) }]}>{comp.riskTier}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.tbText, { fontStyle: "italic", color: colors.gray }]}>
              No infrastructure components registered.
            </Text>
          )}
        </View>

        {/* Section 7: Vendor Assessments */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>7. Vendor Security & Risk Assessments</Text>
          {vendorAssessments.narrative ? (
            <Text style={styles.narrativeText}>{vendorAssessments.narrative}</Text>
          ) : null}
          {vendorAssessments.vendors.length > 0 ? (
            <View>
              <View style={styles.tableHeader}>
                <View style={styles.colVendorName}><Text style={styles.thText}>Vendor</Text></View>
                <View style={styles.colVendorComp}><Text style={styles.thText}>Component Name</Text></View>
                <View style={styles.colVendorScore}><Text style={styles.thText}>Security Score</Text></View>
                <View style={styles.colVendorRisk}><Text style={styles.thText}>Risk Level</Text></View>
                <View style={styles.colVendorStatus}><Text style={styles.thText}>Status</Text></View>
              </View>
              {vendorAssessments.vendors.map((vendor, idx) => (
                <View key={idx} style={styles.tableRow} wrap={false}>
                  <View style={styles.colVendorName}><Text style={[styles.tbText, { fontWeight: "bold" }]}>{vendor.vendorName}</Text></View>
                  <View style={styles.colVendorComp}><Text style={styles.tbText}>{vendor.componentName}</Text></View>
                  <View style={styles.colVendorScore}>
                    <Text style={[styles.tbText, { fontWeight: "bold", color: getTrafficLightColor(vendor.score) }]}>
                      {vendor.score}%
                    </Text>
                  </View>
                  <View style={styles.colVendorRisk}>
                    <View style={[styles.badge, { backgroundColor: getRiskBg(vendor.riskTier) }]}>
                      <Text style={[styles.badgeText, { color: getRiskColor(vendor.riskTier) }]}>{vendor.riskTier}</Text>
                    </View>
                  </View>
                  <View style={styles.colVendorStatus}><Text style={styles.tbText}>{vendor.status}</Text></View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.tbText, { fontStyle: "italic", color: colors.gray }]}>
              No third-party vendor assessments found.
            </Text>
          )}
        </View>

        {/* Section 8: Bias Testing & Vulnerability Assessment */}
        <View style={styles.sectionContainer} wrap={false}>
          <Text style={styles.sectionHeading}>8. Algorithmic Trust & Safety Assessments</Text>
          {biasAndVulnerability.narrative ? (
            <Text style={styles.narrativeText}>{biasAndVulnerability.narrative}</Text>
          ) : null}
          <View style={styles.biasGrid}>
            <View style={styles.biasItem}>
              <Text style={styles.metaValue}>{biasAndVulnerability.evaluationsCount}</Text>
              <Text style={styles.cardLabel}>Fairness Tests</Text>
            </View>
            <View style={styles.biasItem}>
              <Text style={styles.metaValue}>{biasAndVulnerability.datasetReportsCount}</Text>
              <Text style={styles.cardLabel}>Dataset Reports</Text>
            </View>
            <View style={styles.biasItem}>
              <Text style={styles.metaValue}>{biasAndVulnerability.apiReportsCount}</Text>
              <Text style={styles.cardLabel}>API Reports</Text>
            </View>
            <View style={styles.biasItem}>
              <Text style={[styles.metaValue, { color: getTrafficLightColor((biasAndVulnerability.averageScores.bias ?? 0) * 100) }]}>
                {biasAndVulnerability.averageScores.bias !== null ? `${Math.round(biasAndVulnerability.averageScores.bias * 100)}%` : "—"}
              </Text>
              <Text style={styles.cardLabel}>Average Bias</Text>
            </View>
            <View style={styles.biasItem}>
              <Text style={[styles.metaValue, { color: getTrafficLightColor((1 - (biasAndVulnerability.averageScores.toxicity ?? 0)) * 100) }]}>
                {biasAndVulnerability.averageScores.toxicity !== null ? `${Math.round(biasAndVulnerability.averageScores.toxicity * 100)}%` : "—"}
              </Text>
              <Text style={styles.cardLabel}>Toxicity Safety</Text>
            </View>
          </View>
        </View>

        {/* Section 9: Full Control List */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>9. Full Governance Controls List</Text>
          <View style={styles.tableHeader}>
            <View style={styles.colCtrlId}><Text style={styles.thText}>ID</Text></View>
            <View style={styles.colCtrlTitle}><Text style={styles.thText}>Control Title</Text></View>
            <View style={styles.colCtrlFlag}><Text style={styles.thText}>Required Flag</Text></View>
            <View style={styles.colCtrlAns}><Text style={styles.thText}>Response</Text></View>
            <View style={styles.colCtrlEvid}><Text style={styles.thText}>Evidence Status</Text></View>
            <View style={styles.colCtrlAudit}><Text style={styles.thText}>Audit Ready</Text></View>
          </View>
          {controlList.map((ctrl, idx) => (
            <View key={idx} style={styles.tableRow} wrap={false}>
              <View style={styles.colCtrlId}><Text style={[styles.tbText, { fontWeight: "bold" }]}>{ctrl.controlId}</Text></View>
              <View style={styles.colCtrlTitle}>
                <Text style={styles.tbText}>{ctrl.controlTitle}</Text>
                {ctrl.notes ? (
                  <Text style={[styles.tbText, { fontSize: 6.5, color: colors.gray, marginTop: 2 }]}>
                    Notes: {ctrl.notes}
                  </Text>
                ) : null}
              </View>
              <View style={styles.colCtrlFlag}>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        ctrl.flag === "MANDATORY"
                          ? colors.redBg
                          : ctrl.flag === "RECOMMENDED"
                          ? colors.blueBg
                          : colors.muted,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color:
                          ctrl.flag === "MANDATORY"
                            ? colors.red
                            : ctrl.flag === "RECOMMENDED"
                            ? colors.blue
                            : colors.gray,
                      },
                    ]}
                  >
                    {ctrl.flag}
                  </Text>
                </View>
              </View>
              <View style={styles.colCtrlAns}>
                <Text
                  style={[
                    styles.tbText,
                    {
                      fontWeight: "bold",
                      color:
                        ctrl.answer === "Yes"
                          ? colors.green
                          : ctrl.answer === "Partially"
                          ? colors.amber
                          : ctrl.answer === "No"
                          ? colors.red
                          : colors.gray,
                    },
                  ]}
                >
                  {ctrl.answer}
                </Text>
              </View>
              <View style={styles.colCtrlEvid}><Text style={styles.tbText}>{ctrl.evidenceStatus}</Text></View>
              <View style={styles.colCtrlAudit}>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: ctrl.auditReady ? colors.greenBg : colors.redBg,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color: ctrl.auditReady ? colors.green : colors.red,
                      },
                    ]}
                  >
                    {ctrl.auditReady ? "READY" : "NO"}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};
