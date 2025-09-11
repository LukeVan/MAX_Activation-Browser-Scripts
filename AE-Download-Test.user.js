// ==UserScript==
// @name         Adobe Express: Download Button Test (Find & Click Blue Download Button)
// @namespace    lukevan.express.download.test
// @version      1.0
// @description  Test script to find and click the blue Download button in the download modal
// @match        https://express.adobe.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(() => {
  "use strict";

  // ---------- Configuration ----------
  const DEBUG = true;

  function log(...args) {
    if (DEBUG) console.log("[AE-Download-Test]", ...args);
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

  // ---------- Find and click the download button INSIDE modal ----------
  function findDownloadButton() {
    log("=== SEARCHING FOR DOWNLOAD BUTTON INSIDE MODAL ===");
    
    // First, let's inspect what modal/dialog elements exist AND are visible
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
    
    // If no visible modals, return null
    const allContainers = [...dialogs, ...modals, ...overlays, ...popovers];
    if (allContainers.length === 0) {
      log("❌ No visible modal containers found - make sure download modal is open first!");
      return null;
    }
    
    // Log details of each visible modal/dialog
    allContainers.forEach((container, i) => {
      log(`VISIBLE Container ${i}:`, container.tagName, container.className);
      log(`VISIBLE Container ${i} innerHTML (first 300 chars):`, container.innerHTML.substring(0, 300));
      
      // Look for buttons specifically in this container
      const buttons = container.querySelectorAll('button, sp-button, [role="button"]');
      log(`VISIBLE Container ${i} has ${buttons.length} buttons:`);
      buttons.forEach((btn, btnIndex) => {
        const text = btn.textContent?.trim() || '';
        const ariaLabel = btn.getAttribute('aria-label') || '';
        const className = btn.className || '';
        const variant = btn.getAttribute('variant') || '';
        const treatment = btn.getAttribute('treatment') || '';
        
        // Check if this button is visible too
        const btnRect = btn.getBoundingClientRect();
        const btnStyles = window.getComputedStyle(btn);
        const isBtnVisible = btnRect.width > 0 && btnRect.height > 0 && 
                           btnStyles.visibility !== 'hidden' && 
                           btnStyles.display !== 'none' &&
                           btnStyles.opacity !== '0';
        
        log(`  Button ${btnIndex}: "${text}" ${isBtnVisible ? '✅' : '❌'} (class: "${className}", variant: "${variant}", treatment: "${treatment}", aria: "${ariaLabel}")`);
      });
    });
    
    // Now let's look for download buttons ONLY within visible modal containers
    const downloadSelectors = [
        // SPECIFIC TARGET: The exact blue download button from the modal
        '#dialog-download-btn',
        'sp-button[data-testid="download-commit-button"]',
        'sp-button.download-button',
        'sp-button[id="dialog-download-btn"]',
        
        // Adobe Spectrum specific (fallbacks)
        'sp-button[treatment="fill"][variant="accent"]',
        'sp-button[variant="accent"]',
        'sp-button[treatment="fill"]',
        
        // Buttons with download-related attributes
        'button[title*="Download"]',
        'sp-button[title*="Download"]',
      
      // Generic buttons (will filter by text)
      '.spectrum-Button',
      'sp-button',
      'button'
    ];
    
    let bestButton = null;
    let bestScore = 0;
    
    // First try: Search within visible containers 
    for (const container of allContainers) {
      log(`\n--- Searching in container: ${container.tagName}.${container.className} ---`);
      
      for (const selector of downloadSelectors) {
        const buttons = container.querySelectorAll(selector);
        if (buttons.length === 0) continue;
        
        log(`  Checking selector: ${selector} (${buttons.length} elements)`);
        
        buttons.forEach((btn, index) => {
            const text = btn.textContent?.toLowerCase().trim() || '';
            const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
            const title = btn.getAttribute('title')?.toLowerCase() || '';
            const className = btn.className || '';
            const variant = btn.getAttribute('variant') || '';
            const treatment = btn.getAttribute('treatment') || '';
            
            // Skip if no download-related text
            const hasDownloadText = text.includes('download') || 
                                  text.includes('export') || 
                                  text.includes('save') ||
                                  ariaLabel.includes('download') || 
                                  ariaLabel.includes('export') ||
                                  title.includes('download') ||
                                  title.includes('export');
                                  
            if (!hasDownloadText) return;
            
            // Check if button is visible
            const rect = btn.getBoundingClientRect();
            const styles = window.getComputedStyle(btn);
            const isVisible = rect.width > 0 && rect.height > 0 && 
                             styles.visibility !== 'hidden' && 
                             styles.display !== 'none' &&
                             styles.opacity !== '0';
            
            if (!isVisible) {
              log(`    Button ${index}: "${text}" - HIDDEN (${rect.width}x${rect.height}, vis: ${styles.visibility}, disp: ${styles.display})`);
              return;
            }
            
            // Score this button
            let score = 0;
            
            // HIGHEST PRIORITY: The exact blue download button we're looking for
            if (btn.id === 'dialog-download-btn' || 
                btn.getAttribute('data-testid') === 'download-commit-button' ||
                btn.classList.contains('download-button')) {
              score += 1000; // Massively high score for the exact target
              log(`    🎯 EXACT TARGET BUTTON FOUND! Mega score boost!`);
            }
            
            // Exact "download" text gets highest score
            if (text === 'download') score += 100;
            else if (text.includes('download')) score += 50;
            
            // Already in modal container (guaranteed by our search scope) 
            score += 50;
            
            // Adobe Spectrum CTA/accent buttons (usually blue)
            if (variant === 'cta' || variant === 'accent') score += 30;
            if (treatment === 'fill') score += 20;
            
            // Large buttons
            if (className.includes('sizeL') || btn.getAttribute('size') === 'l') score += 10;
            
            // Penalize close/cancel buttons
            if (text.includes('close') || text.includes('cancel')) score -= 50;
            
            log(`    Button ${index}: "${text}" = ${score} points`);
            log(`      Class: "${className}", Variant: "${variant}", Treatment: "${treatment}"`);
            log(`      Rect: ${rect.width}x${rect.height} at (${rect.left}, ${rect.top})`);
            
            if (score > bestScore) {
              bestScore = score;
              bestButton = btn;
              log(`      *** NEW BEST BUTTON! Score: ${score}`);
            }
          });
        }
      }
    
    // Second try: If no good option found in containers, search entire document for specific button
    if (!bestButton || bestScore < 500) {
      log(`\n--- GLOBAL SEARCH: Looking for specific blue download button anywhere in DOM ---`);
      
      const globalSelectors = [
        '#dialog-download-btn',
        'sp-button[data-testid="download-commit-button"]',
        'sp-button.download-button'
      ];
      
      for (const selector of globalSelectors) {
        const buttons = queryAllDeep(selector);
        if (buttons.length === 0) continue;
        
        log(`  Global search: ${selector} (${buttons.length} elements)`);
        
        buttons.forEach((btn, index) => {
          const text = btn.textContent?.toLowerCase().trim() || '';
          const className = btn.className || '';
          const variant = btn.getAttribute('variant') || '';
          const treatment = btn.getAttribute('treatment') || '';
          
          // Check if button is visible
          const rect = btn.getBoundingClientRect();
          const styles = window.getComputedStyle(btn);
          const isVisible = rect.width > 0 && rect.height > 0 && 
                           styles.visibility !== 'hidden' && 
                           styles.display !== 'none' &&
                           styles.opacity !== '0';
          
          if (!isVisible) {
            log(`    Global Button ${index}: "${text}" - HIDDEN`);
            return;
          }
          
          // Score this global button (start with base score for being the exact target)
          let score = 1000; // High base score for exact target
          
          // Add more points for exact text match
          if (text === 'download') score += 100;
          else if (text.includes('download')) score += 50;
          
          // Adobe Spectrum CTA/accent buttons
          if (variant === 'cta' || variant === 'accent') score += 30;
          if (treatment === 'fill') score += 20;
          
          log(`    Global Button ${index}: "${text}" = ${score} points (GLOBAL SEARCH)`);
          log(`      ID: ${btn.id}, TestID: ${btn.getAttribute('data-testid')}, Variant: ${variant}`);
          
          if (score > bestScore) {
            bestScore = score;
            bestButton = btn;
            log(`      *** NEW GLOBAL BEST! Score: ${score}`);
          }
        });
      }
    }
    
    if (bestButton) {
      log(`\n🎯 BEST BUTTON FOUND (score: ${bestScore}):`, bestButton);
      log(`Text: "${bestButton.textContent?.trim()}", Class: "${bestButton.className}"`);
      return bestButton;
    } else {
      log("\n❌ No download button found");
      return null;
    }
  }
  
  // ---------- Select MP4 format in the download modal ----------
  function selectMP4Format() {
    log("Looking for file format options in the download modal...");
    
    // Common selectors for format options
    const formatSelectors = [
      // Look for MP4 specifically
      '[data-format="mp4"]',
      '[data-value="mp4"]', 
      'input[value="mp4"]',
      'button[data-format="mp4"]',
      
      // Look for video format options
      '[data-format*="video"]',
      '[data-value*="video"]',
      'input[value*="video"]',
      
      // Look for format picker elements
      '.file-format-picker button',
      '.format-option',
      '[role="option"]',
      
      // Adobe-specific format selectors
      'sp-radio[value="mp4"]',
      'sp-button[data-format="mp4"]',
      '.spectrum-Radio input[value="mp4"]'
    ];
    
    for (const selector of formatSelectors) {
      const elements = queryAllDeep(selector);
      log(`Checking format selector "${selector}" - found ${elements.length} elements`);
      
      for (const element of elements) {
        const text = element.textContent?.toLowerCase() || '';
        const value = element.getAttribute('value')?.toLowerCase() || '';
        const dataFormat = element.getAttribute('data-format')?.toLowerCase() || '';
        const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
        
        // Check if it's visible
        const rect = element.getBoundingClientRect();
        const styles = window.getComputedStyle(element);
        const isVisible = rect.width > 0 && rect.height > 0 && 
                         styles.visibility !== 'hidden' && 
                         styles.display !== 'none' &&
                         styles.opacity !== '0';
        
        if (!isVisible) continue;
        
        // Check if this element relates to MP4/video
        const isMP4Related = text.includes('mp4') || text.includes('video') ||
                           value.includes('mp4') || value.includes('video') ||
                           dataFormat.includes('mp4') || dataFormat.includes('video') ||
                           ariaLabel.includes('mp4') || ariaLabel.includes('video');
        
        if (isMP4Related) {
          log(`✅ Found MP4/video format option: "${text}" (${element.tagName}, value: ${value})`);
          
          // Try to click/select it
          try {
            element.click();
            
            // Also try mouse events for reliability
            const clickEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            element.dispatchEvent(clickEvent);
            
            // If it's a radio button or input, also try changing its value
            if (element.type === 'radio' || element.type === 'checkbox') {
              element.checked = true;
              element.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            log(`🎯 Clicked MP4 format option: ${element.tagName}.${element.className}`);
            return true;
            
          } catch (error) {
            log(`❌ Failed to click MP4 option: ${error.message}`);
          }
        }
      }
    }
    
    log("❌ No MP4/video format option found or clickable");
    return false;
  }
  
  // ---------- Find ORIGINAL download button (the one that opens the modal) ----------
  function findOriginalDownloadButton() {
    log("Looking for ORIGINAL Download button (the one that opens modal)...");
    
    // Look for the visible Download button in the UI (not inside any modal)
    const selectors = [
      'sp-button[data-testid="editor-download-button"]', // Exact testid match
      'sp-button[variant="secondary"][id*="download"]',   // Secondary variant with download in ID
      'sp-button[variant="secondary"]',                   // Any secondary button
      'button[title*="Download"]',                        // Button with Download in title
      'sp-button',                                        // Any sp-button
      'button'                                            // Any button
    ];
    
    for (const selector of selectors) {
      const buttons = queryAllDeep(selector);
      log(`Checking selector "${selector}" - found ${buttons.length} buttons`);
      
      for (const btn of buttons) {
        const text = btn.textContent?.toLowerCase().trim() || '';
        const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
        const title = btn.getAttribute('title')?.toLowerCase() || '';
        const testid = btn.getAttribute('data-testid') || '';
        const variant = btn.getAttribute('variant') || '';
        
        // Check if it's visible and not in a modal/hidden container
        const rect = btn.getBoundingClientRect();
        const styles = window.getComputedStyle(btn);
        const isVisible = rect.width > 0 && rect.height > 0 && 
                         styles.visibility !== 'hidden' && 
                         styles.display !== 'none' &&
                         styles.opacity !== '0';
        
        if (!isVisible) continue;
        
        // Check if button contains "download" text or is the exact button we want
        const isDownloadButton = text.includes('download') || 
                                ariaLabel.includes('download') || 
                                title.includes('download') ||
                                testid.includes('download') ||
                                (text === 'send for review'); // Our custom button text
        
        // Avoid modal containers (buttons inside dialogs/modals)
        const inModal = btn.closest('[role="dialog"], [aria-modal="true"], [class*="modal"], [class*="Modal"]');
        
        if (isDownloadButton && !inModal) {
          log(`✅ Found original download button: "${text}" (${btn.tagName}, variant: ${variant}, testid: ${testid})`);
          return btn;
        }
      }
    }
    
    log("❌ Original download button not found");
    return null;
  }
  
  // ---------- Click stored download button ----------
  function clickStoredButton() {
    if (window.lastFoundButton) {
      log("🚀 Clicking stored download button:", window.lastFoundButton);
      window.lastFoundButton.click();
      
      // Also try mouse events for reliability
      const rect = window.lastFoundButton.getBoundingClientRect();
      const mouseEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2
      });
      window.lastFoundButton.dispatchEvent(mouseEvent);
      
      log("✅ Stored download button clicked!");
      return true;
    } else {
      log("❌ No stored download button to click");
      return false;
    }
  }
  
  // ---------- Create test UI ----------
  function createTestUI() {
    // Remove existing test UI
    const existing = document.getElementById('ae-download-test');
    if (existing) existing.remove();
    
    const testUI = document.createElement('div');
    testUI.id = 'ae-download-test';
    testUI.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      z-index: 99999;
      background: #f0f0f0;
      border: 2px solid #333;
      border-radius: 8px;
      padding: 12px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-width: 250px;
    `;
    
    testUI.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: bold;">🔍 Debug Download Modal</div>
      <div style="margin-bottom: 8px; font-size: 11px; color: #666;">
        Click Download button, then check console
      </div>
      <button id="inspect-dom" style="
        background: #6f42c1; color: white; border: none; padding: 4px 8px; 
        border-radius: 4px; cursor: pointer; margin-right: 4px; font-size: 10px;
      ">Inspect DOM</button>
      <button id="manual-find" style="
        background: #007acc; color: white; border: none; padding: 4px 8px; 
        border-radius: 4px; cursor: pointer; margin-right: 4px; font-size: 10px;
      ">Find Button</button>
      <button id="click-button" style="
        background: #28a745; color: white; border: none; padding: 4px 8px; 
        border-radius: 4px; cursor: pointer; margin-right: 4px; font-size: 10px;
      ">Click Found</button>
      <button id="close-test" style="
        background: #dc3545; color: white; border: none; padding: 4px 8px; 
        border-radius: 4px; cursor: pointer; font-size: 10px;
      ">Close</button>
      <div id="test-result" style="margin-top: 8px; font-size: 10px; color: #666; max-width: 220px;">
        Ready to debug - check console
      </div>
    `;
    
    const result = testUI.querySelector('#test-result');
    
    // Inspect DOM button - shows current state of all potential modal elements
    testUI.querySelector('#inspect-dom').addEventListener('click', () => {
      log("=== CURRENT DOM INSPECTION ===");
      
      // Check all potential modal selectors
      const selectors = [
        '[role="dialog"]',
        '[class*="modal"]', '[class*="Modal"]',
        '[class*="overlay"]', '[class*="Overlay"]', 
        '[class*="popover"]', '[class*="Popover"]',
        '[class*="dropdown"]', '[class*="Dropdown"]',
        '[aria-modal="true"]',
        '[data-testid*="modal"]', '[data-testid*="dialog"]',
        '.spectrum-Modal', '.spectrum-Dialog', '.spectrum-Popover'
      ];
      
      selectors.forEach(selector => {
        const elements = queryAllDeep(selector);
        if (elements.length > 0) {
          log(`${selector}: Found ${elements.length} elements`);
          elements.forEach((el, i) => {
            const rect = el.getBoundingClientRect();
            const styles = window.getComputedStyle(el);
            const isVisible = rect.width > 0 && rect.height > 0 && 
                             styles.visibility !== 'hidden' && 
                             styles.display !== 'none' &&
                             styles.opacity !== '0';
            
            log(`  [${i}] ${el.tagName}.${el.className} ${isVisible ? '✅ VISIBLE' : '❌ HIDDEN'}`);
            log(`      Size: ${rect.width}x${rect.height}, Display: ${styles.display}, Visibility: ${styles.visibility}`);
            if (el.innerHTML && el.innerHTML.length < 500) {
              log(`      Content: ${el.innerHTML}`);
            } else if (el.innerHTML) {
              log(`      Content (first 200 chars): ${el.innerHTML.substring(0, 200)}...`);
            }
          });
        } else {
          log(`${selector}: No elements found`);
        }
      });
      
      // Also check for the SPECIFIC blue download button anywhere in DOM
      log("\n=== LOOKING FOR SPECIFIC BLUE DOWNLOAD BUTTON ===");
      
      const specificSelectors = [
        '#dialog-download-btn',
        'sp-button[data-testid="download-commit-button"]',
        'sp-button.download-button',
        'sp-button[id="dialog-download-btn"]'
      ];
      
      specificSelectors.forEach(selector => {
        const found = queryAllDeep(selector);
        if (found.length > 0) {
          log(`FOUND TARGET: ${selector} - ${found.length} elements`);
          found.forEach((el, i) => {
            const rect = el.getBoundingClientRect();
            const styles = window.getComputedStyle(el);
            const isVisible = rect.width > 0 && rect.height > 0 && 
                             styles.visibility !== 'hidden' && 
                             styles.display !== 'none' &&
                             styles.opacity !== '0';
            
            log(`  [${i}] ${isVisible ? '✅ VISIBLE' : '❌ HIDDEN'} "${el.textContent?.trim()}"`);
            log(`      ID: ${el.id}, Classes: ${el.className}`);
            log(`      TestID: ${el.getAttribute('data-testid')}, Variant: ${el.getAttribute('variant')}`);
            log(`      Size: ${rect.width}x${rect.height}, Display: ${styles.display}`);
          });
        } else {
          log(`NOT FOUND: ${selector}`);
        }
      });
      
      // Also check for buttons with download text anywhere in DOM
      log("\n=== ALL DOWNLOAD BUTTONS ANYWHERE ===");
      const allButtons = queryAllDeep('button, sp-button, [role="button"]');
      const downloadButtons = allButtons.filter(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
        const title = btn.getAttribute('title')?.toLowerCase() || '';
        return text.includes('download') || text.includes('export') || text.includes('save') ||
               ariaLabel.includes('download') || ariaLabel.includes('export') ||
               title.includes('download') || title.includes('export');
      });
      
      log(`Found ${downloadButtons.length} buttons with download-related text:`);
      downloadButtons.forEach((btn, i) => {
        const rect = btn.getBoundingClientRect();
        const styles = window.getComputedStyle(btn);
        const isVisible = rect.width > 0 && rect.height > 0 && 
                         styles.visibility !== 'hidden' && 
                         styles.display !== 'none' &&
                         styles.opacity !== '0';
        
        log(`  [${i}] "${btn.textContent?.trim()}" ${isVisible ? '✅ VISIBLE' : '❌ HIDDEN'}`);
        log(`      Class: ${btn.className}, Variant: ${btn.getAttribute('variant')}`);
      });
      
      result.textContent = 'DOM inspection complete - check console';
      result.style.color = '#6f42c1';
    });
    
    // Manual find button - NOW USES 2-STEP APPROACH
    testUI.querySelector('#manual-find').addEventListener('click', () => {
      log("\n🧪 === MANUAL TEST: 2-STEP DOWNLOAD PROCESS ===");
      result.innerHTML = 'Step 1: Finding original Download button...';
      result.style.color = '#007bff';
      
      // Step 1: Find and click ORIGINAL download button to open modal
      const originalButton = findOriginalDownloadButton();
      
      if (originalButton) {
        log("✅ Step 1: Found original Download button:", originalButton);
        result.innerHTML = `Step 1: Found "${originalButton.textContent?.trim()}" - clicking...`;
        
        // Click the original button to open modal
        originalButton.click();
        
        // Step 2: Wait for modal to open, then find blue button
        setTimeout(() => {
          log("Step 2: Looking for blue Download button in opened modal...");
          result.innerHTML = 'Step 2: Searching for blue button in modal...';
          
          log("Step 2a: Looking for format selection options...");
          const formatChanged = selectMP4Format();
          
          if (formatChanged) {
            log("✅ Step 2a: MP4 format selected!");
            result.innerHTML = 'Step 2a: MP4 selected, finding blue button...';
          } else {
            log("⚠️ Step 2a: Could not select MP4, continuing anyway...");
            result.innerHTML = 'Step 2a: Format unchanged, finding blue button...';
          }
          
          // Wait a moment for format change to apply
          setTimeout(() => {
            const blueButton = findDownloadButton();
            if (blueButton) {
              result.innerHTML = `✅ Step 2: Found blue button!<br>"${blueButton.textContent?.trim()}"<br><small>${formatChanged ? 'MP4 selected' : 'Default format'}</small>`;
              result.style.color = '#28a745';
              window.lastFoundButton = blueButton;
              log("✅ Step 2: Blue button found and stored!");
            } else {
              result.innerHTML = '❌ Step 2 failed:<br>Blue button not found in modal';
              result.style.color = '#dc3545';
              window.lastFoundButton = null;
            }
          }, 500);
        }, 1500); // Wait 1.5 seconds for modal to fully open
        
      } else {
        result.innerHTML = '❌ Step 1 failed:<br>Original Download button not found';
        result.style.color = '#dc3545';
        window.lastFoundButton = null;
      }
    });
    
    // Click button (uses stored button from auto-detection or manual find)
    testUI.querySelector('#click-button').addEventListener('click', () => {
      if (window.lastFoundButton) {
        result.textContent = 'Clicking stored button...';
        log("🚀 Clicking stored download button:", window.lastFoundButton);
        
        // Click the stored button
        window.lastFoundButton.click();
        
        // Also dispatch mouse events
        const rect = window.lastFoundButton.getBoundingClientRect();
        const mouseEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2
        });
        window.lastFoundButton.dispatchEvent(mouseEvent);
        
        result.textContent = '🚀 Stored button clicked!';
        result.style.color = '#28a745';
      } else {
        result.innerHTML = '❌ No button stored<br>Wait for auto-detection or use Manual Check';
        result.style.color = '#dc3545';
      }
    });
    
    // Close button
    testUI.querySelector('#close-test').addEventListener('click', () => {
      testUI.remove();
    });
    
    document.body.appendChild(testUI);
    log("Test UI created - use buttons to test download button detection");
  }
  
  // ---------- Auto-detect when modal appears ----------
  function setupAutoDetection() {
    log("Setting up automatic modal detection...");
    
    const observer = new MutationObserver((mutations) => {
      // Log ALL mutations to see what's happening
      mutations.forEach((mutation, index) => {
        if (mutation.addedNodes.length > 0) {
          log(`Mutation ${index}: ${mutation.addedNodes.length} nodes added`);
          Array.from(mutation.addedNodes).forEach((node, nodeIndex) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              log(`  Added node ${nodeIndex}: ${node.tagName}.${node.className} (id: ${node.id})`);
              // Log first bit of innerHTML if it's substantial
              if (node.innerHTML && node.innerHTML.length > 50) {
                log(`  Content preview: ${node.innerHTML.substring(0, 100)}...`);
              }
            }
          });
        }
        
        // Check for attribute changes too (modal might be shown/hidden via attributes)
        if (mutation.type === 'attributes') {
          const target = mutation.target;
          if (target.nodeType === Node.ELEMENT_NODE) {
            log(`Attribute changed on ${target.tagName}.${target.className}: ${mutation.attributeName} = "${target.getAttribute(mutation.attributeName)}"`);
          }
        }
      });
      
      // Check if any new modals appeared
      const hasNewModal = mutations.some(mutation => {
        return Array.from(mutation.addedNodes).some(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if it's a modal or contains modal elements
            const isModal = node.matches && (
              node.matches('[role="dialog"]') ||
              node.matches('[class*="modal"], [class*="Modal"]') ||
              node.matches('[class*="overlay"], [class*="Overlay"]') ||
              node.matches('[class*="popover"], [class*="Popover"]') ||
              node.querySelector('[role="dialog"]') ||
              node.querySelector('[class*="modal"], [class*="Modal"]') ||
              node.querySelector('[class*="overlay"], [class*="Overlay"]') ||
              node.querySelector('[class*="popover"], [class*="Popover"]')
            );
            
            if (isModal) {
              log(`Found modal element: ${node.tagName}.${node.className}`);
            }
            
            return isModal;
          }
          return false;
        });
      });
      
      // Also check for attribute changes that might show existing modals
      const hasModalAttributeChange = mutations.some(mutation => {
        if (mutation.type === 'attributes') {
          const target = mutation.target;
          const attributeName = mutation.attributeName;
          
          // Check if it's a potential modal that became visible
          if (target.nodeType === Node.ELEMENT_NODE && 
              (attributeName === 'style' || attributeName === 'class' || 
               attributeName === 'aria-hidden' || attributeName === 'hidden')) {
            
            const mightBeModal = target.matches && (
              target.matches('[role="dialog"]') ||
              target.matches('[class*="modal"], [class*="Modal"]') ||
              target.matches('[class*="overlay"], [class*="Overlay"]') ||
              target.matches('[class*="popover"], [class*="Popover"]')
            );
            
            if (mightBeModal) {
              const rect = target.getBoundingClientRect();
              const styles = window.getComputedStyle(target);
              const isVisible = rect.width > 0 && rect.height > 0 && 
                               styles.visibility !== 'hidden' && 
                               styles.display !== 'none' &&
                               styles.opacity !== '0';
              
              if (isVisible) {
                log(`Modal became visible via ${attributeName} change: ${target.tagName}.${target.className}`);
                return true;
              }
            }
          }
        }
        return false;
      });
      
      if (hasNewModal || hasModalAttributeChange) {
        log("🔍 Modal detected! Auto-searching for download button...");
        // Wait a moment for modal to fully render
        setTimeout(() => {
          const found = findDownloadButton();
          updateTestResult(found);
        }, 100);
      }
    });
    
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'aria-hidden', 'hidden']
    });
    
    log("Auto-detection setup complete - watching document for modal changes");
  }
  
  // ---------- Update test result display ----------
  function updateTestResult(foundButton) {
    const result = document.querySelector('#test-result');
    if (!result) return;
    
    if (foundButton) {
      result.innerHTML = `✅ Auto-found:<br>"${foundButton.textContent?.trim()}"<br><small>Ready to click!</small>`;
      result.style.color = '#28a745';
      
      // Store the found button globally so click button can use it
      window.lastFoundButton = foundButton;
    } else {
      result.innerHTML = '❌ Modal opened but no download button found';
      result.style.color = '#dc3545';
      window.lastFoundButton = null;
    }
  }

  // ---------- Initialize ----------
  function initialize() {
    log("Download Button Test initialized");
    
    // Create test UI immediately
    createTestUI();
    
    // Set up automatic modal detection
    setupAutoDetection();
    
    // Also create on navigation changes (SPA)
    let lastUrl = location.href;
    setInterval(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        setTimeout(() => {
          createTestUI();
          setupAutoDetection();
        }, 1000);
      }
    }, 1000);
  }
  
  // Start when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  window.addEventListener('load', () => {
    setTimeout(initialize, 500);
  });

})();
