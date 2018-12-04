#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from multiprocessing import Process


def process_main():
    import bot


def process_schedule():
    import subscription


if __name__ == '__main__':
    m = Process(target=process_main)
    m.start()

    s = Process(target=process_schedule)
    s.start()

    m.join()
    s.join()
