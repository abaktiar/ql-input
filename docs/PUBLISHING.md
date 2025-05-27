# Publishing Guide

This guide explains how to build and publish both packages from this monorepo.

## 📦 Package Overview

This repository contains two packages:

1. **@abaktiar/ql-parser** - Framework-agnostic QL parser and query builder
2. **@abaktiar/ql-input** - React component with UI for the parser

## 🔧 Build Process

### Build Individual Packages

```bash
# Build parser package only
npm run build:parser

# Build input package only
npm run build:input

# Build both packages
npm run build:packages
```

### Build Output

After building, you'll find the packages in:
- `dist/parser/` - Contains the parser package files
- `dist/input/` - Contains the input package files

Each package includes:
- `index.js` - CommonJS build
- `index.mjs` - ES modules build
- `index.d.ts` - TypeScript declarations
- `README.md` - Package documentation
- `package.json` - Package metadata

The input package also includes:
- `styles.css` - Component styles

## 📤 Publishing Process

### Prerequisites

1. Ensure you're logged into npm:
   ```bash
   npm login
   ```

2. Verify your npm account has access to the `@abaktiar` scope

### Publish Both Packages

```bash
# Build and publish both packages
npm run publish:all
```

### Publish Individual Packages

```bash
# Publish parser package only
npm run publish:parser

# Publish input package only
npm run publish:input
```

## 🔄 Version Management

### Update Package Versions

Before publishing, update the version in both package files:

1. Edit `package-parser.json` - Update the `version` field
2. Edit `package-input.json` - Update the `version` field

### Version Dependencies

If you update the parser package, make sure to update the dependency version in `package-input.json`:

```json
{
  "dependencies": {
    "@abaktiar/ql-parser": "^1.1.0"
  }
}
```

## 📋 Pre-publish Checklist

- [ ] Update version numbers in both package.json files
- [ ] Update CHANGELOG.md (if you have one)
- [ ] Run tests: `npm test`
- [ ] Build packages: `npm run build:packages`
- [ ] Verify build output in `dist/` folders
- [ ] Update README files if needed
- [ ] Commit and push changes to git

## 🚀 Publishing Workflow

### First Time Publishing

1. **Build packages:**
   ```bash
   npm run build:packages
   ```

2. **Publish parser first:**
   ```bash
   npm run publish:parser
   ```

3. **Update input package dependency:**
   Edit `package-input.json` to reference the published parser version

4. **Rebuild and publish input:**
   ```bash
   npm run build:input
   npm run publish:input
   ```

### Subsequent Updates

1. **Update versions** in both package files
2. **Build and publish:**
   ```bash
   npm run publish:all
   ```

## 📁 File Structure

```
├── dist/
│   ├── parser/           # Built parser package
│   │   ├── index.js
│   │   ├── index.mjs
│   │   ├── index.d.mts
│   │   ├── package.json
│   │   └── README.md
│   └── input/            # Built input package
│       ├── index.js
│       ├── index.mjs
│       ├── index.d.mts
│       ├── styles.css
│       ├── package.json
│       └── README.md
├── src/                  # Source code
├── package-parser.json   # Parser package metadata
├── package-input.json    # Input package metadata
├── README-parser.md      # Parser documentation
├── README-input.md       # Input documentation
├── vite.config.parser.ts # Parser build config
└── vite.config.input.ts  # Input build config
```

## 🔍 Verification

After publishing, verify the packages:

```bash
# Check parser package
npm view @abaktiar/ql-parser

# Check input package
npm view @abaktiar/ql-input

# Test installation
npm install @abaktiar/ql-parser
npm install @abaktiar/ql-input
```

## 🐛 Troubleshooting

### Common Issues

1. **Permission denied**: Ensure you're logged into npm and have access to the `@abaktiar` scope
2. **Version already exists**: Increment the version number in package.json files
3. **Build errors**: Check TypeScript errors and fix before publishing
4. **Missing dependencies**: Ensure all peer dependencies are correctly specified
5. **Private package error**: Add `--access public` flag for scoped packages (already included in scripts)
6. **Git repository errors**: Ensure repository URLs are correct in package.json files

### Build Errors

If you encounter build errors:

1. Clean the dist folder: `rm -rf dist`
2. Reinstall dependencies: `npm install`
3. Try building again: `npm run build:packages`

## 📚 Usage Examples

### Installing and Using Parser Only

```bash
npm install @abaktiar/ql-parser
```

```typescript
import { QLParser } from '@abaktiar/ql-parser';

const parser = new QLParser(config);
const query = parser.parse('status = "open"');
```

### Installing and Using React Component

```bash
npm install @abaktiar/ql-input
```

```tsx
import { QLInput } from '@abaktiar/ql-input';
import '@abaktiar/ql-input/styles.css';

function App() {
  return <QLInput config={config} />;
}
```

## 🔄 Continuous Integration

For automated publishing, you can set up GitHub Actions:

```yaml
name: Publish Packages
on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm install
      - run: npm run build:packages
      - run: npm run publish:all
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```
