#include "music_player.h"
#include <assert.h>

void test_doubly_linked_list(void) {
    printf("[Test] Running Doubly Linked List tests...\n");
    Playlist *pl = playlist_create();
    assert(pl != NULL);
    assert(pl->count == 0);
    assert(pl->head == NULL);

    Song s1 = create_song(1, "Track A", "Artist 1", 180, "Pop");
    Song s2 = create_song(2, "Track B", "Artist 2", 210, "Rock");
    Song s3 = create_song(3, "Track C", "Artist 3", 195, "Jazz");

    playlist_insert_end(pl, s1);
    assert(pl->count == 1);
    assert(pl->head == pl->tail);
    assert(strcmp(pl->head->song.title, "Track A") == 0);

    playlist_insert_end(pl, s2);
    playlist_insert_end(pl, s3);
    assert(pl->count == 3);

    /* Verify bi-directional pointers */
    SongNode *n1 = pl->head;
    SongNode *n2 = n1->next;
    SongNode *n3 = n2->next;
    assert(n2->prev == n1);
    assert(n3->prev == n2);
    assert(n3->next == NULL);

    /* Test removal */
    assert(playlist_remove(pl, 2));
    assert(pl->count == 2);
    assert(n1->next == n3);
    assert(n3->prev == n1);

    playlist_free(pl);
    free(pl);
    printf("  -> Doubly Linked List tests PASSED!\n");
}

void test_queue(void) {
    printf("[Test] Running FIFO Up Next Queue tests...\n");
    SongQueue q;
    queue_init(&q);
    assert(queue_is_empty(&q));

    Song s1 = create_song(1, "Queued 1", "Artist A", 200, "Pop");
    Song s2 = create_song(2, "Queued 2", "Artist B", 180, "R&B");

    queue_enqueue(&q, s1);
    queue_enqueue(&q, s2);
    assert(q.count == 2);

    Song out1, out2;
    assert(queue_dequeue(&q, &out1));
    assert(strcmp(out1.title, "Queued 1") == 0);

    assert(queue_dequeue(&q, &out2));
    assert(strcmp(out2.title, "Queued 2") == 0);

    assert(queue_is_empty(&q));
    printf("  -> FIFO Queue tests PASSED!\n");
}

void test_stack(void) {
    printf("[Test] Running LIFO History Stack tests...\n");
    HistoryStack st;
    stack_init(&st);
    assert(stack_is_empty(&st));

    Song s1 = create_song(1, "Played First", "A", 150, "Indie");
    Song s2 = create_song(2, "Played Second", "B", 170, "Pop");

    stack_push(&st, s1);
    stack_push(&st, s2);
    assert(st.count == 2);

    Song popped;
    assert(stack_pop(&st, &popped));
    assert(strcmp(popped.title, "Played Second") == 0); /* LIFO */

    assert(stack_pop(&st, &popped));
    assert(strcmp(popped.title, "Played First") == 0);

    assert(stack_is_empty(&st));
    printf("  -> LIFO Stack tests PASSED!\n");
}

void test_bst(void) {
    printf("[Test] Running Binary Search Tree (Library Search) tests...\n");
    BSTNode *root = NULL;

    Song s1 = create_song(1, "Starboy", "The Weeknd", 230, "R&B");
    Song s2 = create_song(2, "Blinding Lights", "The Weeknd", 200, "Synthwave");
    Song s3 = create_song(3, "Levitating", "Dua Lipa", 203, "Pop");

    root = bst_insert(root, s1);
    root = bst_insert(root, s2);
    root = bst_insert(root, s3);

    /* Test search */
    BSTNode *found = bst_search(root, "Blinding Lights");
    assert(found != NULL);
    assert(strcmp(found->song.artist, "The Weeknd") == 0);

    BSTNode *notFound = bst_search(root, "Nonexistent Song");
    assert(notFound == NULL);

    bst_free(root);
    printf("  -> Binary Search Tree tests PASSED!\n");
}

int main(void) {
    printf("=========================================\n");
    printf("  RUNNING TUNESTREAM DATA STRUCTURE TESTS \n");
    printf("=========================================\n");
    test_doubly_linked_list();
    test_queue();
    test_stack();
    test_bst();
    printf("\nAll 4 Data Structure test suites PASSED successfully!\n");
    return 0;
}
