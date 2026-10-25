#include "music_player.h"

/* Helper for case-insensitive string compare */
static int ci_strcmp(const char *s1, const char *s2) {
    while (*s1 && *s2) {
        char c1 = (*s1 >= 'A' && *s1 <= 'Z') ? (*s1 + 32) : *s1;
        char c2 = (*s2 >= 'A' && *s2 <= 'Z') ? (*s2 + 32) : *s2;
        if (c1 != c2) return c1 - c2;
        s1++;
        s2++;
    }
    return *s1 - *s2;
}

Song create_song(int id, const char *title, const char *artist, int duration_sec, const char *genre) {
    Song s;
    s.id = id;
    strncpy(s.title, title, MAX_TITLE_LEN - 1);
    s.title[MAX_TITLE_LEN - 1] = '\0';
    strncpy(s.artist, artist, MAX_ARTIST_LEN - 1);
    s.artist[MAX_ARTIST_LEN - 1] = '\0';
    s.duration_sec = duration_sec;
    strncpy(s.genre, genre, MAX_GENRE_LEN - 1);
    s.genre[MAX_GENRE_LEN - 1] = '\0';
    return s;
}

void format_duration(int seconds, char *buffer, size_t max_len) {
    if (!buffer || max_len == 0) return;
    int mins = seconds / 60;
    int secs = seconds % 60;
    snprintf(buffer, max_len, "%d:%02d", mins, secs);
}

/* ========================================================================= */
/* 1. DOUBLY LINKED LIST (PLAYLIST) IMPLEMENTATION                           */
/* ========================================================================= */

Playlist* playlist_create(void) {
    Playlist *pl = (Playlist*)malloc(sizeof(Playlist));
    if (!pl) return NULL;
    pl->head = NULL;
    pl->tail = NULL;
    pl->current = NULL;
    pl->count = 0;
    return pl;
}

void playlist_insert_end(Playlist *pl, Song song) {
    if (!pl) return;

    SongNode *newNode = (SongNode*)malloc(sizeof(SongNode));
    if (!newNode) return;
    newNode->song = song;
    newNode->next = NULL;
    newNode->prev = pl->tail;

    if (pl->tail == NULL) {
        /* List is currently empty */
        pl->head = newNode;
        pl->tail = newNode;
        pl->current = newNode;
    } else {
        pl->tail->next = newNode;
        pl->tail = newNode;
    }
    pl->count++;
}

void playlist_insert_after(Playlist *pl, SongNode *target, Song song) {
    if (!pl || !target) return;

    SongNode *newNode = (SongNode*)malloc(sizeof(SongNode));
    if (!newNode) return;
    newNode->song = song;
    newNode->prev = target;
    newNode->next = target->next;

    if (target->next != NULL) {
        target->next->prev = newNode;
    } else {
        pl->tail = newNode;
    }
    target->next = newNode;
    pl->count++;
}

bool playlist_remove(Playlist *pl, int song_id) {
    if (!pl || pl->head == NULL) return false;

    SongNode *curr = pl->head;
    while (curr) {
        if (curr->song.id == song_id) {
            /* If deleting current song, advance current first */
            if (pl->current == curr) {
                pl->current = curr->next ? curr->next : curr->prev;
            }

            if (curr->prev != NULL) {
                curr->prev->next = curr->next;
            } else {
                pl->head = curr->next;
            }

            if (curr->next != NULL) {
                curr->next->prev = curr->prev;
            } else {
                pl->tail = curr->prev;
            }

            free(curr);
            pl->count--;
            return true;
        }
        curr = curr->next;
    }
    return false;
}

Song* playlist_get_current(Playlist *pl) {
    if (!pl || !pl->current) return NULL;
    return &pl->current->song;
}

Song* playlist_play_next(MusicEngine *engine) {
    if (!engine) return NULL;

    /* 1. Check if FIFO Queue has songs waiting in 'Up Next' */
    if (!queue_is_empty(&engine->up_next_queue)) {
        Song next_up;
        if (queue_dequeue(&engine->up_next_queue, &next_up)) {
            /* Push previous song onto LIFO history stack */
            if (engine->playlist.current) {
                stack_push(&engine->history_stack, engine->playlist.current->song);
            }
            /* Insert temporary or find in playlist */
            playlist_insert_end(&engine->playlist, next_up);
            engine->playlist.current = engine->playlist.tail;
            return &engine->playlist.current->song;
        }
    }

    /* 2. Standard Doubly Linked List forward traversal */
    if (!engine->playlist.current) {
        engine->playlist.current = engine->playlist.head;
        return engine->playlist.current ? &engine->playlist.current->song : NULL;
    }

    /* Push current song onto history stack before moving */
    stack_push(&engine->history_stack, engine->playlist.current->song);

    if (engine->playlist.current->next != NULL) {
        engine->playlist.current = engine->playlist.current->next;
    } else if (engine->is_repeat) {
        engine->playlist.current = engine->playlist.head; /* Loop back */
    } else {
        printf("End of playlist reached.\n");
        return NULL;
    }

    return &engine->playlist.current->song;
}

Song* playlist_play_prev(MusicEngine *engine) {
    if (!engine) return NULL;

    /* 1. Check LIFO History Stack first */
    if (!stack_is_empty(&engine->history_stack)) {
        Song prev_history;
        if (stack_pop(&engine->history_stack, &prev_history)) {
            /* Search for it in current playlist */
            SongNode *curr = engine->playlist.head;
            while (curr) {
                if (curr->song.id == prev_history.id) {
                    engine->playlist.current = curr;
                    return &curr->song;
                }
                curr = curr->next;
            }
        }
    }

    /* 2. Fall back to Doubly Linked List prev pointer */
    if (engine->playlist.current && engine->playlist.current->prev != NULL) {
        engine->playlist.current = engine->playlist.current->prev;
        return &engine->playlist.current->song;
    }

    return engine->playlist.current ? &engine->playlist.current->song : NULL;
}

void playlist_display(const Playlist *pl) {
    if (!pl || pl->head == NULL) {
        printf("Playlist is currently empty.\n");
        return;
    }

    printf("\n=== ACTIVE PLAYLIST (Doubly Linked List: %d songs) ===\n", pl->count);
    SongNode *curr = pl->head;
    int index = 1;
    char dur_str[16];

    while (curr) {
        format_duration(curr->song.duration_sec, dur_str, sizeof(dur_str));
        bool is_now_playing = (curr == pl->current);

        printf("%s [%d] %-24s | %-18s | %s | %s\n",
               is_now_playing ? "▶ (NOW)" : "       ",
               index++,
               curr->song.title,
               curr->song.artist,
               dur_str,
               curr->song.genre);
        curr = curr->next;
    }
}

void playlist_free(Playlist *pl) {
    if (!pl) return;
    SongNode *curr = pl->head;
    while (curr) {
        SongNode *temp = curr;
        curr = curr->next;
        free(temp);
    }
    pl->head = pl->tail = pl->current = NULL;
    pl->count = 0;
}

/* ========================================================================= */
/* 2. FIFO QUEUE ("UP NEXT") IMPLEMENTATION                                 */
/* ========================================================================= */

void queue_init(SongQueue *q) {
    if (!q) return;
    q->front = NULL;
    q->rear = NULL;
    q->count = 0;
}

void queue_enqueue(SongQueue *q, Song song) {
    if (!q) return;

    QueueNode *newNode = (QueueNode*)malloc(sizeof(QueueNode));
    if (!newNode) return;
    newNode->song = song;
    newNode->next = NULL;

    if (q->rear == NULL) {
        q->front = q->rear = newNode;
    } else {
        q->rear->next = newNode;
        q->rear = newNode;
    }
    q->count++;
}

bool queue_dequeue(SongQueue *q, Song *out_song) {
    if (!q || q->front == NULL) return false;

    QueueNode *temp = q->front;
    if (out_song) {
        *out_song = temp->song;
    }
    q->front = q->front->next;
    if (q->front == NULL) {
        q->rear = NULL;
    }
    free(temp);
    q->count--;
    return true;
}

bool queue_peek(const SongQueue *q, Song *out_song) {
    if (!q || q->front == NULL) return false;
    if (out_song) {
        *out_song = q->front->song;
    }
    return true;
}

bool queue_is_empty(const SongQueue *q) {
    return (q == NULL || q->count == 0);
}

void queue_display(const SongQueue *q) {
    if (!q || q->front == NULL) {
        printf("Up Next queue is empty.\n");
        return;
    }
    printf("\n=== UP NEXT PLAY QUEUE (FIFO: %d tracks) ===\n", q->count);
    QueueNode *curr = q->front;
    int idx = 1;
    char dur_str[16];
    while (curr) {
        format_duration(curr->song.duration_sec, dur_str, sizeof(dur_str));
        printf(" [%d] %-24s | %-18s | %s\n", idx++, curr->song.title, curr->song.artist, dur_str);
        curr = curr->next;
    }
}

void queue_clear(SongQueue *q) {
    if (!q) return;
    Song s;
    while (queue_dequeue(q, &s));
}

/* ========================================================================= */
/* 3. LIFO STACK (HISTORY) IMPLEMENTATION                                    */
/* ========================================================================= */

void stack_init(HistoryStack *s) {
    if (!s) return;
    s->top = NULL;
    s->count = 0;
}

void stack_push(HistoryStack *s, Song song) {
    if (!s) return;

    StackNode *newNode = (StackNode*)malloc(sizeof(StackNode));
    if (!newNode) return;
    newNode->song = song;
    newNode->next = s->top;
    s->top = newNode;
    s->count++;
}

bool stack_pop(HistoryStack *s, Song *out_song) {
    if (!s || s->top == NULL) return false;

    StackNode *temp = s->top;
    if (out_song) {
        *out_song = temp->song;
    }
    s->top = temp->next;
    free(temp);
    s->count--;
    return true;
}

bool stack_peek(const HistoryStack *s, Song *out_song) {
    if (!s || s->top == NULL) return false;
    if (out_song) {
        *out_song = s->top->song;
    }
    return true;
}

bool stack_is_empty(const HistoryStack *s) {
    return (s == NULL || s->count == 0);
}

void stack_display(const HistoryStack *s) {
    if (!s || s->top == NULL) {
        printf("Playback history is empty.\n");
        return;
    }
    printf("\n=== RECENTLY PLAYED HISTORY (LIFO Stack: %d tracks) ===\n", s->count);
    StackNode *curr = s->top;
    int idx = 1;
    char dur_str[16];
    while (curr) {
        format_duration(curr->song.duration_sec, dur_str, sizeof(dur_str));
        printf(" [%d] %-24s | %-18s | %s%s\n",
               idx++,
               curr->song.title,
               curr->song.artist,
               dur_str,
               (curr == s->top) ? "  <-- TOP (Most Recent)" : "");
        curr = curr->next;
    }
}

void stack_clear(HistoryStack *s) {
    if (!s) return;
    Song sng;
    while (stack_pop(s, &sng));
}

/* ========================================================================= */
/* 4. BINARY SEARCH TREE (SONG CATALOG INDEX) IMPLEMENTATION                 */
/* ========================================================================= */

void bst_init(SongBST *bst) {
    if (!bst) return;
    bst->root = NULL;
    bst->total_songs = 0;
}

BSTNode* bst_insert(BSTNode *root, Song song) {
    if (root == NULL) {
        BSTNode *newNode = (BSTNode*)malloc(sizeof(BSTNode));
        if (!newNode) return NULL;
        newNode->song = song;
        newNode->left = NULL;
        newNode->right = NULL;
        return newNode;
    }

    int cmp = ci_strcmp(song.title, root->song.title);
    if (cmp < 0) {
        root->left = bst_insert(root->left, song);
    } else if (cmp > 0) {
        root->right = bst_insert(root->right, song);
    }
    return root;
}

BSTNode* bst_search(BSTNode *root, const char *title) {
    if (root == NULL || title == NULL) return NULL;

    int cmp = ci_strcmp(title, root->song.title);
    if (cmp == 0) {
        return root;
    } else if (cmp < 0) {
        return bst_search(root->left, title);
    } else {
        return bst_search(root->right, title);
    }
}

void bst_inorder_display(const BSTNode *root) {
    if (!root) return;
    bst_inorder_display(root->left);

    char dur_str[16];
    format_duration(root->song.duration_sec, dur_str, sizeof(dur_str));
    printf(" #%-3d %-26s | %-20s | %s\n",
           root->song.id,
           root->song.title,
           root->song.artist,
           dur_str);

    bst_inorder_display(root->right);
}

void bst_free(BSTNode *root) {
    if (!root) return;
    bst_free(root->left);
    bst_free(root->right);
    free(root);
}

/* ========================================================================= */
/* 5. ENGINE CONTAINER & INITIALIZATION                                      */
/* ========================================================================= */

MusicEngine* engine_create(void) {
    MusicEngine *engine = (MusicEngine*)malloc(sizeof(MusicEngine));
    if (!engine) return NULL;

    engine->playlist.head = NULL;
    engine->playlist.tail = NULL;
    engine->playlist.current = NULL;
    engine->playlist.count = 0;

    queue_init(&engine->up_next_queue);
    stack_init(&engine->history_stack);
    bst_init(&engine->library_bst);

    engine->is_playing = false;
    engine->is_repeat = false;
    engine->is_shuffle = false;

    return engine;
}

void engine_free(MusicEngine *engine) {
    if (!engine) return;
    playlist_free(&engine->playlist);
    queue_clear(&engine->up_next_queue);
    stack_clear(&engine->history_stack);
    bst_free(engine->library_bst.root);
    free(engine);
}

void engine_load_sample_data(MusicEngine *engine) {
    if (!engine) return;

    Song s1 = create_song(1, "Blinding Lights", "The Weeknd", 200, "Synthwave");
    Song s2 = create_song(2, "Levitating", "Dua Lipa", 203, "Pop");
    Song s3 = create_song(3, "Starboy", "The Weeknd & Daft Punk", 230, "R&B");
    Song s4 = create_song(4, "Shape of You", "Ed Sheeran", 233, "Pop");
    Song s5 = create_song(5, "Save Your Tears", "The Weeknd", 215, "Synth-pop");
    Song s6 = create_song(6, "Stay", "The Kid LAROI & Justin Bieber", 141, "Pop");
    Song s7 = create_song(7, "As It Was", "Harry Styles", 167, "Indie Pop");
    Song s8 = create_song(8, "Sunflower", "Post Malone & Swae Lee", 158, "Hip-hop");

    /* Populate BST Catalog */
    engine->library_bst.root = bst_insert(engine->library_bst.root, s1);
    engine->library_bst.root = bst_insert(engine->library_bst.root, s2);
    engine->library_bst.root = bst_insert(engine->library_bst.root, s3);
    engine->library_bst.root = bst_insert(engine->library_bst.root, s4);
    engine->library_bst.root = bst_insert(engine->library_bst.root, s5);
    engine->library_bst.root = bst_insert(engine->library_bst.root, s6);
    engine->library_bst.root = bst_insert(engine->library_bst.root, s7);
    engine->library_bst.root = bst_insert(engine->library_bst.root, s8);
    engine->library_bst.total_songs = 8;

    /* Add first 5 to active playlist */
    playlist_insert_end(&engine->playlist, s1);
    playlist_insert_end(&engine->playlist, s2);
    playlist_insert_end(&engine->playlist, s3);
    playlist_insert_end(&engine->playlist, s4);
    playlist_insert_end(&engine->playlist, s5);

    /* Enqueue 1 track into FIFO queue */
    queue_enqueue(&engine->up_next_queue, s6);
}
