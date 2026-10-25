#ifndef MUSIC_PLAYER_H
#define MUSIC_PLAYER_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <time.h>

#define MAX_TITLE_LEN 64
#define MAX_ARTIST_LEN 64
#define MAX_GENRE_LEN 32

/* ========================================================================= */
/* BASE SONG DATA STRUCTURE                                                  */
/* ========================================================================= */

typedef struct Song {
    int id;
    char title[MAX_TITLE_LEN];
    char artist[MAX_ARTIST_LEN];
    int duration_sec;           /* Duration in seconds (e.g. 215 = 3:35) */
    char genre[MAX_GENRE_LEN];
} Song;

/* ========================================================================= */
/* 1. DOUBLY LINKED LIST (The Active Playlist)                              */
/* ========================================================================= */

/**
 * SongNode: Represents a node in the Doubly Linked List.
 * Allows O(1) bi-directional navigation (Next / Previous track)
 * and O(1) insertion/deletion once the position pointer is known.
 */
typedef struct SongNode {
    Song song;
    struct SongNode *prev;      /* Pointer to preceding song in playlist */
    struct SongNode *next;      /* Pointer to subsequent song in playlist */
} SongNode;

typedef struct {
    SongNode *head;             /* First song in playlist */
    SongNode *tail;             /* Last song in playlist */
    SongNode *current;          /* Currently playing song */
    int count;                  /* Total songs in playlist */
} Playlist;

/* ========================================================================= */
/* 2. FIFO QUEUE (The "Up Next" Play Queue)                                 */
/* ========================================================================= */

/**
 * QueueNode: Singly linked node for the FIFO "Up Next" queue.
 * Songs enqueued by the user play before advancing to the playlist sequence.
 */
typedef struct QueueNode {
    Song song;
    struct QueueNode *next;
} QueueNode;

typedef struct {
    QueueNode *front;           /* Dequeue point (Next to play) */
    QueueNode *rear;            /* Enqueue point (Newly added) */
    int count;
} SongQueue;

/* ========================================================================= */
/* 3. LIFO STACK (Recently Played History)                                   */
/* ========================================================================= */

/**
 * StackNode: Node for LIFO playback history.
 * Every time a song finishes or skips, it is pushed onto the history stack.
 * Clicking "Back" pops the most recent song.
 */
typedef struct StackNode {
    Song song;
    struct StackNode *next;
} StackNode;

typedef struct {
    StackNode *top;             /* Most recently played track */
    int count;
} HistoryStack;

/* ========================================================================= */
/* 4. BINARY SEARCH TREE (Song Library Index & Fast Search)                  */
/* ========================================================================= */

/**
 * BSTNode: Binary Search Tree node sorted alphabetically by song title.
 * Provides O(log N) search lookup across the entire music catalog.
 */
typedef struct BSTNode {
    Song song;
    struct BSTNode *left;       /* Titles alphabetically smaller */
    struct BSTNode *right;      /* Titles alphabetically larger */
} BSTNode;

typedef struct {
    BSTNode *root;
    int total_songs;
} SongBST;

/* ========================================================================= */
/* 5. TUNE STREAM SYSTEM CONTAINER                                           */
/* ========================================================================= */

typedef struct {
    Playlist playlist;          /* Doubly Linked List */
    SongQueue up_next_queue;    /* FIFO Queue */
    HistoryStack history_stack; /* LIFO Stack */
    SongBST library_bst;        /* Binary Search Tree */
    bool is_playing;
    bool is_repeat;
    bool is_shuffle;
} MusicEngine;

/* ========================================================================= */
/* FUNCTION PROTOTYPES                                                       */
/* ========================================================================= */

/* Engine Lifecycle */
MusicEngine* engine_create(void);
void engine_free(MusicEngine *engine);
void engine_load_sample_data(MusicEngine *engine);

/* Doubly Linked List (Playlist) Operations */
Playlist* playlist_create(void);
void playlist_insert_end(Playlist *pl, Song song);
void playlist_insert_after(Playlist *pl, SongNode *target, Song song);
bool playlist_remove(Playlist *pl, int song_id);
Song* playlist_get_current(Playlist *pl);
Song* playlist_play_next(MusicEngine *engine);
Song* playlist_play_prev(MusicEngine *engine);
void playlist_display(const Playlist *pl);
void playlist_free(Playlist *pl);

/* Queue ("Up Next") Operations */
void queue_init(SongQueue *q);
void queue_enqueue(SongQueue *q, Song song);
bool queue_dequeue(SongQueue *q, Song *out_song);
bool queue_peek(const SongQueue *q, Song *out_song);
bool queue_is_empty(const SongQueue *q);
void queue_display(const SongQueue *q);
void queue_clear(SongQueue *q);

/* Stack (History) Operations */
void stack_init(HistoryStack *s);
void stack_push(HistoryStack *s, Song song);
bool stack_pop(HistoryStack *s, Song *out_song);
bool stack_peek(const HistoryStack *s, Song *out_song);
bool stack_is_empty(const HistoryStack *s);
void stack_display(const HistoryStack *s);
void stack_clear(HistoryStack *s);

/* BST (Search Library) Operations */
void bst_init(SongBST *bst);
BSTNode* bst_insert(BSTNode *root, Song song);
BSTNode* bst_search(BSTNode *root, const char *title);
void bst_inorder_display(const BSTNode *root);
void bst_free(BSTNode *root);

/* Utility Functions */
Song create_song(int id, const char *title, const char *artist, int duration_sec, const char *genre);
void format_duration(int seconds, char *buffer, size_t max_len);

#endif /* MUSIC_PLAYER_H */
