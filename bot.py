#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from functools import wraps
from telegram.ext import Updater, CommandHandler, CallbackQueryHandler
from telegram import ChatAction, InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardMarkup
from strings import _
from time import sleep, gmtime, strftime
from os import environ
import pymongo
import re
import lib

def button(bot, update):
    query = update.callback_query
    data = query.data.split('=')
    lang = users.find({'chat_id': query.message.chat_id}, {'lang': 1})[0]['lang']

    if data[0] == "lang":
        bot.editMessageText(text="{}".format(_["lang"][data[1]]),
                                chat_id=query.message.chat_id,
                                message_id=query.message.message_id)
        users.update_one({'chat_id': query.message.chat_id}, {'$set': {'lang': data[1]}})
    elif data[0] == "vegetarian":
        bot.editMessageText(text="{}".format(_["vegetarian"][int(data[1])][lang]),
                                chat_id=query.message.chat_id,
                                message_id=query.message.message_id)
        users.update_one({'chat_id': query.message.chat_id}, {'$set': {'vegetarian': int(data[1])}})
    elif data[0] in ["unsubscribe", "subscribe"]:
        bot.editMessageText(text="{}".format(_[data[0]][lang]),
                                chat_id=query.message.chat_id,
                                message_id=query.message.message_id)
        users.update_one({'chat_id': query.message.chat_id}, {'$set': {'subscribe': ["unsubscribe", "subscribe"].index(data[0])}})

def build_menu(buttons,
               n_cols,
               header_buttons=None,
               footer_buttons=None):
    menu = [buttons[i:i + n_cols] for i in range(0, len(buttons), n_cols)]
    if header_buttons:
        menu.insert(0, header_buttons)
    if footer_buttons:
        menu.append(footer_buttons)
    return menu

def send_action(action):
    def decorator(func):
        @wraps(func)
        def command_func(*args, **kwargs):
            bot, update = args
            bot.send_chat_action(chat_id=update.message.chat_id, action=action)
            func(bot, update, **kwargs)
        return command_func

    return decorator

def settings(bot, update):
    user = users.find({'chat_id': update.message.chat_id}, {'lang': 1})[0]
    button_list_lang = [
        InlineKeyboardButton("Türkçe", callback_data="lang=tr"),
        InlineKeyboardButton("English", callback_data="lang=en"),
    ]
    reply_markup_lang = InlineKeyboardMarkup(build_menu(button_list_lang, n_cols=2))
    update.message.reply_text(_['question']['lang'][user['lang']], reply_markup=reply_markup_lang)

    button_list_food_type = [
        InlineKeyboardButton(_['bool'][0][user['lang']], callback_data="vegetarian=0"),
        InlineKeyboardButton(_['bool'][1][user['lang']], callback_data="vegetarian=1"),
    ]
    reply_markup_food_type = InlineKeyboardMarkup(build_menu(button_list_food_type, n_cols=2))
    update.message.reply_text(_['question']['vegetarian'][user['lang']], reply_markup=reply_markup_food_type)

    button_list_subscribe = [
        InlineKeyboardButton(_['bool'][0][user['lang']], callback_data="unsubscribe"),
        InlineKeyboardButton(_['bool'][1][user['lang']], callback_data="subscribe"),
    ]
    reply_markup_subscribe = InlineKeyboardMarkup(build_menu(button_list_subscribe, n_cols=2))
    update.message.reply_text(_['question']['subscription'][user['lang']], reply_markup=reply_markup_subscribe)

def start(bot, update):
    if users.count_documents({'chat_id': update.message.chat_id}) == 0:
        users.insert_one({'chat_id': update.message.chat_id, 'lang': 'en', 'vegetarian': 0, 'subscribe': 0})
    lang = users.find({'chat_id': update.message.chat_id}, {'lang': 1})[0]['lang']
    update.message.reply_text(_['start'][lang].format(update.message.from_user.first_name))
    settings(bot, update)

def help(bot, update):
    user = users.find({'chat_id': update.message.chat_id}, {'lang': 1})[0]
    update.message.reply_text(_['help'][user['lang']])

def subscribe(bot, update):
    user = users.find({'chat_id': update.message.chat_id}, {'lang': 1})[0]
    users.update_one({'chat_id': update.message.chat_id}, {'$set': {'subscribe': 1}})
    update.message.reply_text(_['subscribe'][user['lang']], reply_markup=reply_markup_subscribe)

def unsubscribe(bot, update):
    user = users.find({'chat_id': update.message.chat_id}, {'lang': 1})[0]
    users.update_one({'chat_id': update.message.chat_id}, {'$set': {'subscribe': 0}})
    update.message.reply_text(_['unsubscribe'][user['lang']], reply_markup=reply_markup_subscribe)

def lang(bot, update):
    parsed_text = update.message.text.split(" ")
    user = users.find({'chat_id': update.message.chat_id}, {'lang': 1})[0]
    if len(parsed_text) > 1 and parsed_text[1] in ['en', 'tr']:
        users.update_one({'chat_id': update.message.chat_id}, {'$set': {'lang': parsed_text[1]}})
        update.message.reply_text(_['lang'][parsed_text[1]], reply_markup=reply_markup_subscribe)
    else:
        update.message.reply_text(_['error_lang'][user['lang']], reply_markup=reply_markup_subscribe)

@send_action(ChatAction.TYPING)
def menu(bot, update):
    user = users.find({'chat_id': update.message.chat_id}, {'lang': 1, 'vegetarian': 1})[0]
    parsed_text = update.message.text.split(" ")
    if len(parsed_text) == 1 or (len(parsed_text) > 1 and parsed_text[1] == "today"):
            update.message.reply_text(lib.get_menu("today", user['lang'], user['vegetarian']), parse_mode="Markdown")
    elif len(parsed_text) > 1:
        update.message.reply_text(lib.get_menu(parsed_text[1], user['lang'], user['vegetarian']), parse_mode="Markdown")

print("{} MAIN THREAD".format(strftime("%m.%d.%Y %a %H:%M:%S", gmtime())))

client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client['iztechbot']
users = db["users"]

updater = Updater(token=environ.get('IZTECHBOT_KEY'))

updater.dispatcher.add_handler(CommandHandler('start', start))
updater.dispatcher.add_handler(CommandHandler('help', help))
updater.dispatcher.add_handler(CommandHandler('menu', menu))
updater.dispatcher.add_handler(CommandHandler('subscribe', subscribe))
updater.dispatcher.add_handler(CommandHandler('unsubscribe', unsubscribe))
updater.dispatcher.add_handler(CommandHandler('settings', settings))
updater.dispatcher.add_handler(CommandHandler('lang', lang))
updater.dispatcher.add_handler(CallbackQueryHandler(button))

updater.start_polling()
updater.idle()
