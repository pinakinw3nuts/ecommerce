const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all TypeScript files in the project
const getAllTsFiles = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
};

// Update cookies usage in files
const updateCookiesUsage = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Check if file imports cookies from next/headers
    if (content.includes('import { cookies }') || content.includes('import {cookies}')) {
      // Check if file contains the pattern we want to replace in functions
      if (content.includes('const cookieStore = cookies()')) {
        console.log(`Updating cookies usage in: ${filePath}`);
        
        // Find all function declarations that use cookies
        const functionRegex = /(const|function)\s+([a-zA-Z0-9_]+)\s*=\s*(\(.*?\)\s*=>|function\s*\(.*?\))\s*{[\s\S]*?const\s+cookieStore\s*=\s*cookies\(\)[\s\S]*?}/g;
        
        // Extract all function declarations
        const functionMatches = [...content.matchAll(functionRegex)];
        
        for (const match of functionMatches) {
          const fullMatch = match[0];
          const funcType = match[1]; // 'const' or 'function'
          const funcName = match[2];
          const funcParams = match[3];
          
          // Check if the function is already async
          const isAsync = funcParams.includes('async');
          
          if (!isAsync) {
            console.log(`Making function ${funcName} async`);
            
            // Replace the function declaration to make it async
            if (funcType === 'const') {
              // For arrow functions or function expressions
              const newFuncDecl = funcParams.startsWith('async') 
                ? fullMatch 
                : fullMatch.replace(
                    new RegExp(`${funcName}\\s*=\\s*\\(`), 
                    `${funcName} = async (`
                  );
              
              content = content.replace(fullMatch, newFuncDecl);
            } else {
              // For function declarations
              const newFuncDecl = funcParams.startsWith('async') 
                ? fullMatch 
                : fullMatch.replace(
                    new RegExp(`function\\s+${funcName}\\s*\\(`), 
                    `async function ${funcName}(`
                  );
              
              content = content.replace(fullMatch, newFuncDecl);
            }
            
            updated = true;
          }
        }
        
        // Replace all direct cookies() calls with await cookies()
        content = content.replace(
          /const\s+cookieStore\s*=\s*cookies\(\)/g,
          'const cookieStore = await cookies()'
        );
        
        // Find all function calls to helper functions that now need await
        const helperFuncRegex = /(const\s+[a-zA-Z0-9_]+\s*=\s*)([a-zA-Z0-9_]+)\(\)/g;
        const helperFuncMatches = [...content.matchAll(helperFuncRegex)];
        
        // Get all function names that were made async
        const asyncFuncNames = functionMatches
          .filter(m => !m[3].includes('async'))
          .map(m => m[2]);
        
        // Add await to calls to these functions
        for (const match of helperFuncMatches) {
          const fullMatch = match[0];
          const funcName = match[2];
          
          if (asyncFuncNames.includes(funcName)) {
            console.log(`Adding await to call of ${funcName}`);
            content = content.replace(
              fullMatch,
              `${match[1]}await ${funcName}()`
            );
            updated = true;
          }
        }
      }
    }
    
    // Fix route handler signatures in dynamic routes
    if (filePath.includes('route.ts') && (filePath.includes('[') || filePath.includes(']'))) {
      console.log(`Checking route handler in: ${filePath}`);
      
      // Fix PUT, DELETE, GET, POST, PATCH methods
      const methodRegex = /export\s+async\s+function\s+(PUT|DELETE|GET|POST|PATCH)\s*\(\s*request\s*:\s*NextRequest\s*,\s*{\s*params\s*}\s*:\s*{\s*params\s*:\s*{\s*([a-zA-Z0-9_]+)\s*:\s*string(\s*;\s*[a-zA-Z0-9_]+\s*:\s*string)*\s*}\s*}\s*\)/g;
      
      if (methodRegex.test(content)) {
        console.log(`Fixing route handler signature in: ${filePath}`);
        
        content = content.replace(
          methodRegex,
          'export async function $1(request: NextRequest, context: { params: { $2: string$3 } })'
        );
        
        // Also update params.id to context.params.id
        content = content.replace(
          /const\s+([a-zA-Z0-9_]+)\s*=\s*params\.([a-zA-Z0-9_]+)/g,
          'const $1 = context.params.$2'
        );
        
        // Also update direct params.id usage
        content = content.replace(
          /params\.([a-zA-Z0-9_]+)/g,
          'context.params.$1'
        );
        
        updated = true;
      }
    }
    
    // Add dynamic export if it doesn't exist and the file is a route file
    if (
      (filePath.includes('/api/') || filePath.includes('\\api\\')) && 
      filePath.includes('route.ts') && 
      !content.includes("export const dynamic")
    ) {
      console.log(`Adding dynamic export to: ${filePath}`);
      
      const dynamicExport = "// Force dynamic rendering for this route\nexport const dynamic = 'force-dynamic';\n\n";
      
      // Find a good place to insert the dynamic export (after imports)
      let lines = content.split('\n');
      let lastImportIndex = -1;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
          lastImportIndex = i;
        }
      }
      
      if (lastImportIndex !== -1) {
        // Insert after the last import
        lines.splice(lastImportIndex + 1, 0, '', dynamicExport);
        content = lines.join('\n');
      } else {
        // If no imports found, just add at the beginning
        content = dynamicExport + content;
      }
      
      updated = true;
    }
    
    // Write the updated content back to the file
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
};

// Main function
const main = () => {
  const srcDir = path.join(__dirname, 'src');
  const files = getAllTsFiles(srcDir);
  
  console.log(`Found ${files.length} TypeScript files to check`);
  
  files.forEach(file => {
    updateCookiesUsage(file);
  });
  
  console.log('Done updating files');
};

main(); 