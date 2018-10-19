#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import schedule
import telegram
import pymongo
from time import sleep
from os import environ
from strings import hour
import lib
import logging

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',level=logging.INFO)
logger = logging.getLogger(__name__)

logger.info("SUBSCRIPTION PROCESS STARTED")

logger.info("CONNECTING DATABASE")
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client['iztechbot']
users = db["users"]
logger.info("CONNECTION ESTABLISHED")

def job():
    bot = telegram.Bot(token=environ.get('IZTECHBOT_KEY'))
    i=0
    for user in users.find({'subscribe': 1}):
        i +=1;
        menu = lib.get_menu("today", user['lang'], user['vegetarian'])
        bot.sendMessage(chat_id=user['chat_id'], text=menu, parse_mode="Markdown")
    logger.info("{} message has been sended to subscribed users.".format(i))

schedule.every().monday.at(hour).do(job)
schedule.every().tuesday.at(hour).do(job)
schedule.every().wednesday.at(hour).do(job)
schedule.every().thursday.at(hour).do(job)
schedule.every().friday.at(hour).do(job)

while True:
    schedule.run_pending()
    sleep(1)
