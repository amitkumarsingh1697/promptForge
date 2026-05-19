// Main Figma Sandbox execution script
figma.showUI(__html__, { width: 360, height: 580, themeColors: true });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'extract-selection') {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
      figma.ui.postMessage({ type: 'selection-result', error: 'Please select a frame or node layer in your Figma canvas.' });
      return;
    }

    try {
      const rootNode = selection[0];
      const parsedData = extractFigmaNode(rootNode);
      figma.ui.postMessage({ type: 'selection-result', data: parsedData });
    } catch (err) {
      figma.ui.postMessage({ type: 'selection-result', error: 'Extraction failed: ' + err.message });
    }
  }
};

function extractFigmaNode(node) {
  const info = {
    id: node.id,
    name: node.name,
    type: node.type,
    width: Math.round(node.width || 0),
    height: Math.round(node.height || 0),
    fills: parseSolidColors(node.fills),
    strokes: parseSolidColors(node.strokes),
    cornerRadius: node.cornerRadius || 0,
    children: []
  };

  // Extract layout/padding details if layout mode is active (Auto Layout)
  if (node.layoutMode && node.layoutMode !== 'NONE') {
    info.layoutMode = node.layoutMode;
    info.paddingLeft = node.paddingLeft || 0;
    info.paddingRight = node.paddingRight || 0;
    info.paddingTop = node.paddingTop || 0;
    info.paddingBottom = node.paddingBottom || 0;
    info.itemSpacing = node.itemSpacing || 0;
  }

  // Extract text and font configurations
  if (node.type === 'TEXT') {
    info.textValue = node.characters;
    if (node.fontSize !== figma.mixed) {
      info.fontSize = node.fontSize;
    }
    if (node.fontName !== figma.mixed && node.fontName) {
      info.fontFamily = node.fontName.family;
      info.fontWeight = node.fontName.style;
    }
  }

  // Recurse into children layers
  if ('children' in node) {
    node.children.forEach(child => {
      // Ignore hidden layers
      if (child.visible) {
        info.children.push(extractFigmaNode(child));
      }
    });
  }

  return info;
}

function parseSolidColors(fills) {
  if (!fills || fills === figma.mixed || fills.length === 0) return [];
  const colors = [];
  fills.forEach(f => {
    if (f.type === 'SOLID' && f.visible) {
      const hex = rgbToHex(f.color.r, f.color.g, f.color.b);
      colors.push(hex);
    }
  });
  return colors;
}

function rgbToHex(r, g, b) {
  const convert = c => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return '#' + convert(r) + convert(g) + convert(b);
}
