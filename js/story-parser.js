// Story parser for story.md
// Pure functions, works in browser and Node.js

export function parseStory(markdown) {
  const lines = markdown.split('\n');
  const result = {
    meta: {},
    nodes: {},
    errors: []
  };

  let currentNode = null;
  let inFrontMatter = false;
  let frontMatterLines = [];
  let textLines = [];
  let lineNum = 0;

  for (let i = 0; i < lines.length; i++) {
    lineNum = i + 1;
    const line = lines[i];
    const trimmed = line.trim();

    // Skip HTML comments
    if (trimmed.startsWith('<!--')) continue;
    if (trimmed.endsWith('-->')) continue;
    if (trimmed.includes('<!--') && trimmed.includes('-->')) continue;

    // Front matter
    if (trimmed === '---') {
      if (i === 0) {
        inFrontMatter = true;
        continue;
      } else if (inFrontMatter) {
        inFrontMatter = false;
        result.meta = parseFrontMatter(frontMatterLines);
        continue;
      }
    }

    if (inFrontMatter) {
      frontMatterLines.push(line);
      continue;
    }

    // Node header: ## node-id | Title
    if (trimmed.startsWith('## ')) {
      // Save previous node
      if (currentNode) {
        finalizeNode(currentNode, textLines, result);
      }

      const headerMatch = trimmed.match(/^##\s+([a-z0-9-]+)\s*\|\s*(.+)$/);
      if (!headerMatch) {
        result.errors.push({
          line: lineNum,
          message: `Invalid node header format. Expected: ## node-id | Title`
        });
        continue;
      }

      const [, id, title] = headerMatch;
      currentNode = {
        id,
        title: title.trim(),
        metadata: {},
        text: '',
        lineNum
      };
      textLines = [];
      continue;
    }

    if (!currentNode) continue;

    // Metadata lines (key: value) before first blank line
    if (!currentNode.text && trimmed && !trimmed.startsWith('?') &&
        !trimmed.startsWith('next:') && !trimmed.startsWith('end:') &&
        !trimmed.startsWith('A:') && !trimmed.startsWith('B:')) {

      const metaMatch = line.match(/^([a-z]+):\s*(.*)$/);
      if (metaMatch) {
        const [, key, value] = metaMatch;
        currentNode.metadata[key] = value.trim();
        continue;
      }
    }

    // Question block
    if (trimmed.startsWith('? ')) {
      currentNode.question = trimmed.substring(2).trim();
      currentNode.options = {};
      continue;
    }

    // Options
    if (trimmed.startsWith('A: ')) {
      const optMatch = trimmed.match(/^A:\s*(.+?)\s*=>\s*([a-z0-9-]+)$/);
      if (optMatch) {
        currentNode.options.A = { label: optMatch[1].trim(), target: optMatch[2].trim() };
      } else {
        result.errors.push({ line: lineNum, message: 'Invalid option A format. Expected: A: Label => target-id' });
      }
      continue;
    }

    if (trimmed.startsWith('B: ')) {
      const optMatch = trimmed.match(/^B:\s*(.+?)\s*=>\s*([a-z0-9-]+)$/);
      if (optMatch) {
        currentNode.options.B = { label: optMatch[1].trim(), target: optMatch[2].trim() };
      } else {
        result.errors.push({ line: lineNum, message: 'Invalid option B format. Expected: B: Label => target-id' });
      }
      continue;
    }

    // Next line
    if (trimmed.startsWith('next: ')) {
      currentNode.next = trimmed.substring(6).trim();
      continue;
    }

    // End line
    if (trimmed.startsWith('end: ')) {
      currentNode.end = trimmed.substring(5).trim() === 'true';
      continue;
    }

    // Story text
    textLines.push(line);
  }

  // Save last node
  if (currentNode) {
    finalizeNode(currentNode, textLines, result);
  }

  // Validate structure
  validateStory(result);

  return result;
}

function parseFrontMatter(lines) {
  const meta = {};
  for (const line of lines) {
    const match = line.match(/^([a-z]+):\s*(.*)$/);
    if (match) {
      meta[match[1]] = match[2].trim();
    }
  }
  return meta;
}

function finalizeNode(node, textLines, result) {
  // Extract text until first blank line after metadata
  let textStart = 0;
  for (let i = 0; i < textLines.length; i++) {
    if (textLines[i].trim() !== '') {
      textStart = i;
      break;
    }
  }

  // Find where text ends (before question/next/end)
  let textEnd = textLines.length;
  for (let i = textStart; i < textLines.length; i++) {
    const trimmed = textLines[i].trim();
    if (trimmed.startsWith('?') || trimmed.startsWith('next:') ||
        trimmed.startsWith('end:') || trimmed.startsWith('A:') || trimmed.startsWith('B:')) {
      textEnd = i;
      break;
    }
  }

  node.text = textLines.slice(textStart, textEnd).join('\n').trim();

  // Add to result
  if (result.nodes[node.id]) {
    result.errors.push({
      line: node.lineNum,
      message: `Duplicate node id: ${node.id}`
    });
  }
  result.nodes[node.id] = node;
}

function validateStory(result) {
  const { meta, nodes, errors } = result;

  // Check required meta
  if (!meta.title) errors.push({ line: 1, message: 'Missing required front matter: title' });
  if (!meta.start) errors.push({ line: 1, message: 'Missing required front matter: start' });

  // Check start node exists
  if (meta.start && !nodes[meta.start]) {
    errors.push({ line: 1, message: `Start node "${meta.start}" not found` });
  }

  // Validate each node
  for (const [id, node] of Object.entries(nodes)) {
    const hasQuestion = node.question && node.options;
    const hasNext = node.next;
    const hasEnd = node.end;

    const actionCount = [hasQuestion, hasNext, hasEnd].filter(Boolean).length;

    if (actionCount === 0) {
      errors.push({ line: node.lineNum, message: `Node "${id}" has no question, next, or end` });
    } else if (actionCount > 1) {
      errors.push({ line: node.lineNum, message: `Node "${id}" has multiple actions (question/next/end)` });
    }

    // Validate question has exactly 2 options
    if (hasQuestion) {
      if (!node.options.A || !node.options.B) {
        errors.push({ line: node.lineNum, message: `Node "${id}" question must have exactly options A and B` });
      }
    }

    // Check targets exist
    if (node.options?.A?.target && !nodes[node.options.A.target]) {
      errors.push({ line: node.lineNum, message: `Node "${id}" option A target "${node.options.A.target}" not found` });
    }
    if (node.options?.B?.target && !nodes[node.options.B.target]) {
      errors.push({ line: node.lineNum, message: `Node "${id}" option B target "${node.options.B.target}" not found` });
    }
    if (node.next && !nodes[node.next]) {
      errors.push({ line: node.lineNum, message: `Node "${id}" next target "${node.next}" not found` });
    }
  }

  // Find unreachable nodes
  const reachable = new Set();
  const visited = new Set();

  function visit(nodeId) {
    if (!nodeId || visited.has(nodeId) || !nodes[nodeId]) return;
    visited.add(nodeId);
    reachable.add(nodeId);

    const node = nodes[nodeId];
    if (node.options?.A?.target) visit(node.options.A.target);
    if (node.options?.B?.target) visit(node.options.B.target);
    if (node.next) visit(node.next);
  }

  if (meta.start) {
    visit(meta.start);
  }

  for (const id of Object.keys(nodes)) {
    if (!reachable.has(id)) {
      errors.push({ line: nodes[id].lineNum, message: `Node "${id}" is unreachable from start` });
    }
  }
}

export function renderMarkdown(text) {
  if (!text) return '';

  // Simple markdown renderer for bold and italic
  let html = text;

  // **bold**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // *italic*
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Paragraphs
  html = html.split('\n\n').map(p => `<p>${p.trim()}</p>`).join('');

  return html;
}

// For Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parseStory, renderMarkdown };
}
