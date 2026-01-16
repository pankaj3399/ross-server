#!/usr/bin/env node

/**
 * Design System Validation Script
 * Scans the codebase for hardcoded colors and styles that violate the design system.
 * 
 * Excludes:
 * - globals.css (the design system definition)
 * - dataset-testing/report/page.tsx (PDF export needs hardcoded colors)
 * - node_modules/
 * - .next/
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SRC_DIR = path.join(__dirname, '..', 'src');
const EXCLUDED_FILES = [
  'globals.css',
  'dataset-testing/report/page.tsx'
];
const EXCLUDED_DIRS = ['node_modules', '.next', '.git'];

// Patterns to detect violations
const VIOLATION_PATTERNS = [
  {
    name: 'Hex Colors',
    // Match hex colors but not in comments or CSS variable definitions
    pattern: /#[0-9a-fA-F]{3,8}(?![0-9a-zA-Z])/g,
    // Exceptions for valid uses
    exceptions: [
      /\/\/.*(#[0-9a-fA-F]{3,8})/,  // Single line comments
      /\/\*[\s\S]*?(#[0-9a-fA-F]{3,8})[\s\S]*?\*\//,  // Multi-line comments
      /href=["'][^"']*#/,  // Anchor links
      /&#[0-9]+;/,  // HTML entities
    ]
  },
  {
    name: 'RGB/RGBA/HSL/HSLA Values',
    // Match rgb/rgba/hsl/hsla but exclude those using CSS variables
    pattern: /(?:rgb|rgba|hsl|hsla)\s*\(\s*(?!\s*var\()(?:\d|[\d\s,.\/%]+)\)/gi,
    exceptions: []
  },
  {
    name: 'Hardcoded Tailwind Background Colors',
    pattern: /\bbg-(red|green|blue|yellow|gray|slate|zinc|orange|purple|violet|pink|indigo|emerald|amber|lime|cyan|teal|sky|rose|fuchsia|stone|neutral)-\d{2,3}\b/g,
    exceptions: []
  },
  {
    name: 'Hardcoded Tailwind Text Colors',
    pattern: /\btext-(red|green|blue|yellow|gray|slate|zinc|orange|purple|violet|pink|indigo|emerald|amber|lime|cyan|teal|sky|rose|fuchsia|stone|neutral)-\d{2,3}\b/g,
    exceptions: []
  },
  {
    name: 'Hardcoded Tailwind Border Colors',
    pattern: /\bborder-(red|green|blue|yellow|gray|slate|zinc|orange|purple|violet|pink|indigo|emerald|amber|lime|cyan|teal|sky|rose|fuchsia|stone|neutral)-\d{2,3}\b/g,
    exceptions: []
  },
  {
    name: 'Hardcoded Tailwind Fill/Stroke Colors',
    pattern: /\b(?:fill|stroke)-(red|green|blue|yellow|gray|slate|zinc|orange|purple|violet|pink|indigo|emerald|amber|lime|cyan|teal|sky|rose|fuchsia|stone|neutral)-\d{2,3}\b/g,
    exceptions: []
  },
  {
    name: 'Hardcoded White/Black Backgrounds',
    pattern: /\bbg-(white|black)\b/g,
    exceptions: []
  }
];

// Suggested replacements
const REPLACEMENT_SUGGESTIONS = {
  // Background colors
  'bg-white': 'bg-card or bg-background',
  'bg-black': 'bg-background (dark mode)',
  'bg-gray-50': 'bg-muted or bg-background',
  'bg-gray-100': 'bg-muted or bg-secondary',
  'bg-gray-200': 'bg-muted',
  'bg-gray-800': 'bg-card (dark mode handled by theme)',
  'bg-gray-900': 'bg-background (dark mode handled by theme)',
  'bg-purple': 'bg-primary',
  'bg-red': 'bg-destructive',
  'bg-green': 'bg-success (add to theme)',
  'bg-yellow': 'bg-warning (add to theme)',
  'bg-amber': 'bg-warning (add to theme)',
  // Text colors
  'text-white': 'text-primary-foreground or text-card-foreground',
  'text-black': 'text-foreground',
  'text-gray': 'text-muted-foreground',
  'text-purple': 'text-primary',
  'text-red': 'text-destructive',
  'text-green': 'text-success (add to theme)',
  // Border colors
  'border-gray': 'border-border or border-input',
  'border-purple': 'border-primary',
};

function isExcludedFile(filePath) {
  const relativePath = path.relative(SRC_DIR, filePath);
  return EXCLUDED_FILES.some(excluded => relativePath.includes(excluded));
}

function isExcludedDir(dirPath) {
  return EXCLUDED_DIRS.some(excluded => dirPath.includes(excluded));
}

function getAllFiles(dir, files = []) {
  if (isExcludedDir(dir)) return files;
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      getAllFiles(fullPath, files);
    } else if (/\.(tsx?|jsx?|css)$/.test(item)) {
      if (!isExcludedFile(fullPath)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    for (const { name, pattern, exceptions } of VIOLATION_PATTERNS) {
      // Reset regex lastIndex
      pattern.lastIndex = 0;
      
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const matchedText = match[0];
        
        // Check if this match is an exception
        const isException = exceptions.some(exc => exc.test(line));
        if (isException) continue;
        
        // Skip if in a comment
        if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('/*')) {
          continue;
        }
        
        // Get suggestion if available
        let suggestion = '';
        for (const [key, value] of Object.entries(REPLACEMENT_SUGGESTIONS)) {
          if (matchedText.includes(key.split('-')[1]) || matchedText.startsWith(key)) {
            suggestion = value;
            break;
          }
        }
        
        violations.push({
          line: lineNum,
          column: match.index + 1,
          type: name,
          value: matchedText,
          suggestion,
          context: line.trim().substring(0, 100)
        });
      }
    }
  }
  
  return violations;
}

function getSuggestionForMatch(matchedText) {
  for (const [pattern, suggestion] of Object.entries(REPLACEMENT_SUGGESTIONS)) {
    if (matchedText.includes(pattern) || matchedText.startsWith(pattern)) {
      return suggestion;
    }
  }
  return '';
}

function main() {
  console.log('\n🎨 Design System Validation Script\n');
  console.log('Scanning for hardcoded colors and styles...\n');
  
  const files = getAllFiles(SRC_DIR);
  let totalViolations = 0;
  const violationsByFile = {};
  
  for (const file of files) {
    const violations = checkFile(file);
    
    if (violations.length > 0) {
      const relativePath = path.relative(SRC_DIR, file);
      violationsByFile[relativePath] = violations;
      totalViolations += violations.length;
    }
  }
  
  // Output results
  if (totalViolations === 0) {
    console.log('✅ No design system violations found!\n');
    console.log('🎉 All files follow the design system. This script can now be deleted.\n');
    return 0;
  }
  
  console.log(`❌ Found ${totalViolations} violations in ${Object.keys(violationsByFile).length} files:\n`);
  
  // Group by violation type for summary
  const byType = {};
  
  for (const [file, violations] of Object.entries(violationsByFile)) {
    console.log(`\n📄 ${file}`);
    console.log('─'.repeat(60));
    
    for (const v of violations) {
      console.log(`  Line ${v.line}: [${v.type}] ${v.value}`);
      if (v.suggestion) {
        console.log(`    💡 Suggestion: Use ${v.suggestion}`);
      }
      console.log(`    Context: ${v.context}`);
      
      // Count by type
      byType[v.type] = (byType[v.type] || 0) + 1;
    }
  }
  
  // Summary
  console.log('\n\n📊 Summary by Violation Type:');
  console.log('─'.repeat(40));
  for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }
  
  console.log('\n\n💡 Design System Token Reference:');
  console.log('─'.repeat(40));
  console.log('  Backgrounds: bg-background, bg-card, bg-muted, bg-secondary, bg-primary');
  console.log('  Text: text-foreground, text-muted-foreground, text-primary, text-card-foreground');
  console.log('  Borders: border-border, border-input, border-primary');
  console.log('  Semantic: destructive, success (--success), warning (--warning)');
  console.log('  Difficulty: difficulty-easy, difficulty-medium, difficulty-hard');
  
  console.log('\n');
  
  return 1;
}

// Run the script
process.exit(main());
