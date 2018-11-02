#!/usr/bin/env python3
# -*- coding: utf-8 -*-

hour = "00:00"

_ = {
    'help': {
        'en':'''
        /help - open help menu
        /menu - show food menu of today
        /menu <yesterday|today|tomorrow|day.month.year> - show food menu of spesific day
        /subscribe - receive food menu daily at {hour}
        /unsubscribe - unsubscribe from message service
        /vegetarian <false|true> - set menu type, default is false''',
        'tr': '''
        /help - yardım menüsünü aç
        /menu - günün menüsünü göster
        /menu <dün|dun|bugün|bugun|yarın|yarin|13.09.2018> - belirtilen güne ait yemek menüsünü göster
        /subscribe - hergün {hour}'de yemek menüsünü mesaj olarak al
        /unsubscribe - mesaj almayı bırak
        /vegetarian <false|true> - yemek tipini değiştir, varsayılan false'''.format(hour=hour)
    },
    'start': {
        'en':'''
        Hello {}, you can see food menu whenever you want or even subscribe it to receive message everyday.\n''',
        'tr':'''
        Merhaba {}, beni kullanarak istediğin zaman yemekhane menüsünü görebilirsin. Hatta abone olarak istediğin günlük olarak mesaj alabilirsin.\n'''
    },
    'fetch_url': 'https://yks.iyte.edu.tr/yemekliste.aspx?tarih={}&ogun={}',
    'menu_header': {
        'en': 'Food Menu',
        'tr': 'Yemek Menüsü'
    },
    'error_date_format': {
        'en': 'Oops, wrong date format!\nExample: 13.01.2019',
        'tr': 'Geçersiz format!\nÖrnek: 13.01.2019'
    },
    'weekend': {
        'en': "It's a weekend. :)",
        'tr': "Haftasonu."
    },
    'vegetarian': {
        0: {
            'en': 'You will see normal food menu.',
            'tr': 'Normal yemek menüsünü göreceksin.'
        },
        1: {
            'en': 'You will see vegetarian food menu.',
            'tr': 'Vejetaryan yemek menüsünü göreceksin.'
        }
    },
    'question': {
        'lang': {
            'en': 'Which language do you prefer?',
            'tr': 'Hangi dili tercih edersin?'
        },
        'vegetarian': {
            'en': 'Are you a vegetarian?',
            'tr': 'Vejetaryan mısın?'
        },
        'subscription': {
            'en': 'Do you want to subscribe to receive daily food menu message at {}?'.format(hour),
            'tr': 'Günlük olarak saat {}\'da yemek menüsünü almak ister misin?'.format(hour)
        }
    },
    'lang': {
        'en': 'You have selected English.',
        'tr': 'Türkçeyi seçtin.'
    },
    'error_request_exception': {
        'en': 'Something happened while retrieving menu...',
        'tr': 'Menü alınırken bir hata oluştu...'
    },
    'error_lang': {
        'en': "Oops, wrong format!\n Only `/lang en` and `/lang tr` are valid.",
        'tr': "Geçersiz format!\n Sadece `/lang en` ve `/lang tr` geçerli."
    },
    'subscribe': {
        'en': 'You will receive daily food menu everyday at ' + hour,
        'tr': 'Günlük yemek menüsünü düzenli olarak hergün {}\'de alacaksın.'.format(hour)
    },
    'unsubscribe': {
        'en': 'You won\'t receive daily food menu message.',
        'tr': 'Günlük yemek menüsü mesajı almayacaksın.'
    },
    'bool': {
        0: {
            'en': 'No',
            'tr': 'Hayır'
        },
        1: {
            'en': 'Yes',
            'tr': 'Evet'
        }
    }
}
