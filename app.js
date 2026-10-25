/**
 * TuneStream - Music Streaming & Play Queue Manager
 * Direct browser simulation of C Data Structures:
 * 1. Doubly Linked List (Playlist with prev/next pointers)
 * 2. FIFO Queue ("Up Next" Play Queue)
 * 3. LIFO Stack ("Recently Played" History)
 * 4. Binary Search Tree (Library Search Index)
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. DATA STRUCTURE DEFINITIONS (Mirroring C Structs in music_player.h)
  // =========================================================================

  class Song {
    constructor(id, title, artist, durationSec, genre, freq = 440) {
      this.id = id;
      this.title = title;
      this.artist = artist;
      this.durationSec = durationSec;
      this.genre = genre;
      this.freq = freq; // Base frequency for Web Audio synth
    }
  }

  // Doubly Linked List Node
  class SongNode {
    constructor(song) {
      this.song = song;
      this.prev = null; // Pointer to previous track
      this.next = null; // Pointer to next track
    }
  }

  // Doubly Linked List (Active Playlist)
  class Playlist {
    constructor() {
      this.head = null;
      this.tail = null;
      this.current = null;
      this.count = 0;
    }

    insertEnd(song) {
      const newNode = new SongNode(song);
      if (!this.tail) {
        this.head = newNode;
        this.tail = newNode;
        this.current = newNode;
      } else {
        newNode.prev = this.tail;
        this.tail.next = newNode;
        this.tail = newNode;
      }
      this.count++;
      return newNode;
    }

    remove(songId) {
      if (!this.head) return false;
      let curr = this.head;

      while (curr) {
        if (curr.song.id === songId) {
          // If deleting currently active song, advance first
          if (this.current === curr) {
            this.current = curr.next ? curr.next : curr.prev;
          }

          if (curr.prev) {
            curr.prev.next = curr.next;
          } else {
            this.head = curr.next;
          }

          if (curr.next) {
            curr.next.prev = curr.prev;
          } else {
            this.tail = curr.prev;
          }

          this.count--;
          return true;
        }
        curr = curr.next;
      }
      return false;
    }

    toArray() {
      const arr = [];
      let curr = this.head;
      while (curr) {
        arr.push(curr);
        curr = curr.next;
      }
      return arr;
    }
  }

  // FIFO Queue ("Up Next")
  class SongQueue {
    constructor() {
      this.items = [];
    }

    enqueue(song) {
      this.items.push(song);
    }

    dequeue() {
      return this.items.length > 0 ? this.items.shift() : null;
    }

    peek() {
      return this.items.length > 0 ? this.items[0] : null;
    }

    isEmpty() {
      return this.items.length === 0;
    }

    getAll() {
      return [...this.items];
    }

    get count() {
      return this.items.length;
    }
  }

  // LIFO Stack ("Recently Played" History)
  class HistoryStack {
    constructor() {
      this.items = [];
    }

    push(song) {
      this.items.push(song);
    }

    pop() {
      return this.items.length > 0 ? this.items.pop() : null;
    }

    peek() {
      return this.items.length > 0 ? this.items[this.items.length - 1] : null;
    }

    isEmpty() {
      return this.items.length === 0;
    }

    getAll() {
      // Return top-first
      return [...this.items].reverse();
    }

    get count() {
      return this.items.length;
    }
  }

  // Binary Search Tree (Library Catalog)
  class BSTNode {
    constructor(song) {
      this.song = song;
      this.left = null;
      this.right = null;
    }
  }

  class SongBST {
    constructor() {
      this.root = null;
      this.totalSongs = 0;
    }

    insert(song) {
      const newNode = new BSTNode(song);
      if (!this.root) {
        this.root = newNode;
        this.totalSongs++;
        return;
      }

      let curr = this.root;
      while (true) {
        const cmp = song.title.localeCompare(curr.song.title, undefined, { sensitivity: 'accent' });
        if (cmp < 0) {
          if (!curr.left) {
            curr.left = newNode;
            this.totalSongs++;
            break;
          }
          curr = curr.left;
        } else if (cmp > 0) {
          if (!curr.right) {
            curr.right = newNode;
            this.totalSongs++;
            break;
          }
          curr = curr.right;
        } else {
          break; // Duplicate
        }
      }
    }

    search(query) {
      if (!query || !this.root) return { found: null, steps: [] };
      query = query.toLowerCase();

      let curr = this.root;
      const steps = [];

      while (curr) {
        steps.push(curr.song.title);
        const titleLower = curr.song.title.toLowerCase();

        if (titleLower.includes(query) || titleLower === query) {
          return { found: curr.song, steps };
        }

        if (query.localeCompare(titleLower) < 0) {
          curr = curr.left;
        } else {
          curr = curr.right;
        }
      }

      return { found: null, steps };
    }

    inorder() {
      const result = [];
      const traverse = (node) => {
        if (!node) return;
        traverse(node.left);
        result.push(node.song);
        traverse(node.right);
      };
      traverse(this.root);
      return result;
    }
  }

  // =========================================================================
  // 2. WEB AUDIO SYNTHESIZER (Generates pleasant ambient melody)
  // =========================================================================

  class WebAudioPlayer {
    constructor() {
      this.ctx = null;
      this.osc = null;
      this.gain = null;
      this.timer = null;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
    }

    playTone(baseFreq = 440) {
      this.stopTone();
      this.init();
      if (!this.ctx) return;

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      // Arpeggiator notes around baseFreq
      const notes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 1.33];
      let noteIndex = 0;

      const triggerNote = () => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(notes[noteIndex % notes.length], this.ctx.currentTime);
        noteIndex++;

        gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08, this.ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.7);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.75);
      };

      triggerNote();
      this.timer = setInterval(triggerNote, 800);
    }

    stopTone() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }
  }

  // =========================================================================
  // 3. APPLICATION STATE & SAMPLE DATA
  // =========================================================================

  const playlist = new Playlist();
  const upNextQueue = new SongQueue();
  const historyStack = new HistoryStack();
  const libraryBST = new SongBST();
  const synth = new WebAudioPlayer();

  let isPlaying = false;
  let isRepeat = false;
  let isShuffle = false;
  let playbackSeconds = 0;
  let playbackTimer = null;

  function loadSampleCatalog() {
    const samples = [
      new Song(1, 'Blinding Lights', 'The Weeknd', 200, 'Synthwave', 349.23),
      new Song(2, 'Levitating', 'Dua Lipa', 203, 'Pop', 293.66),
      new Song(3, 'Starboy', 'The Weeknd & Daft Punk', 230, 'R&B', 440.00),
      new Song(4, 'Shape of You', 'Ed Sheeran', 233, 'Pop', 329.63),
      new Song(5, 'Save Your Tears', 'The Weeknd', 215, 'Synth-pop', 392.00),
      new Song(6, 'Stay', 'The Kid LAROI & Justin Bieber', 141, 'Pop', 523.25),
      new Song(7, 'As It Was', 'Harry Styles', 167, 'Indie Pop', 370.00),
      new Song(8, 'Sunflower', 'Post Malone & Swae Lee', 158, 'Hip-hop', 466.16)
    ];

    // Insert into BST Library Catalog
    samples.forEach(s => libraryBST.insert(s));

    // Add initial songs to Active Playlist (Doubly Linked List)
    for (let i = 0; i < 5; i++) {
      playlist.insertEnd(samples[i]);
    }

    // Enqueue 1 song into FIFO Up Next queue
    upNextQueue.enqueue(samples[5]);
  }

  // =========================================================================
  // 4. CORE PLAYBACK ALGORITHMS (Coordinating DLL, Queue, and Stack)
  // =========================================================================

  function playNextTrack() {
    // 1. Check if FIFO Queue has any songs
    if (!upNextQueue.isEmpty()) {
      const queuedSong = upNextQueue.dequeue();
      if (playlist.current) {
        // Push currently finished song onto LIFO history stack
        historyStack.push(playlist.current.song);
      }
      // Insert into playlist at tail and set as current
      const newNode = playlist.insertEnd(queuedSong);
      playlist.current = newNode;
      startPlayback();
      renderAll();
      return;
    }

    // 2. Standard Doubly Linked List forward traversal (current.next)
    if (!playlist.current) {
      playlist.current = playlist.head;
      if (playlist.current) startPlayback();
      renderAll();
      return;
    }

    // Push current song onto LIFO History Stack before moving
    historyStack.push(playlist.current.song);

    if (isShuffle && playlist.count > 1) {
      const allNodes = playlist.toArray();
      const otherNodes = allNodes.filter(n => n !== playlist.current);
      playlist.current = otherNodes[Math.floor(Math.random() * otherNodes.length)];
    } else if (playlist.current.next) {
      playlist.current = playlist.current.next;
    } else if (isRepeat) {
      // Loop back to DLL head
      playlist.current = playlist.head;
    } else {
      // End of playlist
      pausePlayback();
      renderAll();
      return;
    }

    startPlayback();
    renderAll();
  }

  function playPrevTrack() {
    // 1. Check LIFO History Stack first
    if (!historyStack.isEmpty()) {
      const prevHistorySong = historyStack.pop();
      // Find in playlist
      let curr = playlist.head;
      while (curr) {
        if (curr.song.id === prevHistorySong.id) {
          playlist.current = curr;
          startPlayback();
          renderAll();
          return;
        }
        curr = curr.next;
      }
    }

    // 2. Fall back to Doubly Linked List prev pointer
    if (playlist.current && playlist.current.prev) {
      playlist.current = playlist.current.prev;
      startPlayback();
      renderAll();
    }
  }

  function togglePlayPause() {
    if (isPlaying) {
      pausePlayback();
    } else {
      startPlayback();
    }
    renderPlayerState();
  }

  function startPlayback() {
    isPlaying = true;
    playbackSeconds = 0;
    if (playlist.current) {
      synth.playTone(playlist.current.song.freq);
    }
    startProgressTimer();
    renderPlayerState();
  }

  function pausePlayback() {
    isPlaying = false;
    synth.stopTone();
    stopProgressTimer();
    renderPlayerState();
  }

  function startProgressTimer() {
    stopProgressTimer();
    playbackTimer = setInterval(() => {
      if (!playlist.current) return;
      playbackSeconds++;
      if (playbackSeconds >= playlist.current.song.durationSec) {
        playNextTrack();
      } else {
        updateProgressBar();
      }
    }, 1000);
  }

  function stopProgressTimer() {
    if (playbackTimer) {
      clearInterval(playbackTimer);
      playbackTimer = null;
    }
  }

  // =========================================================================
  // 5. UI RENDERERS
  // =========================================================================

  // DOM Elements
  const nowPlayingTitle = document.getElementById('now-playing-title');
  const nowPlayingArtist = document.getElementById('now-playing-artist');
  const nowPlayingGenre = document.getElementById('now-playing-genre');
  const nowPlayingNodeId = document.getElementById('now-playing-node-id');
  const vinylDisk = document.getElementById('vinyl-disk');
  const playPauseIcon = document.getElementById('play-pause-icon');
  const timeCurrent = document.getElementById('time-current');
  const timeTotal = document.getElementById('time-total');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const progressBarTrack = document.getElementById('progress-bar-track');

  const badgePlaylistCount = document.getElementById('badge-playlist-count');
  const badgeQueueCount = document.getElementById('badge-queue-count');
  const badgeHistoryCount = document.getElementById('badge-history-count');
  const catalogTotalBadge = document.getElementById('catalog-total-badge');

  const catalogListContainer = document.getElementById('catalog-list-container');
  const playlistContainer = document.getElementById('playlist-container');
  const dllChainContainer = document.getElementById('dll-chain-container');
  const inspectorQueueContainer = document.getElementById('inspector-queue-container');
  const inspectorStackContainer = document.getElementById('inspector-stack-container');
  const inspectorBstContainer = document.getElementById('inspector-bst-container');

  const btnPlayPause = document.getElementById('btn-play-pause');
  const btnNext = document.getElementById('btn-next');
  const btnPrev = document.getElementById('btn-prev');
  const btnRepeat = document.getElementById('btn-repeat');
  const btnShuffle = document.getElementById('btn-shuffle');

  const searchInput = document.getElementById('search-input');
  const btnClearSearch = document.getElementById('btn-clear-search');
  const searchBstFeedback = document.getElementById('search-bst-feedback');

  function renderAll() {
    renderPlayerState();
    renderPlaylist();
    renderCatalog();
    renderInspectorDLL();
    renderInspectorQueue();
    renderInspectorStack();
    renderInspectorBST();
    updateBadges();
  }

  function updateBadges() {
    badgePlaylistCount.textContent = `${playlist.count} Nodes (DLL)`;
    badgeQueueCount.textContent = `${upNextQueue.count} Enqueued (FIFO)`;
    badgeHistoryCount.textContent = `${historyStack.count} Stacked (LIFO)`;
    catalogTotalBadge.textContent = `${libraryBST.totalSongs} Tracks`;
  }

  function renderPlayerState() {
    const curr = playlist.current ? playlist.current.song : null;

    if (curr) {
      nowPlayingTitle.textContent = curr.title;
      nowPlayingArtist.textContent = curr.artist;
      nowPlayingGenre.textContent = curr.genre;
      nowPlayingNodeId.textContent = `DLL Node: &SongNode@${curr.id}`;
      timeTotal.textContent = formatTime(curr.durationSec);
    } else {
      nowPlayingTitle.textContent = 'No Track Selected';
      nowPlayingArtist.textContent = 'Add songs to playlist';
      nowPlayingGenre.textContent = 'Idle';
      nowPlayingNodeId.textContent = 'DLL: NULL';
      timeTotal.textContent = '0:00';
    }

    if (isPlaying) {
      vinylDisk.classList.add('spinning');
      playPauseIcon.innerHTML = `<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>`;
      btnPlayPause.setAttribute('title', 'Pause');
    } else {
      vinylDisk.classList.remove('spinning');
      playPauseIcon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"></polygon>`;
      btnPlayPause.setAttribute('title', 'Play');
    }

    updateProgressBar();
  }

  function updateProgressBar() {
    const curr = playlist.current ? playlist.current.song : null;
    if (!curr) {
      progressBarFill.style.width = '0%';
      timeCurrent.textContent = '0:00';
      return;
    }
    const pct = Math.min(100, (playbackSeconds / curr.durationSec) * 100);
    progressBarFill.style.width = `${pct}%`;
    timeCurrent.textContent = formatTime(playbackSeconds);
  }

  // Render Center Active Playlist (Doubly Linked List)
  function renderPlaylist() {
    playlistContainer.innerHTML = '';
    const nodes = playlist.toArray();

    if (nodes.length === 0) {
      playlistContainer.innerHTML = `
        <div style="text-align:center; padding: 40px; color:var(--text-muted); font-size:0.85rem;">
          <p>Playlist is empty</p>
          <span style="font-size:0.75rem;">Click "+ Playlist" on any catalog track to append nodes</span>
        </div>
      `;
      return;
    }

    nodes.forEach((node, idx) => {
      const isCurrent = node === playlist.current;
      const el = document.createElement('div');
      el.className = `playlist-item ${isCurrent ? 'is-playing' : ''}`;

      const prevName = node.prev ? node.prev.song.title : 'NULL';
      const nextName = node.next ? node.next.song.title : 'NULL';

      el.innerHTML = `
        <div class="playlist-item-left">
          <span class="playlist-index">${isCurrent ? '▶' : (idx + 1)}</span>
          <div>
            <div class="playlist-item-title">${escapeHtml(node.song.title)}</div>
            <div class="playlist-item-artist">${escapeHtml(node.song.artist)} &bull; ${formatTime(node.song.durationSec)}</div>
          </div>
        </div>
        <div class="playlist-item-right">
          <span class="playlist-pointer-badge" title="Pointers: prev & next">
            ${escapeHtml(prevName)} ◄──► ${escapeHtml(nextName)}
          </span>
          <button class="btn-remove-track" title="Remove node from Doubly Linked List" data-id="${node.song.id}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      `;

      // Click row to jump pointer directly
      el.addEventListener('click', (e) => {
        if (e.target.closest('.btn-remove-track')) return;
        if (playlist.current) {
          historyStack.push(playlist.current.song);
        }
        playlist.current = node;
        startPlayback();
        renderAll();
      });

      // Remove button handler
      const removeBtn = el.querySelector('.btn-remove-track');
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playlist.remove(node.song.id);
        renderAll();
      });

      playlistContainer.appendChild(el);
    });
  }

  // Render Left Catalog (BST In-Order)
  function renderCatalog(filterSongs = null) {
    catalogListContainer.innerHTML = '';
    const songs = filterSongs || libraryBST.inorder();

    songs.forEach(song => {
      const el = document.createElement('div');
      el.className = 'catalog-item-card';
      el.innerHTML = `
        <div class="catalog-item-info">
          <span class="catalog-item-title">${escapeHtml(song.title)}</span>
          <span class="catalog-item-sub">${escapeHtml(song.artist)} &bull; ${formatTime(song.durationSec)}</span>
        </div>
        <div class="catalog-item-actions">
          <button class="btn-mini btn-mini-queue btn-add-queue" title="Add to FIFO Up Next Queue" data-id="${song.id}">
            + Queue
          </button>
          <button class="btn-mini btn-add-playlist" title="Append to Doubly Linked List Playlist" data-id="${song.id}">
            + Playlist
          </button>
        </div>
      `;

      el.querySelector('.btn-add-queue').addEventListener('click', () => {
        upNextQueue.enqueue(song);
        renderAll();
      });

      el.querySelector('.btn-add-playlist').addEventListener('click', () => {
        playlist.insertEnd(song);
        renderAll();
      });

      catalogListContainer.appendChild(el);
    });
  }

  // Render Right Tab 1: Doubly Linked List Visualizer
  function renderInspectorDLL() {
    dllChainContainer.innerHTML = '';
    const nodes = playlist.toArray();

    if (nodes.length === 0) {
      dllChainContainer.innerHTML = '<span style="color:var(--text-muted);font-size:0.8rem;">DLL is empty</span>';
      return;
    }

    nodes.forEach((node, idx) => {
      const isCurrent = node === playlist.current;
      const card = document.createElement('div');
      card.className = `dll-node-card ${isCurrent ? 'is-active' : ''}`;

      const prevStr = node.prev ? `&Node@${node.prev.song.id}` : 'NULL';
      const nextStr = node.next ? `&Node@${node.next.song.id}` : 'NULL';

      card.innerHTML = `
        <div class="dll-node-header">
          <span>[${idx}] &SongNode@${node.song.id}: "${escapeHtml(node.song.title)}"</span>
          <span>${isCurrent ? '👈 CURRENT' : ''}</span>
        </div>
        <div class="dll-pointers-row">
          <span>prev &larr; <strong class="ptr-accent">${prevStr}</strong></span>
          <span>next &rarr; <strong class="ptr-accent">${nextStr}</strong></span>
        </div>
      `;

      card.addEventListener('click', () => {
        if (playlist.current) historyStack.push(playlist.current.song);
        playlist.current = node;
        startPlayback();
        renderAll();
      });

      dllChainContainer.appendChild(card);
    });
  }

  // Render Right Tab 2: FIFO Up Next Queue
  function renderInspectorQueue() {
    inspectorQueueContainer.innerHTML = '';
    const items = upNextQueue.getAll();

    if (items.length === 0) {
      inspectorQueueContainer.innerHTML = `
        <div style="padding:16px; text-align:center; color:var(--text-muted); font-size:0.8rem;">
          Queue is empty. Click "+ Queue" on any catalog track.
        </div>
      `;
      return;
    }

    items.forEach((song, idx) => {
      const card = document.createElement('div');
      card.className = 'queue-card';
      card.innerHTML = `
        <div>
          <span style="color:var(--accent-cyan); font-weight:600;">[${idx + 1}]</span>
          <strong>${escapeHtml(song.title)}</strong> &mdash; ${escapeHtml(song.artist)}
        </div>
        <div>
          ${idx === 0 ? '<span class="queue-badge-head">FRONT (Next to Play)</span>' : ''}
          ${idx === items.length - 1 && idx !== 0 ? '<span style="font-size:0.65rem; color:var(--text-muted);">REAR</span>' : ''}
        </div>
      `;
      inspectorQueueContainer.appendChild(card);
    });
  }

  // Render Right Tab 3: LIFO History Stack
  function renderInspectorStack() {
    inspectorStackContainer.innerHTML = '';
    const items = historyStack.getAll();

    if (items.length === 0) {
      inspectorStackContainer.innerHTML = `
        <div style="padding:16px; text-align:center; color:var(--text-muted); font-size:0.8rem;">
          History stack is empty. Play or skip tracks to push history.
        </div>
      `;
      return;
    }

    items.forEach((song, idx) => {
      const isTop = idx === 0;
      const card = document.createElement('div');
      card.className = `stack-card ${isTop ? 'is-top' : ''}`;
      card.innerHTML = `
        <div>
          <span style="color:var(--accent-purple); font-weight:600;">[#${items.length - idx}]</span>
          <strong>${escapeHtml(song.title)}</strong> &mdash; ${escapeHtml(song.artist)}
        </div>
        <div>
          ${isTop ? '<span class="stack-badge-top">TOP OF STACK</span>' : ''}
        </div>
      `;
      inspectorStackContainer.appendChild(card);
    });
  }

  // Render Right Tab 4: BST Index
  function renderInspectorBST() {
    inspectorBstContainer.innerHTML = '';
    const songs = libraryBST.inorder();

    songs.forEach(song => {
      const row = document.createElement('div');
      row.className = 'bst-node-row';
      row.innerHTML = `
        <span><strong>${escapeHtml(song.title)}</strong></span>
        <span style="color:var(--text-muted); font-size:0.7rem;">${escapeHtml(song.artist)} (${escapeHtml(song.genre)})</span>
      `;
      inspectorBstContainer.appendChild(row);
    });
  }

  // =========================================================================
  // 6. EVENT HANDLERS & SEARCH
  // =========================================================================

  // Controls
  btnPlayPause.addEventListener('click', togglePlayPause);
  btnNext.addEventListener('click', playNextTrack);
  btnPrev.addEventListener('click', playPrevTrack);

  btnRepeat.addEventListener('click', () => {
    isRepeat = !isRepeat;
    btnRepeat.classList.toggle('active', isRepeat);
  });

  btnShuffle.addEventListener('click', () => {
    isShuffle = !isShuffle;
    btnShuffle.classList.toggle('active', isShuffle);
  });

  // Progress Scrubbing
  progressBarTrack.addEventListener('click', (e) => {
    if (!playlist.current) return;
    const rect = progressBarTrack.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    playbackSeconds = Math.floor(pct * playlist.current.song.durationSec);
    updateProgressBar();
  });

  // BST Search input
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim();
    if (q) {
      btnClearSearch.style.display = 'block';
      const searchRes = libraryBST.search(q);
      if (searchRes.found) {
        searchBstFeedback.innerHTML = `BST Match found in <span class="search-bst-highlight">${searchRes.steps.length} comparison(s)</span>: <em>"${escapeHtml(searchRes.found.title)}"</em>`;
        renderCatalog([searchRes.found]);
      } else {
        searchBstFeedback.innerHTML = `Traversed BST (${searchRes.steps.length} checks) &mdash; <span style="color:var(--accent-rose);">No match</span>`;
        renderCatalog([]);
      }
    } else {
      btnClearSearch.style.display = 'none';
      searchBstFeedback.innerHTML = `<span>Library indexed via Binary Search Tree (O(log N))</span>`;
      renderCatalog();
    }
  });

  btnClearSearch.addEventListener('click', () => {
    searchInput.value = '';
    btnClearSearch.style.display = 'none';
    searchBstFeedback.innerHTML = `<span>Library indexed via Binary Search Tree (O(log N))</span>`;
    renderCatalog();
  });

  // Tab switching
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const target = document.getElementById(targetId);
      if (target) target.classList.add('active');
    });
  });

  // Modals
  const modalAddSong = document.getElementById('modal-add-song');
  const btnAddSongModal = document.getElementById('btn-add-song-modal');
  const btnCloseAddModal = document.getElementById('btn-close-add-modal');
  const btnCancelAdd = document.getElementById('btn-cancel-add');
  const btnConfirmAdd = document.getElementById('btn-confirm-add');

  const inputSongTitle = document.getElementById('input-song-title');
  const inputSongArtist = document.getElementById('input-song-artist');
  const inputSongGenre = document.getElementById('input-song-genre');
  const inputSongDuration = document.getElementById('input-song-duration');
  const selectAddDest = document.getElementById('select-add-dest');

  btnAddSongModal.addEventListener('click', () => {
    modalAddSong.classList.add('show');
    inputSongTitle.focus();
  });

  function closeAddModal() {
    modalAddSong.classList.remove('show');
  }

  btnCloseAddModal.addEventListener('click', closeAddModal);
  btnCancelAdd.addEventListener('click', closeAddModal);

  btnConfirmAdd.addEventListener('click', () => {
    const title = inputSongTitle.value.trim();
    const artist = inputSongArtist.value.trim() || 'Unknown Artist';
    const genre = inputSongGenre.value.trim() || 'Custom';
    const dur = parseInt(inputSongDuration.value, 10) || 180;
    const dest = selectAddDest.value;

    if (!title) {
      alert('Please enter a song title.');
      return;
    }

    const newSong = new Song(Date.now() % 10000, title, artist, dur, genre, 400 + Math.random() * 200);

    // Always insert into BST
    libraryBST.insert(newSong);

    if (dest === 'playlist') {
      playlist.insertEnd(newSong);
    } else if (dest === 'queue') {
      upNextQueue.enqueue(newSong);
    }

    inputSongTitle.value = '';
    closeAddModal();
    renderAll();
  });

  // Copy C Code Button
  document.getElementById('btn-copy-c-code').addEventListener('click', () => {
    const code = document.getElementById('c-code-display').textContent;
    navigator.clipboard.writeText(code).then(() => {
      const btn = document.getElementById('btn-copy-c-code');
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy C'; }, 2000);
    });
  });

  // Format seconds to mm:ss
  function formatTime(sec) {
    sec = Math.floor(sec || 0);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

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
  // 7. INITIALIZATION
  // =========================================================================

  loadSampleCatalog();
  renderAll();

})();
