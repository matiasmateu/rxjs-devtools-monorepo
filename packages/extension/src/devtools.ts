// RxJS DevTools - DevTools Panel Creation

// Check if DevTools is ready
if (!chrome.devtools || !chrome.devtools.panels) {
    console.error('🔄 RxJS DevTools: Chrome DevTools API not available');
} else {

// Create the RxJS DevTools panel
try {
    chrome.devtools.panels.create(
        'RxJS',
        'icons/icon32.png',
        'public/panel.html',
        (panel: chrome.devtools.panels.ExtensionPanel): void => {
            if (chrome.runtime.lastError) {
                console.error('🔄 RxJS DevTools: Error creating panel:', chrome.runtime.lastError);
                return;
            }
            console.log('🔄 RxJS DevTools: Panel created successfully');
        
        let panelWindow: Window | null = null;
        
        // Panel shown/hidden events
        panel.onShown.addListener((window: Window): void => {
            console.log('RxJS DevTools panel shown');
            panelWindow = window;
            
            // Initialize panel when shown - try multiple ways
            if (window.initializePanel) {
                console.log('Calling initializePanel from window');
                window.initializePanel();
            } else if (window.document && window.document.readyState === 'complete') {
                // Panel is loaded but initializePanel might not be available yet
                console.log('Panel loaded, waiting for initializePanel...');
                setTimeout((): void => {
                    if (window.initializePanel) {
                        console.log('Calling delayed initializePanel');
                        window.initializePanel();
                    } else {
                        console.error('initializePanel not found after delay');
                    }
                }, 100);
            } else {
                console.log('Panel window not ready, waiting for load...');
                window.addEventListener('load', (): void => {
                    console.log('Panel window loaded, calling initializePanel');
                    if (window.initializePanel) {
                        window.initializePanel();
                    }
                });
            }
        });
        
        panel.onHidden.addListener((): void => {
            console.log('🔄 RxJS DevTools: Panel hidden');
        });
    });
} catch (error) {
    console.error('🔄 RxJS DevTools: Error setting up DevTools panel:', error);
}

}

