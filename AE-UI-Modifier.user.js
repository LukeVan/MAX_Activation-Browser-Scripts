// ==UserScript==
// @name         Adobe Express: UI Modifier (Hide Share + Send For Review)
// @namespace    lukevan.express.ui.modifier
// @version      1.0
// @description  Hide Share button and convert Download to one-click "Send For Review"
// @match        https://express.adobe.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(() => {
  "use strict";

  // ---------- Configuration ----------
  const DEBUG = true; // Set to true for console logging

  function log(...args) {
    if (DEBUG) console.log("[AE-UI-Modifier]", ...args);
  }

  // ---------- CSS Injection for hiding Share button ----------
  function injectHideShareCSS() {
    const style = document.createElement("style");
    style.id = "ae-ui-modifier-styles";
    style.textContent = `
      /* Hide Share button - multiple possible selectors */
      [data-testid*="share" i]:not([data-testid*="worksheet"]):not([data-testid*="workspace"]),
      [aria-label*="share" i]:not([aria-label*="worksheet"]):not([aria-label*="workspace"]),
      button[title*="share" i]:not([title*="worksheet"]):not([title*="workspace"]),
      button:has(span:contains("Share")):not(:has(span:contains("Worksheet"))):not(:has(span:contains("Workspace"))),
      [class*="share" i]:not([class*="worksheet"]):not([class*="workspace"]),
      
      /* More specific Adobe Express share button patterns */
      [data-cy*="share"],
      [data-automation-id*="share"],
      button[data-testid="top-bar-share-button"],
      button[data-testid="header-share-button"],
      
      /* Generic top bar share patterns */
      header button:has([data-glyph="share"]),
      [role="banner"] button:has([data-glyph="share"]),
      
      /* Hide any button containing share icon or text in top area */
      header button:has(svg[data-glyph*="share"]),
      [role="banner"] button:has(svg[data-glyph*="share"]),
      
      /* Catch common share button structures */
      button:has(span[data-glyph="share"]),
      button:has([aria-label*="Share"]),
      
      /* Adobe-specific UI patterns */
      .spectrum-Button:has([data-glyph="share"]) {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
      
      /* Custom styles for Send For Review button */
      .ae-send-for-review-btn {
        background: #555be7 !important;
        border-color: #555be7 !important;
        color: white !important;
      }
      
      .ae-send-for-review-btn:hover {
        background: #4a4fcf !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 12px rgba(85, 91, 231, 0.3) !important;
      }
    `;
    
    // Add to head or body
    (document.head || document.documentElement).appendChild(style);
    log("CSS injected for hiding Share button");
  }

  // ---------- Shadow-DOM aware query ----------
  function queryAllDeep(selector, root = document) {
    const results = [];
    const walk = (node) => {
      if (!node) return;
      if (node instanceof Element || node instanceof Document || node instanceof DocumentFragment) {
        // Query current level
        const matches = node.querySelectorAll?.(selector);
        if (matches) results.push(...matches);
        
        // Descend into shadow roots
        if (node.shadowRoot) walk(node.shadowRoot);
        
        // Descend into child nodes
        for (const child of node.childNodes || []) {
          walk(child);
        }
      }
    };
    walk(root);
    return results;
  }

  // ---------- Find Share buttons and hide them ----------
  function hideShareButtons() {
    const shareSelectors = [
      '[data-testid*="share"]',
      '[aria-label*="Share"]',
      '[title*="Share"]',
      'button:has([data-glyph="share"])',
      'button:has(span[data-glyph="share"])',
      '.spectrum-Button:has([data-glyph="share"])',
      '[data-cy*="share"]',
      '[data-automation-id*="share"]'
    ];

    let hiddenCount = 0;
    for (const selector of shareSelectors) {
      try {
        const buttons = queryAllDeep(selector);
        buttons.forEach(btn => {
          // Make sure it's actually a share button (not worksheet/workspace)
          const text = btn.textContent?.toLowerCase() || '';
          const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
          const title = btn.getAttribute('title')?.toLowerCase() || '';
          
          if (text.includes('share') || ariaLabel.includes('share') || title.includes('share')) {
            if (!text.includes('worksheet') && !text.includes('workspace') && 
                !ariaLabel.includes('worksheet') && !ariaLabel.includes('workspace')) {
              btn.style.display = 'none';
              btn.style.visibility = 'hidden';
              btn.style.opacity = '0';
              btn.style.pointerEvents = 'none';
              hiddenCount++;
              log("Hidden share button:", btn);
            }
          }
        });
      } catch (e) {
        log("Error with selector:", selector, e);
      }
    }
    
    if (hiddenCount > 0) {
      log(`Hidden ${hiddenCount} share buttons`);
    }
  }

  // ---------- Find and modify Download button ----------
  function modifyDownloadButton() {
    log("🔍 === DEBUGGING DOWNLOAD BUTTON DISCOVERY ===");
    
    const downloadSelectors = [
      '[data-testid*="download"]',
      '[aria-label*="Download"]',
      '[title*="Download"]',
      '[data-cy*="download"]',
      '[data-automation-id*="download"]',
      'button[aria-label*="Download"]',
      '.spectrum-Button',
      'sp-button',
      'button'
    ];

    let totalButtonsFound = 0;
    let downloadButtonsFound = 0;

    for (const selector of downloadSelectors) {
      try {
        const buttons = queryAllDeep(selector);
        totalButtonsFound += buttons.length;
        
        buttons.forEach(btn => {
          if (btn.classList.contains('ae-modified-download')) return; // Skip if already modified
          
          const text = btn.textContent?.toLowerCase() || '';
          const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
          const title = btn.getAttribute('title')?.toLowerCase() || '';
          const testid = btn.getAttribute('data-testid') || '';
          
          const isDownloadRelated = text.includes('download') || ariaLabel.includes('download') || title.includes('download');
          
          if (isDownloadRelated) {
            downloadButtonsFound++;
            log(`📋 Found download button #${downloadButtonsFound}:`);
            log(`  Text: "${btn.textContent?.trim()}"`);
            log(`  TestID: "${testid}"`);
            log(`  AriaLabel: "${btn.getAttribute('aria-label') || 'none'}"`);
            log(`  Title: "${btn.getAttribute('title') || 'none'}"`);
            
            // IMPORTANT: Store reference to original button BEFORE modifying it
            // Try multiple conditions to catch the button
            if (!originalDownloadButtonRef && (
              testid === 'editor-download-button' || 
              testid.includes('download') ||
              text.includes('download') && testid
            )) {
              originalDownloadButtonRef = btn;
              log("🎯 Stored reference to original download button!");
              log("Button details:", btn.textContent?.trim(), "| testid:", testid);
            }
            
            modifyDownloadButtonElement(btn);
          } else {
            // DEBUG: Log why buttons are being skipped
            if (testid.includes('download') || text.includes('download') || ariaLabel.includes('download') || title.includes('download')) {
              log(`⚠️ SKIPPED potential download button:`);
              log(`  Text: "${btn.textContent?.trim()}"`);
              log(`  TestID: "${testid}"`);
              log(`  Text includes download: ${text.includes('download')}`);
              log(`  AriaLabel includes download: ${ariaLabel.includes('download')}`);
              log(`  Title includes download: ${title.includes('download')}`);
            }
          }
        });
      } catch (e) {
        log("Error with download selector:", selector, e);
      }
    }
    
    log(`📊 Discovery Summary: ${totalButtonsFound} total buttons, ${downloadButtonsFound} download-related buttons`);
    log(`📦 Original button reference stored: ${!!originalDownloadButtonRef}`);
  }

  // ---------- Modify individual download button ----------
  function modifyDownloadButtonElement(btn) {
    log("Modifying download button:", btn);
    
    // Mark as modified to prevent duplicate processing
    btn.classList.add('ae-modified-download', 'ae-send-for-review-btn');
    
    // Change button text
    const textElements = [
      ...btn.querySelectorAll('span'),
      ...btn.querySelectorAll('[role="text"]'),
      ...btn.childNodes
    ].filter(node => 
      (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) ||
      (node.nodeType === Node.ELEMENT_NODE && node.textContent.toLowerCase().includes('download'))
    );
    
    // Change text content
    textElements.forEach(el => {
      if (el.nodeType === Node.TEXT_NODE) {
        if (el.textContent.toLowerCase().includes('download')) {
          el.textContent = 'Send For Review';
        }
      } else if (el.textContent.toLowerCase().includes('download')) {
        el.textContent = 'Send For Review';
      }
    });
    
    // Update attributes
    if (btn.getAttribute('aria-label')) {
      btn.setAttribute('aria-label', 'Send For Review');
    }
    if (btn.getAttribute('title')) {
      btn.setAttribute('title', 'Send For Review');
    }
    
    // Store original click handler
    const originalClick = btn.onclick;
    const originalEventListeners = btn.cloneNode(false);
    
    // Override click behavior
    btn.onclick = null;
    
    // Remove existing event listeners by replacing the node
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    // CRITICAL: Update our stored reference if this was the original button!
    if (originalDownloadButtonRef === btn) {
      originalDownloadButtonRef = newBtn;
      log("🔄 Updated stored button reference to new cloned button");
    }
    
    // Add our custom click handler
    newBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      log("🔥 === SEND FOR REVIEW BUTTON CLICKED ===");
      log("📦 Stored button reference exists:", !!originalDownloadButtonRef);
      log("📦 Stored button in DOM:", originalDownloadButtonRef ? document.contains(originalDownloadButtonRef) : "N/A");
      log("📦 Stored button details:", originalDownloadButtonRef ? {
        text: originalDownloadButtonRef.textContent?.trim(),
        testid: originalDownloadButtonRef.getAttribute('data-testid'),
        visible: originalDownloadButtonRef.offsetWidth > 0 && originalDownloadButtonRef.offsetHeight > 0
      } : "NULL");
      
      try {
        // Try to find and click the actual download action
        const success = await triggerDirectDownload(newBtn);
        if (!success) {
          log("Direct download failed, falling back to original behavior");
          // Fallback to original click if our method fails
          if (originalClick) {
            originalClick.call(newBtn, e);
          }
        }
      } catch (error) {
        log("Error in custom click handler:", error);
        // Fallback to original click
        if (originalClick) {
          originalClick.call(newBtn, e);
        }
      }
    }, true); // Use capture phase
    
    log("Download button modified to 'Send For Review'");
  }

  // ---------- NEW: 2-Step Download Functions ----------
  
  // Store reference to original button before modifying it
  let originalDownloadButtonRef = null;
  
  // NOTE: Original button finding is no longer needed since we store a reference
  
  // Step 2a: Select MP4 format
  function selectMP4Format() {
    log("Looking for MP4 format options...");
    
    const formatSelectors = [
      '[data-format="mp4"]', '[data-value="mp4"]', 'input[value="mp4"]',
      '[data-format*="video"]', '.file-format-picker button', 'sp-radio[value="mp4"]'
    ];
    
    for (const selector of formatSelectors) {
      const elements = queryAllDeep(selector);
      for (const element of elements) {
        const text = element.textContent?.toLowerCase() || '';
        const value = element.getAttribute('value')?.toLowerCase() || '';
        
        // Check if visible
        const rect = element.getBoundingClientRect();
        const styles = window.getComputedStyle(element);
        const isVisible = rect.width > 0 && rect.height > 0 && styles.visibility !== 'hidden';
        
        const isMP4Related = text.includes('mp4') || text.includes('video') || value.includes('mp4');
        
        if (isMP4Related && isVisible) {
          log(`✅ Found MP4 option: "${text}"`);
          try {
            element.click();
            if (element.type === 'radio') {
              element.checked = true;
              element.dispatchEvent(new Event('change', { bubbles: true }));
            }
            return true;
          } catch (e) {
            log(`❌ Failed to select MP4: ${e.message}`);
          }
        }
      }
    }
    return false;
  }
  
  // Step 2b: Find blue download button in modal
  // SIMPLIFIED - Use the exact approach that was working in test script
  function findBlueDownloadButton() {
    log("=== SEARCHING FOR DOWNLOAD BUTTON INSIDE MODAL (Test Script Approach) ===");
    
    // Filter visible modal containers EXACTLY like the test script did
    const dialogs = queryAllDeep('[role="dialog"]').filter(el => {
      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && 
             styles.visibility !== 'hidden' && 
             styles.display !== 'none' &&
             styles.opacity !== '0';
    });
    
    const modals = queryAllDeep('[class*="modal"], [class*="Modal"]').filter(el => {
      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && 
             styles.visibility !== 'hidden' && 
             styles.display !== 'none' &&
             styles.opacity !== '0';
    });
    
    const overlays = queryAllDeep('[class*="overlay"], [class*="Overlay"]').filter(el => {
      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && 
             styles.visibility !== 'hidden' && 
             styles.display !== 'none' &&
             styles.opacity !== '0';
    });
    
    const popovers = queryAllDeep('[class*="popover"], [class*="Popover"]').filter(el => {
      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && 
             styles.visibility !== 'hidden' && 
             styles.display !== 'none' &&
             styles.opacity !== '0';
    });
    
    log(`Found VISIBLE: ${dialogs.length} dialogs, ${modals.length} modals, ${overlays.length} overlays, ${popovers.length} popovers`);
    
    const allContainers = [...dialogs, ...modals, ...overlays, ...popovers];
    if (allContainers.length === 0) {
      log("❌ No visible modal containers found");
      return null;
    }
    
    // Use the EXACT SAME download button search that was working
    const downloadSelectors = [
      '#dialog-download-btn',
      'sp-button[data-testid="download-commit-button"]',
      'button[class*="download"]',
      'sp-button[class*="download"]',
      'sp-button[variant="accent"]',  // Blue buttons that were working
      'sp-button[variant="cta"]',
      'button[class*="accent"]',
      'button[class*="primary"]'
    ];
    
    let bestButton = null;
    let bestScore = 0;
    
    allContainers.forEach(container => {
      log(`🔍 Searching container: ${container.tagName}.${container.className}`);
      
      downloadSelectors.forEach(selector => {
        container.querySelectorAll(selector).forEach(btn => {
          const text = btn.textContent?.toLowerCase().trim() || '';
          const rect = btn.getBoundingClientRect();
          const styles = window.getComputedStyle(btn);
          const isVisible = rect.width > 0 && rect.height > 0 && styles.visibility !== 'hidden';
          
          if (!isVisible) return;
          
          let score = 0;
          
          // EXACT same scoring that was working in test
          if (btn.id === 'dialog-download-btn') score += 1000;
          if (btn.getAttribute('data-testid') === 'download-commit-button') score += 1000;
          if (text === 'download') score += 500;
          if (text.includes('download')) score += 200;
          if (btn.getAttribute('variant') === 'accent') score += 300;
          if (btn.getAttribute('variant') === 'cta') score += 300;
          
          log(`  Button "${text}" scored ${score} points`);
          
          if (score > bestScore) {
            bestScore = score;
            bestButton = btn;
          }
        });
      });
    });
    
    if (bestButton) {
      log(`✅ Found download button (score: ${bestScore}): "${bestButton.textContent?.trim()}"`);
      return bestButton;
    }
    
    log("❌ No download button found in modal");
    return null;
  }

  // ---------- Trigger direct download using stored button reference ----------
  async function triggerDirectDownload(downloadBtn) {
    log("🚀 === STARTING DOWNLOAD PROCESS ===");
    log("📦 Original button reference available:", !!originalDownloadButtonRef);
    
    return new Promise((resolve) => {
      // Use our stored reference to the original button
      if (!originalDownloadButtonRef) {
        log("❌ No stored reference to original button found!");
        log("This means the script didn't find/store the original download button during page load");
        resolve(false);
        return;
      }
      
      log("✅ Step 1: Using stored original Download button reference");
      log("Button text:", originalDownloadButtonRef.textContent?.trim());
      log("Button testid:", originalDownloadButtonRef.getAttribute('data-testid'));
      log("Button visible:", originalDownloadButtonRef.offsetWidth > 0 && originalDownloadButtonRef.offsetHeight > 0);
      log("Button in DOM:", document.contains(originalDownloadButtonRef) ? "YES" : "NO - STALE REFERENCE!");
      
      // Click the stored original button to open modal
      try {
        log("⏳ Clicking stored original button...");
        originalDownloadButtonRef.click();
        log("✅ Clicked stored original button");
        
        // Step 2: Use the SIMPLE approach that was working in test script  
        setTimeout(() => {
          log("⏳ Step 2: Modal should be open, looking for download button (using working test script approach)...");
          
          // Step 2a: Try to select MP4 format first
          const formatChanged = selectMP4Format();
          if (formatChanged) {
            log("✅ Step 2a: MP4 format selected!");
          } else {
            log("⚠️ Step 2a: Could not select MP4, continuing with default format...");
          }
          
          // Step 2b: Find and click blue download button using the approach that WAS working
          setTimeout(() => {
            const blueButton = findBlueDownloadButton();
            if (blueButton) {
              log(`✅ Step 2b: Found blue button: "${blueButton.textContent?.trim()}"`);
              
              // Click the blue button to start download
              blueButton.click();
              
              log("🎯 Download initiated successfully!");
              resolve(true);
            } else {
              log("❌ Step 2b failed: Blue button not found in modal");
              resolve(false);
            }
          }, 500); // Wait for format change to apply
          
        }, 1500); // Wait for modal to fully open
        
      } catch (error) {
        log("❌ Error clicking stored button:", error);
        resolve(false);
      }
    });
  }

  // ---------- Main modification runner ----------
  function runModifications() {
    hideShareButtons();
    modifyDownloadButton();
  }

  // ---------- Initialize and monitor for changes ----------
  function initialize() {
    log("Initializing AE UI Modifier");
    
    // Inject CSS immediately
    injectHideShareCSS();
    
    // Initial modification
    runModifications();
    
    // Set up mutation observer for SPA changes
    const observer = new MutationObserver((mutations) => {
      let shouldRun = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if new nodes contain buttons we care about
          const hasRelevantNodes = Array.from(mutation.addedNodes).some(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node;
              return element.querySelector && (
                element.querySelector('button') ||
                element.tagName === 'BUTTON' ||
                element.querySelector('[data-testid*="share"]') ||
                element.querySelector('[data-testid*="download"]')
              );
            }
            return false;
          });
          
          if (hasRelevantNodes) {
            shouldRun = true;
          }
        }
      });
      
      if (shouldRun) {
        // Debounce rapid changes
        clearTimeout(runModifications.timeout);
        runModifications.timeout = setTimeout(runModifications, 200);
      }
    });
    
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: false
    });
    
    // Also run modifications periodically for robustness
    setInterval(runModifications, 2000);
    
    log("AE UI Modifier initialized");
  }

  // ---------- Start when ready ----------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  // Also initialize on window load for extra safety
  window.addEventListener('load', () => {
    setTimeout(initialize, 500);
  });

})();
