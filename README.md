# TuneStream: Music Streaming & Play Queue Manager

> A real-world **Music Streaming and Play Queue Manager** built from scratch in **C**, featuring a live, interactive web application deployable directly to **GitHub Pages**.

![Language](https://img.shields.io/badge/Language-C%20(ANSI%20C99)-blue)
![Frontend](https://img.shields.io/badge/Frontend-HTML5%20%7C%20Vanilla%20CSS%20%7C%20JavaScript-emerald)
![Deployment](https://img.shields.io/badge/Deployment-GitHub%20Pages%20Ready-cyan)
![Data Structures](https://img.shields.io/badge/DSA-DLL%20%7C%20Queue%20%7C%20Stack%20%7C%20BST-purple)

---

## 📌 Real-World Problem & Motivation

Modern music streaming platforms like **Spotify**, **Apple Music**, and **YouTube Music** need to manage playback queues, recently played history, and library search with sub-millisecond responsiveness.

This project implements an end-to-end music player engine using **4 foundational Data Structures**:
1. **Doubly Linked List**: Represents the active **Playlist** with bi-directional pointer navigation (`prev` and `next`).
2. **FIFO Queue**: Represents the **"Up Next" Play Queue** where user-queued songs take priority in First-In, First-Out order.
3. **LIFO Stack**: Represents **Playback History** where finished songs are pushed, and clicking "Previous" pops the most recent track.
4. **Binary Search Tree (BST)**: Indexes the entire **Song Catalog** alphabetically for fast $O(\log N)$ search queries.

---

## 🏗️ Data Structures Architecture in C

### 1. Doubly Linked List (Active Playlist)
Every song in the playlist is a node holding pointers to both its predecessor (`prev`) and successor (`next`):

```
NULL ◄── [prev | Song 1 | next] ◄──► [prev | Song 2 | next] ◄──► [prev | Song 3 | next] ──► NULL
                  ▲
                  │
             current node
```

* **Advantage**: Moving to the next or previous track requires only reading `current->next` or `current->prev` in **$O(1)$ constant time** with zero memory shifting.

#### C Definition (`c_src/music_player.h`):
```c
typedef struct SongNode {
    Song song;
    struct SongNode *prev; /* O(1) bi-directional pointer */
    struct SongNode *next; /* O(1) bi-directional pointer */
} SongNode;

typedef struct {
    SongNode *head;
    SongNode *tail;
    SongNode *current;
    int count;
} Playlist;
```

---

### 2. FIFO Queue ("Up Next" Play Queue)
When a user adds songs to play next, they are enqueued into a First-In, First-Out (FIFO) singly-linked queue.

```
Enqueue (Rear) ──► [Song C] ──► [Song B] ──► [Song A] ──► Dequeue (Front / Next to Play)
```

* **Playback Priority**: When the current song finishes or the user clicks "Next", the engine checks if the queue has items. If yes, it dequeues from the front and plays it first before continuing the playlist!

---

### 3. LIFO Stack (Playback History)
Every time a song finishes or skips, the previous song is pushed onto a Last-In, First-Out (LIFO) stack.

```
       ┌────────────────────────┐
 TOP   │ Song 3 (Most Recent)   │  ◄── Pop on "Previous Track"
       ├────────────────────────┤
       │ Song 2                 │
       ├────────────────────────┤
       │ Song 1 (Oldest)        │
       └────────────────────────┘
```

---

### 4. Binary Search Tree (Library Search)
The song catalog is organized in a Binary Search Tree sorted alphabetically by song title:

```
                  [Save Your Tears]
                   /             \
       [Blinding Lights]         [Starboy]
         /            \             \
     [As It Was]   [Levitating]    [Stay]
```

* **Advantage**: Searching for any track takes **$O(\log N)$** time by comparing titles alphabetically.

---

## ⏱️ Time & Space Complexity Analysis

| Operation | Action | Data Structure Used | Time Complexity | Space Complexity |
| :--- | :--- | :--- | :--- | :--- |
| **Next Track** | Advance playback | Doubly Linked List (`current->next`) | $O(1)$ | $O(1)$ |
| **Prev Track** | Go back | LIFO Stack (`pop`) / DLL (`prev`) | $O(1)$ | $O(1)$ |
| **Add to Playlist** | Insert track | Doubly Linked List (`tail->next`) | $O(1)$ | $O(1)$ |
| **Remove from Playlist** | Delete track | Doubly Linked List pointer unlinking | $O(1)$ | $O(1)$ |
| **Add to Up Next** | Queue song | FIFO Queue (`enqueue` at rear) | $O(1)$ | $O(1)$ |
| **Play Queued Song** | Dequeue song | FIFO Queue (`dequeue` from front) | $O(1)$ | $O(1)$ |
| **Catalog Search** | Search by title | Binary Search Tree (BST Traversal) | $O(\log N)$ | $O(1)$ |
| **Sorted Catalog List** | In-order display | Binary Search Tree (In-order DFS) | $O(N)$ | $O(H)$ stack |

---

## 💻 Running the Pure C Version on Your Computer

### Prerequisites
A standard C compiler (`gcc` or `clang`) and `make`.

### Compilation & Interactive CLI
Navigate into the `c_src/` folder:

```bash
cd c_src

# Compile and start the interactive CLI player
make run
```

### Running Automated Unit Tests
To verify all operations of the Doubly Linked List, Queue, Stack, and BST:

```bash
make check
```

---

## 🚀 How to Deploy Live to GitHub Pages (2 Minutes)

All static files (`index.html`, `style.css`, `app.js`) are ready in the root directory. Follow these simple steps:

### Step 1: Create a GitHub Repository
1. Go to [github.com/new](https://github.com/new).
2. Name your repo: `tunestream-music-player`.
3. Set visibility to **Public**.
4. Leave *Add README* and *Add .gitignore* unchecked.
5. Click **Create repository**.

### Step 2: Push Your Code
Open your terminal inside this project folder and run:

```bash
git add .
git commit -m "TuneStream: Music Streaming & Play Queue Manager in C"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tunestream-music-player.git
git push -u origin main
```
*(Replace `YOUR_USERNAME` with your actual GitHub username).*

### Step 3: Enable GitHub Pages
1. Go to your repository on GitHub &rarr; click **Settings** (top tab).
2. Click **Pages** (on the left menu under *Code and automation*).
3. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: Select **`main`** and folder **`/(root)`**
4. Click **Save**.

### Step 4: Your App is Live!
In ~30 seconds, your project will be live at:
```
https://YOUR_USERNAME.github.io/tunestream-music-player/
```

---

## 📁 Repository Structure

```
DSA Project/
├── index.html           # Web App UI (Spotify-tier interactive player)
├── style.css            # Modern glassmorphism dark theme with audio waves
├── app.js               # Browser simulation of C Data Structures & Web Audio
├── README.md            # Comprehensive documentation & viva guide
├── .gitignore           # Git ignore file for C binaries
└── c_src/               # Pure C Codebase (For evaluation & submission)
    ├── music_player.h   # Structs for DLL, Queue, Stack, and BST
    ├── music_player.c   # Algorithms and dynamic memory management in C
    ├── main.c           # Interactive CLI menu driver
    ├── test_player.c    # Automated unit test suite verifying all 4 structures
    └── Makefile         # GCC compilation rules
```
