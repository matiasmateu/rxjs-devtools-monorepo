#!/usr/bin/env node

// Simple validation script for the RxJS DevTools extension
const fs = require('fs');
const path = require('path');

console.log('🔄 RxJS DevTools Extension Validation\n');

// Check required files exist
const requiredFiles = [
    'manifest.json',
    'public/devtools.html',
    'dist/devtools.js',
    'public/panel.html',
    'dist/panel.js',
    'public/panel.css',
    'public/popup.html',
    'dist/popup.js',
    'public/popup.css',
    'dist/background.js',
    'dist/rxjs-detector.js',
    'dist/injected-script.js'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        allFilesExist = false;
    }
});

// Check manifest.json structure
try {
    const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
    console.log('\n📋 Manifest Validation:');
    
    if (manifest.manifest_version === 3) {
        console.log('✅ Manifest version 3');
    } else {
        console.log('❌ Wrong manifest version');
        allFilesExist = false;
    }
    
    if (manifest.devtools_page) {
        console.log('✅ DevTools page defined');
    } else {
        console.log('❌ DevTools page missing');
        allFilesExist = false;
    }
    
    if (manifest.content_scripts && manifest.content_scripts.length > 0) {
        console.log('✅ Content scripts defined');
    } else {
        console.log('❌ Content scripts missing');
        allFilesExist = false;
    }
    
} catch (error) {
    console.log('❌ Invalid manifest.json:', error.message);
    allFilesExist = false;
}

// Check icon files
console.log('\n🎨 Icon Files:');
const iconSizes = ['16', '32', '48', '128'];
iconSizes.forEach(size => {
    const iconPath = `icons/icon${size}.png`;
    if (fs.existsSync(iconPath)) {
        console.log(`✅ ${iconPath}`);
    } else {
        console.log(`⚠️  ${iconPath} - Optional but recommended`);
    }
});

// Summary
console.log('\n📊 Validation Summary:');
if (allFilesExist) {
    console.log('✅ Extension is ready to load!');
    console.log('\n📝 Next steps:');
    console.log('1. Open Chrome and go to chrome://extensions/');
    console.log('2. Enable "Developer mode"');
    console.log('3. Click "Load unpacked" and select this folder');
    console.log('4. Test with examples/test-page.html or examples/react-test-page.html');
} else {
    console.log('❌ Extension has issues that need to be fixed');
}

console.log('\n🔄 Happy debugging with RxJS DevTools!');

