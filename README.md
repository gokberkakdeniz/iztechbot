<center>
<img src="https://img.shields.io/badge/style-iztechbot-blue.svg?longCache=true&style=for-the-badge&label=Telegram&logo=telegram&link=https://t.me/iztechbot">
</center>

<center>
  <h1>
    <img src="https://raw.githubusercontent.com/iztech/logo/master/export/iztech_logo%400%2C1x.png">
    iztechbot
  </h1>
</center>

> A Telegram bot that helps you to see food menu of IZTECH central cafeteria

    /help - open help menu
    /menu - show food menu of today
    /menu yesterday/today/tomorrow - show food menu of yesterday/today/tomorrow
    /menu 13.12.2018 - show food menu of 13.12.2018
    /settings - open setting menu
    /subscribe - receive daily food menu message
    /unsubscribe - don't receive daily food menu message
    /lang en/tr - change language

## Installation
Python 3:

    pip install python-telegram-bot
    pip install schedule
    pip install requests
    pip install ftfy
    pip install pymongo

Ubuntu:

    sudo apt install expect
install mongo db using [this tutorial](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/)

Arch Linux:

    sudo pacman -S expect
    sudo pacman -S mongodb
    systemctl enable mongodb

Start

    chmod +x start.sh
    ./start.sh

> Add bot token as environment variable "IZTECHBOT_KEY".

### Credits
Logo: https://github.com/iztech/logo

## Licence
Copyright (c) 2018 Gökberk AKDENİZ
**iztechbot** is licensed under the *GNU AGPLv3.0*.
