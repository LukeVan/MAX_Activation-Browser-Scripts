// ==UserScript==
// @name         Adobe Redirect Button
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adds a bright green "Click Me" button in the lower right corner that redirects to adobe.com
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    function createButton() {
        // Check if button already exists to prevent duplicates
        if (document.getElementById('adobe-redirect-btn')) {
            return;
        }
        
        console.log('Creating Adobe redirect button...');
        
        // Create the button element
        const button = document.createElement('button');
        button.id = 'adobe-redirect-btn';
        button.textContent = 'Click Me';
        
        // Style the button
        button.style.cssText = `
            position: fixed !important;
            bottom: 20px !important;
            right: 20px !important;
            z-index: 2147483647 !important;
            background-color: #00ff00 !important;
            color: white !important;
            border: none !important;
            border-radius: 8px !important;
            padding: 12px 20px !important;
            font-size: 16px !important;
            font-weight: bold !important;
            cursor: pointer !important;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2) !important;
            transition: all 0.3s ease !important;
            font-family: Arial, sans-serif !important;
            width: auto !important;
            height: auto !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        `;
        
        // Add hover effect
        button.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#00cc00';
            this.style.transform = 'scale(1.05)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#00ff00';
            this.style.transform = 'scale(1)';
        });
        
        // Add click handler to redirect to adobe.com
        button.addEventListener('click', function() {
            console.log('Adobe redirect button clicked!');
            window.location.href = 'https://adobe.com';
        });
        
        // Try to add the button to the page
        const targetElement = document.body || document.documentElement;
        if (targetElement) {
            targetElement.appendChild(button);
            console.log('Adobe redirect button added to page!');
        } else {
            console.error('Could not find body or documentElement to append button');
        }
    }
    
    // Try to create the button immediately
    if (document.readyState === 'loading') {
        // If document is still loading, wait for it
        document.addEventListener('DOMContentLoaded', createButton);
    } else {
        // Document is already loaded
        createButton();
    }
    
    // Also try after a short delay as a backup
    setTimeout(createButton, 1000);
    
    // Watch for dynamic content changes that might remove the button
    const observer = new MutationObserver(function() {
        if (!document.getElementById('adobe-redirect-btn')) {
            createButton();
        }
    });
    
    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    }
})();
