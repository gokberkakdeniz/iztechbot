[![bot link]()]()


<p align="center">
  <img src="https://raw.githubusercontent.com/iztech/logo/master/export/iztech_logo%400%2C1x.png">
</p>

# iztechbot

<p align="right">
  <a href="https://t.me/iztechbot">
  <img src="https://img.shields.io/badge/style-iztechbot-blue.svg?longCache=true&style=for-the-badge&label=Telegram&logo=telegram&link=https://t.me/iztechbot">
  </a>
</p>

IYTE Yemekhane botu

    yardim - yardım menüsünü göster.
    menu - günün menüsünü göster.
    menu <dün|bugün|yarın|13.09.2018> - O güne ait menüyü göster.
    ayarlar - ayarlar menüsünü aç.

# Kurulum
- Depoyu klonlayın.
    
    git clone https://github.com/tncga/iztechbot.git

- `.env` dosyasını kendinize göre düzenleyin.

      DB_HOST=localhost
      DB_NAME=iztechbot
      DB_USER=iztechbot_admin
      DB_PASSWORD=password
      DB_CONNECTION_LIMIT=5
      BOT_ADMIN_CHAT_ID=123456789
      BOT_TOKEN=123456789:ABCDEFGH

- MariaDB'yi kurun.
- Veritabanı ve tablo oluşturun.

      CREATE DATABASE iztechbot;
      CREATE USER 'iztechbot_admin'@'localhost' IDENTIFIED BY 'password';
      GRANT ALL PRIVILEGES ON iztechbot.* TO 'iztechbot_admin'@'localhost';
      CREATE TABLE iztechbot.users (
          `chat_id` int(11) NOT NULL,
          `menu_type` enum('NORMAL','VEGAN','VEGETARIAN') NOT NULL DEFAULT 'NORMAL',
          `subscription` enum('FALSE','TRUE','DISABLED') NOT NULL DEFAULT 'FALSE',
          UNIQUE (`chat_id`)
      );

- Gerekli paketleri indirin.

      yarn install

- Derleyin.

      yarn build

- systemd servisi (`/usr/lib/systemd/system/iztechbot.service`) oluşturun.

      [Unit]
      Description=IYTE Yemekhane Botu
      After=syslog.target network.target
      Documentation=https://github.com/tncga/iztechbot

      [Service]
      Type=simple
      User=gokberk
      WorkingDirectory=/projenin/oldugu/klasor
      ExecStart=/usr/bin/node --tls-min-v1.0 dist/main.js
      Restart=on-failure
      RestartSec=60s

      [Install]
      WantedBy=multi-user.target

- Servisleri güncelleyelin.

      sudo systemctl daemon-reload 

- Servisi aktif edip başlatalın.

      sudo systemctl enable iztechbot 
      sudo systemctl start iztechbot 


# Test Edilmiş Sistem Özellikleri
- İşletim Sistemi: Fedora 31
- MariaDB: mysql  Ver 15.1 Distrib 10.3.21-MariaDB, for Linux (x86_64) using readline 5.1
- NodeJS: v12.15.0

# Teşekkürler
Logo: https://github.com/iztech/logo

# Lisans
Copyright (c) 2018 Gökberk AKDENİZ

**iztechbot** is licensed under the *GNU AGPLv3.0*.
