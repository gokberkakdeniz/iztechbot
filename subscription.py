#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import schedule
import telegram
import pymongo
import lib
import logging
from datetime import date
from time import sleep
from os import environ
from strings import hour
from telegram.error import Unauthorized


logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

logger.info("SUBSCRIPTION PROCESS STARTED")
logger.info("CONNECTING DATABASE")
client = pymongo.MongoClient("mongodb://localhost:27017/")

db = client['iztechbot']
users = db["users"]
menu_storage = db["menu"]
logger.info("CONNECTION ESTABLISHED")


def job():
    bot = telegram.Bot(token=environ.get('IZTECHBOT_KEY'))
    menu = {"0": lib.get_menu("today", 0),
            "1": lib.get_menu("today", 1),
            "2": str(date.today())}
    if menu_storage.estimated_document_count() > 0:
        menu_storage.update_one({}, {"$set": menu})
    else:
        menu_storage.insert_one(menu)
    logger.info("Menu has been updated.")
    sent_message_count = 0
    for user in users.find({'subscribe': 1}):
        try:
            bot.sendMessage(chat_id=user['chat_id'], text=lib.generate_menu_text(menu[str(user['vegetarian'])],
                                                                                 user['lang']), parse_mode="Markdown")
            sent_message_count +=1
        except Unauthorized:
            logger.info("Removing user ({}) because of blocking...".format(user['chat_id']))
            users.remove({"chat_id": user['chat_id']})
    logger.info("{} message has been sent to subscribed users.".format(sent_message_count))


schedule.every().monday.at(hour).do(job)
schedule.every().tuesday.at(hour).do(job)
schedule.every().wednesday.at(hour).do(job)
schedule.every().thursday.at(hour).do(job)
schedule.every().friday.at(hour).do(job)

while True:
    schedule.run_pending()
    sleep(1)
