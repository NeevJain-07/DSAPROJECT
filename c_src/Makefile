# Compiler and flags
CC = gcc
CFLAGS = -Wall -Wextra -std=c99 -O2

# Targets
all: tunestream test

tunestream: main.o music_player.o
	$(CC) $(CFLAGS) -o tunestream main.o music_player.o

test: test_player.o music_player.o
	$(CC) $(CFLAGS) -o test_runner test_player.o music_player.o

main.o: main.c music_player.h
	$(CC) $(CFLAGS) -c main.c

music_player.o: music_player.c music_player.h
	$(CC) $(CFLAGS) -c music_player.c

test_player.o: test_player.c music_player.h
	$(CC) $(CFLAGS) -c test_player.c

clean:
	rm -f *.o tunestream test_runner tunestream.exe test_runner.exe

run: tunestream
	./tunestream

check: test
	./test_runner

.PHONY: all clean run check
