'use strict';

let currentTab = 'text';
let imgData = null;
let imgMime = null;
let mode = 'direct';
let proxyUrl = 'http://localhost:8080';
let lastPrompt = '';
let activeAgent = 'claude';
let apiKeys = { claude: '', gemini: '', openai: '', deepseek: '', groq: '', mistral: '' };
let workspacePresets = [];
let loadedDesignTokens = null;
let rawTokensText = '';
let activeTabVariables = null;
let historyLog = [];
let supabaseUrl = 'https://ywlvbitacvemgkndmfef.supabase.co';
let supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3bHZiaXRhY3ZlbWdrbmRtZmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxOTM0NjcsImV4cCI6MjA5NDc2OTQ2N30.diLEK6xnzQj1hBH6G2NFq0uTuC8xJHlHX6hkwYfwAqQ';
let userId = '';
let teamId = '';
let isLoggedIn = false;
let accountTier = 'free';
let generationsCount = 0;
let userEmail = '';
let accessToken = '';
let refreshToken = '';

function init() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(
      ['apiKeys', 'activeAgent', 'mode', 'proxyUrl', 'supabaseUrl', 'supabaseKey', 'userId', 'teamId', 'workspacePresets', 'historyLog', 'isLoggedIn', 'accountTier', 'generationsCount', 'userEmail', 'loadedDesignTokens', 'rawTokensText', 'accessToken', 'refreshToken'],
      (result) => {
        if (result.apiKeys) apiKeys = result.apiKeys;
        if (result.activeAgent) activeAgent = result.activeAgent;
        if (result.mode) mode = result.mode;
        if (result.proxyUrl) proxyUrl = result.proxyUrl;
        if (result.supabaseUrl) supabaseUrl = result.supabaseUrl;
        if (result.supabaseKey) supabaseKey = result.supabaseKey;
        if (result.accessToken) accessToken = result.accessToken;
        if (result.refreshToken) refreshToken = result.refreshToken;
        
        userId = result.userId || '';
        if (!userId) {
          userId = 'pf-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          chrome.storage.local.set({ userId });
        }
        
        if (result.teamId) teamId = result.teamId;
        if (result.workspacePresets && Array.isArray(result.workspacePresets)) workspacePresets = result.workspacePresets;
        if (result.historyLog && Array.isArray(result.historyLog)) historyLog = result.historyLog;
        if (result.hasOwnProperty('isLoggedIn')) isLoggedIn = result.isLoggedIn;
        if (result.accountTier) accountTier = result.accountTier;
        if (result.hasOwnProperty('generationsCount')) generationsCount = result.generationsCount;
        if (result.userEmail) userEmail = result.userEmail;
        if (result.loadedDesignTokens) loadedDesignTokens = result.loadedDesignTokens;
        if (result.rawTokensText) rawTokensText = result.rawTokensText;

        // Initialize UI controllers
        setupTabs();
        setupPills();
        setupColorPicker();
        setupImageUpload();
        setupRte();
        setupGenerate();
        setupOutput();
        setupBottomBar();
        setupAgentSelect();
        
        // Bind UI triggers and render initial states
        initSettingsUI();
        initPresetsUI();
        initDesignTokensUI();
        initHistoryUI();
        initMonetizationUI();

        // Safe cloud synchronization now that state variables are guaranteed
        syncPresetsFromCloud();
        syncHistoryFromCloud();
      }
    );
  } else {
    // Fallback local storage gets for web page testing simulation
    isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    accountTier = localStorage.getItem('accountTier') || 'free';
    generationsCount = parseInt(localStorage.getItem('generationsCount') || '0', 10);
    userEmail = localStorage.getItem('userEmail') || '';
    userId = localStorage.getItem('userId') || 'pf-web-test-123';
    teamId = localStorage.getItem('teamId') || '';
    rawTokensText = localStorage.getItem('rawTokensText') || '';

    const cachedPresets = localStorage.getItem('workspacePresets');
    if (cachedPresets) {
      try { workspacePresets = JSON.parse(cachedPresets); } catch (e) {}
    }
    const cachedHistory = localStorage.getItem('historyLog');
    if (cachedHistory) {
      try { historyLog = JSON.parse(cachedHistory); } catch (e) {}
    }
    const cachedTokens = localStorage.getItem('loadedDesignTokens');
    if (cachedTokens) {
      try { loadedDesignTokens = JSON.parse(cachedTokens); } catch (e) {}
    }

    setupTabs();
    setupPills();
    setupColorPicker();
    setupImageUpload();
    setupRte();
    setupGenerate();
    setupOutput();
    setupBottomBar();
    setupAgentSelect();

    initSettingsUI();
    initPresetsUI();
    initDesignTokensUI();
    initHistoryUI();
    initMonetizationUI();
  }
}

function setupTabs() {
  ['text','image','url'].forEach(id => {
    document.getElementById('tab-' + id).addEventListener('click', () => switchTab(id));
  });
}

function switchTab(t) {
  currentTab = t;
  ['text','image','url'].forEach(id => {
    document.getElementById('tab-' + id).classList.toggle('active', id === t);
    document.getElementById('pane-' + id).classList.toggle('hidden', id !== t);
  });
}

function setupPills() {
  document.getElementById('fw-group').querySelectorAll('.pill').forEach(btn => {
    btn.addEventListener('click', () => selectPill(btn, 'fw-group'));
  });
  document.getElementById('st-group').querySelectorAll('.pill').forEach(btn => {
    btn.addEventListener('click', () => selectPill(btn, 'st-group'));
  });
}

function setupColorPicker() {
  const clrInp = document.getElementById('clr-inp');
  const nativePicker = document.getElementById('native-color-picker');
  const colorLabel = nativePicker.parentElement;

  nativePicker.addEventListener('input', (e) => {
    const hex = e.target.value;
    clrInp.value = hex.toUpperCase();
    
    // Visual feedback: update border of color spectrum circle button to match picked color!
    colorLabel.style.borderColor = hex;
  });

  clrInp.addEventListener('change', () => {
    const val = clrInp.value.trim();
    if (/^#[0-9A-F]{6}$/i.test(val)) {
      nativePicker.value = val;
      colorLabel.style.borderColor = val;
    }
  });
}


function selectPill(btn, groupId) {
  document.getElementById(groupId).querySelectorAll('.pill').forEach(p => p.classList.remove('on'));
  btn.classList.add('on');
}

function getSelected(groupId) {
  const el = document.querySelector('#' + groupId + ' .pill.on');
  return el ? el.textContent.trim() : '';
}

function setupRte() {
  const editor = document.getElementById('desc-txt');
  const counter = document.getElementById('char-count');
  
  editor.addEventListener('input', () => {
    const count = editor.innerText.trim().length;
    counter.textContent = count + '/1500';
    if (count > 1500) {
      editor.innerText = editor.innerText.slice(0, 1500);
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editor);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  });

  document.querySelectorAll('.rte-btn').forEach(btn => {
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const command = btn.getAttribute('data-command');
      document.execCommand(command, false, null);
      editor.focus();
      updateToolbarActiveStates();
    });
  });

  editor.addEventListener('keyup', updateToolbarActiveStates);
  editor.addEventListener('mouseup', updateToolbarActiveStates);

  const refineBtn = document.getElementById('refine-txt-btn');
  if (refineBtn) {
    refineBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const originalText = editor.innerText.trim();
      if (!originalText) {
        showError('Please enter some text to refine.');
        return;
      }
      
      const apiKey = apiKeys[activeAgent] || document.getElementById('api-key-inp').value.trim();
      if (!apiKey && mode !== 'proxy') {
        showError(`Please configure an API key for ${activeAgent} to refine text.`);
        return;
      }

      refineBtn.disabled = true;
      const oldTxt = refineBtn.innerHTML;
      refineBtn.innerHTML = '<div class="refine-spinner"></div> Refining...';

      try {
        const sysPrompt = 'You are an expert UI technical writer and grammar editor. Correct grammar, spelling, and punctuation while improving technical professional clarity. Do not add any introductory chatter, quotes, or markdown formatting fences. Output only the refined plain text.';
        
        let payload, endpoint;
        const headers = { 'Content-Type': 'application/json' };

        if (activeAgent === 'claude') {
          payload = {
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            system: sysPrompt,
            messages: [{ role: 'user', content: originalText }]
          };
        } else if (activeAgent === 'gemini') {
          payload = {
            contents: [{ role: 'user', parts: [{ text: sysPrompt + '\n\nText to refine:\n' + originalText }] }],
            generation_config: { max_output_tokens: 2048 }
          };
        } else {
          let modelName = 'gpt-4o';
          if (activeAgent === 'deepseek') modelName = 'deepseek-chat';
          if (activeAgent === 'groq') modelName = 'llama3-70b-8192';
          if (activeAgent === 'mistral') modelName = 'mistral-large-latest';

          payload = {
            model: modelName,
            messages: [
              { role: 'system', content: sysPrompt },
              { role: 'user', content: originalText }
            ]
          };
        }

        if (mode === 'proxy') {
          endpoint = document.getElementById('proxy-url-inp').value.trim() + '/generate';
          headers['X-Target-Agent'] = activeAgent;
          headers['X-API-Key'] = apiKey;
        } else {
          if (activeAgent === 'claude') {
            endpoint = 'https://api.anthropic.com/v1/messages';
            headers['x-api-key'] = apiKey;
            headers['anthropic-version'] = '2023-06-01';
          } else if (activeAgent === 'gemini') {
            endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
          } else if (['openai', 'deepseek', 'groq', 'mistral'].includes(activeAgent)) {
            let base = 'https://api.openai.com/v1/chat/completions';
            if (activeAgent === 'deepseek') base = 'https://api.deepseek.com/chat/completions';
            if (activeAgent === 'groq') base = 'https://api.groq.com/openai/v1/chat/completions';
            if (activeAgent === 'mistral') base = 'https://api.mistral.ai/v1/chat/completions';
            endpoint = base;
            headers['Authorization'] = 'Bearer ' + apiKey;
          }
        }

        const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('Refinement request failed.');
        
        const data = await res.json();
        let refined = '';
        if (activeAgent === 'claude') {
          refined = (data.content || []).map(b => b.text || '').join('');
        } else if (activeAgent === 'gemini') {
          refined = data.candidates[0].content.parts[0].text;
        } else {
          refined = data.choices[0].message.content;
        }

        if (refined) {
          editor.innerText = refined.trim();
          editor.dispatchEvent(new Event('input'));
        }
      } catch (err) {
        showError('Refine failed: ' + err.message);
      } finally {
        refineBtn.innerHTML = oldTxt;
        refineBtn.disabled = false;
      }
    });
  }
}

function updateToolbarActiveStates() {
  document.querySelectorAll('.rte-btn').forEach(btn => {
    const command = btn.getAttribute('data-command');
    const isActive = document.queryCommandState(command);
    btn.classList.toggle('active', isActive);
  });
}

function getRteContent() {
  const el = document.getElementById('desc-txt');
  if (!el) return '';
  
  let html = el.innerHTML;
  
  html = html.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  html = html.replace(/<b>(.*?)<\/b>/gi, '**$1**');
  html = html.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  html = html.replace(/<i>(.*?)<\/i>/gi, '*$1*');
  html = html.replace(/<u>(.*?)<\/u>/gi, '_$1_');
  
  html = html.replace(/<li>(.*?)<\/li>/gi, '- $1\n');
  html = html.replace(/<\/ul>/gi, '\n');
  html = html.replace(/<\/ol>/gi, '\n');
  
  html = html.replace(/<div>(.*?)<\/div>/gi, '$1\n');
  html = html.replace(/<p>(.*?)<\/p>/gi, '$1\n');
  html = html.replace(/<br\s*\/?>/gi, '\n');
  
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent.trim();
}

function setupImageUpload() {
  const zone = document.getElementById('drop-zone');
  const fileInp = document.getElementById('file-inp');
  const prevArea = document.getElementById('img-prev-area');
  const removeBtn = document.getElementById('img-remove-btn');

  zone.addEventListener('click', () => fileInp.click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('dragover');
    const f = e.dataTransfer.files[0];
    if (f) loadImageFile(f);
  });
  fileInp.addEventListener('change', e => {
    if (e.target.files[0]) loadImageFile(e.target.files[0]);
  });
  removeBtn.addEventListener('click', () => {
    imgData = null; imgMime = null;
    prevArea.style.display = 'none';
    zone.style.display = 'block';
    fileInp.value = '';
  });
}

function loadImageFile(file) {
  if (file.size > 4 * 1024 * 1024) {
    showError('Image too large (max 4 MB). Please compress and retry.');
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    imgData = e.target.result;
    imgMime = file.type;
    document.getElementById('img-prev').src = imgData;
    document.getElementById('drop-zone').style.display = 'none';
    document.getElementById('img-prev-area').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function setupGenerate() {
  document.getElementById('gen-btn').addEventListener('click', generate);
}

async function generate() {
  const fw = getSelected('fw-group');
  const st = getSelected('st-group');
  const colors = document.getElementById('clr-inp').value.trim();
  const font = document.getElementById('fnt-inp').value.trim();
  const desc = getRteContent();
  const urlVal = document.getElementById('url-inp').value.trim();
  const apiKey = document.getElementById('api-key-inp').value.trim();

  if (currentTab === 'text' && !desc) { showError('Please describe the UI you want to build.'); return; }
  if (currentTab === 'image' && !imgData) { showError('Please upload a UI screenshot first.'); return; }
  if (currentTab === 'url' && !urlVal) { showError('Please paste a URL.'); return; }
  if (accountTier === 'free' && generationsCount >= 10) {
    document.getElementById('settings-panel').classList.add('open');
    showError('Free quota limit reached (10/10 runs). Please Upgrade to Pro.');
    return;
  }

  if (mode === 'direct' && !apiKey) {
    document.getElementById('settings-panel').classList.add('open');
    showError('Direct API mode requires an API Key in Settings.');
    return;
  }

  if (!apiKey && !isLoggedIn) {
    document.getElementById('settings-panel').classList.add('open');
    showError('Add your API key or Sign In in Settings first.');
    return;
  }

  setLoading(true);
  document.getElementById('output-wrap').classList.remove('visible');

  activeTabVariables = null;
  let screenshotDataUrl;
  if (currentTab === 'url') {
    if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.scripting) {
      showError('Extension API not available. Please load PromptForge as an unpacked extension in Chrome (chrome://extensions).');
      setLoading(false);
      return;
    }
    try {
      const tabs = await new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, resolve);
      });
      const activeTab = tabs[0];
      if (activeTab) {
        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          files: ['content.js']
        });

        const response = await new Promise((resolve) => {
          chrome.tabs.sendMessage(activeTab.id, { type: 'GET_DOM_SPECS' }, (res) => {
            if (chrome.runtime.lastError) {
              console.warn('DOM specs query warning:', chrome.runtime.lastError.message);
              resolve(null);
            } else {
              resolve(res);
            }
          });
        });

        if (response && response.status === 'success') {
          activeTabVariables = response.data;
          console.log('Deep DOM specs extracted:', activeTabVariables);
        }
      }

      screenshotDataUrl = await new Promise((resolve, reject) => {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, function(dataUrl) {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(dataUrl);
          }
        });
      });
      console.log('Screenshot captured successfully');
    } catch (e) {
      console.error('Failed to capture tab context:', e);
      showError('Failed to capture tab context. Make sure you are on the active tab.');
      setLoading(false);
      return;
    }
  }

  const instruction = buildInstruction(fw, st, colors, font, desc, urlVal);

  let userContent;

  if (currentTab === 'image' && imgData) {
    const b64 = imgData.split(',')[1];
    userContent = [
      { type: 'image', source: { type: 'base64', media_type: imgMime, data: b64 } },
      { type: 'text', text: instruction }
    ];
  } else if (currentTab === 'url' && screenshotDataUrl) {
    const b64 = screenshotDataUrl.split(',')[1];
    userContent = [
      { type: 'image', source: { type: 'base64', media_type: 'image/png', data: b64 } },
      { type: 'text', text: instruction }
    ];
  } else {
    userContent = [{ type: 'text', text: instruction }];
  }

  let payload;
  if (activeAgent === 'claude') {
    payload = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: 'You are an expert UI/UX prompt engineer. Your prompts are hyper-precise and produce pixel-accurate results. Always return valid JSON only — no markdown fences, no preamble, no extra text.',
      messages: [{ role: 'user', content: userContent }]
    };
  } else if (activeAgent === 'gemini') {
    let parts = [];
    if (currentTab === 'image' && imgData) {
      const b64 = imgData.split(',')[1];
      parts.push({ text: instruction });
      parts.push({ inlineData: { mimeType: imgMime, data: b64 } });
    } else if (currentTab === 'url' && screenshotDataUrl) {
      const b64 = screenshotDataUrl.split(',')[1];
      parts.push({ text: instruction });
      parts.push({ inlineData: { mimeType: 'image/png', data: b64 } });
    } else {
      parts.push({ text: instruction });
    }

    payload = {
      contents: [{ role: 'user', parts: parts }],
      generation_config: {
        max_output_tokens: 4096
      }
    };
  } else {
    let oaiContent;
    if ((currentTab === 'image' && imgData) || (currentTab === 'url' && screenshotDataUrl)) {
      const baseData = currentTab === 'image' ? imgData : screenshotDataUrl;
      oaiContent = [
        { type: 'text', text: instruction },
        { type: 'image_url', image_url: { url: baseData } }
      ];
    } else {
      oaiContent = instruction;
    }

    let modelName = 'gpt-4o';
    if (activeAgent === 'deepseek') modelName = 'deepseek-chat';
    if (activeAgent === 'groq') modelName = 'llama3-70b-8192';
    if (activeAgent === 'mistral') modelName = 'mistral-large-latest';

    payload = {
      model: modelName,
      messages: [
        {
          role: 'system',
          content: 'You are an expert UI/UX prompt engineer. Your prompts are hyper-precise and produce pixel-accurate results. Always return valid JSON only — no markdown fences, no preamble, no extra text.'
        },
        {
          role: 'user',
          content: oaiContent
        }
      ]
    };
  }

  try {
    let endpoint;
    const headers = { 'Content-Type': 'application/json' };

    if (mode === 'proxy') {
      endpoint = document.getElementById('proxy-url-inp').value.trim() + '/generate';
      headers['X-Target-Agent'] = activeAgent;
      headers['X-API-Key'] = apiKey;
      if (isLoggedIn && accessToken) {
        headers['Authorization'] = 'Bearer ' + accessToken;
      }
    } else {
      if (activeAgent === 'claude') {
        endpoint = 'https://api.anthropic.com/v1/messages';
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
      } else if (activeAgent === 'gemini') {
        endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
      } else if (activeAgent === 'openai') {
        endpoint = 'https://api.openai.com/v1/chat/completions';
        headers['Authorization'] = 'Bearer ' + apiKey;
      } else if (activeAgent === 'deepseek') {
        endpoint = 'https://api.deepseek.com/chat/completions';
        headers['Authorization'] = 'Bearer ' + apiKey;
      } else if (activeAgent === 'groq') {
        endpoint = 'https://api.groq.com/openai/v1/chat/completions';
        headers['Authorization'] = 'Bearer ' + apiKey;
      } else if (activeAgent === 'mistral') {
        endpoint = 'https://api.mistral.ai/v1/chat/completions';
        headers['Authorization'] = 'Bearer ' + apiKey;
      }
    }

    console.log('Calling endpoint:', endpoint);
    console.log('Headers:', headers);

    let finalBody;
    if (mode === 'proxy') {
      let tokenStr = '';
      if (loadedDesignTokens && loadedDesignTokens.tokens && loadedDesignTokens.tokens.length > 0) {
        tokenStr = loadedDesignTokens.tokens.map(t => `- ${t.name}: ${t.value}`).join('\n');
      }
      let varStr = '';
      if (activeTabVariables && activeTabVariables.variables) {
        const keys = Object.keys(activeTabVariables.variables);
        if (keys.length > 0) {
          varStr = keys.map(k => `- ${k}: ${activeTabVariables.variables[k]}`).join('\n');
        }
      }
      finalBody = JSON.stringify({
        source: "extension",
        framework: fw,
        style: st,
        colors: colors,
        font: font,
        description: desc,
        url: urlVal,
        tokensText: tokenStr,
        variablesText: varStr,
        screenshot: currentTab === 'image' ? imgData : (currentTab === 'url' ? screenshotDataUrl : '')
      });
    } else {
      finalBody = JSON.stringify(payload);
    }

    const res = await fetch(endpoint, { method: 'POST', headers, body: finalBody });
    if (!res.ok) {
      const errorBody = await res.text();
      console.error('API Error Body:', errorBody);
      
      let errorMsg = 'API returned ' + res.status;
      try {
        const errObj = JSON.parse(errorBody);
        if (errObj.error && errObj.error.message) {
          errorMsg = errObj.error.message;
        }
      } catch (e) {
        errorMsg += ' - ' + errorBody;
      }
      
      if (res.status === 503) {
        errorMsg = 'The API is currently experiencing high demand. Please try again later. (Error: ' + errorMsg + ')';
      }
      
      throw new Error(errorMsg);
    }

    const data = await res.json();
    if (mode === 'proxy') {
      renderOutput(data);
      if (isLoggedIn) {
        generationsCount++;
        saveMonetizationToStorage();
        updateQuotaUI();
      }
      return;
    }

    let raw = '';
    if (activeAgent === 'claude') {
      raw = (data.content || []).map(b => b.text || '').join('');
    } else if (activeAgent === 'gemini') {
      try {
        raw = data.candidates[0].content.parts[0].text;
      } catch (e) {
        throw new Error('Failed to parse Gemini response');
      }
    } else {
      try {
        raw = data.choices[0].message.content;
      } catch (e) {
        throw new Error('Failed to parse response from ' + activeAgent);
      }
    }
    let jsonStr = '';
    const codeBlockMatch = raw.match(/```json\s*([\s\S]*?)\s*```/);
    
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    } else {
      const firstBrace = raw.indexOf('{');
      const lastBrace = raw.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = raw.substring(firstBrace, lastBrace + 1);
      }
    }

    if (jsonStr) {
      try {
        const parsed = JSON.parse(jsonStr);
        renderOutput(parsed);
      } catch (e) {
        console.error('JSON parse error:', e);
        console.log('Extracted string was:', jsonStr);
        // Fallback to raw text if JSON fails to parse
        renderOutput({ prompt: raw, accuracy: "~90%", layout: "Unknown", components: "Unknown", tokens: "Medium" });
      }
    } else {
      console.log('Raw string was:', raw);
      // Fallback to raw text if no JSON found
      renderOutput({ prompt: raw, accuracy: "~90%", layout: "Unknown", components: "Unknown", tokens: "Medium" });
    }

    // Increment SaaS freemium counter
    if (isLoggedIn) {
      generationsCount++;
      saveMonetizationToStorage();
      updateQuotaUI();
    }
  } catch (e) {
    showError('Error: ' + (e.message || 'Check your API key and try again.'));
  } finally {
    setLoading(false);
  }
}

function buildInstruction(fw, st, colors, font, desc, urlVal) {
  const inputLine = currentTab === 'url'
    ? `URL reference: ${urlVal}`
    : currentTab === 'image'
      ? `[See attached UI screenshot — analyze and recreate it exactly]`
      : `Input description: "${desc}"`;

  let tokenInstructions = '';
  if (loadedDesignTokens && loadedDesignTokens.tokens && loadedDesignTokens.tokens.length > 0) {
    const list = loadedDesignTokens.tokens.map(t => `- ${t.name}: ${t.value}`).join('\n');
    tokenInstructions = `\n\nStrictly adhere to the following project-specific design system tokens and style variables:\n${list}`;
  }

  let extractedTabInstructions = '';
  if (activeTabVariables && activeTabVariables.variables) {
    const keys = Object.keys(activeTabVariables.variables);
    if (keys.length > 0) {
      const list = keys.map(k => `- ${k}: ${activeTabVariables.variables[k]}`).join('\n');
      extractedTabInstructions = `\n\nAdditionally, enforce alignment with these computed styles extracted from the reference tab:\n${list}`;
    }
  }

  return `You are an expert UI/UX prompt engineer. Transform the following into the most precise, optimized prompt for building an exact UI.

${inputLine}
Target framework: ${fw}
Style direction: ${st}${colors ? `\nColor palette: ${colors}` : ''}${font ? `\nFont family: ${font}` : ''}${tokenInstructions}${extractedTabInstructions}

Write a hyper-detailed, engineer-ready prompt covering:
- Exact layout structure and grid system
- Complete component hierarchy (parent → child)
- Precise spacing values (margins, padding, gaps in px/rem)
- Full color system (background layers, borders, text, accents — with exact hex values)
- Typography scale (font-size, font-weight, line-height, letter-spacing per element)
- Interactive states (hover, focus, active, disabled) with transition specs
- Responsive breakpoints and behavior
- Accessibility roles and aria attributes
- Animation and motion specs
- Specific code patterns and naming conventions for ${fw}

Target accuracy: 99%+. Be hyper-specific. A developer should be able to implement this without any guesswork.

Return ONLY a raw JSON object. No markdown. No backticks. No preamble. Keys:
- prompt: the full detailed prompt (300-450 words)
- accuracy: short string e.g. "98-99%"
- layout: brief layout description, max 5 words
- components: key components, comma-separated, max 5 items
- tokens: one of "low" | "medium" | "high"`;
}

function renderOutput(parsed) {
  lastPrompt = parsed.prompt || '';
  document.getElementById('output-box').textContent = lastPrompt;
  document.getElementById('acc-pill').textContent = parsed.accuracy || '~99% accuracy';
  document.getElementById('bd-layout').textContent = parsed.layout || '—';
  document.getElementById('bd-comp').textContent = parsed.components || '—';
  document.getElementById('bd-tok').textContent = parsed.tokens || '—';

  // Reset feedback buttons state
  const upBtn = document.getElementById('feedback-up');
  const downBtn = document.getElementById('feedback-down');
  if (upBtn) upBtn.className = 'feedback-btn';
  if (downBtn) downBtn.className = 'feedback-btn';

  document.getElementById('output-wrap').classList.add('visible');
  logPromptToHistory(lastPrompt);
}

function setupOutput() {
  document.getElementById('copy-btn').addEventListener('click', () => {
    if (!lastPrompt) return;
    navigator.clipboard.writeText(lastPrompt).then(() => {
      const btn = document.getElementById('copy-btn');
      btn.classList.add('copied');
      btn.textContent = '✓ Copied!';
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="8" height="8" rx="1.5"/><path d="M2 10V2h8"/></svg> Copy';
      }, 2000);
    });
  });

  // Task 5: Dropdown export logic
  const menu = document.getElementById('copy-dropdown-menu');
  const arrowBtn = document.getElementById('copy-dropdown-btn');
  if (arrowBtn && menu) {
    arrowBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !arrowBtn.contains(e.target)) {
        menu.classList.add('hidden');
      }
    });

    menu.querySelectorAll('.copy-opt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!lastPrompt) return;
        const exportType = btn.getAttribute('data-export');
        let formattedPrompt = lastPrompt;

        if (exportType === 'v0') {
          formattedPrompt = `Generate a beautiful V0 component using React, Tailwind CSS, and Lucide icons based on these exact specs:\n\n${lastPrompt}`;
        } else if (exportType === 'cursor') {
          formattedPrompt = `<prompt_forge_design_system>\n${lastPrompt}\n</prompt_forge_design_system>\n\nImplement these exact UI specifications deterministically.`;
        } else if (exportType === 'artifacts') {
          formattedPrompt = `Create a complete, interactive single-file React component using Tailwind CSS in a Claude Artifact adhering strictly to this design specification:\n\n${lastPrompt}`;
        }

        navigator.clipboard.writeText(formattedPrompt).then(() => {
          menu.classList.add('hidden');
          const copyBtn = document.getElementById('copy-btn');
          copyBtn.classList.add('copied');
          copyBtn.textContent = '✓ Exported!';
          setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="8" height="8" rx="1.5"/><path d="M2 10V2h8"/></svg> Copy';
          }, 2000);
        });
      });
    });
  }

  document.getElementById('regen-btn').addEventListener('click', () => {
    document.getElementById('output-wrap').classList.remove('visible');
    generate();
  });

  document.getElementById('refine-btn').addEventListener('click', () => {
    if (lastPrompt) alert('Copy the prompt above and paste it into Claude with: "Please refine this UI prompt to be even more precise for pixel-perfect implementation."');
  });

  // Telemetry Feedback hooks
  const upBtn = document.getElementById('feedback-up');
  const downBtn = document.getElementById('feedback-down');
  if (upBtn && downBtn) {
    upBtn.addEventListener('click', () => {
      if (upBtn.classList.contains('active-up')) {
        upBtn.classList.remove('active-up');
        sendTelemetry('neutral_retracted_up');
      } else {
        upBtn.classList.add('active-up');
        downBtn.classList.remove('active-down');
        sendTelemetry('up');
      }
    });

    downBtn.addEventListener('click', () => {
      if (downBtn.classList.contains('active-down')) {
        downBtn.classList.remove('active-down');
        sendTelemetry('neutral_retracted_down');
      } else {
        downBtn.classList.add('active-down');
        upBtn.classList.remove('active-up');
        sendTelemetry('down');
      }
    });
  }
}

function initSettingsUI() {
  document.getElementById('mode-direct').addEventListener('click', () => setMode('direct'));
  document.getElementById('mode-proxy').addEventListener('click', () => setMode('proxy'));
  document.getElementById('save-btn').addEventListener('click', saveSettings);
  document.getElementById('clear-cache-btn').addEventListener('click', clearCache);

  // Developer mode toggle
  const devToggle = document.getElementById('dev-mode-toggle');
  const devFields = document.getElementById('dev-fields');
  devToggle.addEventListener('click', () => {
    devFields.classList.toggle('hidden');
  });

  // Populate settings elements from variables
  document.getElementById('agent-select').value = activeAgent;
  setMode(mode);
  if (mode === 'proxy') {
    devFields.classList.remove('hidden');
  }
  document.getElementById('proxy-url-inp').value = proxyUrl;
  document.getElementById('supabase-url-inp').value = supabaseUrl;
  document.getElementById('supabase-key-inp').value = supabaseKey;
  document.getElementById('user-id-inp').value = userId;
  document.getElementById('team-id-inp').value = teamId;
  document.getElementById('api-key-inp').value = apiKeys[activeAgent] || '';
}

function saveSettings() {
  const apiKey = document.getElementById('api-key-inp').value.trim();
  apiKeys[activeAgent] = apiKey; // Save key for active agent
  
  proxyUrl = document.getElementById('proxy-url-inp').value.trim();
  supabaseUrl = document.getElementById('supabase-url-inp').value.trim();
  supabaseKey = document.getElementById('supabase-key-inp').value.trim();
  userId = document.getElementById('user-id-inp').value.trim();
  teamId = document.getElementById('team-id-inp').value.trim();

  if (!userId) {
    userId = 'pf-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    document.getElementById('user-id-inp').value = userId;
  }
  
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ apiKeys, activeAgent, mode, proxyUrl, supabaseUrl, supabaseKey, userId, teamId }, () => {
      console.log('Settings saved');
      // Trigger sync
      syncPresetsFromCloud();
      syncHistoryFromCloud();
    });
  }
  
  document.getElementById('settings-panel').classList.remove('open');
}

function clearCache() {
  if (confirm('Are you sure you want to clear all saved API keys?')) {
    apiKeys = { claude: '', gemini: '', openai: '', deepseek: '', groq: '', mistral: '' };
    document.getElementById('api-key-inp').value = '';
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.remove(['apiKeys'], () => {
        alert('Saved keys cleared.');
      });
    }
  }
}

function setMode(m) {
  mode = m;
  document.getElementById('mode-direct').classList.toggle('direct', m === 'direct');
  document.getElementById('mode-proxy').classList.toggle('direct', m === 'proxy');
  document.getElementById('proxy-field').style.display = m === 'proxy' ? 'flex' : 'none';
  const badge = document.getElementById('mode-badge');
  if (badge) {
    badge.textContent = m === 'direct' ? 'Direct API' : 'Java Proxy';
    badge.classList.toggle('direct', m === 'direct');
  }
}

function setupBottomBar() {
  document.getElementById('settings-toggle-btn').addEventListener('click', () => {
    document.getElementById('settings-panel').classList.toggle('open');
  });
}

function setLoading(on) {
  const btn = document.getElementById('gen-btn');
  btn.disabled = on;
  document.getElementById('spinner').style.display = on ? 'block' : 'none';
  document.getElementById('btn-icon').style.display = on ? 'none' : 'inline';
  document.getElementById('btn-txt').textContent = on ? 'Generating...' : 'Generate optimized prompt';
}

function showError(msg) {
  const el = document.getElementById('err-banner');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 5000);
}

function setupAgentSelect() {
  const select = document.getElementById('agent-select');
  select.addEventListener('change', (e) => {
    activeAgent = e.target.value;
    document.getElementById('api-key-inp').value = apiKeys[activeAgent] || '';
  });
}

// Task 6: Workspace Presets Storage & UI Handlers
function initPresetsUI() {
  const linkBtn = document.getElementById('preset-save-link');
  const saveRow = document.getElementById('preset-save-row');
  const nameInp = document.getElementById('preset-name-inp');
  const confirmBtn = document.getElementById('preset-save-confirm');
  const cancelBtn = document.getElementById('preset-save-cancel');
  
  if (linkBtn && saveRow) {
    linkBtn.addEventListener('click', () => {
      if (workspacePresets.length >= 3) {
        alert('Maximum 3 presets allowed. Please delete an existing preset first.');
        return;
      }
      saveRow.classList.remove('hidden');
      nameInp.focus();
    });

    cancelBtn.addEventListener('click', () => {
      saveRow.classList.add('hidden');
      nameInp.value = '';
    });

    confirmBtn.addEventListener('click', () => {
      const name = nameInp.value.trim();
      if (!name) {
        alert('Please enter a preset name.');
        return;
      }
      
      const fw = getSelected('fw-group') || 'React';
      const st = getSelected('st-group') || 'Pixel-perfect';
      const colors = document.getElementById('clr-inp').value.trim();
      const font = document.getElementById('fnt-inp').value.trim();
      
      const shareTeam = document.getElementById('preset-share-team') ? document.getElementById('preset-share-team').checked : false;
      
      const presetObj = {
        id: generateUUID(),
        name: name,
        fw: fw,
        st: st,
        colors: colors,
        font: font,
        team_id: shareTeam ? teamId : ''
      };

      workspacePresets.push(presetObj);
      savePresetsToStorage();
      uploadPresetToCloud(presetObj);
      renderPresets();
      
      if (document.getElementById('preset-share-team')) document.getElementById('preset-share-team').checked = false;
      saveRow.classList.add('hidden');
      nameInp.value = '';
    });
  }

  renderPresets();
}

function savePresetsToStorage() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ workspacePresets }, () => {
      console.log('Presets saved to storage');
    });
  }
}

function renderPresets() {
  const container = document.getElementById('presets-container');
  if (!container) return;

  container.innerHTML = '';
  
  if (workspacePresets.length === 0) {
    container.innerHTML = '<span class="empty-presets" id="empty-presets-msg">No presets saved. Configure above to save loadouts.</span>';
    return;
  }

  workspacePresets.forEach(p => {
    const pill = document.createElement('div');
    pill.className = 'preset-pill';
    pill.title = `Load: ${p.fw} · ${p.st}${p.font ? ' · ' + p.font : ''}`;
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'preset-pill-name';
    nameSpan.textContent = (p.team_id ? '👥 ' : '') + p.name;
    
    const delBtn = document.createElement('button');
    delBtn.className = 'preset-pill-del';
    delBtn.title = 'Delete preset';
    delBtn.textContent = '✕';
    
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      workspacePresets = workspacePresets.filter(item => item.id !== p.id);
      savePresetsToStorage();
      deletePresetFromCloud(p.id);
      renderPresets();
    });
    
    pill.appendChild(nameSpan);
    pill.appendChild(delBtn);
    
    pill.addEventListener('click', () => {
      loadPreset(p);
    });
    
    container.appendChild(pill);
  });
}

function loadPreset(p) {
  const fwGroup = document.getElementById('fw-group');
  if (fwGroup && p.fw) {
    fwGroup.querySelectorAll('.pill').forEach(btn => {
      if (btn.textContent.trim() === p.fw) {
        selectPill(btn, 'fw-group');
      }
    });
  }
  
  const stGroup = document.getElementById('st-group');
  if (stGroup && p.st) {
    stGroup.querySelectorAll('.pill').forEach(btn => {
      if (btn.textContent.trim() === p.st) {
        selectPill(btn, 'st-group');
      }
    });
  }
  
  const clrInp = document.getElementById('clr-inp');
  const nativePicker = document.getElementById('native-color-picker');
  if (clrInp) {
    clrInp.value = p.colors || '';
    if (p.colors && /^#[0-9A-F]{6}$/i.test(p.colors.split(',')[0].trim())) {
      const firstHex = p.colors.split(',')[0].trim();
      if (nativePicker) {
        nativePicker.value = firstHex;
        nativePicker.parentElement.style.borderColor = firstHex;
      }
    } else if (nativePicker) {
      nativePicker.parentElement.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    }
  }
  
  const fntInp = document.getElementById('fnt-inp');
  if (fntInp) {
    fntInp.value = p.font || '';
  }
  
  const msg = document.createElement('div');
  msg.style.position = 'absolute';
  msg.style.top = '10px';
  msg.style.left = '50%';
  msg.style.transform = 'translateX(-50%)';
  msg.style.background = 'var(--green)';
  msg.style.color = '#000';
  msg.style.padding = '4px 12px';
  msg.style.borderRadius = '20px';
  msg.style.fontSize = '11px';
  msg.style.fontWeight = '600';
  msg.style.zIndex = '1000';
  msg.textContent = `Loaded preset: ${p.name}`;
  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), 1500);
}

function sendTelemetry(satisfaction) {
  if (!lastPrompt) return;
  const fw = getSelected('fw-group') || 'React';
  const st = getSelected('st-group') || 'Pixel-perfect';
  const font = document.getElementById('fnt-inp').value.trim();
  
  const telemetryData = {
    promptLength: lastPrompt.length,
    agent: activeAgent,
    framework: fw,
    style: st,
    font: font,
    satisfaction: satisfaction,
    timestamp: Date.now()
  };

  console.log('Telemetry feedback event captured:', telemetryData);

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['telemetryLog'], (result) => {
      const log = result.telemetryLog || [];
      log.push(telemetryData);
      chrome.storage.local.set({ telemetryLog: log }, () => {
        console.log('Telemetry saved to local storage log. Total entries:', log.length);
      });
    });
  }

  if (mode === 'proxy') {
    proxyUrl = document.getElementById('proxy-url-inp').value.trim() || 'http://localhost:8080';
    fetch(`${proxyUrl}/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(telemetryData)
    })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP status ${res.status}`);
      return res.json();
    })
    .then(data => console.log('Proxy telemetry ingestion success:', data))
    .catch(err => console.warn('Proxy telemetry ingestion offline/failed:', err));
  }
}

// Category 4: Design Token Constraints Ingestion
function initDesignTokensUI() {
  const textInput = document.getElementById('token-text-input');
  const clearBtn = document.getElementById('token-clear-btn');

  if (textInput) {
    textInput.addEventListener('input', () => {
      rawTokensText = textInput.value;
      processRawTokensText();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      rawTokensText = '';
      if (textInput) textInput.value = '';
      loadedDesignTokens = null;
      saveDesignTokensToStorage();
      renderDesignTokensState();
    });
  }

  if (textInput && rawTokensText) {
    textInput.value = rawTokensText;
    processRawTokensText();
  } else {
    renderDesignTokensState();
  }
}

function processRawTokensText() {
  let tokens = [];
  const text = rawTokensText.trim();
  if (!text) {
    loadedDesignTokens = null;
    saveDesignTokensToStorage();
    renderDesignTokensState();
    return;
  }

  try {
    if (text.startsWith('{')) {
      const json = JSON.parse(text);
      tokens = parseJsonTokens(json);
    } else {
      tokens = parseCssTokens(text);
    }

    loadedDesignTokens = {
      filename: 'Pasted Tokens',
      tokens: tokens
    };
  } catch (e) {
    loadedDesignTokens = null;
  }

  saveDesignTokensToStorage();
  renderDesignTokensState();
}

function saveDesignTokensToStorage() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ loadedDesignTokens, rawTokensText }, () => {
      console.log('Design tokens saved to local storage');
    });
  } else {
    localStorage.setItem('rawTokensText', rawTokensText);
    localStorage.setItem('loadedDesignTokens', JSON.stringify(loadedDesignTokens));
  }
}

function renderDesignTokensState() {
  const statusLbl = document.getElementById('token-status-lbl');
  if (!statusLbl) return;

  if (loadedDesignTokens && loadedDesignTokens.tokens && loadedDesignTokens.tokens.length > 0) {
    statusLbl.textContent = `${loadedDesignTokens.tokens.length} design tokens parsed`;
    statusLbl.style.color = '#34D399';
  } else {
    statusLbl.textContent = 'No design tokens parsed';
    statusLbl.style.color = '';
  }
}

function parseJsonTokens(obj, prefix = '') {
  let tokens = [];
  for (let key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    const val = obj[key];
    const newPrefix = prefix ? `${prefix}.${key}` : key;
    if (val !== null && typeof val === 'object') {
      if (val.hasOwnProperty('value') && (typeof val.value === 'string' || typeof val.value === 'number')) {
        tokens.push({ name: newPrefix, value: val.value });
      } else {
        tokens = tokens.concat(parseJsonTokens(val, newPrefix));
      }
    } else if (typeof val === 'string' || typeof val === 'number') {
      tokens.push({ name: newPrefix, value: val });
    }
  }
  return tokens;
}

function parseCssTokens(cssText) {
  const tokens = [];
  const regex = /--([a-zA-Z0-9_-]+)\s*:\s*([^;]+)/g;
  let match;
  while ((match = regex.exec(cssText)) !== null) {
    tokens.push({
      name: `--${match[1].trim()}`,
      value: match[2].trim()
    });
  }
  return tokens;
}

// Category 2: Saved / Prompt History Drawer implementation
function initHistoryUI() {
  const toggleBtn = document.getElementById('history-toggle-btn');
  const drawer = document.getElementById('history-drawer');
  const closeBtn = document.getElementById('history-close-btn');
  const clearAllBtn = document.getElementById('history-clear-all');

  if (toggleBtn && drawer) {
    toggleBtn.addEventListener('click', () => {
      drawer.classList.toggle('open');
      renderHistory();
    });
  }

  if (closeBtn && drawer) {
    closeBtn.addEventListener('click', () => {
      drawer.classList.remove('open');
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear your prompt history?')) {
        historyLog = [];
        saveHistoryToStorage();
        clearAllHistoryFromCloud();
        renderHistory();
      }
    });
  }

  renderHistory();
}

function logPromptToHistory(promptText) {
  if (!promptText) return;
  
  if (historyLog.length > 0 && historyLog[0].prompt === promptText) {
    return;
  }

  const fw = getSelected('fw-group') || 'React';
  const st = getSelected('st-group') || 'Pixel-perfect';
  const colors = document.getElementById('clr-inp').value.trim();
  const font = document.getElementById('fnt-inp').value.trim();

  const historyObj = {
    id: generateUUID(),
    prompt: promptText,
    fw: fw,
    st: st,
    colors: colors,
    font: font,
    timestamp: Date.now(),
    starred: false
  };

  historyLog.unshift(historyObj);

  if (historyLog.length > 30) {
    historyLog = historyLog.slice(0, 30);
  }

  saveHistoryToStorage();
  uploadHistoryToCloud(historyObj);
}

function saveHistoryToStorage() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ historyLog }, () => {
      console.log('History saved to local storage');
    });
  }
}

function renderHistory() {
  const container = document.getElementById('history-list');
  if (!container) return;

  const clearBtn = document.getElementById('history-clear-all');
  if (clearBtn) {
    if (historyLog.length > 0) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }
  }

  container.innerHTML = '';

  if (historyLog.length === 0) {
    container.innerHTML = '<div class="empty-history" id="history-empty-msg">No prompt history found. Try generating above!</div>';
    return;
  }

  const sorted = [...historyLog].sort((a, b) => (b.starred ? 1 : 0) - (a.starred ? 1 : 0));

  sorted.forEach(item => {
    const card = document.createElement('div');
    card.className = `history-card${item.starred ? ' starred' : ''}`;

    const header = document.createElement('div');
    header.className = 'history-card-header';

    const timeSpan = document.createElement('span');
    timeSpan.className = 'history-card-time';
    timeSpan.textContent = formatRelativeTime(item.timestamp);

    const tagsDiv = document.createElement('div');
    tagsDiv.className = 'history-card-tags';

    if (item.fw) {
      const tag = document.createElement('span');
      tag.className = 'history-card-tag';
      tag.textContent = item.fw;
      tagsDiv.appendChild(tag);
    }
    if (item.st) {
      const tag = document.createElement('span');
      tag.className = 'history-card-tag';
      tag.textContent = item.st;
      tagsDiv.appendChild(tag);
    }

    header.appendChild(timeSpan);
    header.appendChild(tagsDiv);

    const body = document.createElement('div');
    body.className = 'history-card-body';
    body.textContent = item.prompt;

    const actions = document.createElement('div');
    actions.className = 'history-card-actions';

    const starBtn = document.createElement('button');
    starBtn.className = `hist-act-btn star${item.starred ? ' active' : ''}`;
    starBtn.innerHTML = item.starred ? '★ Starred' : '☆ Star';
    starBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleStarHistoryItem(item.id);
    });

    const copyBtn = document.createElement('button');
    copyBtn.className = 'hist-act-btn';
    copyBtn.textContent = 'Copy';
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(item.prompt).then(() => {
        copyBtn.textContent = '✓';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1000);
      });
    });

    const restoreBtn = document.createElement('button');
    restoreBtn.className = 'hist-act-btn restore';
    restoreBtn.textContent = 'Restore';
    restoreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      restoreHistoryItem(item);
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'hist-act-btn delete';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteHistoryItem(item.id);
    });

    actions.appendChild(starBtn);
    actions.appendChild(copyBtn);
    actions.appendChild(restoreBtn);
    actions.appendChild(delBtn);

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(actions);

    container.appendChild(card);
  });
}

function toggleStarHistoryItem(id) {
  let starredState = false;
  historyLog = historyLog.map(item => {
    if (item.id === id) {
      starredState = !item.starred;
      return { ...item, starred: starredState };
    }
    return item;
  });
  saveHistoryToStorage();
  toggleStarHistoryItemInCloud(id, starredState);
  renderHistory();
}

function deleteHistoryItem(id) {
  historyLog = historyLog.filter(item => item.id !== id);
  saveHistoryToStorage();
  deleteHistoryItemFromCloud(id);
  renderHistory();
}

function restoreHistoryItem(item) {
  lastPrompt = item.prompt;
  document.getElementById('output-box').textContent = lastPrompt;
  document.getElementById('output-wrap').classList.add('visible');

  const fwGroup = document.getElementById('fw-group');
  if (fwGroup && item.fw) {
    fwGroup.querySelectorAll('.pill').forEach(btn => {
      if (btn.textContent.trim() === item.fw) {
        selectPill(btn, 'fw-group');
      }
    });
  }

  const stGroup = document.getElementById('st-group');
  if (stGroup && item.st) {
    stGroup.querySelectorAll('.pill').forEach(btn => {
      if (btn.textContent.trim() === item.st) {
        selectPill(btn, 'st-group');
      }
    });
  }

  const clrInp = document.getElementById('clr-inp');
  const nativePicker = document.getElementById('native-color-picker');
  if (clrInp) {
    clrInp.value = item.colors || '';
    if (item.colors && /^#[0-9A-F]{6}$/i.test(item.colors.split(',')[0].trim())) {
      const firstHex = item.colors.split(',')[0].trim();
      if (nativePicker) {
        nativePicker.value = firstHex;
        nativePicker.parentElement.style.borderColor = firstHex;
      }
    } else if (nativePicker) {
      nativePicker.parentElement.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    }
  }

  const fntInp = document.getElementById('fnt-inp');
  if (fntInp) {
    fntInp.value = item.font || '';
  }

  document.getElementById('history-drawer').classList.remove('open');

  const msg = document.createElement('div');
  msg.style.position = 'absolute';
  msg.style.top = '10px';
  msg.style.left = '50%';
  msg.style.transform = 'translateX(-50%)';
  msg.style.background = 'var(--green)';
  msg.style.color = '#000';
  msg.style.padding = '4px 12px';
  msg.style.borderRadius = '20px';
  msg.style.fontSize = '11px';
  msg.style.fontWeight = '600';
  msg.style.zIndex = '10000';
  msg.textContent = 'Prompt restored!';
  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), 1500);
}

function formatRelativeTime(epoch) {
  const diff = Date.now() - epoch;
  if (diff < 60000) return 'Just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(epoch).toLocaleDateString();
}

// Supabase REST client synchronization helpers
function getSupabaseHeaders() {
  const token = (isLoggedIn && accessToken) ? accessToken : supabaseKey;
  return {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
}

async function syncPresetsFromCloud() {
  if (!supabaseUrl || !supabaseKey || !userId) return;
  try {
    let queryUrl = `${supabaseUrl}/rest/v1/workspace_presets?user_id=eq.${userId}&select=*`;
    if (teamId) {
      queryUrl = `${supabaseUrl}/rest/v1/workspace_presets?or=(user_id.eq.${userId},team_id.eq.${teamId})&select=*`;
    }
    
    const res = await fetch(queryUrl, {
      headers: getSupabaseHeaders()
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && Array.isArray(data)) {
      workspacePresets = data.map(d => ({
        id: d.id,
        name: d.name,
        fw: d.fw,
        st: d.st,
        colors: d.colors,
        font: d.font,
        team_id: d.team_id
      }));
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ workspacePresets });
      }
      renderPresets();
      console.log('Sync cloud presets count:', workspacePresets.length);
    }
  } catch (e) {
    console.warn('Supabase sync presets offline:', e.message);
  }
}

async function uploadPresetToCloud(preset) {
  if (!supabaseUrl || !supabaseKey || !userId) return;
  try {
    const payload = {
      id: preset.id,
      user_id: userId,
      name: preset.name,
      fw: preset.fw,
      st: preset.st,
      colors: preset.colors,
      font: preset.font,
      team_id: preset.team_id || ''
    };
    await fetch(`${supabaseUrl}/rest/v1/workspace_presets`, {
      method: 'POST',
      headers: {
        ...getSupabaseHeaders(),
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.warn('Supabase upload preset error:', e.message);
  }
}

async function deletePresetFromCloud(presetId) {
  if (!supabaseUrl || !supabaseKey || !userId) return;
  try {
    await fetch(`${supabaseUrl}/rest/v1/workspace_presets?id=eq.${presetId}`, {
      method: 'DELETE',
      headers: getSupabaseHeaders()
    });
  } catch (e) {
    console.warn('Supabase delete preset error:', e.message);
  }
}

async function syncHistoryFromCloud() {
  if (!supabaseUrl || !supabaseKey || !userId) return;
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/prompt_history?user_id=eq.${userId}&select=*&order=created_at.desc`, {
      headers: getSupabaseHeaders()
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && Array.isArray(data)) {
      historyLog = data.map(d => ({
        id: d.id,
        prompt: d.prompt,
        fw: d.fw,
        st: d.st,
        colors: d.colors,
        font: d.font,
        timestamp: new Date(d.created_at).getTime(),
        starred: d.starred
      }));
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ historyLog });
      }
      renderHistory();
      console.log('Sync cloud history logs count:', historyLog.length);
    }
  } catch (e) {
    console.warn('Supabase sync history offline:', e.message);
  }
}

async function uploadHistoryToCloud(item) {
  if (!supabaseUrl || !supabaseKey || !userId) return;
  try {
    const payload = {
      id: item.id,
      user_id: userId,
      prompt: item.prompt,
      fw: item.fw,
      st: item.st,
      colors: item.colors,
      font: item.font,
      starred: item.starred
    };
    await fetch(`${supabaseUrl}/rest/v1/prompt_history`, {
      method: 'POST',
      headers: {
        ...getSupabaseHeaders(),
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.warn('Supabase upload history error:', e.message);
  }
}

async function toggleStarHistoryItemInCloud(id, starred) {
  if (!supabaseUrl || !supabaseKey || !userId) return;
  try {
    await fetch(`${supabaseUrl}/rest/v1/prompt_history?id=eq.${id}`, {
      method: 'PATCH',
      headers: getSupabaseHeaders(),
      body: JSON.stringify({ starred })
    });
  } catch (e) {
    console.warn('Supabase toggle star error:', e.message);
  }
}

async function deleteHistoryItemFromCloud(id) {
  if (!supabaseUrl || !supabaseKey || !userId) return;
  try {
    await fetch(`${supabaseUrl}/rest/v1/prompt_history?id=eq.${id}`, {
      method: 'DELETE',
      headers: getSupabaseHeaders()
    });
  } catch (e) {
    console.warn('Supabase delete history error:', e.message);
  }
}

async function clearAllHistoryFromCloud() {
  if (!supabaseUrl || !supabaseKey || !userId) return;
  try {
    await fetch(`${supabaseUrl}/rest/v1/prompt_history?user_id=eq.${userId}`, {
      method: 'DELETE',
      headers: getSupabaseHeaders()
    });
  } catch (e) {
    console.warn('Supabase clear history error:', e.message);
  }
}

// Category A: Onboarding & Stripe Paywall Controllers
function initMonetizationUI() {
  const loginGoogle = document.getElementById('btn-login-google');
  const loginGithub = document.getElementById('btn-login-github');
  const logoutBtn = document.getElementById('btn-logout');
  const upgradeBtn = document.getElementById('btn-upgrade-stripe');
  
  const emailLoginBtn = document.getElementById('btn-email-login');
  const emailSignupBtn = document.getElementById('btn-email-signup');

  if (loginGoogle) {
    loginGoogle.addEventListener('click', () => handleOAuthLogin('google'));
  }
  if (loginGithub) {
    loginGithub.addEventListener('click', () => handleOAuthLogin('github'));
  }
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  if (upgradeBtn) {
    upgradeBtn.addEventListener('click', handleUpgradeStripe);
  }
  
  if (emailLoginBtn) {
    emailLoginBtn.addEventListener('click', handleEmailLogin);
  }
  if (emailSignupBtn) {
    emailSignupBtn.addEventListener('click', handleEmailSignup);
  }

  updateQuotaUI();
}

function saveMonetizationToStorage() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ isLoggedIn, accountTier, generationsCount, userEmail, accessToken, refreshToken });
  } else {
    localStorage.setItem('isLoggedIn', isLoggedIn);
    localStorage.setItem('accountTier', accountTier);
    localStorage.setItem('generationsCount', generationsCount);
    localStorage.setItem('userEmail', userEmail);
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }
}

function updateQuotaUI() {
  const loggedOut = document.getElementById('account-logged-out');
  const loggedIn = document.getElementById('account-logged-in');
  
  if (!loggedOut || !loggedIn) return;

  if (isLoggedIn) {
    loggedOut.classList.add('hidden');
    loggedIn.classList.remove('hidden');

    document.getElementById('user-email').textContent = userEmail;
    document.getElementById('user-tier').textContent = accountTier + ' Tier';
    
    // Set avatar if present or show initials
    const avatar = document.getElementById('user-avatar');
    if (avatar) {
      avatar.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${userEmail}`;
      avatar.style.display = 'block';
    }

    // Update quota indicator
    const quotaLabel = document.getElementById('quota-label');
    const quotaFill = document.getElementById('quota-fill');
    
    if (accountTier === 'pro') {
      quotaLabel.textContent = 'Unlimited runs';
      quotaFill.style.width = '100%';
      quotaFill.className = 'quota-bar-fill'; // Clear warning states
      document.getElementById('btn-upgrade-stripe').style.display = 'none';
      document.getElementById('user-tier').style.color = '#34D399'; // Green Pro color
    } else {
      quotaLabel.textContent = `${generationsCount} / 10 runs`;
      const pct = Math.min((generationsCount / 10) * 100, 100);
      quotaFill.style.width = `${pct}%`;
      
      // Dynamic colors based on usage severity
      quotaFill.className = 'quota-bar-fill';
      if (generationsCount >= 9) {
        quotaFill.classList.add('danger');
      } else if (generationsCount >= 6) {
        quotaFill.classList.add('warning');
      }

      document.getElementById('btn-upgrade-stripe').style.display = 'block';
      document.getElementById('user-tier').style.color = 'var(--accent)';
    }

    // Enforce CTA disable/enable
    const genBtn = document.getElementById('gen-btn');
    if (genBtn) {
      if (accountTier === 'free' && generationsCount >= 10) {
        genBtn.disabled = true;
        const txt = genBtn.querySelector('#btn-txt') || genBtn;
        txt.textContent = 'Quota Exceeded - Upgrade to Pro';
        genBtn.style.background = 'rgba(239, 68, 68, 0.2)';
        genBtn.style.color = '#EF4444';
      } else {
        genBtn.disabled = false;
        const txt = genBtn.querySelector('#btn-txt') || genBtn;
        if (txt.textContent.includes('Quota')) {
          txt.textContent = 'Generate optimized prompt';
        }
        genBtn.style.background = '';
        genBtn.style.color = '';
      }
    }
  } else {
    loggedOut.classList.remove('hidden');
    loggedIn.classList.add('hidden');
    
    // Enable button by default if logged out (falls back to local API key requirement)
    const genBtn = document.getElementById('gen-btn');
    if (genBtn) {
      genBtn.disabled = false;
      const txt = genBtn.querySelector('#btn-txt') || genBtn;
      if (txt.textContent.includes('Quota')) {
        txt.textContent = 'Generate optimized prompt';
      }
      genBtn.style.background = '';
      genBtn.style.color = '';
    }
  }
}

function showToast(text, isSuccess = true) {
  const msg = document.createElement('div');
  msg.style.position = 'absolute';
  msg.style.top = '10px';
  msg.style.left = '50%';
  msg.style.transform = 'translateX(-50%)';
  msg.style.background = isSuccess ? '#34D399' : '#EF4444';
  msg.style.color = '#000';
  msg.style.padding = '5px 14px';
  msg.style.borderRadius = '20px';
  msg.style.fontSize = '11px';
  msg.style.fontWeight = '700';
  msg.style.zIndex = '10000';
  msg.textContent = text;
  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), 2500);
}

async function handleEmailLogin() {
  const emailInp = document.getElementById('auth-email-inp');
  const passInp = document.getElementById('auth-password-inp');
  const email = emailInp ? emailInp.value.trim() : '';
  const password = passInp ? passInp.value.trim() : '';

  if (!email || !password) {
    showError('Please enter both email and password.');
    return;
  }

  try {
    const loginBtn = document.getElementById('btn-email-login');
    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing In...';

    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error_description || errData.msg || errData.message || 'Login failed.');
    }

    const data = await response.json();
    
    accessToken = data.access_token;
    refreshToken = data.refresh_token;
    isLoggedIn = true;
    userEmail = data.user.email;
    userId = data.user.id;
    
    accountTier = data.user.user_metadata && data.user.user_metadata.account_tier ? data.user.user_metadata.account_tier : 'free';
    
    saveMonetizationToStorage();
    updateQuotaUI();
    
    if (emailInp) emailInp.value = '';
    if (passInp) passInp.value = '';

    syncPresetsFromCloud();
    syncHistoryFromCloud();

    showToast(`Welcome back, ${userEmail}!`, true);
  } catch (err) {
    showError('Authentication failed: ' + err.message);
  } finally {
    const loginBtn = document.getElementById('btn-email-login');
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Sign In';
    }
  }
}

async function handleEmailSignup() {
  const emailInp = document.getElementById('auth-email-inp');
  const passInp = document.getElementById('auth-password-inp');
  const email = emailInp ? emailInp.value.trim() : '';
  const password = passInp ? passInp.value.trim() : '';

  if (!email || !password) {
    showError('Please enter both email and password.');
    return;
  }
  
  if (password.length < 6) {
    showError('Password must be at least 6 characters.');
    return;
  }

  try {
    const signupBtn = document.getElementById('btn-email-signup');
    signupBtn.disabled = true;
    signupBtn.textContent = 'Signing Up...';

    const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.msg || errData.message || 'Signup failed.');
    }

    const data = await response.json();
    
    if (data.identities && data.identities.length === 0) {
      showError('This email is already registered.');
      return;
    }

    showToast('Sign up successful! Check your email to confirm registration.', true);
    
    if (passInp) passInp.value = '';
  } catch (err) {
    showError('Signup failed: ' + err.message);
  } finally {
    const signupBtn = document.getElementById('btn-email-signup');
    if (signupBtn) {
      signupBtn.disabled = false;
      signupBtn.textContent = 'Sign Up';
    }
  }
}

async function handleOAuthLogin(provider) {
  if (typeof chrome === 'undefined' || !chrome.identity || !chrome.identity.launchWebAuthFlow) {
    showError('OAuth web auth flow is only available inside Chrome Extension environment.');
    return;
  }

  try {
    const redirectUrl = chrome.identity.getRedirectURL();
    const authUrl = `${supabaseUrl}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectUrl)}`;

    console.log(`Launching web auth flow for ${provider} pointing to: ${authUrl}`);

    chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true
    }, function (responseUrl) {
      if (chrome.runtime.lastError) {
        showError('OAuth failed: ' + chrome.runtime.lastError.message);
        return;
      }

      if (!responseUrl) {
        showError('OAuth failed. Received empty response URL.');
        return;
      }

      try {
        const parsedUrl = new URL(responseUrl.replace('#', '?'));
        const token = parsedUrl.searchParams.get('access_token');
        const rToken = parsedUrl.searchParams.get('refresh_token');

        if (!token) {
          showError('Authentication failed: Access token missing.');
          return;
        }

        const payload = JSON.parse(atob(token.split('.')[1]));
        
        accessToken = token;
        refreshToken = rToken || '';
        isLoggedIn = true;
        userEmail = payload.email || `${provider}-user@promptforge.dev`;
        userId = payload.sub || '';
        
        accountTier = payload.user_metadata && payload.user_metadata.account_tier ? payload.user_metadata.account_tier : 'free';

        saveMonetizationToStorage();
        updateQuotaUI();

        syncPresetsFromCloud();
        syncHistoryFromCloud();

        showToast(`Logged in via ${provider}!`, true);
      } catch (err) {
        showError('Failed parsing auth token: ' + err.message);
      }
    });
  } catch (e) {
    showError('Failed initiating OAuth: ' + e.message);
  }
}

function handleLogout() {
  isLoggedIn = false;
  accountTier = 'free';
  generationsCount = 0;
  userEmail = '';
  accessToken = '';
  refreshToken = '';
  saveMonetizationToStorage();
  updateQuotaUI();
  showToast('Logged out successfully.', true);
}

function handleUpgradeStripe() {
  console.log('Initiating mock Stripe checkout session redirect...');
  const upgradeBtn = document.getElementById('btn-upgrade-stripe');
  upgradeBtn.textContent = 'Connecting Stripe...';
  
  setTimeout(() => {
    // Simulating successful Stripe subscription callback
    accountTier = 'pro';
    saveMonetizationToStorage();
    updateQuotaUI();
    
    // Display premium billing upgrade success message
    const msg = document.createElement('div');
    msg.style.position = 'absolute';
    msg.style.top = '10px';
    msg.style.left = '50%';
    msg.style.transform = 'translateX(-50%)';
    msg.style.background = '#34D399';
    msg.style.color = '#000';
    msg.style.padding = '5px 14px';
    msg.style.borderRadius = '20px';
    msg.style.fontSize = '11.5px';
    msg.style.fontWeight = '700';
    msg.style.zIndex = '10000';
    msg.textContent = '⚡ Upgraded to PRO successfully!';
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 2500);
  }, 1000);
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

document.addEventListener('DOMContentLoaded', init);
