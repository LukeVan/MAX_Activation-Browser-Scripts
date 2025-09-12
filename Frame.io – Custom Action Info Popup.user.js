// ==UserScript==
// @name         Frame.io – Custom Action Info Popup
// @namespace    https://your-namespace.example
// @version      1.0
// @description  Show a friendly info popup when a Frame.io Custom Action is triggered on an asset
// @author       You
// @match        https://app.frame.io/*
// @match        https://*.frame.io/*
// @run-at       document-idle
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  'use strict';

  // 1) Update this to the EXACT label(s) of your Custom Action menu item(s) in Frame.io
  //    Add multiple strings if you have more than one custom action.
  //    Example: ["Run AI Workflow", "Send to Firefly"]
  const CUSTOM_ACTION_LABELS = ["Run AI Workflow"]; // <-- CHANGE THIS

  // 2) The message you want to display
  const POPUP_HTML = `
    <div class="fiopop-modal-backdrop"></div>
    <div class="fiopop-modal" role="dialog" aria-modal="true" aria-label="What Happens When You Click">
      <div class="fiopop-header">What Happens When You Click</div>
      <div class="fiopop-body">
        <ul>
          <li>Your drawing is sent through a custom Adobe workflow that:</li>
          <li><strong>Crops the page</strong> so the focus is just on your artwork</li>
          <li><strong>Removes the background</strong> for a clean cutout</li>
          <li><strong>Applies Lightroom magic</strong> with color presets to make your image pop ✨</li>
        </ul>
        <p class="fiopop-footnote">All powered automatically by <strong>Adobe Firefly Services</strong>, right from <strong>Frame.io</strong>.</p>
      </div>
      <div class="fiopop-actions">
        <button class="fiopop-ok" autofocus>Got it</button>
      </div>
    </div>
  `;

  // 3) Styles for the modal
  const css = `
    .fiopop-modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.35);
      z-index: 999999998;
    }
    .fiopop-modal {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: min(520px, 92vw);
      background: #fff; color: #222;
      border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.25);
      z-index: 999999999; padding: 20px 20px 16px; font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
    }
    .fiopop-header {
      font-weight: 700; font-size: 18px; margin-bottom: 8px;
    }
    .fiopop-body { font-size: 14px; line-height: 1.5; }
    .fiopop-body ul { padding-left: 18px; margin: 8px 0 12px; }
    .fiopop-body li { margin: 6px 0; }
    .fiopop-footnote { margin: 6px 0 0; color: #444; }
    .fiopop-actions { display: flex; justify-content: flex-end; margin-top: 10px; }
    .fiopop-ok {
      border: 0; border-radius: 8px; padding: 10px 14px; cursor: pointer;
      background: #5b5bd6; color: #fff; font-weight: 600;
    }
    .fiopop-ok:hover { filter: brightness(1.05); }
  `;

  if (typeof GM_addStyle === 'function') {
    GM_addStyle(css);
  } else {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  function showPopup() {
    // Prevent multiple open modals
    if (document.querySelector('.fiopop-modal')) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = POPUP_HTML.trim();

    const backdrop = wrapper.firstElementChild;
    const modal = wrapper.lastElementChild;

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    function close() {
      backdrop.remove();
      modal.remove();
      document.removeEventListener('keydown', onKeydown);
    }

    function onKeydown(e) {
      if (e.key === 'Escape') close();
    }

    modal.querySelector('.fiopop-ok').addEventListener('click', close);
    backdrop.addEventListener('click', close);
    document.addEventListener('keydown', onKeydown);
  }

  // Utility: checks if a node (or its text) matches any custom action label
  function nodeMatchesCustomAction(node) {
    if (!node) return false;

    const el = node.closest && node.closest('button,[role="menuitem"],[data-testid],[class*="Men*]()
