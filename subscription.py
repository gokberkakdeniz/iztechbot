#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import schedule
import telegram
import pymongo
from time import sleep, gmtime, strftime
from os import environ
import lib

hour = "11:00"

print("{} MESSAGE SENDER THREAD".format(strftime("%m.%d.%Y %a %H:%M:%S", gmtime())))

def job():
    client = pymongo.MongoClient("mongodb://localhost:27017/")
    db = client['iztechbot']
    users = db["users"]

    bot = telegram.Bot(token=environ.get('IZTECHBOT_KEY'))
    i=0
    for user in users.find({'subscribe': 1}):
        i +=1;
        menu = lib.get_menu("today", user['lang'], user['vegetarian'])
        bot.sendMessage(chat_id=user['chat_id'], text=menu, parse_mode="Markdown")
    print("{} message has been sended to subscribed users.".format(i))

schedule.every().monday.at(hour).do(job)
schedule.every().tuesday.at(hour).do(job)
schedule.every().wednesday.at(hour).do(job)
schedule.every().thursday.at(hour).do(job)
schedule.every().friday.at(hour).do(job)

while True:
    schedule.run_pending()
    sleep(1)
