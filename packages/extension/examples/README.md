# 🔄 RxJS DevTools - Test Examples

This folder contains test pages for verifying that the RxJS DevTools extension works correctly.

## Test Pages

### 📄 `test-page.html`
Basic RxJS patterns and operator testing:
- Simple Observable creation
- Interval streams with operators
- Subject and BehaviorSubject usage
- Error handling with catchError
- Click event streams

**Usage:**
```bash
open examples/test-page.html
```

### ⚛️ `react-test-page.html`
React + RxJS integration examples:
- React hooks with RxJS observables
- BehaviorSubject for state management
- HTTP request simulation
- Inter-component communication via Subjects
- Real-time counters and event tracking

**Usage:**
```bash
open examples/react-test-page.html
```

## How to Test

1. **Load the Extension:**
   - Open Chrome → `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" → select the root project folder

2. **Open Test Page:**
   - Open one of the test pages in Chrome
   - Press F12 to open Chrome DevTools
   - Look for the "RxJS" tab

3. **Create Observables:**
   - Click buttons on the test page to create observables
   - Watch streams appear in the RxJS DevTools panel
   - Monitor emissions in real-time

## Expected Results

✅ **RxJS Detection:** Extension should detect RxJS on the page  
✅ **Stream Creation:** Observables should appear in the sidebar  
✅ **Emission Tracking:** Values should display with timestamps  
✅ **Real-time Updates:** New emissions should appear instantly  
✅ **Error Handling:** Errors should be caught and displayed  
✅ **Completion Events:** Stream completion should be indicated  

## Troubleshooting

If the extension doesn't work:
1. Check that the extension is loaded and enabled
2. Refresh the test page after loading the extension
3. Open the browser console to check for errors
4. Verify the RxJS tab appears in DevTools

## Framework-Specific Testing

### React Applications
The `react-test-page.html` demonstrates patterns commonly used in React applications:
- Custom hooks with RxJS
- State management with observables
- Event stream handling
- HTTP request patterns

### Angular Applications
While no specific Angular test page is included, the extension automatically detects Angular applications and monitors:
- HttpClient observables
- Router events
- Reactive forms
- Service-based observables

