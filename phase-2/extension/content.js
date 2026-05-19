// Content script running in the context of the active web page tab.
console.log('[PromptForge] Content script injected and active.');

// Listen for query requests from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_DOM_SPECS') {
    try {
      const specs = extractDesignSpecs();
      sendResponse({ status: 'success', data: specs });
    } catch (err) {
      sendResponse({ status: 'error', message: err.message });
    }
  }
  return true; // Keeps the sendResponse channel open for async execution
});

function extractDesignSpecs() {
  const rootStyles = getComputedStyle(document.documentElement);
  const variables = {};

  // Traverses all CSS rules across stylesheets to find custom properties defined under :root
  try {
    for (const sheet of document.styleSheets) {
      try {
        // Skip cross-origin sheets to prevent security blocks
        if (sheet.href && new URL(sheet.href).origin !== window.location.origin) {
          continue;
        }
        for (const rule of sheet.cssRules) {
          if (rule.selectorText && (rule.selectorText === ':root' || rule.selectorText === 'html')) {
            const style = rule.style;
            for (let i = 0; i < style.length; i++) {
              const name = style[i];
              if (name.startsWith('--')) {
                variables[name] = rootStyles.getPropertyValue(name).trim();
              }
            }
          }
        }
      } catch (e) {
        // Suppress stylesheet rules access warnings
      }
    }
  } catch (e) {
    // Suppress document stylesheets collection warnings
  }

  // Fallback checklist of common Tailwind and UI properties if stylesheet parsing is empty
  const commonProps = [
    '--background', '--foreground', '--primary', '--secondary', '--accent',
    '--radius', '--border', '--ring', '--muted', '--card', '--popover'
  ];
  commonProps.forEach(prop => {
    const val = rootStyles.getPropertyValue(prop).trim();
    if (val && !variables[prop]) {
      variables[prop] = val;
    }
  });

  // Extract page metadata
  const meta = {
    title: document.title,
    url: window.location.href,
    fontFamily: rootStyles.fontFamily || 'Standard',
    themeColor: document.querySelector('meta[name="theme-color"]')?.content || ''
  };

  return {
    meta,
    variables
  };
}
