import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { parseInsightText } from '../insightUtils';

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    paddingTop: 60, // Space for fixed header
    paddingBottom: 50, // Space for fixed footer
    paddingHorizontal: 30,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  // Branding
  brandingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 36,
    backgroundColor: '#2563eb', // Brand Blue
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
  },
  logoPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  logoMatur: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'black',
    letterSpacing: 0.5,
  },
  logoAI: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'black',
    opacity: 0.8,
  },
  headerText: {
    color: '#ffffff',
    fontSize: 7,
    fontWeight: 'normal',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  brandingFooter: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 7,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'black',
    color: '#020617',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24,
    color: '#2563eb',
    fontWeight: 'bold',
  },
  metaContainer: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 20,
  },
  metaItem: {
    flexDirection: 'column',
  },
  metaLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#020617',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
  },

  // Layout
  mainContent: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  sidebar: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },

  // Overall Score Card
  scoreCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 500,
    marginBottom: 30,
  },
  scoreLeft: {
    alignItems: 'center',
    flex: 1,
  },
  scoreRight: {
    flex: 1,
    gap: 10,
    paddingLeft: 20,
    borderLeftWidth: 1,
    borderLeftColor: '#f1f5f9',
  },
  largeScore: {
    fontSize: 54,
    fontWeight: 'black',
    color: '#020617',
  },
  scoreInfo: {
    fontSize: 9,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: -2,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 10,
    fontWeight: 'black',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  statBox: {
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  statLabel: {
    fontSize: 6,
    textTransform: 'uppercase',
    color: '#64748b',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#020617',
  },

  // Domain Sections
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#020617',
    marginBottom: 15,
    textAlign: 'center',
    width: '100%',
  },
  domainCard: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    width: '100%',
    maxWidth: 600,
  },
  domainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  domainTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#020617',
    maxWidth: '70%',
  },
  domainScoreBox: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    minWidth: 60,
  },
  domainScore: {
    fontSize: 18,
    fontWeight: 'black',
  },
  domainLevel: {
    fontSize: 7,
    textTransform: 'uppercase',
    color: '#64748b',
    marginTop: 2,
  },

  // Progress Bar
  progressContainer: {
    height: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },

  // Practice List
  practiceList: {
    marginTop: 10,
  },
  practiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  practiceId: {
    fontSize: 8,
    color: '#94a3b8',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 2,
    borderRadius: 4,
  },
  practiceTitle: {
    fontSize: 11,
    color: '#020617',
    flex: 1,
  },
  practiceScore: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 10,
    width: 30,
    textAlign: 'right',
  },
  // Insights in PDF
  insightBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#eff6ff', // light blue
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    gap: 4,
  },
  insightTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1e40af',
    textTransform: 'uppercase',
  },
  insightBody: {
    fontSize: 8,
    color: '#1e3a8a',
    lineHeight: 1.5,
  },
  insightGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  insightColAnalysis: {
    flex: 1.2,
  },
  insightColRecommendations: {
    flex: 1,
  },
  insightCol: {
    flex: 1,
  },
  recommendationList: {
    marginTop: 6,
  },
  recommendationText: {
    fontSize: 7,
    color: '#1e3a8a',
    lineHeight: 1.45,
  },
  recommendationEmptyText: {
    fontSize: 7,
    color: '#1e3a8a',
    lineHeight: 1.4,
    fontStyle: 'italic',
  },
  recommendationItemGap: {
    marginBottom: 5,
  },
  recommendationNumber: {
    fontWeight: 'bold',
    color: '#1e40af',
  }
});

/**
 * Maturity Mapping Helpers (copied logic to avoid circular deps and use hex colors)
 */
const getMaturityLevelForPdf = (score: number) => {
  if (score >= 2.5) return { level: 'Optimized', text: '#166534', bg: '#f0fdf4', bgSolid: '#22c55e' };
  if (score >= 1.5) return { level: 'Defined', text: '#92400e', bg: '#fffbeb', bgSolid: '#f59e0b' };
  if (score >= 0.5) return { level: 'Initial', text: '#991b1b', bg: '#fef2f2', bgSolid: '#ef4444' };
  return { level: 'No Maturity', text: '#64748b', bg: '#f1f5f9', bgSolid: '#94a3b8' };
};

interface AimaPdfDocumentProps {
  results: any;
  nonPremiumDomains: any[];
  insights?: Record<string, string>;
}


export const AimaPdfDocument: React.FC<AimaPdfDocumentProps> = ({ results, nonPremiumDomains, insights = {} }) => {
  const overallMaturity = getMaturityLevelForPdf(results?.results?.overall?.overallMaturityScore ?? 0);

  return (
    <Document title={`AIMA Assessment - ${results.project.name}`}>
      <Page size="A4" style={styles.page}>
        {/* Branding Header */}
        <View style={styles.brandingHeader} fixed>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoMatur}>MATUR</Text>
            <Text style={styles.logoAI}>.ai</Text>
          </View>
          <Text style={styles.headerText}>Assessment Report</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Maturity Assessment</Text>
          <Text style={styles.subtitle}>Report</Text>
          
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Project Name</Text>
              <Text style={styles.metaValue}>{results.project.name}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Assessment Date</Text>
              <Text style={styles.metaValue}>
                {results.submittedAt
                  ? new Date(results.submittedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                  : "Submission date unavailable"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.mainContent}>
          {/* Overall Score Section */}
          <View style={styles.scoreCard} wrap={false}>
            <View style={styles.scoreLeft}>
              <Text style={styles.metaLabel}>Overall Score</Text>
              <Text style={styles.largeScore}>{(results.results.overall.overallMaturityScore ?? 0).toFixed(2)}</Text>
              <Text style={styles.scoreInfo}>Out of 3.0</Text>
            </View>
            <View style={styles.scoreRight}>
              <View style={[styles.statBox, { backgroundColor: overallMaturity.bg, marginBottom: 8 }]}>
                <Text style={[styles.statLabel, { color: overallMaturity.text }]}>Maturity Level</Text>
                <Text style={[styles.statValue, { color: overallMaturity.text, fontSize: 10, fontWeight: 'black' }]}>
                  {overallMaturity.level}
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Questions Evaluated</Text>
                <Text style={styles.statValue}>{results.results.overall.totalQuestions}</Text>
              </View>
            </View>
          </View>

          {/* Domain Maturity Breakdown */}
          <Text style={styles.sectionTitle}>Domain Maturity Breakdown</Text>
          
          {nonPremiumDomains.map((domain, index) => {
            const domainMaturity = getMaturityLevelForPdf(domain.maturityScore);
            return (
              <View key={domain.domainId} style={styles.domainCard} wrap={false}>
                <View style={styles.domainHeader}>
                  <View>
                    <Text style={styles.domainTitle}>{domain.domainTitle}</Text>
                    <View style={{ marginTop: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: domainMaturity.bg, alignSelf: 'flex-start' }}>
                      <Text style={{ fontSize: 7, color: domainMaturity.text, fontWeight: 'bold' }}>{domainMaturity.level}</Text>
                    </View>
                  </View>
                  <View style={styles.domainScoreBox}>
                    <Text style={styles.domainScore}>{domain.maturityScore.toFixed(2)}</Text>
                    <Text style={styles.domainLevel}>SCORE / 3.0</Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { 
                        width: `${(domain.maturityScore / 3) * 100}%`,
                        backgroundColor: domainMaturity.bgSolid 
                      }
                    ]} 
                  />
                </View>

                {/* Practice List */}
                <View style={styles.practiceList}>
                  {domain.practiceScores?.slice(0, 5).map((practice: any, pIdx: number) => {
                    const pMaturity = getMaturityLevelForPdf(practice.maturityScore);
                    return (
                      <View key={practice.practiceId} style={styles.practiceItem}>
                        <Text style={styles.practiceId}>P{String(pIdx + 1).padStart(2, '0')}</Text>
                        <Text style={styles.practiceTitle}>{practice.practiceTitle}</Text>
                        <Text style={[styles.practiceScore, { color: pMaturity.text }]}>{practice.maturityScore.toFixed(1)}</Text>
                      </View>
                    );
                  })}
                  {domain.practiceScores?.length > 5 && (
                    <Text style={{ fontSize: 8, color: '#94a3b8', textAlign: 'center', marginTop: 5 }}>
                      + {domain.practiceScores.length - 5} more practices
                    </Text>
                  )}
                </View>

                {/* AI Insights in PDF */}
                {(insights[domain.domainId] || domain.insights) && (
                  <View style={styles.insightBox} wrap={false}>
                    <View style={styles.insightHeader}>
                      <Text style={styles.insightTitle}>AI Insights & Recommendations</Text>
                    </View>
                    
                    {(() => {
                      const parsed = parseInsightText(insights[domain.domainId] || domain.insights);
                      const displayRecommendations = parsed.recommendations.slice(0, 3); // Limit for PDF space
                      return (
                        <View style={styles.insightGrid}>
                          <View style={[styles.insightCol, styles.insightColAnalysis]}>
                            <Text style={styles.insightTitle}>Strategic Analysis</Text>
                            <Text style={styles.insightBody}>{parsed.analysis || "No direct analysis available."}</Text>
                          </View>
                          <View style={[styles.insightCol, styles.insightColRecommendations]}>
                            <Text style={styles.insightTitle}>Top Recommendations</Text>
                            <View style={styles.recommendationList}>
                              {displayRecommendations.map((rec, i) => (
                                <Text key={i} style={[styles.recommendationText, styles.recommendationItemGap]}>
                                  <Text style={styles.recommendationNumber}>{`${i + 1}. `}</Text>
                                  {rec}
                                </Text>
                              ))}
                              {displayRecommendations.length === 0 && (
                                <Text style={styles.recommendationEmptyText}>Increasing assessment coverage for detailed AI plans.</Text>
                              )}
                            </View>
                          </View>
                        </View>
                      );
                    })()}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Branding Footer */}
        <View style={styles.brandingFooter} fixed>
          <Text style={styles.footerText}>MATUR.ai</Text>
          <Text style={styles.footerText}>CONFIDENTIAL</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
            `Page ${pageNumber} of ${totalPages}`
          )} />
        </View>
      </Page>
    </Document>
  );
};
