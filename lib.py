#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from requests import get
from strings import _
import datetime
import re
from ftfy import fix_text, fix_encoding

def get_menu(date, lang, vegetarian):
    if date == "today":
        date = datetime.datetime.strftime(datetime.date.today(), "%m.%d.%Y")
    elif date == "yesterday":
        date = datetime.datetime.strftime(datetime.date.today() - datetime.timedelta(days=1), "%m.%d.%Y")
    elif date == "tomorrow":
        date = datetime.datetime.strftime(datetime.date.today() + datetime.timedelta(days=1), "%m.%d.%Y")
    else:
        try:
            date = datetime.datetime.strftime(datetime.datetime.strptime(date, "%d.%m.%Y"), "%m.%d.%Y")
        except ValueError:
            return _['error_date_format'][lang]

    if datetime.datetime.strftime(datetime.datetime.strptime(date, "%m.%d.%Y") ,"%w") in ["6", "0"]:
        return _['weekend'][user['lang']]

    req = get(_['fetch_url'].format(date, "V" if vegetarian else "O"),
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:64.0) Gecko/20100101 Firefox/64.0'
        }
    )

    regex = r'<td>(.*?)<\/td>'
    menu = re.findall(regex, req.text)
    menu_str = "```\n{} {}```\n".format(_['menu_header'][lang],  datetime.datetime.strftime(datetime.datetime.strptime(date, "%m.%d.%Y"), "%d.%m.%Y"))
    for i in range(0, len(menu), 2):
        menu_str += "{} `{}`\n".format(fix_text(menu[i]),menu[i+1])
    return menu_str
