const fs = require('fs');
const path = require('path');

const files = [
  'AdminReturns.jsx',
  'AdminNotificationOrchestrator.jsx',
  'AdminHealthScores.jsx',
  'AdminABTesting.jsx',
  'AdminAIHub.jsx'
];

const replacements = [
  { regex: /bg-\[#0a1625\]/g, replacement: 'bg-gradient-to-br from-white via-stone-50 to-white' },
  { regex: /bg-\[#0f2137\]/g, replacement: 'bg-white' },
  { regex: /bg-\[#0f2136\]/g, replacement: 'bg-white' },
  { regex: /bg-slate-900\/30/g, replacement: 'bg-white border border-stone-200 shadow-sm' },
  { regex: /bg-white\/\[0\.02\]/g, replacement: 'bg-stone-50' },
  { regex: /bg-white\/5/g, replacement: 'bg-stone-50' },
  { regex: /bg-white\/10/g, replacement: 'bg-stone-100' },
  { regex: /hover:bg-white\/10/g, replacement: 'hover:bg-stone-100' },
  { regex: /bg-black\/20/g, replacement: 'bg-stone-100' },
  { regex: /bg-\[#0a1625\]\/50/g, replacement: 'bg-stone-50' },
  
  { regex: /border-slate-800/g, replacement: 'border-stone-200' },
  { regex: /border-slate-850/g, replacement: 'border-stone-200' },
  { regex: /border-slate-700/g, replacement: 'border-stone-200' },
  { regex: /border-white\/10/g, replacement: 'border-stone-200' },
  { regex: /border-white\/5/g, replacement: 'border-stone-100' },

  { regex: /text-slate-100/g, replacement: 'text-stone-900' },
  { regex: /text-slate-200/g, replacement: 'text-stone-800' },
  { regex: /text-slate-300/g, replacement: 'text-stone-700' },
  { regex: /text-slate-400/g, replacement: 'text-stone-500' },
  { regex: /text-slate-500/g, replacement: 'text-stone-400' },
  { regex: /text-slate-800/g, replacement: 'text-stone-100' },
  
  // Specifically for headers or generic text previously white
  { regex: /text-white(?!(\/|\w|-))/g, replacement: 'text-stone-900' }
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    replacements.forEach(r => {
      content = content.replace(r.regex, r.replacement);
    });
    
    // Fix any buttons that should actually remain text-white
    // e.g. text-white in combination with bg-rose-600, bg-amber-500, bg-[#5BBFB5] etc.
    content = content.replace(/bg-rose-600\s+text-stone-900/g, 'bg-rose-600 text-white');
    content = content.replace(/bg-emerald-600\s+text-stone-900/g, 'bg-emerald-600 text-white');
    content = content.replace(/bg-red-600\s+text-stone-900/g, 'bg-red-600 text-white');
    content = content.replace(/bg-blue-600\s+text-stone-900/g, 'bg-blue-600 text-white');
    content = content.replace(/bg-amber-600\s+text-stone-900/g, 'bg-amber-600 text-white');
    content = content.replace(/text-stone-900(?=\s*shadow-lg shadow-rose-600\/15)/g, 'text-white');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
