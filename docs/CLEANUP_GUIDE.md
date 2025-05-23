# 🧹 Cleanup Guide

## **Test Artifacts Cleanup**

### **Automated Cleanup Script**

```bash
# Clean all test artifacts
npm run test:clean
```

**What it removes:**
- ✅ `test-results/` - Playwright test results and screenshots
- ✅ `playwright-report/` - HTML test reports  
- ✅ `.playwright-cache/` - Playwright browser cache

### **Manual Cleanup Commands**

If you prefer manual cleanup or need more control:

```bash
# Remove test results only
rm -rf test-results

# Remove HTML reports only  
rm -rf playwright-report

# Remove browser cache only
rm -rf .playwright-cache

# Remove all test artifacts (equivalent to npm run test:clean)
rm -rf test-results playwright-report .playwright-cache
```

---

## **Development Artifacts Cleanup**

### **Build Artifacts**
```bash
# Remove build output
rm -rf dist

# Remove TypeScript build cache
rm -rf .tsbuildinfo
```

### **Node.js Cache**
```bash
# Remove npm cache
rm -rf node_modules/.cache

# Remove all node_modules (nuclear option)
rm -rf node_modules
npm install
```

### **IDE/Editor Files**
```bash
# Remove VS Code settings (optional)
rm -rf .vscode

# Remove IDE temp files
rm -rf .idea
```

---

## **Complete Project Reset**

### **Full Clean (Nuclear Option)**
```bash
# Remove all generated files and caches
rm -rf node_modules
rm -rf dist
rm -rf test-results
rm -rf playwright-report
rm -rf .playwright-cache
rm -rf .tsbuildinfo

# Reinstall dependencies
npm install
npm run test:install
```

### **Fresh Start Script**
```bash
#!/bin/bash
echo "🧹 Performing complete project cleanup..."

# Remove all artifacts
rm -rf node_modules dist test-results playwright-report .playwright-cache .tsbuildinfo

echo "📦 Reinstalling dependencies..."
npm install

echo "🎭 Installing Playwright browsers..."
npm run test:install

echo "✅ Project reset complete!"
```

---

## **Cleanup Best Practices**

### **When to Clean**

#### **After Testing Sessions**
```bash
# Clean test artifacts after running tests
npm test
npm run test:clean
```

#### **Before Committing**
```bash
# Ensure no test artifacts are committed
npm run test:clean
git add .
git commit -m "Your commit message"
```

#### **CI/CD Pipeline**
```bash
# In your CI script
npm test
npm run test:clean  # Clean artifacts before archiving
```

### **What NOT to Clean**

#### **Keep These Files**
- ✅ `package.json` - Project configuration
- ✅ `package-lock.json` - Dependency lock file
- ✅ `playwright.config.ts` - Test configuration
- ✅ `src/` - Source code
- ✅ `tests/` - Test files
- ✅ `.git/` - Git repository

#### **Keep These Directories**
- ✅ `node_modules/` - Unless doing full reset
- ✅ `.git/` - Git history
- ✅ `public/` - Static assets

---

## **Automated Cleanup Integration**

### **Git Hooks**

#### **Pre-commit Hook**
```bash
# .git/hooks/pre-commit
#!/bin/sh
npm run test:clean
```

#### **Post-merge Hook**
```bash
# .git/hooks/post-merge
#!/bin/sh
npm run test:clean
npm install  # Update dependencies if needed
```

### **VS Code Tasks**

#### **.vscode/tasks.json**
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Clean Test Artifacts",
      "type": "shell",
      "command": "npm",
      "args": ["run", "test:clean"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    }
  ]
}
```

### **Package.json Scripts Reference**

```json
{
  "scripts": {
    "test:clean": "node -e \"const fs=require('fs'); ['test-results','playwright-report','.playwright-cache'].forEach(d=>{try{fs.rmSync(d,{recursive:true,force:true})}catch{}})\""
  }
}
```

---

## **Troubleshooting Cleanup Issues**

### **Permission Errors**
```bash
# If you get permission errors on Windows
npm run test:clean

# If that fails, try with elevated permissions
sudo npm run test:clean  # Linux/Mac
# Or run as Administrator on Windows
```

### **Files in Use Errors**
```bash
# Close all browsers and editors first
# Then run cleanup
npm run test:clean
```

### **Disk Space Issues**
```bash
# Check disk usage of test artifacts
du -sh test-results playwright-report .playwright-cache

# Clean immediately if space is low
npm run test:clean
```

---

## **Quick Reference**

| Command | Purpose | Safety |
|---------|---------|---------|
| `npm run test:clean` | Remove test artifacts | ✅ Safe |
| `rm -rf test-results` | Remove test results only | ✅ Safe |
| `rm -rf playwright-report` | Remove HTML reports only | ✅ Safe |
| `rm -rf .playwright-cache` | Remove browser cache only | ✅ Safe |
| `rm -rf node_modules` | Remove dependencies | ⚠️ Requires reinstall |
| `rm -rf dist` | Remove build output | ✅ Safe |

---

## **🎯 Recommended Workflow**

1. **After Development Session**
   ```bash
   npm run test:clean
   ```

2. **Before Git Commit**
   ```bash
   npm run test:clean
   git add .
   git commit -m "Your changes"
   ```

3. **Weekly Maintenance**
   ```bash
   npm run test:clean
   npm audit
   npm update
   ```

4. **When Things Go Wrong**
   ```bash
   # Nuclear option - fresh start
   rm -rf node_modules package-lock.json
   npm install
   npm run test:install
   ```

**Keep your project clean and your tests fast!** 🚀
