#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from multiprocessing import Process

def thread_main():
    import bot

def thread_schedule():
    import subscription

if __name__ == '__main__':
    m = Process(target=thread_main)
    m.start()

    s = Process(target=thread_schedule)
    s.start()

    m.join()
    s.join()
