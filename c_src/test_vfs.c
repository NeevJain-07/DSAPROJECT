#include "vfs.h"
#include <assert.h>

void test_stack(void) {
    printf("[Test] Running PathStack tests...\n");
    PathStack *st = stack_create();
    assert(stack_is_empty(st));

    FSNode n1 = {.name = "root"};
    FSNode n2 = {.name = "home"};
    FSNode n3 = {.name = "user"};

    stack_push(st, &n1);
    stack_push(st, &n2);
    stack_push(st, &n3);

    assert(st->size == 3);
    assert(strcmp(stack_peek(st)->name, "user") == 0);

    assert(strcmp(stack_pop(st)->name, "user") == 0);
    assert(strcmp(stack_pop(st)->name, "home") == 0);
    assert(strcmp(stack_pop(st)->name, "root") == 0);
    assert(stack_is_empty(st));

    stack_free(st);
    printf("  -> PathStack tests PASSED!\n");
}

void test_queue(void) {
    printf("[Test] Running ActivityQueue tests...\n");
    ActivityQueue q;
    queue_init(&q);
    assert(q.count == 0);

    queue_enqueue(&q, "Action 1");
    queue_enqueue(&q, "Action 2");
    assert(q.count == 2);

    char *a1 = queue_dequeue(&q);
    assert(strcmp(a1, "Action 1") == 0);
    free(a1);

    char *a2 = queue_dequeue(&q);
    assert(strcmp(a2, "Action 2") == 0);
    free(a2);

    assert(q.count == 0);
    queue_clear(&q);
    printf("  -> ActivityQueue tests PASSED!\n");
}

void test_tree_and_vfs(void) {
    printf("[Test] Running N-ary Tree and VFS operations...\n");
    VirtualFileSystem *vfs = vfs_init();
    assert(vfs != NULL);
    assert(strcmp(vfs->root->name, "/") == 0);

    /* Test mkdir */
    assert(vfs_mkdir(vfs, "docs"));
    assert(vfs_mkdir(vfs, "music"));
    assert(!vfs_mkdir(vfs, "docs")); /* Duplicate should fail */

    /* Test touch & cat */
    assert(vfs_touch(vfs, "todo.txt", "1. Study Trees\n2. Study Stacks"));
    char *content = vfs_cat(vfs, "todo.txt");
    assert(content != NULL && strstr(content, "Study Trees") != NULL);

    /* Test write */
    assert(vfs_write(vfs, "todo.txt", "Updated content"));
    content = vfs_cat(vfs, "todo.txt");
    assert(strcmp(content, "Updated content") == 0);

    /* Test cd and pwd using stack */
    char pwd_buf[256];
    vfs_pwd(vfs, pwd_buf, sizeof(pwd_buf));
    assert(strcmp(pwd_buf, "/") == 0);

    assert(vfs_cd(vfs, "docs"));
    vfs_pwd(vfs, pwd_buf, sizeof(pwd_buf));
    assert(strcmp(pwd_buf, "/docs") == 0);

    assert(vfs_mkdir(vfs, "college"));
    assert(vfs_cd(vfs, "college"));
    vfs_pwd(vfs, pwd_buf, sizeof(pwd_buf));
    assert(strcmp(pwd_buf, "/docs/college") == 0);

    /* Test cd .. */
    assert(vfs_cd(vfs, ".."));
    vfs_pwd(vfs, pwd_buf, sizeof(pwd_buf));
    assert(strcmp(pwd_buf, "/docs") == 0);

    /* Test recursive find (DFS) */
    FSNode *found = vfs_find(vfs->root, "college");
    assert(found != NULL);
    assert(strcmp(found->name, "college") == 0);

    /* Test rm */
    assert(vfs_rm(vfs, "college"));
    assert(vfs_find(vfs->root, "college") == NULL);

    vfs_free(vfs);
    printf("  -> N-ary Tree and VFS tests PASSED!\n");
}

int main(void) {
    printf("=========================================\n");
    printf("  RUNNING VFS DATA STRUCTURE UNIT TESTS  \n");
    printf("=========================================\n");
    test_stack();
    test_queue();
    test_tree_and_vfs();
    printf("\nAll Data Structure tests completed successfully!\n");
    return 0;
}
