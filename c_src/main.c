#include "vfs.h"

static void print_banner(void) {
    printf("=================================================================\n");
    printf("   VIRTUAL FILE SYSTEM (VFS) - DATA STRUCTURES PROJECT IN C      \n");
    printf("=================================================================\n");
    printf(" Data Structures Implemented:\n");
    printf("  1. N-ary Tree (Left-Child Right-Sibling representation)\n");
    printf("  2. Stack (Used for path resolution & 'pwd' backtracking)\n");
    printf("  3. Queue (Used for chronological command history FIFO)\n");
    printf("=================================================================\n");
    printf(" Type 'help' to see available shell commands.\n\n");
}

static void print_help(void) {
    printf("\nAvailable Commands:\n");
    printf("  mkdir <name>           Create a new directory in the current folder\n");
    printf("  touch <name> [text]    Create a new file with optional content\n");
    printf("  cat <name>             Display contents of a file\n");
    printf("  write <name> <text>    Overwrite/update content of an existing file\n");
    printf("  ls [-l]                List files and directories in current folder\n");
    printf("  cd <path>              Change current directory ('..', '/', 'folder')\n");
    printf("  pwd                    Print current working directory path (via Stack)\n");
    printf("  tree                   Display hierarchical tree diagram of file system\n");
    printf("  find <name>            Search for a file or folder recursively (DFS)\n");
    printf("  rm <name>              Remove a file or folder recursively\n");
    printf("  history                View recent operations log (FIFO Queue)\n");
    printf("  help                   Display this help menu\n");
    printf("  clear                  Clear the terminal screen\n");
    printf("  exit                   Quit the program\n\n");
}

int main(void) {
    VirtualFileSystem *vfs = vfs_init();
    if (!vfs) {
        fprintf(stderr, "Failed to initialize Virtual File System.\n");
        return 1;
    }

    /* Seed some initial demonstration folders and files */
    vfs_mkdir(vfs, "home");
    vfs_mkdir(vfs, "bin");
    vfs_mkdir(vfs, "etc");
    vfs_touch(vfs, "README.txt", "Welcome to the C Virtual File System project!");

    vfs_cd(vfs, "home");
    vfs_mkdir(vfs, "student");
    vfs_cd(vfs, "student");
    vfs_touch(vfs, "notes.txt", "DSA is fun! Trees, Stacks, Queues, and Pointers.");
    vfs_mkdir(vfs, "projects");
    vfs_cd(vfs, "/");

    print_banner();

    char line[1024];
    char pwd_buf[MAX_PATH_LEN];

    while (1) {
        vfs_pwd(vfs, pwd_buf, sizeof(pwd_buf));
        printf("\033[1;32mvfs-user@dsa-c\033[0m:\033[1;34m%s\033[0m$ ", pwd_buf);
        fflush(stdout);

        if (!fgets(line, sizeof(line), stdin)) {
            break;
        }

        /* Strip trailing newline */
        line[strcspn(line, "\r\n")] = '\0';
        if (strlen(line) == 0) continue;

        char *cmd = strtok(line, " ");
        if (!cmd) continue;

        if (strcmp(cmd, "exit") == 0 || strcmp(cmd, "quit") == 0) {
            printf("Exiting VFS. Cleaning up dynamic memory...\n");
            break;
        } else if (strcmp(cmd, "help") == 0) {
            print_help();
        } else if (strcmp(cmd, "clear") == 0) {
            printf("\033[H\033[J");
        } else if (strcmp(cmd, "pwd") == 0) {
            printf("%s\n", pwd_buf);
        } else if (strcmp(cmd, "ls") == 0) {
            char *arg = strtok(NULL, " ");
            bool detailed = (arg && strcmp(arg, "-l") == 0);
            vfs_ls(vfs, detailed);
        } else if (strcmp(cmd, "mkdir") == 0) {
            char *dir_name = strtok(NULL, " ");
            if (!dir_name) {
                printf("Usage: mkdir <directory_name>\n");
            } else {
                vfs_mkdir(vfs, dir_name);
            }
        } else if (strcmp(cmd, "touch") == 0) {
            char *file_name = strtok(NULL, " ");
            if (!file_name) {
                printf("Usage: touch <file_name> [optional_content]\n");
            } else {
                char *content = strtok(NULL, ""); /* Get remainder of line */
                vfs_touch(vfs, file_name, content ? content : "");
            }
        } else if (strcmp(cmd, "cat") == 0) {
            char *file_name = strtok(NULL, " ");
            if (!file_name) {
                printf("Usage: cat <file_name>\n");
            } else {
                char *content = vfs_cat(vfs, file_name);
                if (content) {
                    printf("%s\n", content);
                }
            }
        } else if (strcmp(cmd, "write") == 0) {
            char *file_name = strtok(NULL, " ");
            char *content = strtok(NULL, "");
            if (!file_name || !content) {
                printf("Usage: write <file_name> <text_to_write>\n");
            } else {
                vfs_write(vfs, file_name, content);
            }
        } else if (strcmp(cmd, "cd") == 0) {
            char *path = strtok(NULL, " ");
            if (!path) {
                vfs_cd(vfs, "/");
            } else {
                vfs_cd(vfs, path);
            }
        } else if (strcmp(cmd, "rm") == 0) {
            char *target = strtok(NULL, " ");
            if (!target) {
                printf("Usage: rm <target_name>\n");
            } else {
                vfs_rm(vfs, target);
            }
        } else if (strcmp(cmd, "tree") == 0) {
            printf(".\n");
            vfs_tree(vfs->root, 0, true, "");
        } else if (strcmp(cmd, "find") == 0) {
            char *target = strtok(NULL, " ");
            if (!target) {
                printf("Usage: find <name>\n");
            } else {
                FSNode *found = vfs_find(vfs->root, target);
                if (found) {
                    printf("Found: %s [%s]\n", found->name, found->type == NODE_DIR ? "DIR" : "FILE");
                } else {
                    printf("Item '%s' not found in file system.\n", target);
                }
            }
        } else if (strcmp(cmd, "history") == 0) {
            queue_display(&vfs->activity_log);
        } else {
            printf("vfs: command not found: %s. Type 'help' for available commands.\n", cmd);
        }
    }

    vfs_free(vfs);
    printf("Memory freed successfully. Goodbye!\n");
    return 0;
}
