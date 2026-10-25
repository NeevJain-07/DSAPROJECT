/**
 * Virtual File System (VFS) - Data Structures Web Simulation
 * Replicating the C core (N-ary Tree with LCRS representation, Stack, and FIFO Queue).
 */

(function () {
  'use strict';

  // =========================================================================
  // DATA STRUCTURE DEFINITIONS (Mirroring C Structs in vfs.h)
  // =========================================================================

  let nodeCounter = 0;

  class FSNode {
    /**
     * @param {string} name 
     * @param {'dir' | 'file'} type 
     * @param {FSNode | null} parent 
     */
    constructor(name, type, parent = null) {
      this.id = ++nodeCounter;
      this.name = name;
      this.type = type; // 'dir' or 'file'
      this.content = type === 'file' ? '' : null;
      this.size = 0;
      this.createdAt = new Date();

      // Pointers (Left-Child Right-Sibling representation)
      this.parent = parent;
      this.firstChild = null;
      this.nextSibling = null;
    }
  }

  // Linked-List Stack Node
  class StackNode {
    constructor(node, next = null) {
      this.node = node;
      this.next = next;
    }
  }

  class PathStack {
    constructor() {
      this.top = null;
      this.size = 0;
    }

    push(node) {
      this.top = new StackNode(node, this.top);
      this.size++;
    }

    pop() {
      if (!this.top) return null;
      const popped = this.top.node;
      this.top = this.top.next;
      this.size--;
      return popped;
    }

    peek() {
      return this.top ? this.top.node : null;
    }

    isEmpty() {
      return this.size === 0;
    }

    toArray() {
      const arr = [];
      let curr = this.top;
      while (curr) {
        arr.push(curr.node);
        curr = curr.next;
      }
      return arr;
    }
  }

  // FIFO Queue
  class ActivityQueue {
    constructor(capacity = 20) {
      this.items = [];
      this.capacity = capacity;
    }

    enqueue(action) {
      const entry = {
        id: Date.now() + Math.random(),
        action: action,
        time: new Date()
      };
      this.items.push(entry);
      if (this.items.length > this.capacity) {
        this.items.shift();
      }
    }

    getAll() {
      return [...this.items];
    }
  }

  // =========================================================================
  // VIRTUAL FILE SYSTEM ENGINE (Matching C functions in vfs.c)
  // =========================================================================

  class VirtualFileSystem {
    constructor() {
      this.root = new FSNode('/', 'dir', null);
      this.current = this.root;
      this.activityQueue = new ActivityQueue(20);
      this.activityQueue.enqueue("Initialized Virtual File System (Root created)");
    }

    // Helper: Find child in sibling chain of parent
    findImmediateChild(parent, name) {
      if (!parent || parent.type !== 'dir') return null;
      let curr = parent.firstChild;
      while (curr) {
        if (curr.name === name) return curr;
        curr = curr.nextSibling;
      }
      return null;
    }

    // Helper: Append child to sibling list
    appendChild(parent, child) {
      child.parent = parent;
      child.nextSibling = null;

      if (!parent.firstChild) {
        parent.firstChild = child;
      } else {
        let curr = parent.firstChild;
        while (curr.nextSibling) {
          curr = curr.nextSibling;
        }
        curr.nextSibling = child;
      }
    }

    // Tree Operation: mkdir
    mkdir(name) {
      if (!name || name.trim() === '') return { success: false, error: "Directory name cannot be empty." };
      name = name.trim();

      if (this.findImmediateChild(this.current, name)) {
        return { success: false, error: `Directory or file '${name}' already exists.` };
      }

      const newDir = new FSNode(name, 'dir', this.current);
      this.appendChild(this.current, newDir);
      this.activityQueue.enqueue(`mkdir: Created directory '${name}'`);
      return { success: true, node: newDir };
    }

    // Tree Operation: touch
    touch(name, initialContent = '') {
      if (!name || name.trim() === '') return { success: false, error: "File name cannot be empty." };
      name = name.trim();

      const existing = this.findImmediateChild(this.current, name);
      if (existing) {
        if (existing.type !== 'file') {
          return { success: false, error: `'${name}' already exists as a directory.` };
        }
        existing.content = initialContent || existing.content;
        existing.size = new TextEncoder().encode(existing.content).length;
        return { success: true, node: existing, updated: true };
      }

      const newFile = new FSNode(name, 'file', this.current);
      newFile.content = initialContent;
      newFile.size = new TextEncoder().encode(initialContent).length;
      this.appendChild(this.current, newFile);

      this.activityQueue.enqueue(`touch: Created file '${name}' (${newFile.size} B)`);
      return { success: true, node: newFile };
    }

    // File Operation: write
    write(name, newContent) {
      const node = this.findImmediateChild(this.current, name);
      if (!node) return { success: false, error: `File '${name}' not found.` };
      if (node.type !== 'file') return { success: false, error: `'${name}' is a directory.` };

      node.content = newContent;
      node.size = new TextEncoder().encode(newContent).length;
      this.activityQueue.enqueue(`write: Updated file '${name}' (${node.size} B)`);
      return { success: true, node: node };
    }

    // File Operation: cat
    cat(name) {
      const node = this.findImmediateChild(this.current, name);
      if (!node) return { success: false, error: `File '${name}' not found.` };
      if (node.type !== 'file') return { success: false, error: `'${name}' is a directory.` };
      return { success: true, content: node.content };
    }

    // Tree Operation: rm (recursive deletion)
    rm(name) {
      const parent = this.current;
      let curr = parent.firstChild;
      let prev = null;

      while (curr) {
        if (curr.name === name) {
          if (!prev) {
            parent.firstChild = curr.nextSibling;
          } else {
            prev.nextSibling = curr.nextSibling;
          }
          curr.nextSibling = null;
          this.activityQueue.enqueue(`rm: Removed '${name}' (${curr.type})`);
          return { success: true, removed: curr };
        }
        prev = curr;
        curr = curr.nextSibling;
      }
      return { success: false, error: `No such file or directory '${name}'.` };
    }

    // Path resolution using Stack: pwd
    pwd() {
      if (this.current === this.root) return '/';

      const stack = new PathStack();
      let curr = this.current;

      while (curr && curr !== this.root) {
        stack.push(curr);
        curr = curr.parent;
      }

      let path = '';
      while (!stack.isEmpty()) {
        const n = stack.pop();
        path += '/' + n.name;
      }
      return path;
    }

    // Path resolution: cd
    cd(path) {
      if (!path || path === '/' || path === '~') {
        this.current = this.root;
        return { success: true, current: this.current };
      }

      if (path === '.') return { success: true, current: this.current };

      if (path === '..') {
        if (this.current.parent) {
          this.current = this.current.parent;
        }
        return { success: true, current: this.current };
      }

      const tokens = path.split('/').filter(t => t.length > 0);
      let target = path.startsWith('/') ? this.root : this.current;

      for (const token of tokens) {
        if (token === '.') continue;
        if (token === '..') {
          if (target.parent) target = target.parent;
        } else {
          const child = this.findImmediateChild(target, token);
          if (!child) {
            return { success: false, error: `Directory '${token}' does not exist.` };
          }
          if (child.type !== 'dir') {
            return { success: false, error: `'${token}' is not a directory.` };
          }
          target = child;
        }
      }

      this.current = target;
      return { success: true, current: this.current };
    }

    // List directory
    ls() {
      const items = [];
      let curr = this.current.firstChild;
      while (curr) {
        items.push(curr);
        curr = curr.nextSibling;
      }
      return items;
    }

    // Recursive search (DFS)
    find(name) {
      const results = [];
      const dfs = (node, currentPath) => {
        if (!node) return;
        const nodePath = currentPath === '/' ? `/${node.name}` : `${currentPath}/${node.name}`;
        if (node.name.toLowerCase().includes(name.toLowerCase())) {
          results.push({ node, path: nodePath });
        }
        let child = node.firstChild;
        while (child) {
          dfs(child, node === this.root ? '' : nodePath);
          child = child.nextSibling;
        }
      };

      let child = this.root.firstChild;
      while (child) {
        dfs(child, '/');
        child = child.nextSibling;
      }
      return results;
    }

    // Recursive Pre-order tree hierarchy for console
    getTreeText() {
      const lines = ['.'];
      const build = (node, depth, isLast, prefix) => {
        if (!node) return;
        const branch = isLast ? '└── ' : '├── ';
        lines.push(`${prefix}${branch}${node.type === 'dir' ? node.name + '/' : node.name}`);

        if (node.type === 'dir' && node.firstChild) {
          const newPrefix = prefix + (isLast ? '    ' : '│   ');
          let child = node.firstChild;
          while (child) {
            const childIsLast = child.nextSibling === null;
            build(child, depth + 1, childIsLast, newPrefix);
            child = child.nextSibling;
          }
        }
      };

      let child = this.root.firstChild;
      while (child) {
        const isLast = child.nextSibling === null;
        build(child, 1, isLast, '');
        child = child.nextSibling;
      }

      return lines.join('\n');
    }

    // Total nodes and estimated memory footprint
    getMetrics() {
      let count = 0;
      let totalSize = 0;
      const traverse = (node) => {
        if (!node) return;
        count++;
        totalSize += 64 + (node.size || 0); // node struct + buffer
        let child = node.firstChild;
        while (child) {
          traverse(child);
          child = child.nextSibling;
        }
      };
      traverse(this.root);
      return { count, totalSize };
    }
  }

  // =========================================================================
  // APPLICATION CONTROLLER & UI BINDINGS
  // =========================================================================

  const vfs = new VirtualFileSystem();
  let terminalHistory = [];
  let historyIndex = -1;
  let activeEditingFile = null;

  // DOM Elements
  const terminalOutput = document.getElementById('terminal-output');
  const terminalInput = document.getElementById('terminal-input');
  const termPromptPath = document.getElementById('term-prompt-path');
  const explorerFilesContainer = document.getElementById('explorer-files-container');
  const breadcrumbItems = document.getElementById('breadcrumb-items');
  const explorerItemCount = document.getElementById('explorer-item-count');
  const explorerCurrentPathText = document.getElementById('explorer-current-path-text');
  const statNodesCount = document.getElementById('stat-nodes-count');
  const statMemorySize = document.getElementById('stat-memory-size');

  // Visualizer Tab Elements
  const treeCanvasWrapper = document.getElementById('tree-canvas-wrapper');
  const stackContainer = document.getElementById('stack-container');
  const queueContainer = document.getElementById('queue-container');

  // Modals
  const modalFileViewer = document.getElementById('modal-file-viewer');
  const modalFileName = document.getElementById('modal-file-name');
  const modalFileSize = document.getElementById('modal-file-size');
  const modalFileCreated = document.getElementById('modal-file-created');
  const modalFileEditor = document.getElementById('modal-file-editor');
  const btnCloseFileModal = document.getElementById('btn-close-file-modal');
  const btnCancelEdit = document.getElementById('btn-cancel-edit');
  const btnSaveFile = document.getElementById('btn-save-file');

  const modalCreateItem = document.getElementById('modal-create-item');
  const modalCreateTitle = document.getElementById('modal-create-title');
  const createItemLabel = document.getElementById('create-item-label');
  const createItemName = document.getElementById('create-item-name');
  const createFileContentGroup = document.getElementById('create-file-content-group');
  const createItemContent = document.getElementById('create-item-content');
  const btnCloseCreateModal = document.getElementById('btn-close-create-modal');
  const btnCancelCreate = document.getElementById('btn-cancel-create');
  const btnConfirmCreate = document.getElementById('btn-confirm-create');
  let pendingCreateType = 'dir';

  const modalGuide = document.getElementById('modal-guide');
  const btnGuideModal = document.getElementById('btn-guide-modal');
  const btnCloseGuideModal = document.getElementById('btn-close-guide-modal');
  const btnCloseGuideFooter = document.getElementById('btn-close-guide-footer');

  // Seed sample initial data
  function seedInitialData() {
    vfs.mkdir('home');
    vfs.mkdir('etc');
    vfs.mkdir('bin');
    vfs.touch('README.txt', 'Welcome to the C Virtual File System Project!\nThis project demonstrates an N-ary Tree, Stack, and Queue in C.');

    vfs.cd('home');
    vfs.mkdir('student');
    vfs.cd('student');
    vfs.touch('notes.txt', '1. Data Structures in C\n2. Tree: Left-Child Right-Sibling\n3. Stack: Path navigation\n4. Queue: Activity log');
    vfs.mkdir('projects');
    vfs.cd('projects');
    vfs.touch('main.c', '#include <stdio.h>\n\nint main() {\n    printf("Hello from VFS!\\n");\n    return 0;\n}');
    vfs.cd('/');
  }

  // =========================================================================
  // UI RENDERERS
  // =========================================================================

  function renderAll() {
    renderExplorer();
    renderBreadcrumbs();
    renderVisualizerTree();
    renderVisualizerStack();
    renderVisualizerQueue();
    updateHeaderStats();
    termPromptPath.textContent = vfs.pwd();
  }

  function updateHeaderStats() {
    const metrics = vfs.getMetrics();
    statNodesCount.textContent = metrics.count;
    statMemorySize.textContent = `${metrics.totalSize} B`;
    explorerCurrentPathText.textContent = vfs.pwd();
  }

  function renderBreadcrumbs() {
    breadcrumbItems.innerHTML = '';
    const currentPath = vfs.pwd();

    // Root breadcrumb
    const rootItem = document.createElement('span');
    rootItem.className = 'breadcrumb-item';
    rootItem.textContent = '/';
    rootItem.onclick = () => {
      vfs.cd('/');
      renderAll();
    };
    breadcrumbItems.appendChild(rootItem);

    if (currentPath === '/') return;

    const parts = currentPath.split('/').filter(p => p.length > 0);
    let accum = '';

    parts.forEach((part) => {
      accum += '/' + part;
      const targetPath = accum;

      const sep = document.createElement('span');
      sep.className = 'breadcrumb-separator';
      sep.textContent = '/';
      breadcrumbItems.appendChild(sep);

      const item = document.createElement('span');
      item.className = 'breadcrumb-item';
      item.textContent = part;
      item.onclick = () => {
        vfs.cd(targetPath);
        renderAll();
      };
      breadcrumbItems.appendChild(item);
    });
  }

  function renderExplorer() {
    explorerFilesContainer.innerHTML = '';
    const items = vfs.ls();
    explorerItemCount.textContent = `${items.length} item${items.length === 1 ? '' : 's'}`;

    if (items.length === 0) {
      explorerFilesContainer.innerHTML = `
        <div class="explorer-empty">
          <p>Empty Directory</p>
          <span style="font-size:0.75rem; color:var(--text-muted);">Use <code>mkdir</code> or <code>touch</code> to create items</span>
        </div>
      `;
      return;
    }

    items.forEach(node => {
      const itemEl = document.createElement('div');
      itemEl.className = 'explorer-item';

      const isDir = node.type === 'dir';
      const iconSvg = isDir
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;

      itemEl.innerHTML = `
        <div class="explorer-item-left">
          <div class="item-icon ${isDir ? 'folder-icon' : 'file-icon'}">
            ${iconSvg}
          </div>
          <div class="item-details">
            <span class="item-name">${escapeHtml(node.name)}</span>
            <span class="item-subtext">${isDir ? 'Directory' : `${node.size} bytes`}</span>
          </div>
        </div>
        <div class="explorer-item-actions">
          <button class="item-action-btn btn-delete-item" title="Delete (rm)" data-name="${escapeHtml(node.name)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;

      // Item click handler
      itemEl.addEventListener('click', (e) => {
        if (e.target.closest('.item-action-btn')) return;
        if (isDir) {
          vfs.cd(node.name);
          renderAll();
        } else {
          openFileModal(node);
        }
      });

      // Delete action handler
      const deleteBtn = itemEl.querySelector('.btn-delete-item');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        vfs.rm(node.name);
        printTermLine(`rm: removed '${node.name}'`, 'term-info');
        renderAll();
      });

      explorerFilesContainer.appendChild(itemEl);
    });
  }

  // Visualizer Tab 1: N-ary Tree Nodes
  function renderVisualizerTree() {
    treeCanvasWrapper.innerHTML = '';

    const nodesList = [];
    const traverse = (node, depth) => {
      if (!node) return;
      nodesList.push({ node, depth });
      let child = node.firstChild;
      while (child) {
        traverse(child, depth + 1);
        child = child.nextSibling;
      }
    };

    traverse(vfs.root, 0);

    nodesList.forEach(({ node, depth }) => {
      const card = document.createElement('div');
      const isCurrentDir = node === vfs.current;
      card.className = `tree-vnode ${node.type === 'file' ? 'type-file' : 'type-dir'} ${isCurrentDir ? 'is-current' : ''}`;
      card.style.setProperty('--depth', depth);

      const firstChildName = node.firstChild ? node.firstChild.name : 'NULL';
      const nextSiblingName = node.nextSibling ? node.nextSibling.name : 'NULL';

      card.innerHTML = `
        <div class="tree-vnode-header">
          <span class="tree-vnode-name">${depth === 0 ? '/' : node.name} ${isCurrentDir ? '👈 (current)' : ''}</span>
          <span class="tree-vnode-tag">${node.type.toUpperCase()}</span>
        </div>
        <div class="tree-vnode-pointers">
          <span>firstChild &rarr; <span class="ptr-highlight">${escapeHtml(firstChildName)}</span></span>
          <span>nextSibling &rarr; <span class="ptr-highlight">${escapeHtml(nextSiblingName)}</span></span>
        </div>
      `;

      card.onclick = () => {
        if (node.type === 'dir') {
          vfs.current = node;
          renderAll();
        } else {
          openFileModal(node);
        }
      };

      treeCanvasWrapper.appendChild(card);
    });
  }

  // Visualizer Tab 2: Path Stack
  function renderVisualizerStack() {
    stackContainer.innerHTML = '';

    const stack = new PathStack();
    let curr = vfs.current;
    while (curr) {
      stack.push(curr);
      curr = curr.parent;
    }

    const frames = stack.toArray();
    if (frames.length === 0) {
      stackContainer.innerHTML = '<span style="color:var(--text-muted);font-size:0.8rem;">Stack is empty</span>';
      return;
    }

    frames.forEach((node, idx) => {
      const isTop = idx === 0;
      const el = document.createElement('div');
      el.className = `stack-frame ${isTop ? 'stack-top' : ''}`;
      el.innerHTML = `
        <div>
          <span>[${frames.length - 1 - idx}] Node: <strong>${escapeHtml(node.name)}</strong></span>
          <span style="color:var(--text-muted);font-size:0.7rem;display:block;">ptr: &FSNode@${node.id}</span>
        </div>
        ${isTop ? '<span class="stack-badge-top">TOP OF STACK</span>' : ''}
      `;
      stackContainer.appendChild(el);
    });
  }

  // Visualizer Tab 3: Activity Queue
  function renderVisualizerQueue() {
    queueContainer.innerHTML = '';
    const items = vfs.activityQueue.getAll().slice().reverse();

    if (items.length === 0) {
      queueContainer.innerHTML = '<span style="color:var(--text-muted);font-size:0.8rem;">Queue is empty</span>';
      return;
    }

    items.forEach((item, idx) => {
      const timeStr = item.time.toTimeString().split(' ')[0];
      const el = document.createElement('div');
      el.className = 'queue-item-card';
      el.innerHTML = `
        <div>
          <span style="color:var(--accent-cyan);font-weight:600;">[${items.length - idx}]</span>
          <span>${escapeHtml(item.action)}</span>
        </div>
        <div>
          <span class="queue-tag">${timeStr}</span>
        </div>
      `;
      queueContainer.appendChild(el);
    });
  }

  // =========================================================================
  // TERMINAL SHELL SIMULATOR
  // =========================================================================

  function printTermLine(text, className = '') {
    const line = document.createElement('div');
    line.className = `term-line ${className}`;
    line.textContent = text;
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  function printTermHtml(html, className = '') {
    const line = document.createElement('div');
    line.className = `term-line ${className}`;
    line.innerHTML = html;
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  function printWelcomeBanner() {
    printTermHtml(`
      <div class="term-banner">
=================================================================
  VIRTUAL FILE SYSTEM (VFS) - C DATA STRUCTURES ENGINE
=================================================================
 Data Structures Active:
  1. N-ary Tree (Left-Child Right-Sibling Pointer Hierarchy)
  2. PathStack (LIFO Stack for 'pwd' and 'cd ..' resolution)
  3. ActivityQueue (FIFO Queue for operation history)
=================================================================
Type 'help' to see all shell commands or try the quick buttons below.
      </div>
    `);
  }

  function executeCommand(rawInput) {
    const trimmed = rawInput.trim();
    if (!trimmed) return;

    terminalHistory.push(trimmed);
    historyIndex = terminalHistory.length;

    // Echo command
    printTermHtml(
      `<span class="term-prompt-inline">vfs-user@dsa-c</span>:<span class="term-path-inline">${escapeHtml(vfs.pwd())}</span>$ <span class="term-cmd-entry">${escapeHtml(trimmed)}</span>`
    );

    const parts = trimmed.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    const cleanParts = parts.map(p => p.replace(/^"|"$/g, ''));
    const cmd = cleanParts[0].toLowerCase();
    const args = cleanParts.slice(1);

    switch (cmd) {
      case 'help':
        printTermHtml(`
<span class="term-info">Available Commands:</span>
  <strong>ls [-l]</strong>                List files and directories
  <strong>cd &lt;path&gt;</strong>              Change directory ('..', '/', 'folder')
  <strong>pwd</strong>                    Print working directory (via PathStack)
  <strong>mkdir &lt;name&gt;</strong>           Create a directory
  <strong>touch &lt;name&gt; [text]</strong>    Create a file with optional content
  <strong>cat &lt;name&gt;</strong>             Read file content
  <strong>write &lt;name&gt; &lt;text&gt;</strong>    Update file content
  <strong>rm &lt;name&gt;</strong>              Delete file or directory recursively
  <strong>tree</strong>                   Visual ASCII tree hierarchy (DFS)
  <strong>find &lt;query&gt;</strong>            Search file system recursively (DFS)
  <strong>history</strong>                Show recent operations (ActivityQueue)
  <strong>clear</strong>                  Clear the terminal screen
  <strong>help</strong>                   Show this help menu
        `);
        break;

      case 'clear':
        terminalOutput.innerHTML = '';
        break;

      case 'pwd':
        printTermLine(vfs.pwd(), 'term-success');
        break;

      case 'ls': {
        const isDetailed = args.includes('-l');
        const items = vfs.ls();
        if (items.length === 0) {
          printTermLine('(empty directory)', 'term-info');
        } else if (isDetailed) {
          items.forEach(item => {
            const timeStr = item.createdAt.toLocaleDateString() + ' ' + item.createdAt.toLocaleTimeString();
            const tag = item.type === 'dir' ? '[DIR] ' : '[FILE]';
            printTermLine(`${tag.padEnd(7)} ${item.name.padEnd(16)} ${(item.size + ' B').padStart(8)}  ${timeStr}`);
          });
        } else {
          const listStr = items.map(item => item.type === 'dir' ? item.name + '/' : item.name).join('   ');
          printTermLine(listStr, 'term-success');
        }
        break;
      }

      case 'cd': {
        const path = args[0] || '/';
        const res = vfs.cd(path);
        if (!res.success) {
          printTermLine(`cd: ${res.error}`, 'term-error');
        }
        break;
      }

      case 'mkdir': {
        if (args.length === 0) {
          printTermLine('Usage: mkdir <directory_name>', 'term-error');
        } else {
          const res = vfs.mkdir(args[0]);
          if (!res.success) {
            printTermLine(`mkdir: ${res.error}`, 'term-error');
          } else {
            printTermLine(`Created directory '${args[0]}'`, 'term-success');
          }
        }
        break;
      }

      case 'touch': {
        if (args.length === 0) {
          printTermLine('Usage: touch <filename> [content]', 'term-error');
        } else {
          const fileName = args[0];
          const content = args.slice(1).join(' ');
          const res = vfs.touch(fileName, content);
          if (!res.success) {
            printTermLine(`touch: ${res.error}`, 'term-error');
          } else {
            printTermLine(`Created file '${fileName}' (${res.node.size} B)`, 'term-success');
          }
        }
        break;
      }

      case 'cat': {
        if (args.length === 0) {
          printTermLine('Usage: cat <filename>', 'term-error');
        } else {
          const res = vfs.cat(args[0]);
          if (!res.success) {
            printTermLine(`cat: ${res.error}`, 'term-error');
          } else {
            printTermLine(res.content || '(empty file)', 'term-info');
          }
        }
        break;
      }

      case 'write': {
        if (args.length < 2) {
          printTermLine('Usage: write <filename> <content>', 'term-error');
        } else {
          const fileName = args[0];
          const content = args.slice(1).join(' ');
          const res = vfs.write(fileName, content);
          if (!res.success) {
            printTermLine(`write: ${res.error}`, 'term-error');
          } else {
            printTermLine(`Updated '${fileName}' (${res.node.size} B)`, 'term-success');
          }
        }
        break;
      }

      case 'rm': {
        if (args.length === 0) {
          printTermLine('Usage: rm <target_name>', 'term-error');
        } else {
          const res = vfs.rm(args[0]);
          if (!res.success) {
            printTermLine(`rm: ${res.error}`, 'term-error');
          } else {
            printTermLine(`Removed '${args[0]}'`, 'term-info');
          }
        }
        break;
      }

      case 'tree': {
        const treeStr = vfs.getTreeText();
        printTermLine(treeStr, 'term-tree-line');
        break;
      }

      case 'find': {
        if (args.length === 0) {
          printTermLine('Usage: find <name>', 'term-error');
        } else {
          const matches = vfs.find(args[0]);
          if (matches.length === 0) {
            printTermLine(`find: No items matching '${args[0]}'`, 'term-info');
          } else {
            matches.forEach(m => {
              printTermLine(`Found: ${m.path} [${m.node.type.toUpperCase()}]`, 'term-success');
            });
          }
        }
        break;
      }

      case 'history': {
        const hist = vfs.activityQueue.getAll();
        printTermLine('--- Activity Queue FIFO History ---', 'term-info');
        hist.forEach((h, i) => {
          const timeStr = h.time.toTimeString().split(' ')[0];
          printTermLine(`[${i + 1}] ${timeStr} -> ${h.action}`);
        });
        break;
      }

      default:
        printTermLine(`vfs: command not found: ${cmd}. Type 'help' for available commands.`, 'term-error');
        break;
    }

    renderAll();
  }

  // =========================================================================
  // MODAL HANDLERS
  // =========================================================================

  function openFileModal(node) {
    activeEditingFile = node;
    modalFileName.textContent = node.name;
    modalFileSize.textContent = `${node.size} bytes`;
    modalFileCreated.textContent = `Created: ${node.createdAt.toLocaleTimeString()}`;
    modalFileEditor.value = node.content || '';
    modalFileViewer.classList.add('show');
    modalFileEditor.focus();
  }

  function closeFileModal() {
    modalFileViewer.classList.remove('show');
    activeEditingFile = null;
  }

  function openCreateModal(type) {
    pendingCreateType = type;
    modalCreateTitle.textContent = type === 'dir' ? 'Create New Directory (mkdir)' : 'Create New File (touch)';
    createItemLabel.textContent = type === 'dir' ? 'Directory Name:' : 'File Name:';
    createItemName.value = '';
    createItemContent.value = '';
    createFileContentGroup.style.display = type === 'file' ? 'block' : 'none';
    modalCreateItem.classList.add('show');
    createItemName.focus();
  }

  function closeCreateModal() {
    modalCreateItem.classList.remove('show');
  }

  function openGuideModal() {
    modalGuide.classList.add('show');
  }

  function closeGuideModal() {
    modalGuide.classList.remove('show');
  }

  // =========================================================================
  // EVENT LISTENERS
  // =========================================================================

  // Terminal Input Keyboard Navigation
  terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = terminalInput.value;
      terminalInput.value = '';
      executeCommand(val);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (terminalHistory.length > 0 && historyIndex > 0) {
        historyIndex--;
        terminalInput.value = terminalHistory[historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < terminalHistory.length - 1) {
        historyIndex++;
        terminalInput.value = terminalHistory[historyIndex];
      } else {
        historyIndex = terminalHistory.length;
        terminalInput.value = '';
      }
    }
  });

  // Quick Command Chips
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const cmd = chip.getAttribute('data-cmd');
      executeCommand(cmd);
    });
  });

  // Terminal Small Buttons
  document.getElementById('btn-term-clear').addEventListener('click', () => {
    executeCommand('clear');
  });

  document.getElementById('btn-term-help').addEventListener('click', () => {
    executeCommand('help');
  });

  // Explorer Top Action Buttons
  document.getElementById('btn-gui-mkdir').addEventListener('click', () => {
    openCreateModal('dir');
  });

  document.getElementById('btn-gui-touch').addEventListener('click', () => {
    openCreateModal('file');
  });

  document.getElementById('btn-gui-up').addEventListener('click', () => {
    vfs.cd('..');
    renderAll();
  });

  // Header Buttons
  document.getElementById('btn-quick-sample').addEventListener('click', () => {
    vfs.root = new FSNode('/', 'dir', null);
    vfs.current = vfs.root;
    vfs.activityQueue = new ActivityQueue(20);
    seedInitialData();
    printTermLine('Reloaded sample file system hierarchy.', 'term-success');
    renderAll();
  });

  btnGuideModal.addEventListener('click', openGuideModal);
  btnCloseGuideModal.addEventListener('click', closeGuideModal);
  btnCloseGuideFooter.addEventListener('click', closeGuideModal);

  // File Modal Buttons
  btnCloseFileModal.addEventListener('click', closeFileModal);
  btnCancelEdit.addEventListener('click', closeFileModal);
  btnSaveFile.addEventListener('click', () => {
    if (activeEditingFile) {
      activeEditingFile.content = modalFileEditor.value;
      activeEditingFile.size = new TextEncoder().encode(activeEditingFile.content).length;
      vfs.activityQueue.enqueue(`write: Updated file '${activeEditingFile.name}' (${activeEditingFile.size} B)`);
      printTermLine(`Updated '${activeEditingFile.name}' (${activeEditingFile.size} B)`, 'term-success');
      closeFileModal();
      renderAll();
    }
  });

  // Create Item Modal Buttons
  btnCloseCreateModal.addEventListener('click', closeCreateModal);
  btnCancelCreate.addEventListener('click', closeCreateModal);
  btnConfirmCreate.addEventListener('click', () => {
    const name = createItemName.value.trim();
    if (!name) return;

    if (pendingCreateType === 'dir') {
      const res = vfs.mkdir(name);
      if (!res.success) {
        alert(res.error);
        return;
      }
      printTermLine(`mkdir: created '${name}'`, 'term-success');
    } else {
      const content = createItemContent.value;
      const res = vfs.touch(name, content);
      if (!res.success) {
        alert(res.error);
        return;
      }
      printTermLine(`touch: created '${name}'`, 'term-success');
    }

    closeCreateModal();
    renderAll();
  });

  // Visualizer Tabs Switching
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTabId = btn.getAttribute('data-tab');

      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(targetTabId);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // Copy C Code button
  document.getElementById('btn-copy-c-code').addEventListener('click', () => {
    const code = document.getElementById('c-code-display').textContent;
    navigator.clipboard.writeText(code).then(() => {
      const btn = document.getElementById('btn-copy-c-code');
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy C'; }, 2000);
    });
  });

  // Helper utility
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================================
  // INITIALIZATION
  // =========================================================================

  seedInitialData();
  printWelcomeBanner();
  renderAll();

})();
