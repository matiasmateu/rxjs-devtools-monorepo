# 🔧 Build Scripts

This folder contains build and utility scripts for the RxJS DevTools extension.

## Scripts

### 🚀 `build.sh`
Comprehensive build script that:
- Cleans previous build artifacts
- Compiles TypeScript to JavaScript
- Validates the extension structure
- Provides next steps for loading the extension

**Usage:**
```bash
./scripts/build.sh
```

**Requirements:**
- Node.js and npm installed
- TypeScript dependencies installed (`npm install`)

### 🔍 `validate-extension.js`
Validation script that checks:
- Required files exist in correct locations
- Manifest.json structure is valid
- All dependencies are present
- Extension icons are available

**Usage:**
```bash
node scripts/validate-extension.js
```

**Called by:**
- `npm run validate`
- `./scripts/build.sh` (automatically)

## Build Process

The build process follows these steps:

1. **Clean** - Remove old build artifacts
2. **Compile** - TypeScript → JavaScript with source maps
3. **Validate** - Check file structure and manifest
4. **Report** - Show status and next steps

## Development Workflow

```bash
# One-time setup
npm install

# Development build
npm run build

# Watch mode (rebuilds on changes)
npm run watch

# Full build with validation
./scripts/build.sh

# Validate only
npm run validate
```

## File Structure Validation

The validation script checks these essential files:

### Core Extension Files
- `manifest.json` - Extension configuration
- `public/devtools.html` - DevTools entry point
- `public/panel.html` - Main panel UI
- `public/popup.html` - Extension popup

### Compiled JavaScript
- `dist/background.js` - Background service worker
- `dist/devtools.js` - DevTools panel creation
- `dist/panel.js` - Panel logic
- `dist/popup.js` - Popup functionality
- `dist/rxjs-detector.js` - Content script
- `dist/injected-script.js` - Page context script

### Assets
- `public/*.css` - Stylesheets
- `icons/*.png` - Extension icons

## Error Handling

If validation fails, the scripts will:
- List missing files
- Highlight manifest issues
- Provide troubleshooting guidance
- Exit with error code for CI/CD

## Customization

You can modify these scripts for your needs:
- Add additional validation checks
- Include linting or testing steps
- Customize build output locations
- Add deployment automation

