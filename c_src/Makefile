# Compiler and flags
CC = gcc
CFLAGS = -Wall -Wextra -std=c99 -O2

# Targets
all: vfs test

vfs: main.o vfs.o
	$(CC) $(CFLAGS) -o vfs main.o vfs.o

test: test_vfs.o vfs.o
	$(CC) $(CFLAGS) -o test_runner test_vfs.o vfs.o

main.o: main.c vfs.h
	$(CC) $(CFLAGS) -c main.c

vfs.o: vfs.c vfs.h
	$(CC) $(CFLAGS) -c vfs.c

test_vfs.o: test_vfs.c vfs.h
	$(CC) $(CFLAGS) -c test_vfs.c

clean:
	rm -f *.o vfs test_runner vfs.exe test_runner.exe

run: vfs
	./vfs

check: test
	./test_runner

.PHONY: all clean run check
