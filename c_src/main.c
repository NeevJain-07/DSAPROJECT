#include "music_player.h"

static void print_banner(void) {
    printf("=================================================================\n");
    printf("    TUNESTREAM: C MUSIC STREAMING & PLAYLIST ENGINE (DSA)        \n");
    printf("=================================================================\n");
    printf(" Data Structures Implemented:\n");
    printf("  1. Doubly Linked List  -> Active Playlist (O(1) Next/Prev)\n");
    printf("  2. FIFO Queue          -> 'Up Next' Play Queue (First-In, First-Out)\n");
    printf("  3. LIFO Stack          -> Recently Played History (Undo/Back)\n");
    printf("  4. Binary Search Tree  -> Music Catalog & Fast Search (O(log N))\n");
    printf("=================================================================\n\n");
}

static void print_menu(const MusicEngine *engine) {
    char dur_str[16] = "--:--";
    Song *curr = playlist_get_current((Playlist*)&engine->playlist);
    if (curr) {
        format_duration(curr->duration_sec, dur_str, sizeof(dur_str));
    }

    printf("\n-----------------------------------------------------------------\n");
    if (curr && engine->is_playing) {
        printf(" ▶ NOW PLAYING: \"%s\" by %s [%s | %s]\n", curr->title, curr->artist, dur_str, curr->genre);
    } else if (curr) {
        printf(" ⏸ PAUSED: \"%s\" by %s [%s | %s]\n", curr->title, curr->artist, dur_str, curr->genre);
    } else {
        printf(" ⏹ NO TRACK SELECTED\n");
    }
    printf(" Status: [Repeat: %s] | [Queue: %d songs] | [History: %d songs]\n",
           engine->is_repeat ? "ON" : "OFF",
           engine->up_next_queue.count,
           engine->history_stack.count);
    printf("-----------------------------------------------------------------\n");
    printf(" 1. Play / Pause\n");
    printf(" 2. Next Track (Queue FIFO -> DLL Next -> Stack Push)\n");
    printf(" 3. Previous Track (Stack Pop / DLL Prev)\n");
    printf(" 4. View Active Playlist (Doubly Linked List)\n");
    printf(" 5. View 'Up Next' Play Queue (FIFO)\n");
    printf(" 6. View Playback History (LIFO Stack)\n");
    printf(" 7. Search Library Catalog (Binary Search Tree - O(log N))\n");
    printf(" 8. Add Song to 'Up Next' Queue\n");
    printf(" 9. Add Song to Playlist (DLL Insertion)\n");
    printf("10. Remove Song from Playlist (DLL Deletion)\n");
    printf("11. Toggle Repeat\n");
    printf(" 0. Exit\n");
    printf("Select option [0-11]: ");
}

int main(void) {
    MusicEngine *engine = engine_create();
    if (!engine) {
        fprintf(stderr, "Failed to allocate MusicEngine.\n");
        return 1;
    }

    engine_load_sample_data(engine);
    engine->is_playing = true;

    print_banner();

    int choice;
    char buffer[128];

    while (1) {
        print_menu(engine);
        if (scanf("%d", &choice) != 1) {
            /* Clear stdin */
            while (getchar() != '\n');
            continue;
        }
        while (getchar() != '\n'); /* Flush newline */

        if (choice == 0) {
            printf("\nExiting TuneStream. Freeing dynamic memory...\n");
            break;
        }

        switch (choice) {
            case 1:
                engine->is_playing = !engine->is_playing;
                printf("\nStatus: %s\n", engine->is_playing ? "▶ PLAYING" : "⏸ PAUSED");
                break;

            case 2: {
                Song *next = playlist_play_next(engine);
                if (next) {
                    char d[16];
                    format_duration(next->duration_sec, d, sizeof(d));
                    printf("\nSkipped to: \"%s\" by %s [%s]\n", next->title, next->artist, d);
                }
                break;
            }

            case 3: {
                Song *prev = playlist_play_prev(engine);
                if (prev) {
                    char d[16];
                    format_duration(prev->duration_sec, d, sizeof(d));
                    printf("\nReturned to: \"%s\" by %s [%s]\n", prev->title, prev->artist, d);
                } else {
                    printf("\nNo previous song available.\n");
                }
                break;
            }

            case 4:
                playlist_display(&engine->playlist);
                break;

            case 5:
                queue_display(&engine->up_next_queue);
                break;

            case 6:
                stack_display(&engine->history_stack);
                break;

            case 7: {
                printf("\nEnter song title to search (BST): ");
                if (fgets(buffer, sizeof(buffer), stdin)) {
                    buffer[strcspn(buffer, "\r\n")] = '\0';
                    BSTNode *res = bst_search(engine->library_bst.root, buffer);
                    if (res) {
                        char d[16];
                        format_duration(res->song.duration_sec, d, sizeof(d));
                        printf("\n✓ FOUND in BST (O(log N)):\n");
                        printf("   Title:    %s\n", res->song.title);
                        printf("   Artist:   %s\n", res->song.artist);
                        printf("   Duration: %s\n", d);
                        printf("   Genre:    %s\n", res->song.genre);
                    } else {
                        printf("\n✗ Song '%s' not found in library catalog.\n", buffer);
                    }
                }
                break;
            }

            case 8: {
                printf("\nEnter song title: ");
                char title[64], artist[64], genre[32];
                int dur = 180;
                if (fgets(title, sizeof(title), stdin)) {
                    title[strcspn(title, "\r\n")] = '\0';
                    printf("Enter artist: ");
                    if (fgets(artist, sizeof(artist), stdin)) {
                        artist[strcspn(artist, "\r\n")] = '\0';
                        printf("Enter genre: ");
                        if (fgets(genre, sizeof(genre), stdin)) {
                            genre[strcspn(genre, "\r\n")] = '\0';
                            Song new_song = create_song(rand() % 1000 + 10, title, artist, dur, genre);
                            queue_enqueue(&engine->up_next_queue, new_song);
                            printf("\nEnqueued \"%s\" into FIFO Up Next queue!\n", title);
                        }
                    }
                }
                break;
            }

            case 9: {
                printf("\nEnter song title: ");
                char title[64], artist[64], genre[32];
                int dur = 200;
                if (fgets(title, sizeof(title), stdin)) {
                    title[strcspn(title, "\r\n")] = '\0';
                    printf("Enter artist: ");
                    if (fgets(artist, sizeof(artist), stdin)) {
                        artist[strcspn(artist, "\r\n")] = '\0';
                        printf("Enter genre: ");
                        if (fgets(genre, sizeof(genre), stdin)) {
                            genre[strcspn(genre, "\r\n")] = '\0';
                            Song new_song = create_song(rand() % 1000 + 10, title, artist, dur, genre);
                            playlist_insert_end(&engine->playlist, new_song);
                            printf("\nAppended \"%s\" to active Doubly Linked List playlist!\n", title);
                        }
                    }
                }
                break;
            }

            case 10: {
                int id;
                printf("\nEnter Song ID to remove from playlist: ");
                if (scanf("%d", &id) == 1) {
                    if (playlist_remove(&engine->playlist, id)) {
                        printf("\nRemoved song ID %d from Doubly Linked List.\n", id);
                    } else {
                        printf("\nSong ID %d not found in playlist.\n", id);
                    }
                }
                break;
            }

            case 11:
                engine->is_repeat = !engine->is_repeat;
                printf("\nRepeat mode: %s\n", engine->is_repeat ? "ENABLED" : "DISABLED");
                break;

            default:
                printf("\nInvalid option. Try again.\n");
                break;
        }
    }

    engine_free(engine);
    printf("Memory freed successfully. Have a great day!\n");
    return 0;
}
