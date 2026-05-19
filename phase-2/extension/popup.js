'use strict';

let currentTab = 'text';
let imgData = null;
let imgMime = null;
let mode = 'direct';
let lastPrompt = '';
let activeAgent = 'claude';
let apiKeys = { claude: '', gemini: '', openai: '', deepseek: '', groq: '', mistral: '' };
let workspacePresets = [];
let loadedDesignTokens = null;

function init() {
  setupTabs();
  setupPills();
  setupColorPicker();
  setupImageUpload();
  setupRte();
  setupGenerate();
  setupOutput();
  setupSettings();
  setupBottomBar();
  setupAgentSelect();
  setupPresets();
  setupDesignTokens();
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
  if (!apiKey) { document.getElementById('settings-panel').classList.add('open'); showError('Add your API key in Settings first.'); return; }

  setLoading(true);
  document.getElementById('output-wrap').classList.remove('visible');

  const instruction = buildInstruction(fw, st, colors, font, desc, urlVal);
  
  let screenshotDataUrl;
  if (currentTab === 'url') {
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      showError('Extension API not available. Please load PromptForge as an unpacked extension in Chrome (chrome://extensions).');
      setLoading(false);
      return;
    }
    try {
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
      console.error('Failed to capture screenshot:', e);
      showError('Failed to capture tab screenshot. Make sure you are on the active tab.');
      setLoading(false);
      return;
    }
  }

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

    const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(payload) });
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

  return `You are an expert UI/UX prompt engineer. Transform the following into the most precise, optimized prompt for building an exact UI.

${inputLine}
Target framework: ${fw}
Style direction: ${st}${colors ? `\nColor palette: ${colors}` : ''}${font ? `\nFont family: ${font}` : ''}${tokenInstructions}

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

function setupSettings() {
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

  // Load settings
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['apiKeys', 'activeAgent', 'mode', 'proxyUrl'], (result) => {
      if (result.apiKeys) apiKeys = result.apiKeys;
      if (result.activeAgent) {
        activeAgent = result.activeAgent;
        document.getElementById('agent-select').value = activeAgent;
      }
      if (result.mode) {
        setMode(result.mode);
        if (result.mode === 'proxy') {
          devFields.classList.remove('hidden');
        }
      }
      if (result.proxyUrl) document.getElementById('proxy-url-inp').value = result.proxyUrl;
      
      // Set initial API key value
      document.getElementById('api-key-inp').value = apiKeys[activeAgent] || '';
    });
  }
}

function saveSettings() {
  const apiKey = document.getElementById('api-key-inp').value.trim();
  apiKeys[activeAgent] = apiKey; // Save key for active agent
  
  const proxyUrl = document.getElementById('proxy-url-inp').value.trim();
  
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ apiKeys, activeAgent, mode, proxyUrl }, () => {
      console.log('Settings saved');
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
function setupPresets() {
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
      
      const presetObj = {
        id: Date.now().toString(),
        name: name,
        fw: fw,
        st: st,
        colors: colors,
        font: font
      };

      workspacePresets.push(presetObj);
      savePresetsToStorage();
      renderPresets();
      
      saveRow.classList.add('hidden');
      nameInp.value = '';
    });
  }

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['workspacePresets'], (result) => {
      if (result.workspacePresets && Array.isArray(result.workspacePresets)) {
        workspacePresets = result.workspacePresets;
        renderPresets();
      }
    });
  }
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
    nameSpan.textContent = p.name;
    
    const delBtn = document.createElement('button');
    delBtn.className = 'preset-pill-del';
    delBtn.title = 'Delete preset';
    delBtn.textContent = '✕';
    
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      workspacePresets = workspacePresets.filter(item => item.id !== p.id);
      savePresetsToStorage();
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
    const proxyUrl = document.getElementById('proxy-url-inp').value.trim() || 'http://localhost:8080';
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
function setupDesignTokens() {
  const uploadLink = document.getElementById('token-upload-link');
  const fileInput = document.getElementById('token-file-input');
  const clearBtn = document.getElementById('token-clear-btn');

  if (uploadLink && fileInput) {
    uploadLink.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target.result;
        let tokens = [];
        try {
          if (file.name.endsWith('.json')) {
            const json = JSON.parse(text);
            tokens = parseJsonTokens(json);
          } else if (file.name.endsWith('.css')) {
            tokens = parseCssTokens(text);
          } else {
            alert('Unsupported file format. Please upload a .json or .css design token file.');
            return;
          }

          if (tokens.length === 0) {
            alert('No valid design tokens found in the file.');
            return;
          }

          loadedDesignTokens = {
            filename: file.name,
            tokens: tokens
          };

          saveDesignTokensToStorage();
          renderDesignTokensState();
        } catch (err) {
          alert('Error parsing design token file: ' + err.message);
        }
      };
      reader.readAsText(file);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      loadedDesignTokens = null;
      saveDesignTokensToStorage();
      renderDesignTokensState();
      if (fileInput) fileInput.value = '';
    });
  }

  // Load from local storage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['loadedDesignTokens'], (result) => {
      if (result.loadedDesignTokens) {
        loadedDesignTokens = result.loadedDesignTokens;
        renderDesignTokensState();
      }
    });
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

function saveDesignTokensToStorage() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ loadedDesignTokens }, () => {
      console.log('Design tokens saved to local storage');
    });
  }
}

function renderDesignTokensState() {
  const row = document.getElementById('token-status-row');
  const emptyMsg = document.getElementById('token-empty-msg');
  const nameSpan = document.getElementById('token-status-name');
  const detailsSpan = document.getElementById('token-status-details');

  if (!row || !emptyMsg) return;

  if (loadedDesignTokens && loadedDesignTokens.tokens && loadedDesignTokens.tokens.length > 0) {
    nameSpan.textContent = loadedDesignTokens.filename;
    detailsSpan.textContent = `${loadedDesignTokens.tokens.length} design tokens loaded`;
    row.classList.remove('hidden');
    emptyMsg.classList.add('hidden');
  } else {
    row.classList.add('hidden');
    emptyMsg.classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', init);
