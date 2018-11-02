#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from requests import get
import requests.exceptions
from strings import _
import datetime
import re
from ftfy import fix_text, fix_encoding
import logging

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',level=logging.INFO)
logger = logging.getLogger(__name__)

def get_menu(date, vegetarian):
    if date in ["today", "bugün", "bugun"]:
        date = datetime.datetime.strftime(datetime.date.today(), "%m.%d.%Y")
    elif date in ["yesterday", "dun", "dün"]:
        date = datetime.datetime.strftime(datetime.date.today() - datetime.timedelta(days=1), "%m.%d.%Y")
    elif date in ["tomorrow", "yarın", "yarin"]:
        date = datetime.datetime.strftime(datetime.date.today() + datetime.timedelta(days=1), "%m.%d.%Y")
    else:
        try:
            date = datetime.datetime.strftime(datetime.datetime.strptime(date, "%d.%m.%Y"), "%m.%d.%Y")
        except ValueError as e:
            logger.warning(str(e))
            return "error_date_format"

    if datetime.datetime.strftime(datetime.datetime.strptime(date, "%m.%d.%Y") ,"%w") in ["6", "0"]:
        return "weekend"

    try:
        req = get(_['fetch_url'].format(date, "V" if vegetarian else "O"),
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:64.0) Gecko/20100101 Firefox/64.0'
            }
        )
    except requests.exceptions.RequestException as e:
        logger.warning(str(e))
        return "error_request_exception"

    regex = r'<td>(.*?)<\/td>'
    menu = re.findall(regex, req.text)
    menu_str = "\n```\n{} " + datetime.datetime.strftime(datetime.datetime.strptime(date, "%m.%d.%Y"), "%d.%m.%Y") + "```\n"
    for i in range(0, len(menu), 2):
        menu_str += "{} `{}`\n".format(fix_text(menu[i]),menu[i+1])
    return menu_str

def generate_menu_text(menu, lang):
    if menu == "error_date_format":
        return _['error_date_format'][lang]
    elif menu == "weekend":
        return _['weekend'][lang]
    elif menu == "error_request_exception":
        return _['error_request_exception'][lang]
    elif not lang in ["tr", "en"]:
        lang = "en"

    return menu.format(_['menu_header'][lang])
