#include "vfs.h"

/* ========================================================================= */
/* STACK IMPLEMENTATION                                                      */
/* ========================================================================= */

PathStack* stack_create(void) {
    PathStack *s = (PathStack*)malloc(sizeof(PathStack));
    if (!s) return NULL;
    s->top = NULL;
    s->size = 0;
    return s;
}

void stack_push(PathStack *s, FSNode *node) {
    if (!s || !node) return;
    StackNode *newNode = (StackNode*)malloc(sizeof(StackNode));
    if (!newNode) return;
    newNode->node = node;
    newNode->next = s->top;
    s->top = newNode;
    s->size++;
}

FSNode* stack_pop(PathStack *s) {
    if (!s || !s->top) return NULL;
    StackNode *temp = s->top;
    FSNode *node = temp->node;
    s->top = temp->next;
    free(temp);
    s->size--;
    return node;
}

FSNode* stack_peek(PathStack *s) {
    if (!s || !s->top) return NULL;
    return s->top->node;
}

bool stack_is_empty(PathStack *s) {
    return (s == NULL || s->top == NULL);
}

void stack_free(PathStack *s) {
    if (!s) return;
    while (!stack_is_empty(s)) {
        stack_pop(s);
    }
    free(s);
}

/* ========================================================================= */
/* QUEUE IMPLEMENTATION (Circular FIFO Buffer / Singly-Linked Queue)        */
/* ========================================================================= */

void queue_init(ActivityQueue *q) {
    if (!q) return;
    q->front = NULL;
    q->rear = NULL;
    q->count = 0;
}

void queue_enqueue(ActivityQueue *q, const char *action) {
    if (!q || !action) return;

    /* If queue reaches max capacity, dequeue oldest item */
    if (q->count >= MAX_HISTORY_QUEUE) {
        char *discarded = queue_dequeue(q);
        if (discarded) free(discarded);
    }

    QueueNode *newNode = (QueueNode*)malloc(sizeof(QueueNode));
    if (!newNode) return;

    strncpy(newNode->action, action, sizeof(newNode->action) - 1);
    newNode->action[sizeof(newNode->action) - 1] = '\0';
    newNode->timestamp = time(NULL);
    newNode->next = NULL;

    if (q->rear == NULL) {
        q->front = q->rear = newNode;
    } else {
        q->rear->next = newNode;
        q->rear = newNode;
    }
    q->count++;
}

char* queue_dequeue(ActivityQueue *q) {
    if (!q || !q->front) return NULL;

    QueueNode *temp = q->front;
    q->front = q->front->next;
    if (q->front == NULL) {
        q->rear = NULL;
    }

    char *action = (char*)malloc(sizeof(temp->action));
    if (action) {
        strcpy(action, temp->action);
    }
    free(temp);
    q->count--;
    return action;
}

void queue_display(ActivityQueue *q) {
    if (!q || !q->front) {
        printf("Activity log is empty.\n");
        return;
    }
    printf("--- Recent File System Operations (Queue FIFO) ---\n");
    QueueNode *curr = q->front;
    int idx = 1;
    while (curr) {
        struct tm *tm_info = localtime(&curr->timestamp);
        char time_str[32];
        strftime(time_str, sizeof(time_str), "%H:%M:%S", tm_info);
        printf("[%d] %s -> %s\n", idx++, time_str, curr->action);
        curr = curr->next;
    }
}

void queue_clear(ActivityQueue *q) {
    if (!q) return;
    while (q->front != NULL) {
        char *act = queue_dequeue(q);
        if (act) free(act);
    }
}

/* ========================================================================= */
/* NODE (N-ARY TREE) MANAGEMENT                                              */
/* ========================================================================= */

FSNode* vfs_create_node(const char *name, NodeType type, FSNode *parent) {
    if (!name || strlen(name) == 0) return NULL;

    FSNode *node = (FSNode*)malloc(sizeof(FSNode));
    if (!node) return NULL;

    strncpy(node->name, name, MAX_NAME_LEN - 1);
    node->name[MAX_NAME_LEN - 1] = '\0';
    node->type = type;
    node->content = NULL;
    node->size = 0;
    node->created_at = time(NULL);

    node->parent = parent;
    node->firstChild = NULL;
    node->nextSibling = NULL;

    return node;
}

void vfs_free_node_recursive(FSNode *node) {
    if (!node) return;

    /* Post-order recursive cleanup: first free child, then free sibling */
    vfs_free_node_recursive(node->firstChild);
    vfs_free_node_recursive(node->nextSibling);

    if (node->content) {
        free(node->content);
        node->content = NULL;
    }
    free(node);
}

/* Helper to check if a child with the given name already exists */
static FSNode* find_immediate_child(FSNode *parent, const char *name) {
    if (!parent || parent->type != NODE_DIR) return NULL;
    FSNode *curr = parent->firstChild;
    while (curr) {
        if (strcmp(curr->name, name) == 0) {
            return curr;
        }
        curr = curr->nextSibling;
    }
    return NULL;
}

/* Helper to append child to parent's sibling chain */
static void append_child(FSNode *parent, FSNode *child) {
    if (!parent || !child) return;
    child->parent = parent;
    child->nextSibling = NULL;

    if (parent->firstChild == NULL) {
        parent->firstChild = child;
    } else {
        FSNode *curr = parent->firstChild;
        while (curr->nextSibling != NULL) {
            curr = curr->nextSibling;
        }
        curr->nextSibling = child;
    }
    parent->size++;
}

/* ========================================================================= */
/* VFS INITIALIZATION & CLEANUP                                              */
/* ========================================================================= */

VirtualFileSystem* vfs_init(void) {
    VirtualFileSystem *vfs = (VirtualFileSystem*)malloc(sizeof(VirtualFileSystem));
    if (!vfs) return NULL;

    /* Root node ("/") */
    vfs->root = vfs_create_node("/", NODE_DIR, NULL);
    vfs->current = vfs->root;
    queue_init(&vfs->activity_log);

    queue_enqueue(&vfs->activity_log, "Initialized Virtual File System (Root created)");
    return vfs;
}

void vfs_free(VirtualFileSystem *vfs) {
    if (!vfs) return;
    vfs_free_node_recursive(vfs->root);
    queue_clear(&vfs->activity_log);
    free(vfs);
}

/* ========================================================================= */
/* FILE SYSTEM COMMAND IMPLEMENTATIONS                                       */
/* ========================================================================= */

bool vfs_mkdir(VirtualFileSystem *vfs, const char *dir_name) {
    if (!vfs || !vfs->current || !dir_name || strlen(dir_name) == 0) return false;

    if (find_immediate_child(vfs->current, dir_name) != NULL) {
        printf("Error: Directory or file '%s' already exists.\n", dir_name);
        return false;
    }

    FSNode *new_dir = vfs_create_node(dir_name, NODE_DIR, vfs->current);
    if (!new_dir) return false;

    append_child(vfs->current, new_dir);

    char log_buf[128];
    snprintf(log_buf, sizeof(log_buf), "mkdir: Created directory '%s'", dir_name);
    queue_enqueue(&vfs->activity_log, log_buf);
    return true;
}

bool vfs_touch(VirtualFileSystem *vfs, const char *file_name, const char *initial_content) {
    if (!vfs || !vfs->current || !file_name || strlen(file_name) == 0) return false;

    FSNode *existing = find_immediate_child(vfs->current, file_name);
    if (existing != NULL) {
        /* Update timestamp or content if provided */
        if (initial_content) {
            return vfs_write(vfs, file_name, initial_content);
        }
        existing->created_at = time(NULL);
        return true;
    }

    FSNode *new_file = vfs_create_node(file_name, NODE_FILE, vfs->current);
    if (!new_file) return false;

    if (initial_content && strlen(initial_content) > 0) {
        size_t len = strlen(initial_content);
        new_file->content = (char*)malloc(len + 1);
        if (new_file->content) {
            strcpy(new_file->content, initial_content);
            new_file->size = len;
        }
    } else {
        new_file->content = (char*)calloc(1, sizeof(char));
        new_file->size = 0;
    }

    append_child(vfs->current, new_file);

    char log_buf[128];
    snprintf(log_buf, sizeof(log_buf), "touch: Created file '%s' (%zu bytes)", file_name, new_file->size);
    queue_enqueue(&vfs->activity_log, log_buf);
    return true;
}

bool vfs_write(VirtualFileSystem *vfs, const char *file_name, const char *new_content) {
    if (!vfs || !vfs->current || !file_name || !new_content) return false;

    FSNode *node = find_immediate_child(vfs->current, file_name);
    if (!node) {
        printf("Error: File '%s' not found.\n", file_name);
        return false;
    }
    if (node->type != NODE_FILE) {
        printf("Error: '%s' is a directory, not a file.\n", file_name);
        return false;
    }

    if (node->content) {
        free(node->content);
    }
    size_t len = strlen(new_content);
    node->content = (char*)malloc(len + 1);
    if (!node->content) return false;
    strcpy(node->content, new_content);
    node->size = len;

    char log_buf[128];
    snprintf(log_buf, sizeof(log_buf), "write: Updated file '%s' (%zu bytes)", file_name, len);
    queue_enqueue(&vfs->activity_log, log_buf);
    return true;
}

char* vfs_cat(VirtualFileSystem *vfs, const char *file_name) {
    if (!vfs || !vfs->current || !file_name) return NULL;

    FSNode *node = find_immediate_child(vfs->current, file_name);
    if (!node) {
        printf("Error: File '%s' not found.\n", file_name);
        return NULL;
    }
    if (node->type != NODE_FILE) {
        printf("Error: '%s' is a directory.\n", file_name);
        return NULL;
    }
    return node->content ? node->content : "";
}

bool vfs_rm(VirtualFileSystem *vfs, const char *target_name) {
    if (!vfs || !vfs->current || !target_name) return false;

    FSNode *parent = vfs->current;
    FSNode *curr = parent->firstChild;
    FSNode *prev = NULL;

    while (curr) {
        if (strcmp(curr->name, target_name) == 0) {
            /* Unlink node from child linked list */
            if (prev == NULL) {
                parent->firstChild = curr->nextSibling;
            } else {
                prev->nextSibling = curr->nextSibling;
            }

            /* Detach sibling so recursive free doesn't delete siblings */
            curr->nextSibling = NULL;
            vfs_free_node_recursive(curr);
            parent->size--;

            char log_buf[128];
            snprintf(log_buf, sizeof(log_buf), "rm: Removed '%s'", target_name);
            queue_enqueue(&vfs->activity_log, log_buf);
            return true;
        }
        prev = curr;
        curr = curr->nextSibling;
    }

    printf("Error: No such file or directory '%s'.\n", target_name);
    return false;
}

/* Path navigation using Stack for 'pwd' */
void vfs_pwd(VirtualFileSystem *vfs, char *buffer, size_t max_len) {
    if (!vfs || !buffer || max_len == 0) return;

    if (vfs->current == vfs->root) {
        strncpy(buffer, "/", max_len);
        return;
    }

    /* Use Stack to trace path from current up to root */
    PathStack *st = stack_create();
    FSNode *curr = vfs->current;

    while (curr != NULL && curr != vfs->root) {
        stack_push(st, curr);
        curr = curr->parent;
    }

    buffer[0] = '\0';
    while (!stack_is_empty(st)) {
        FSNode *n = stack_pop(st);
        strncat(buffer, "/", max_len - strlen(buffer) - 1);
        strncat(buffer, n->name, max_len - strlen(buffer) - 1);
    }

    stack_free(st);
}

bool vfs_cd(VirtualFileSystem *vfs, const char *path) {
    if (!vfs || !path) return false;

    if (strcmp(path, "/") == 0) {
        vfs->current = vfs->root;
        return true;
    }

    if (strcmp(path, ".") == 0) {
        return true;
    }

    if (strcmp(path, "..") == 0) {
        if (vfs->current->parent != NULL) {
            vfs->current = vfs->current->parent;
            return true;
        }
        return true; /* Already at root */
    }

    /* Support path tokens separated by '/' */
    char path_copy[MAX_PATH_LEN];
    strncpy(path_copy, path, sizeof(path_copy) - 1);
    path_copy[sizeof(path_copy) - 1] = '\0';

    FSNode *start = (path[0] == '/') ? vfs->root : vfs->current;
    char *token = strtok(path_copy, "/");

    while (token != NULL) {
        if (strcmp(token, ".") == 0) {
            /* Current directory, no-op */
        } else if (strcmp(token, "..") == 0) {
            if (start->parent != NULL) {
                start = start->parent;
            }
        } else {
            FSNode *child = find_immediate_child(start, token);
            if (!child) {
                printf("Error: Directory '%s' does not exist.\n", token);
                return false;
            }
            if (child->type != NODE_DIR) {
                printf("Error: '%s' is not a directory.\n", token);
                return false;
            }
            start = child;
        }
        token = strtok(NULL, "/");
    }

    vfs->current = start;
    return true;
}

void vfs_ls(VirtualFileSystem *vfs, bool detailed) {
    if (!vfs || !vfs->current) return;

    FSNode *child = vfs->current->firstChild;
    if (!child) {
        printf("(empty directory)\n");
        return;
    }

    while (child) {
        if (detailed) {
            char time_buf[32];
            struct tm *tm_info = localtime(&child->created_at);
            strftime(time_buf, sizeof(time_buf), "%b %d %H:%M", tm_info);
            printf("%s  %-10s  %6zu B  %s\n",
                   (child->type == NODE_DIR ? "[DIR] " : "[FILE]"),
                   child->name,
                   child->size,
                   time_buf);
        } else {
            if (child->type == NODE_DIR) {
                printf("\033[1;34m%s/\033[0m  ", child->name);
            } else {
                printf("%s  ", child->name);
            }
        }
        child = child->nextSibling;
    }
    printf("\n");
}

/* Pre-order DFS traversal for visual tree view */
void vfs_tree(FSNode *node, int depth, bool is_last, char *prefix) {
    if (!node) return;

    if (depth == 0) {
        printf("\033[1;34m/\033[0m\n");
    } else {
        printf("%s%s %s%s\033[0m\n",
               prefix,
               is_last ? "└──" : "├──",
               (node->type == NODE_DIR ? "\033[1;34m" : "\033[0;32m"),
               node->name);
    }

    if (node->type == NODE_DIR && node->firstChild) {
        char new_prefix[MAX_PATH_LEN];
        snprintf(new_prefix, sizeof(new_prefix), "%s%s", prefix, (depth == 0 ? "" : (is_last ? "    " : "│   ")));

        FSNode *child = node->firstChild;
        while (child) {
            bool child_is_last = (child->nextSibling == NULL);
            vfs_tree(child, depth + 1, child_is_last, new_prefix);
            child = child->nextSibling;
        }
    }
}

/* Recursive DFS search across the entire sub-tree */
FSNode* vfs_find(FSNode *start_node, const char *name) {
    if (!start_node || !name) return NULL;

    if (strcmp(start_node->name, name) == 0) {
        return start_node;
    }

    FSNode *child = start_node->firstChild;
    while (child) {
        FSNode *found = vfs_find(child, name);
        if (found) return found;
        child = child->nextSibling;
    }
    return NULL;
}
