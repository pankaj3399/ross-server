import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { CRCResults, CRCFrameworkResult, CRCCategoryResult } from "../api";

// --- Styles ---

const colors = {
  brand: "#2563eb",
  black: "#020617",
  dark: "#0f172a",
  gray: "#64748b",
  lightGray: "#94a3b8",
  muted: "#f1f5f9",
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
  indigoBg: "#e0e7ff",
  emerald: "#059669",
  emeraldBg: "#d1fae5",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 50,
    paddingHorizontal: 30,
    backgroundColor: colors.white,
    fontFamily: "Helvetica",
  },
  // Branding Header
  brandingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 36,
    backgroundColor: colors.brand,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 30,
  },
  logoText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  logoAI: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "bold",
    opacity: 0.8,
  },
  headerBadge: {
    color: colors.white,
    fontSize: 7,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Footer
  brandingFooter: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.muted,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: colors.lightGray,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  // Title Section
  titleSection: {
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.black,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.brand,
    fontWeight: "bold",
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: "column",
  },
  metaLabel: {
    fontSize: 7,
    textTransform: "uppercase",
    color: colors.gray,
    letterSpacing: 1,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.dark,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
    alignSelf: "center",
  },

  // Overall Score
  overallCard: {
    flexDirection: "row",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "space-between",
  },
  overallLeft: {
    alignItems: "center",
    flex: 1,
  },
  overallScore: {
    fontSize: 48,
    fontWeight: "bold",
    color: colors.dark,
  },
  overallLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    color: colors.gray,
    letterSpacing: 2,
    marginTop: -2,
  },
  overallRight: {
    flex: 1,
    paddingLeft: 20,
    borderLeftWidth: 1,
    borderLeftColor: colors.muted,
    gap: 8,
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  tierText: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  statBox: {
    padding: 8,
    backgroundColor: colors.muted,
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 6,
    textTransform: "uppercase",
    color: colors.gray,
    marginBottom: 1,
  },
  statValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.dark,
  },

  // Countdown
  countdownBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.muted,
    marginBottom: 20,
    gap: 8,
  },
  countdownLabel: {
    fontSize: 8,
    color: colors.gray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  countdownValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.dark,
  },

  // Section Title
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: 12,
    marginTop: 8,
  },

  // Framework Cards
  frameworkRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  frameworkCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  frameworkTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: 6,
  },
  frameworkScore: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.dark,
  },
  frameworkMeta: {
    fontSize: 7,
    color: colors.gray,
    marginTop: 4,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.muted,
    borderRadius: 3,
    marginTop: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },

  // Category Table
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.muted,
  },
  categoryName: {
    flex: 2,
    fontSize: 9,
    color: colors.dark,
    fontWeight: "bold",
  },
  categoryScore: {
    flex: 1,
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "right",
  },
  categoryMeta: {
    flex: 1.5,
    fontSize: 7,
    color: colors.gray,
    textAlign: "right",
  },

  // Breakdown row
  breakdownRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    marginBottom: 12,
  },
  breakdownItem: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.muted,
    alignItems: "center",
  },
  breakdownCount: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.dark,
  },
  breakdownLabel: {
    fontSize: 7,
    color: colors.gray,
    marginTop: 2,
  },
});

// --- Helpers ---

const formatPercent = (value: number | null): string =>
  value === null ? "—" : `${value.toFixed(1)}%`;

const getTierInfo = (percent: number | null) => {
  if (percent === null) return { label: "Insufficient Data", color: colors.gray, bg: colors.muted };
  if (percent >= 90) return { label: "Ready", color: colors.green, bg: colors.greenBg };
  if (percent >= 75) return { label: "Mostly Ready", color: colors.blue, bg: colors.blueBg };
  if (percent >= 55) return { label: "Partially Ready", color: colors.amber, bg: colors.amberBg };
  return { label: "Not Ready", color: colors.red, bg: colors.redBg };
};

const getCategoryColor = (percent: number | null): string => {
  if (percent === null) return colors.gray;
  if (percent >= 80) return colors.green;
  if (percent >= 60) return colors.blue;
  if (percent >= 40) return colors.amber;
  return colors.red;
};

// --- Component ---

interface CrcDashboardPdfDocumentProps {
  results: CRCResults;
  projectName: string;
  complete: boolean;
}

export const CrcDashboardPdfDocument: React.FC<CrcDashboardPdfDocumentProps> = ({
  results,
  projectName,
  complete,
}) => {
  const { overall, categories = [], breakdown, frameworks } = results;
  const tier = getTierInfo(overall ? overall.percentage : null);
  const today = new Date();
  const deadline = new Date("2026-08-02T00:00:00Z");
  const daysRemaining = Math.max(0, Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  const defaultFramework: CRCFrameworkResult = { totalControls: 0, scoredControls: 0, points: 0, percentage: null };
  const fw = frameworks || {
    eu_ai_act: defaultFramework,
    nist_ai_rmf: defaultFramework,
    iso_42001: defaultFramework,
  };

  const frameworkEntries: Array<{
    title: string;
    data: CRCFrameworkResult;
    color: string;
  }> = [
    { title: "EU AI Act", data: fw.eu_ai_act || defaultFramework, color: colors.blue },
    { title: "NIST AI RMF", data: fw.nist_ai_rmf || defaultFramework, color: colors.indigo },
    { title: "ISO 42001", data: fw.iso_42001 || defaultFramework, color: colors.emerald },
  ];

  return (
    <Document title={`Compliance Readiness Dashboard - ${projectName}`}>
      <Page size="A4" style={styles.page}>
        {/* Branding Header */}
        <View style={styles.brandingHeader} fixed>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            <Text style={styles.logoText}>MATUR</Text>
            <Text style={styles.logoAI}>.ai</Text>
          </View>
          <Text style={styles.headerBadge}>Compliance Readiness Report</Text>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Compliance Readiness</Text>
          <Text style={styles.subtitle}>Dashboard Report</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Project</Text>
              <Text style={styles.metaValue}>{projectName}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Generated</Text>
              <Text style={styles.metaValue}>
                {today.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Status</Text>
              <Text style={styles.metaValue}>{complete ? "Complete" : "Partial"}</Text>
            </View>
          </View>
        </View>

        {/* EU AI Act Countdown */}
        <View style={styles.countdownBox}>
          <Text style={styles.countdownLabel}>EU AI Act Deadline:</Text>
          <Text style={styles.countdownValue}>
            {daysRemaining > 0
              ? `${daysRemaining} days remaining (Aug 2, 2026)`
              : "Deadline has passed"}
          </Text>
        </View>

        {/* Overall Score */}
        <View style={styles.overallCard} wrap={false}>
          <View style={styles.overallLeft}>
            <Text style={styles.metaLabel}>Overall Readiness</Text>
            <Text style={styles.overallScore}>
              {overall.percentage !== null ? `${Math.round(overall.percentage)}%` : "—"}
            </Text>
            <Text style={styles.overallLabel}>Compliance Score</Text>
          </View>
          <View style={styles.overallRight}>
            <View style={[styles.tierBadge, { backgroundColor: tier.bg }]}>
              <Text style={[styles.tierText, { color: tier.color }]}>{tier.label}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Controls Answered</Text>
              <Text style={styles.statValue}>
                {overall.answeredControls} of {overall.totalControls}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Scored Controls</Text>
              <Text style={styles.statValue}>{overall.scoredControls}</Text>
            </View>
          </View>
        </View>

        {/* Response Breakdown */}
        <Text style={styles.sectionTitle}>Response Distribution</Text>
        <View style={styles.breakdownRow}>
          {[
            { count: breakdown.yes, label: "Yes", color: colors.green },
            { count: breakdown.partial, label: "Partial", color: colors.blue },
            { count: breakdown.no, label: "No", color: colors.red },
            { count: breakdown.na, label: "N/A", color: colors.gray },
            { count: breakdown.notSure, label: "Not Sure", color: colors.gray },
          ].map((item) => (
            <View key={item.label} style={styles.breakdownItem}>
              <Text style={[styles.breakdownCount, { color: item.color }]}>{item.count}</Text>
              <Text style={styles.breakdownLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Framework Readiness */}
        <Text style={styles.sectionTitle}>Framework Readiness</Text>
        <View style={styles.frameworkRow}>
          {frameworkEntries.map((fw) => {
            const fwTier = getTierInfo(fw.data.percentage);
            return (
              <View key={fw.title} style={styles.frameworkCard} wrap={false}>
                <Text style={styles.frameworkTitle}>{fw.title}</Text>
                <Text style={[styles.frameworkScore, { color: fw.color }]}>
                  {formatPercent(fw.data.percentage)}
                </Text>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${fw.data.percentage ?? 0}%`,
                        backgroundColor: fw.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.frameworkMeta}>
                  {fw.data.scoredControls} of {fw.data.totalControls} controls scored ·{" "}
                  {fw.data.points.toFixed(1)} pts
                </Text>
                <Text style={[{ fontSize: 7, marginTop: 2, color: fwTier.color, fontWeight: "bold" }]}>
                  {fwTier.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Category Breakdown */}
        <Text style={styles.sectionTitle}>Category Breakdown</Text>
        {/* Header Row */}
        <View
          style={[
            styles.categoryRow,
            { borderBottomWidth: 2, borderBottomColor: colors.border, paddingVertical: 6 },
          ]}
        >
          <Text style={[styles.categoryName, { fontSize: 7, color: colors.gray, textTransform: "uppercase" }]}>
            Category
          </Text>
          <Text style={[styles.categoryScore, { fontSize: 7, color: colors.gray, textTransform: "uppercase" }]}>
            Score
          </Text>
          <Text style={[styles.categoryMeta, { fontSize: 7, color: colors.gray, textTransform: "uppercase" }]}>
            Controls
          </Text>
        </View>
        {categories.map((cat) => (
          <View
            key={`${cat.categoryId ?? "null"}-${cat.categoryName}`}
            style={styles.categoryRow}
            wrap={false}
          >
            <Text style={styles.categoryName}>{cat.categoryName}</Text>
            <Text style={[styles.categoryScore, { color: getCategoryColor(cat.percentage) }]}>
              {formatPercent(cat.percentage)}
            </Text>
            <Text style={styles.categoryMeta}>
              {cat.scoredControls} scored · {cat.answeredControls}/{cat.totalControls} answered
            </Text>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.brandingFooter} fixed>
          <Text style={styles.footerText}>MATUR.ai</Text>
          <Text style={styles.footerText}>CONFIDENTIAL</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
};
