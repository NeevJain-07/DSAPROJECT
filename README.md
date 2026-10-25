# Virtual File System (VFS) & Data Structures Visualizer

> An interactive in-memory **Virtual File System** built in **C** with a live, modern web visualizer that you can run locally and deploy directly to **GitHub Pages**.

![Project Status](https://img.shields.io/badge/Language-C%20(ANSI%20C99)-blue)
![Frontend](https://img.shields.io/badge/Frontend-HTML5%20%7C%20Vanilla%20CSS%20%7C%20JavaScript-emerald)
![Deployment](https://img.shields.io/badge/Deployment-GitHub%20Pages%20Ready-cyan)
![Data Structures](https://img.shields.io/badge/DSA-Tree%20%7C%20Stack%20%7C%20Queue-purple)

---

## 📌 Project Overview & Real-World Motivation

Every modern operating system (Linux, macOS, Windows) organizes files into a hierarchical directory tree. In an OS kernel, this abstraction is handled by a **Virtual File System (VFS)**.

This project implements an in-memory VFS from scratch in **C**, demonstrating the power and elegance of 3 foundational data structures:
1. **N-ary Tree (Left-Child Right-Sibling representation)**: Handles the hierarchical folders and files.
2. **Linked-List Stack (LIFO)**: Resolves current working directory paths (`pwd`) and backtracks parent levels (`cd ..`).
3. **Circular / Linked-List Queue (FIFO)**: Records an operation audit log of filesystem activities (`mkdir`, `touch`, `rm`, `write`).

It includes both:
- **A Pure C Engine (`c_src/`)**: Compiles with GCC/Clang on Windows, Linux, and macOS with an interactive CLI shell and automated unit test runner.
- **A Modern Web Application (`index.html`, `style.css`, `app.js`)**: A live interactive graphical file explorer, terminal simulator, and real-time visualizer showing the node pointers, stack frames, and queue states.

---

## 🏗️ Data Structures Architecture in C

### 1. N-ary Tree (Left-Child Right-Sibling Binary Representation)
An N-ary tree allows each folder to contain any number of subfolders or files. Rather than using fixed-size arrays that waste memory, we use the textbook **Left-Child Right-Sibling (LCRS)** representation:

```
          / (root)
          │
      firstChild
          ▼
       [home] ───nextSibling───► [etc] ───nextSibling───► [bin]
          │
      firstChild
          ▼
      [student]
          │
      firstChild
          ▼
      [notes.txt] ───nextSibling───► [projects]
```

#### C Definition (`c_src/vfs.h`):
```c
typedef enum {
    NODE_DIR,
    NODE_FILE
} NodeType;

typedef struct FSNode {
    char name[64];
    NodeType type;
    char *content;              /* Text content for files, NULL for dirs */
    size_t size;                /* Size in bytes */
    time_t created_at;

    struct FSNode *parent;      /* Pointer to parent node */
    struct FSNode *firstChild;  /* Pointer to first child node */
    struct FSNode *nextSibling; /* Pointer to next sibling at same level */
} FSNode;
```

---

### 2. Path Stack (LIFO)
When navigating directories with `cd path` or checking the current path with `pwd`, the path must be printed from root `/` to the current leaf folder. By following `parent` pointers up to `root` and **pushing** each node onto a **Stack**, we can **pop** them in reverse order to print the absolute path `/home/student/projects` in $O(D)$ time (where $D$ is directory depth).

```c
typedef struct StackNode {
    FSNode *node;
    struct StackNode *next;
} StackNode;

typedef struct {
    StackNode *top;
    int size;
} PathStack;
```

---

### 3. Activity Queue (FIFO)
Maintains an in-memory chronological history of operations. Operations are **enqueued** at the rear and, when capacity is reached, the oldest action is **dequeued** from the front.

```c
typedef struct QueueNode {
    char action[128];
    time_t timestamp;
    struct QueueNode *next;
} QueueNode;

typedef struct {
    QueueNode *front;
    QueueNode *rear;
    int count;
} ActivityQueue;
```

---

## ⏱️ Time & Space Complexity Analysis

| Operation | Data Structure Used | Time Complexity | Space Complexity |
| :--- | :--- | :--- | :--- |
| **`mkdir <name>`** | N-ary Tree (Sibling Append) | $O(K)$ children | $O(1)$ |
| **`touch <name>`** | N-ary Tree (File Node Alloc) | $O(K)$ children | $O(1)$ |
| **`cd <dir>`** | Child Pointer Traversal | $O(K)$ children | $O(1)$ |
| **`pwd`** | PathStack (Push / Pop) | $O(D)$ depth | $O(D)$ |
| **`tree`** | Pre-Order Recursive Traversal (DFS) | $O(N)$ total nodes | $O(D)$ call stack |
| **`find <name>`** | Recursive Subtree Search (DFS) | $O(N)$ total nodes | $O(D)$ call stack |
| **`rm <name>`** | Pointer Unlink & Recursive Free | $O(K + M)$ subtree | $O(D)$ |
| **`history`** | FIFO ActivityQueue | $O(1)$ enqueue/dequeue | $O(C)$ capacity |

---

## 💻 Running the Pure C Project Locally

### Prerequisites
A C compiler like `gcc` or `clang` and `make`.

### Compilation & Execution
Open your terminal in the project directory:

```bash
# Navigate into C source directory
cd c_src

# Build the interactive CLI shell
make

# Run the Virtual File System shell
make run
```

### Running Automated Unit Tests
To verify all tree insertions, deletions, stack pushes/pops, and queue operations:

```bash
make check
```

---

## 🚀 How to Deploy to GitHub Pages (Live on the Web)

Because this repository contains static web files (`index.html`, `style.css`, `app.js`), you can host it live on GitHub Pages with **zero hosting costs**:

### Step 1: Create a GitHub Repository
1. Go to [github.com/new](https://github.com/new).
2. Repository name: `c-virtual-file-system`.
3. Set visibility to **Public**.
4. Leave *Add README* and *Add .gitignore* unchecked (since this repo already has them).
5. Click **Create repository**.

### Step 2: Push your Code from your Computer
Run the following commands in this project folder:

```bash
git init
git add .
git commit -m "Initial commit: C Virtual File System & Data Structures Web App"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/c-virtual-file-system.git
git push -u origin main
```
*(Replace `YOUR_USERNAME` with your actual GitHub username).*

### Step 3: Enable GitHub Pages
1. On your GitHub repo page, click **Settings** (top tab).
2. On the left sidebar, click **Pages**.
3. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: Select **main** and folder **/(root)**
4. Click **Save**.

### Step 4: Access your Live App!
In about 30–60 seconds, GitHub will generate your live URL:
```
https://YOUR_USERNAME.github.io/c-virtual-file-system/
```
You can share this link with your professor, classmates, or include it in your project report and resume!

---

## 📁 Repository Structure

```
DSA Project/
├── index.html           # Web Application UI (GitHub Pages Entry Point)
├── style.css            # Modern glassmorphism dark-mode styling
├── app.js               # Full JavaScript engine simulating C Data Structures
├── .gitignore           # Git ignore rules for C binaries and system files
├── README.md            # Comprehensive documentation & presentation guide
└── c_src/               # Pure C Codebase (For evaluation & submission)
    ├── vfs.h            # Header file (FSNode, PathStack, ActivityQueue structs)
    ├── vfs.c            # Data structure algorithms & pointer manipulations
    ├── main.c           # Interactive C CLI terminal program
    ├── test_vfs.c       # Automated unit test suite verifying DSA logic
    └── Makefile         # Build rules for gcc
```

---

## 📝 Shell Commands Reference

| Command | Syntax | Description |
| :--- | :--- | :--- |
| `mkdir` | `mkdir <name>` | Create a new directory under current directory |
| `touch` | `touch <name> [text]` | Create a new file with optional content |
| `cat` | `cat <filename>` | Display text contents of a file |
| `write` | `write <filename> <text>` | Overwrite content of an existing file |
| `ls` | `ls [-l]` | List contents (supports detailed `-l` mode) |
| `cd` | `cd <path>` | Navigate directories (`..`, `/`, subpaths) |
| `pwd` | `pwd` | Print working directory using Stack |
| `tree` | `tree` | Visual hierarchical ASCII tree |
| `find` | `find <query>` | Recursive search for files/folders |
| `rm` | `rm <name>` | Delete file or recursive directory |
| `history` | `history` | Print FIFO operations audit queue |
| `clear` | `clear` | Clear terminal display |
| `help` | `help` | Show command reference |
