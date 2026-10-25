import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_code_block(doc, code_text):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, "F1F5F9")
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run(code_text.strip())
    run.font.name = 'Consolas'
    run.font.size = Pt(9.5)
    run.font.color.rgb = RGBColor(15, 23, 42)
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def create_report():
    doc = Document()

    # Page setup
    sections = doc.sections
    for s in sections:
        s.top_margin = Inches(1.0)
        s.bottom_margin = Inches(1.0)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(1.0)

    # Styles & Colors
    PRIMARY_COLOR = RGBColor(16, 185, 129)     # Emerald Green
    SECONDARY_COLOR = RGBColor(14, 116, 144)   # Teal/Cyan
    DARK_TEXT = RGBColor(15, 23, 42)
    MUTED_TEXT = RGBColor(100, 116, 139)

    # -------------------------------------------------------------
    # COVER / TITLE SECTION
    # -------------------------------------------------------------
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(36)
    title_p.paragraph_format.space_after = Pt(8)
    title_run = title_p.add_run("TuneStream: Music Streaming & Play Queue Manager")
    title_run.font.name = 'Segoe UI'
    title_run.font.size = Pt(26)
    title_run.font.bold = True
    title_run.font.color.rgb = PRIMARY_COLOR

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_after = Pt(20)
    sub_run = sub_p.add_run("Comprehensive Project Report & Architecture Reference Guide\nImplementation of Core Data Structures (Doubly Linked List, Queue, Stack, BST) in C & Live Web Application")
    sub_run.font.name = 'Segoe UI'
    sub_run.font.size = Pt(13)
    sub_run.font.color.rgb = SECONDARY_COLOR

    # Metadata Card Table
    meta_table = doc.add_table(rows=6, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Project Title:", "TuneStream - Real-World DSA Music Player Engine"),
        ("Programming Language:", "ANSI C (C99 Standard) & Modern JavaScript / HTML5 / CSS3"),
        ("Primary Data Structures:", "Doubly Linked List, FIFO Queue, LIFO Stack, Binary Search Tree (BST)"),
        ("Live Web Application:", "https://neevjain-07.github.io/DSAPROJECT/"),
        ("GitHub Repository:", "https://github.com/NeevJain-07/DSAPROJECT"),
        ("Author / Student:", "Neev Jain (DSA Project 2026)")
    ]
    for i, (k, v) in enumerate(meta_data):
        row = meta_table.rows[i]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.3)
        set_cell_background(c0, "F8FAFC")
        set_cell_background(c1, "FFFFFF")
        set_cell_margins(c0, 80, 80, 120, 120)
        set_cell_margins(c1, 80, 80, 120, 120)
        
        p0 = c0.paragraphs[0]
        r0 = p0.add_run(k)
        r0.font.bold = True
        r0.font.size = Pt(10)
        r0.font.name = 'Segoe UI'
        r0.font.color.rgb = DARK_TEXT

        p1 = c1.paragraphs[0]
        r1 = p1.add_run(v)
        r1.font.size = Pt(10)
        r1.font.name = 'Segoe UI'
        if "http" in v:
            r1.font.color.rgb = SECONDARY_COLOR
            r1.font.underline = True
        else:
            r1.font.color.rgb = DARK_TEXT

    doc.add_page_break()

    # -------------------------------------------------------------
    # 1. EXECUTIVE SUMMARY & ABSTRACT
    # -------------------------------------------------------------
    h1 = doc.add_heading("1. Executive Summary & Abstract", level=1)
    h1.paragraph_format.space_before = Pt(18)
    h1.paragraph_format.space_after = Pt(8)

    p = doc.add_paragraph(
        "Modern consumer applications require sophisticated data management under stringent performance constraints. "
        "Audio streaming services such as Spotify, Apple Music, and YouTube Music process millions of real-time interactions daily—"
        "including sequential track traversal, priority queuing of user requests, historical playback tracking, and sub-millisecond catalog searching. "
        "While non-technical users view a music player as a simple interface with play and skip buttons, underneath lies an intricate orchestration "
        "of foundational computer science data structures.\n\n"
        "TuneStream is an academic, production-grade project designed to bridge theoretical Data Structures and Algorithms (DSA) with real-world application engineering. "
        "The project implements four core data structures completely from scratch in ANSI C (using dynamic memory allocation and pointer manipulations) "
        "and is complemented by an interactive, responsive web application hosted live on GitHub Pages. "
        "The web application features real-time visual inspectors for every pointer, node, queue element, and stack frame, allowing users and examiners "
        "to witness algorithmic state transitions live as audio plays."
    )
    p.paragraph_format.line_spacing = 1.2
    p.paragraph_format.space_after = Pt(12)

    # -------------------------------------------------------------
    # 2. PROBLEM STATEMENT & REAL-WORLD MOTIVATION
    # -------------------------------------------------------------
    h1 = doc.add_heading("2. Problem Statement & Real-World Motivation", level=1)
    h1.paragraph_format.space_before = Pt(18)
    h1.paragraph_format.space_after = Pt(8)

    p = doc.add_paragraph(
        "Why not simply use fixed-size arrays for everything in a media player? In introductory programming courses, beginners often rely on static arrays. "
        "However, real-world media players face fundamental algorithmic bottlenecks when restricted to arrays:"
    )
    p.paragraph_format.line_spacing = 1.2

    bullet1 = doc.add_paragraph(style='List Bullet')
    r = bullet1.add_run("Arbitrary Insertion & Deletion Bottlenecks (O(N) vs O(1)): ")
    r.font.bold = True
    bullet1.add_run("In an array of 5,000 songs, deleting track #3 requires shifting 4,997 elements to the left. Inserting a track in the middle similarly incurs O(N) memory copy operations. A Doubly Linked List achieves insertion and deletion in O(1) time simply by updating two pointer references.")

    bullet2 = doc.add_paragraph(style='List Bullet')
    r = bullet2.add_run("Bi-Directional Navigation: ")
    r.font.bold = True
    bullet2.add_run("A media player must seamlessly navigate backwards (Previous Track) and forward (Next Track). A Doubly Linked List provides native O(1) bi-directional pointer traversal without maintaining array bounds index counters.")

    bullet3 = doc.add_paragraph(style='List Bullet')
    r = bullet3.add_run("Priority Queuing vs Playlist Sequences: ")
    r.font.bold = True
    bullet3.add_run("When a listener clicks 'Play Next' on a track, that song must interrupt the normal playlist order. It cannot simply overwrite the playlist. A First-In, First-Out (FIFO) Queue stores user-prioritized tracks, which the player dequeues before falling back to the playlist sequence.")

    bullet4 = doc.add_paragraph(style='List Bullet')
    r = bullet4.add_run("Historical Backtracking: ")
    r.font.bold = True
    bullet4.add_run("Clicking 'Back' in Spotify does not simply mean 'the previous index in the album.' If a user listened to Track 5, then a queued custom song, then skipped to Track 9, clicking Back must return to Track 5. This is inherently a Last-In, First-Out (LIFO) Stack behavior.")

    bullet5 = doc.add_paragraph(style='List Bullet')
    r = bullet5.add_run("Rapid Catalog Search (O(log N) vs O(N)): ")
    r.font.bold = True
    bullet5.add_run("Linear search across a large music catalog requires O(N) comparisons. By structuring the music catalog in a Binary Search Tree (BST) sorted alphabetically by title, search queries execute in O(log N) time.")

    # -------------------------------------------------------------
    # 3. DETAILED DATA STRUCTURES ARCHITECTURE
    # -------------------------------------------------------------
    doc.add_page_break()
    h1 = doc.add_heading("3. Detailed Data Structures Architecture & C Implementation", level=1)
    h1.paragraph_format.space_before = Pt(18)
    h1.paragraph_format.space_after = Pt(8)

    p = doc.add_paragraph(
        "TuneStream harmoniously connects four distinct data structures into a unified engine. "
        "Below is the complete technical anatomy of each structure, including its memory representation, C structs, and algorithmic operations."
    )
    p.paragraph_format.line_spacing = 1.2

    # --- Sub 1: DLL ---
    h2 = doc.add_heading("3.1 Doubly Linked List (The Active Playlist)", level=2)
    p = doc.add_paragraph(
        "A Doubly Linked List (DLL) is a linear data structure composed of independently allocated nodes in heap memory. "
        "Unlike a singly linked list, each node contains two pointer fields: prev (pointing to the preceding node) and next (pointing to the subsequent node). "
        "The Playlist container maintains head, tail, current (the currently playing song), and count."
    )
    p.paragraph_format.line_spacing = 1.2

    add_code_block(doc, """/* Doubly Linked List Node Definition in C (music_player.h) */
typedef struct SongNode {
    Song song;                  /* Song payload (id, title, artist, duration, genre) */
    struct SongNode *prev;      /* O(1) pointer to preceding track */
    struct SongNode *next;      /* O(1) pointer to subsequent track */
} SongNode;

typedef struct {
    SongNode *head;             /* Pointer to first song in playlist */
    SongNode *tail;             /* Pointer to last song in playlist */
    SongNode *current;          /* Pointer to currently playing song */
    int count;                  /* Total song count */
} Playlist;""")

    p = doc.add_paragraph("Key Operations on the Playlist Doubly Linked List:")
    p.paragraph_format.line_spacing = 1.2
    
    b1 = doc.add_paragraph(style='List Bullet')
    b1.add_run("playlist_insert_end(Playlist *pl, Song song): ").bold = True
    b1.add_run("Allocates a new SongNode via malloc(). Attaches newNode->prev = pl->tail, pl->tail->next = newNode, and updates pl->tail. Time complexity: O(1).")

    b2 = doc.add_paragraph(style='List Bullet')
    b2.add_run("playlist_remove(Playlist *pl, int song_id): ").bold = True
    b2.add_run("Locates the node by ID, adjusts curr->prev->next = curr->next and curr->next->prev = curr->prev. If curr is current, it advances current first. Frees node memory with free(curr). Time complexity: O(1) once node is located.")

    b3 = doc.add_paragraph(style='List Bullet')
    b3.add_run("playlist_play_next(MusicEngine *engine): ").bold = True
    b3.add_run("Checks if the FIFO queue has queued songs. If so, plays from queue. Otherwise, pushes current song to History Stack, and advances engine->playlist.current = engine->playlist.current->next. Time complexity: O(1).")

    # --- Sub 2: FIFO Queue ---
    h2 = doc.add_heading("3.2 FIFO Queue (The 'Up Next' Play Queue)", level=2)
    p = doc.add_paragraph(
        "The play queue implements First-In, First-Out (FIFO) semantics. When listeners discover tracks in the catalog and click '+ Queue', "
        "those songs must be guaranteed to play in the exact sequence they were queued, preceding the playlist's pre-arranged order."
    )
    p.paragraph_format.line_spacing = 1.2

    add_code_block(doc, """/* Singly-Linked FIFO Queue (music_player.h) */
typedef struct QueueNode {
    Song song;
    struct QueueNode *next;
} QueueNode;

typedef struct {
    QueueNode *front;           /* Dequeue target (Next song to be played) */
    QueueNode *rear;            /* Enqueue target (Newly added tracks) */
    int count;
} SongQueue;""")

    p = doc.add_paragraph("Key Operations on the FIFO Queue:")
    p.paragraph_format.line_spacing = 1.2

    b1 = doc.add_paragraph(style='List Bullet')
    b1.add_run("queue_enqueue(SongQueue *q, Song song): ").bold = True
    b1.add_run("Allocates a QueueNode, sets q->rear->next = newNode, and moves q->rear = newNode. If empty, both front and rear point to newNode. Time complexity: O(1).")

    b2 = doc.add_paragraph(style='List Bullet')
    b2.add_run("queue_dequeue(SongQueue *q, Song *out_song): ").bold = True
    b2.add_run("Extracts the song at q->front, advances q->front = q->front->next, and frees the detached node. If front becomes NULL, rear is set to NULL. Time complexity: O(1).")

    # --- Sub 3: LIFO Stack ---
    h2 = doc.add_heading("3.3 LIFO Stack (Playback History & Backtracking)", level=2)
    p = doc.add_paragraph(
        "Every time a track completes its duration or the user clicks 'Next Track', the current song payload is pushed onto a "
        "Last-In, First-Out (LIFO) History Stack. When the user clicks 'Previous Track', the engine pops the top element of the stack, "
        "restoring the exact previous listening context."
    )
    p.paragraph_format.line_spacing = 1.2

    add_code_block(doc, """/* Linked-List LIFO Stack (music_player.h) */
typedef struct StackNode {
    Song song;
    struct StackNode *next;
} StackNode;

typedef struct {
    StackNode *top;             /* Most recently played track */
    int count;
} HistoryStack;""")

    p = doc.add_paragraph("Key Operations on the LIFO Stack:")
    p.paragraph_format.line_spacing = 1.2

    b1 = doc.add_paragraph(style='List Bullet')
    b1.add_run("stack_push(HistoryStack *s, Song song): ").bold = True
    b1.add_run("Allocates StackNode, assigns newNode->next = s->top, and updates s->top = newNode. Time complexity: O(1).")

    b2 = doc.add_paragraph(style='List Bullet')
    b2.add_run("stack_pop(HistoryStack *s, Song *out_song): ").bold = True
    b2.add_run("Extracts the song at s->top, updates s->top = s->top->next, and frees the old top node. Time complexity: O(1).")

    # --- Sub 4: BST ---
    h2 = doc.add_heading("3.4 Binary Search Tree (Music Catalog Index & O(log N) Search)", level=2)
    p = doc.add_paragraph(
        "The catalog is organized in a Binary Search Tree (BST) sorted lexicographically (alphabetically) by song title. "
        "For any node X in the tree, all songs in its left subtree have titles alphabetically smaller than X, and all songs in its right subtree "
        "have titles alphabetically larger than X."
    )
    p.paragraph_format.line_spacing = 1.2

    add_code_block(doc, """/* Binary Search Tree Node (music_player.h) */
typedef struct BSTNode {
    Song song;
    struct BSTNode *left;       /* Alphabetically smaller titles */
    struct BSTNode *right;      /* Alphabetically larger titles */
} BSTNode;

typedef struct {
    BSTNode *root;
    int total_songs;
} SongBST;""")

    p = doc.add_paragraph("Key Operations on the BST:")
    p.paragraph_format.line_spacing = 1.2

    b1 = doc.add_paragraph(style='List Bullet')
    b1.add_run("bst_search(BSTNode *root, const char *title): ").bold = True
    b1.add_run("Compares query with root->song.title. If matched, returns pointer. If query < title, recurses left; if query > title, recurses right. Average Time Complexity: O(log N).")

    b2 = doc.add_paragraph(style='List Bullet')
    b2.add_run("bst_inorder_display(const BSTNode *root): ").bold = True
    b2.add_run("Performs in-order Depth-First Search traversal (Left -> Root -> Right), naturally outputting all catalog songs in alphabetically sorted order. Time complexity: O(N).")

    # -------------------------------------------------------------
    # 4. TIME & SPACE COMPLEXITY ANALYSIS
    # -------------------------------------------------------------
    doc.add_page_break()
    h1 = doc.add_heading("4. Time & Space Complexity Analysis", level=1)
    h1.paragraph_format.space_before = Pt(18)
    h1.paragraph_format.space_after = Pt(8)

    p = doc.add_paragraph(
        "Below is a rigorous comparative analysis of all primary operations across the system, demonstrating the efficiency "
        "gains of selecting specialized data structures over monolithic arrays."
    )
    p.paragraph_format.line_spacing = 1.2

    comp_table = doc.add_table(rows=8, cols=5)
    comp_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["System Operation", "Underlying Data Structure", "Best Time", "Worst Time", "Space"]
    for col_idx, text in enumerate(headers):
        c = comp_table.rows[0].cells[col_idx]
        set_cell_background(c, "0F172A")
        set_cell_margins(c, 100, 100, 120, 120)
        p = c.paragraphs[0]
        r = p.add_run(text)
        r.font.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    comp_data = [
        ("Next Track Traversal", "Doubly Linked List (current->next)", "O(1)", "O(1)", "O(1)"),
        ("Previous Track Traversal", "LIFO Stack (pop) / DLL (prev)", "O(1)", "O(1)", "O(1)"),
        ("Insert Song into Playlist", "Doubly Linked List (tail append)", "O(1)", "O(1)", "O(1)"),
        ("Delete Song from Playlist", "Doubly Linked List (pointer unlink)", "O(1)", "O(1)", "O(1)"),
        ("Enqueue Track (Play Next)", "FIFO Queue (rear append)", "O(1)", "O(1)", "O(1)"),
        ("Play Queued Track", "FIFO Queue (front dequeue)", "O(1)", "O(1)", "O(1)"),
        ("Search Song by Title", "Binary Search Tree (BST Search)", "O(1)", "O(log N)*", "O(1)")
    ]

    for row_idx, data in enumerate(comp_data):
        row = comp_table.rows[row_idx + 1]
        bg_color = "F8FAFC" if row_idx % 2 == 0 else "FFFFFF"
        for col_idx, val in enumerate(data):
            c = row.cells[col_idx]
            set_cell_background(c, bg_color)
            set_cell_margins(c, 80, 80, 100, 100)
            p = c.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(9)
            r.font.name = 'Segoe UI'
            if col_idx in [2, 3, 4]:
                r.font.bold = True
                r.font.color.rgb = PRIMARY_COLOR
            else:
                r.font.color.rgb = DARK_TEXT

    p_note = doc.add_paragraph()
    p_note.paragraph_format.space_before = Pt(6)
    r_note = p_note.add_run("*Note: In a balanced BST, search time is strictly O(log N). Worst case for completely skewed BST is O(N), mitigated by balanced insertion orders.")
    r_note.font.size = Pt(8.5)
    r_note.font.italic = True
    r_note.font.color.rgb = MUTED_TEXT

    # -------------------------------------------------------------
    # 5. USER INTERFACE & SCREENSHOTS REPORT
    # -------------------------------------------------------------
    doc.add_page_break()
    h1 = doc.add_heading("5. Web Application Interface & Visual Verification", level=1)
    h1.paragraph_format.space_before = Pt(18)
    h1.paragraph_format.space_after = Pt(8)

    p = doc.add_paragraph(
        "To provide an intuitive, visual presentation of the C data structures, TuneStream includes a responsive web application "
        "deployed directly to GitHub Pages. Below are screenshots captured during automated browser testing, highlighting each architectural subsystem."
    )
    p.paragraph_format.line_spacing = 1.2

    # Image 1
    h2 = doc.add_heading("5.1 Complete Live System Overview", level=2)
    p = doc.add_paragraph(
        "The interface is divided into three distinct panes: Left (Song Catalog & BST Search), Center (Playback Deck & Active Doubly Linked List), "
        "and Right (Real-Time Data Structures Inspector). The header features active live status badges displaying node counts across the DLL, Queue, and Stack."
    )
    p.paragraph_format.line_spacing = 1.2

    if os.path.exists("assets/live_player_overview.png"):
        img_p = doc.add_paragraph()
        img_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        img_run = img_p.add_run()
        img_run.add_picture("assets/live_player_overview.png", width=Inches(6.0))
        cap = doc.add_paragraph("Figure 1: Complete Live System Overview on GitHub Pages (https://neevjain-07.github.io/DSAPROJECT/)")
        cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        cap.paragraph_format.space_after = Pt(14)
        cap.runs[0].font.size = Pt(8.5)
        cap.runs[0].font.italic = True
        cap.runs[0].font.color.rgb = MUTED_TEXT

    # Image 2
    h2 = doc.add_heading("5.2 Active Playback, Equalizer Waves & BST Search in Action", level=2)
    p = doc.add_paragraph(
        "When playback begins, the vinyl disc rotates and animated equalizer waveforms reflect audio activity generated by the Web Audio API synthesizer. "
        "Typing into the search box traverses the Binary Search Tree live, displaying the exact comparison count and filtering the catalog instantaneously."
    )
    p.paragraph_format.line_spacing = 1.2

    if os.path.exists("assets/active_playback_search.png"):
        img_p = doc.add_paragraph()
        img_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        img_run = img_p.add_run()
        img_run.add_picture("assets/active_playback_search.png", width=Inches(6.0))
        cap = doc.add_paragraph("Figure 2: Active Vinyl Animation, Sound Synthesizer Equalizer, and Real-Time BST Search Traversal")
        cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        cap.paragraph_format.space_after = Pt(14)
        cap.runs[0].font.size = Pt(8.5)
        cap.runs[0].font.italic = True
        cap.runs[0].font.color.rgb = MUTED_TEXT

    # Image 3
    h2 = doc.add_heading("5.3 Custom Song Insertion Modal (Dynamic Allocation)", level=2)
    p = doc.add_paragraph(
        "Users can click 'Add Song' to insert custom tracks into the system. The modal allows targeting the Active Playlist (DLL append), "
        "the 'Up Next' Queue (FIFO enqueue), or the Library Catalog (BST insertion). This demonstrates dynamic memory allocation at runtime."
    )
    p.paragraph_format.line_spacing = 1.2

    if os.path.exists("assets/add_song_modal.png"):
        img_p = doc.add_paragraph()
        img_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        img_run = img_p.add_run()
        img_run.add_picture("assets/add_song_modal.png", width=Inches(5.5))
        cap = doc.add_paragraph("Figure 3: Interactive Modal for Dynamic Track Creation & Target Data Structure Routing")
        cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        cap.paragraph_format.space_after = Pt(14)
        cap.runs[0].font.size = Pt(8.5)
        cap.runs[0].font.italic = True
        cap.runs[0].font.color.rgb = MUTED_TEXT

    # Image 4
    h2 = doc.add_heading("5.4 Data Structures Inspector Tabs & Live Memory Pointers", level=2)
    p = doc.add_paragraph(
        "The Right Inspector Pane allows examiners to toggle between the Doubly Linked List chain (showing explicit prev and next pointers), "
        "the FIFO Queue cards (with FRONT and REAR indicators), the LIFO Stack (with glowing TOP OF STACK badge), the BST Index, and raw C source code."
    )
    p.paragraph_format.line_spacing = 1.2

    if os.path.exists("assets/inspector_tabs_detail.png"):
        img_p = doc.add_paragraph()
        img_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        img_run = img_p.add_run()
        img_run.add_picture("assets/inspector_tabs_detail.png", width=Inches(6.0))
        cap = doc.add_paragraph("Figure 4: Live Data Structure Memory Inspector showing Stack, Queue, DLL chain, and C Source View")
        cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        cap.paragraph_format.space_after = Pt(14)
        cap.runs[0].font.size = Pt(8.5)
        cap.runs[0].font.italic = True
        cap.runs[0].font.color.rgb = MUTED_TEXT

    # -------------------------------------------------------------
    # 6. TESTING & QUALITY ASSURANCE
    # -------------------------------------------------------------
    doc.add_page_break()
    h1 = doc.add_heading("6. Testing & Quality Assurance Report", level=1)
    h1.paragraph_format.space_before = Pt(18)
    h1.paragraph_format.space_after = Pt(8)

    p = doc.add_paragraph(
        "TuneStream was subjected to two layers of rigorous verification: automated C unit testing with assertions, "
        "and browser-based end-to-end integration testing."
    )
    p.paragraph_format.line_spacing = 1.2

    h2 = doc.add_heading("6.1 C Automated Unit Test Suite (test_player.c)", level=2)
    p = doc.add_paragraph(
        "The C test suite tests all edge cases for memory management, pointer links, empty queue/stack conditions, and BST lookups. "
        "The test runner can be executed using 'make check':"
    )
    p.paragraph_format.line_spacing = 1.2

    add_code_block(doc, """$ cd c_src && make check
=========================================
  RUNNING TUNESTREAM DATA STRUCTURE TESTS 
=========================================
[Test] Running Doubly Linked List tests...
  -> Doubly Linked List tests PASSED!
[Test] Running FIFO Up Next Queue tests...
  -> FIFO Queue tests PASSED!
[Test] Running LIFO History Stack tests...
  -> LIFO Stack tests PASSED!
[Test] Running Binary Search Tree (Library Search) tests...
  -> Binary Search Tree tests PASSED!

All 4 Data Structure test suites PASSED successfully!""")

    h2 = doc.add_heading("6.2 Browser Integration & Deployment Test Summary", level=2)
    test_table = doc.add_table(rows=6, cols=3)
    test_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    th = ["Test Scenario", "Tested Functionality", "Result"]
    for idx, t in enumerate(th):
        c = test_table.rows[0].cells[idx]
        set_cell_background(c, "0F172A")
        set_cell_margins(c, 80, 80, 100, 100)
        p = c.paragraphs[0]
        r = p.add_run(t)
        r.font.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    scenarios = [
        ("Playback Initiation", "Play button triggers Web Audio synth tone and vinyl animation", "PASSED (0 Errors)"),
        ("Queue Priority Skip", "Enqueued track plays first before playlist sequential advance", "PASSED (0 Errors)"),
        ("History Stack Pop", "Previous button pops top element of history stack cleanly", "PASSED (0 Errors)"),
        ("BST Real-Time Search", "Live title search queries BST and filters catalog in O(log N)", "PASSED (0 Errors)"),
        ("Custom Track Creation", "Modal inserts new node and updates DLL, Queue, and BST", "PASSED (0 Errors)")
    ]
    for r_idx, (sc, tf, res) in enumerate(scenarios):
        row = test_table.rows[r_idx + 1]
        for c_idx, val in enumerate([sc, tf, res]):
            c = row.cells[c_idx]
            set_cell_background(c, "F8FAFC" if r_idx % 2 == 0 else "FFFFFF")
            set_cell_margins(c, 70, 70, 90, 90)
            p = c.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(9)
            if c_idx == 2:
                r.font.bold = True
                r.font.color.rgb = PRIMARY_COLOR
            else:
                r.font.color.rgb = DARK_TEXT

    # -------------------------------------------------------------
    # 7. SLIDE-BY-SLIDE PPT GENERATION PROMPT & OUTLINE
    # -------------------------------------------------------------
    doc.add_page_break()
    h1 = doc.add_heading("7. Slide-by-Slide PowerPoint Presentation Guide", level=1)
    h1.paragraph_format.space_before = Pt(18)
    h1.paragraph_format.space_after = Pt(8)

    p = doc.add_paragraph(
        "You can directly copy and paste the section below into an AI presentation tool (such as ChatGPT, Gamma, or Microsoft Copilot) "
        "or use it as your speaking notes for creating your PPT slides:"
    )
    p.paragraph_format.line_spacing = 1.2

    slides = [
        ("Slide 1: Title Slide", 
         "Title: TuneStream - Music Streaming & Play Queue Manager\n"
         "Subtitle: Applied Data Structures & Algorithms (C & Interactive Web App)\n"
         "Presenter: Neev Jain\n"
         "Live Link: https://neevjain-07.github.io/DSAPROJECT/"),
        
        ("Slide 2: The Core Problem", 
         "• How do music streaming platforms (Spotify, Apple Music) handle instant skipping, custom song queues, and search?\n"
         "• Why Static Arrays Fail: O(N) element shifts on deletion/insertion; fixed memory limits.\n"
         "• Solution: 4 specialized data structures (Doubly Linked List, Queue, Stack, BST) delivering O(1) and O(log N) operations."),
        
        ("Slide 3: System Architecture Overview", 
         "• Dual Architecture: Pure C Backend Engine + Live Web Frontend.\n"
         "• 4 Data Structures working in harmony:\n"
         "  1. Doubly Linked List -> Active Playlist\n"
         "  2. FIFO Queue -> 'Up Next' Priority Queue\n"
         "  3. LIFO Stack -> Playback History (Back/Undo)\n"
         "  4. Binary Search Tree -> Fast Song Catalog Index"),
        
        ("Slide 4: Data Structure 1 - Doubly Linked List (Playlist)", 
         "• Memory Layout: [prev pointer | Song Data | next pointer]\n"
         "• Next Track: current = current->next in O(1) time.\n"
         "• Previous Track: current = current->prev in O(1) time.\n"
         "• Song Removal: Updates 2 neighboring pointers in O(1) with zero array shifting."),
        
        ("Slide 5: Data Structure 2 - FIFO Queue ('Up Next')", 
         "• First-In, First-Out queue for prioritized listening.\n"
         "• Enqueue: Adding a song attaches to rear in O(1).\n"
         "• Dequeue: When skipping, the player checks the queue first; dequeues from front in O(1) before resuming playlist."),
        
        ("Slide 6: Data Structure 3 - LIFO Stack (Playback History)", 
         "• Push: Every finished or skipped track is pushed onto the stack in O(1).\n"
         "• Pop: Clicking 'Previous' pops the most recently played track from top of stack.\n"
         "• Guarantees precise backtracking even after jumping between queues and playlists."),
        
        ("Slide 7: Data Structure 4 - Binary Search Tree (Library Index)", 
         "• All catalog songs indexed alphabetically by title.\n"
         "• Left Subtree < Root < Right Subtree.\n"
         "• Instant Search: O(log N) lookup time vs O(N) linear search.\n"
         "• In-Order Traversal: Automatically produces sorted alphabetical track list."),
        
        ("Slide 8: Algorithmic Complexity Table", 
         "• Next/Prev Track: O(1) Time | O(1) Space\n"
         "• Enqueue/Dequeue: O(1) Time | O(1) Space\n"
         "• Push/Pop History: O(1) Time | O(1) Space\n"
         "• Search Song: O(log N) Time | O(1) Space\n"
         "• Demonstrates maximum algorithmic efficiency."),
        
        ("Slide 9: Live Interactive Web Demo", 
         "• Show Figure 1 (Live Overview) and Figure 2 (Active Playback & Equalizer).\n"
         "• Highlight Live Inspector: Real-time visual nodes showing memory pointers.\n"
         "• Web Audio Synthesizer: Actually plays ambient melodies in browser!"),
        
        ("Slide 10: C Implementation & Unit Testing", 
         "• Standards-compliant ANSI C99 with dynamic memory management (malloc, free).\n"
         "• Makefile included: 'make run' launches CLI, 'make check' executes unit tests.\n"
         "• 100% test pass rate across all 4 data structures."),
        
        ("Slide 11: Deployment & GitHub Live Link", 
         "• Repository: https://github.com/NeevJain-07/DSAPROJECT\n"
         "• Hosted live via GitHub Pages: Zero server costs, 100% client-side execution.\n"
         "• Accessible on mobile, tablet, and desktop browsers."),
        
        ("Slide 12: Conclusion & Key Learnings", 
         "• Data structures are not abstract textbook theory—they power real consumer apps.\n"
         "• Pointers enable seamless O(1) manipulation without expensive memory copying.\n"
         "• Questions & Viva Q&A Session.")
    ]

    for title, content in slides:
        h3 = doc.add_heading(title, level=3)
        h3.paragraph_format.space_before = Pt(10)
        h3.paragraph_format.space_after = Pt(4)
        add_code_block(doc, content)

    # -------------------------------------------------------------
    # 8. VIVA VOCE QUESTIONS & ANSWERS (TOP 10 EXAM CHEAT SHEET)
    # -------------------------------------------------------------
    doc.add_page_break()
    h1 = doc.add_heading("8. Viva Voce Cheat Sheet: Top 10 Questions & Expert Answers", level=1)
    h1.paragraph_format.space_before = Pt(18)
    h1.paragraph_format.space_after = Pt(8)

    p = doc.add_paragraph(
        "Examiners frequently ask targeted questions about pointers, memory management, and time complexities. "
        "Review these 10 curated questions and model answers prior to your presentation:"
    )
    p.paragraph_format.line_spacing = 1.2

    viva_qa = [
        ("Q1: Why did you choose a Doubly Linked List instead of a dynamic array (like std::vector or realloc) for the playlist?",
         "A: In a music playlist, insertions and deletions frequently happen anywhere (e.g. deleting track #2 or inserting after the currently playing song). In an array, removing an element requires shifting all remaining elements to the left, which is O(N). A Doubly Linked List achieves insertion and deletion in O(1) time simply by unlinking and relinking adjacent node pointers without touching other elements."),
        
        ("Q2: How does your player coordinate between the FIFO Queue and the Doubly Linked List when the user skips to the next track?",
         "A: The player checks the FIFO Queue first using queue_is_empty(). If a song is enqueued, it dequeues that track from the front and plays it first. Only when the FIFO Queue is completely empty does the player advance along the Doubly Linked List using current = current->next. In both cases, the previous track is pushed onto the LIFO History Stack."),
        
        ("Q3: Why is a Stack suitable for the 'Previous Track' feature instead of just using current->prev?",
         "A: If the user plays tracks strictly in sequential order, current->prev works. But in real life, users jump around—they play from a queue, search a random song, or shuffle. If you listen to Song A, then jump to Song Z, clicking 'Previous' should take you back to Song A (the song you just listened to), not Song Y (the predecessor of Z in the album). A LIFO stack preserves chronological playback history regardless of playlist positioning."),
        
        ("Q4: What is the time complexity of searching for a song in your Binary Search Tree?",
         "A: On average, searching a BST takes O(log N) time, where N is the total number of songs in the catalog. In each comparison step, we eliminate half of the remaining tree branches. In the worst case (if the tree becomes a degenerated linked list), it takes O(N), which can be prevented using self-balancing trees like AVL or Red-Black trees."),
        
        ("Q5: How do you handle dynamic memory deallocation in C to avoid memory leaks?",
         "A: Every malloc() in our C code has a corresponding free(). For the Doubly Linked List, playlist_free() traverses the chain and frees each SongNode. For the FIFO Queue, queue_clear() dequeues and frees every QueueNode. For the Stack, stack_clear() pops and frees every StackNode. For the BST, bst_free() uses post-order recursive traversal (freeing left and right subtrees before freeing the root node)."),
        
        ("Q6: What happens when the playlist reaches the last song (tail->next is NULL)?",
         "A: Our code checks if repeat mode is enabled (engine->is_repeat). If repeat is ON, current loops back to head (current = playlist->head). If repeat is OFF, current is set to NULL, playback stops, and the system reports that the end of the playlist has been reached."),
        
        ("Q7: What is the difference between passing a pointer vs a double pointer when modifying linked structures in C?",
         "A: When modifying a pointer itself (such as updating head when the list was empty or passing root in a BST insertion), we either pass a double pointer (e.g. BSTNode **root) or have the function return the updated pointer (e.g. root = bst_insert(root, song)). Returning the new pointer ensures clean, idiomatic recursion in C99."),
        
        ("Q8: How did you implement real sound in the web application without external audio files?",
         "A: We used the browser's native Web Audio API (AudioContext, OscillatorNode, and GainNode). When a song plays, the synthesizer generates an arpeggiated melodic tone mapped to the song's musical key frequency (e.g., 440 Hz for A4). The synthesizer starts on play and stops on pause, creating an authentic audio feedback loop."),
        
        ("Q9: How is the web application deployed without a server or backend database?",
         "A: The web application is built with standard HTML5, Vanilla CSS, and JavaScript. It runs 100% client-side in the user's browser, maintaining all data structures directly in browser memory. This allows it to be hosted statically on GitHub Pages with zero server latency or hosting costs."),
        
        ("Q10: What are the space complexities of your four data structures?",
         "A: All four data structures have linear O(N) auxiliary space complexity proportional to the number of stored songs. Each node only stores the song payload (fixed size struct) plus 1 or 2 pointers (8 bytes each on 64-bit systems). There is zero over-allocation or memory wastage from oversized arrays.")
    ]

    for q, a in viva_qa:
        p_q = doc.add_paragraph()
        p_q.paragraph_format.space_before = Pt(8)
        p_q.paragraph_format.space_after = Pt(2)
        r_q = p_q.add_run(q)
        r_q.font.bold = True
        r_q.font.size = Pt(10)
        r_q.font.color.rgb = DARK_TEXT

        p_a = doc.add_paragraph()
        p_a.paragraph_format.space_after = Pt(8)
        p_a.paragraph_format.line_spacing = 1.15
        r_a = p_a.add_run(a)
        r_a.font.size = Pt(9.5)
        r_a.font.color.rgb = MUTED_TEXT

    # Save Document
    output_filename = "TuneStream_DSA_Project_Report.docx"
    doc.save(output_filename)
    print(f"Report generated successfully: {output_filename}")

if __name__ == '__main__':
    create_report()
