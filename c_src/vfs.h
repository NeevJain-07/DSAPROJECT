#ifndef VFS_H
#define VFS_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <time.h>

#define MAX_NAME_LEN 64
#define MAX_PATH_LEN 512
#define MAX_HISTORY_QUEUE 20

/* ========================================================================= */
/* 1. N-ARY TREE DATA STRUCTURE (Left-Child Right-Sibling Representation)    */
/* ========================================================================= */

typedef enum {
    NODE_DIR,
    NODE_FILE
} NodeType;

/**
 * FSNode: Represents a node in the File System Tree.
 * 
 * In standard Data Structures, an N-ary tree can have an arbitrary number of 
 * children. The most memory-efficient and textbook representation is the
 * "Left-Child Right-Sibling" (LCRS) binary representation:
 *  - firstChild: Points to the first item (file or subfolder) inside this folder.
 *  - nextSibling: Points to the next item located at the same directory level.
 *  - parent: Back-pointer to parent directory (enables 'cd ..').
 */
typedef struct FSNode {
    char name[MAX_NAME_LEN];
    NodeType type;
    char *content;             /* Text content for files, NULL for directories */
    size_t size;               /* File size in bytes or directory items count */
    time_t created_at;

    struct FSNode *parent;     /* Pointer to parent node (NULL for root) */
    struct FSNode *firstChild; /* Pointer to first child node */
    struct FSNode *nextSibling;/* Pointer to sibling node at the same level */
} FSNode;

/* ========================================================================= */
/* 2. STACK DATA STRUCTURE (For Directory Path Navigation & 'cd ..')         */
/* ========================================================================= */

typedef struct StackNode {
    FSNode *node;
    struct StackNode *next;
} StackNode;

typedef struct {
    StackNode *top;
    int size;
} PathStack;

/* ========================================================================= */
/* 3. QUEUE DATA STRUCTURE (For Recent Operations / Activity Log)            */
/* ========================================================================= */

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

/* ========================================================================= */
/* 4. VIRTUAL FILE SYSTEM STATE CONTAINER                                    */
/* ========================================================================= */

typedef struct {
    FSNode *root;              /* Root directory ("/") */
    FSNode *current;           /* Current working directory */
    ActivityQueue activity_log;/* Log of recent commands */
} VirtualFileSystem;

/* ========================================================================= */
/* FUNCTION PROTOTYPES                                                       */
/* ========================================================================= */

/* File System Initialization & Teardown */
VirtualFileSystem* vfs_init(void);
void vfs_free(VirtualFileSystem *vfs);

/* Node Allocations & Deallocations (Tree) */
FSNode* vfs_create_node(const char *name, NodeType type, FSNode *parent);
void vfs_free_node_recursive(FSNode *node);

/* Core Tree Operations */
bool vfs_mkdir(VirtualFileSystem *vfs, const char *dir_name);
bool vfs_touch(VirtualFileSystem *vfs, const char *file_name, const char *initial_content);
bool vfs_write(VirtualFileSystem *vfs, const char *file_name, const char *new_content);
char* vfs_cat(VirtualFileSystem *vfs, const char *file_name);
bool vfs_rm(VirtualFileSystem *vfs, const char *target_name);
bool vfs_cd(VirtualFileSystem *vfs, const char *path);
void vfs_pwd(VirtualFileSystem *vfs, char *buffer, size_t max_len);
void vfs_ls(VirtualFileSystem *vfs, bool detailed);
void vfs_tree(FSNode *node, int depth, bool is_last, char *prefix);
FSNode* vfs_find(FSNode *start_node, const char *name);

/* Stack Operations */
PathStack* stack_create(void);
void stack_push(PathStack *s, FSNode *node);
FSNode* stack_pop(PathStack *s);
FSNode* stack_peek(PathStack *s);
bool stack_is_empty(PathStack *s);
void stack_free(PathStack *s);

/* Queue Operations */
void queue_init(ActivityQueue *q);
void queue_enqueue(ActivityQueue *q, const char *action);
char* queue_dequeue(ActivityQueue *q);
void queue_display(ActivityQueue *q);
void queue_clear(ActivityQueue *q);

#endif /* VFS_H */
