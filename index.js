const invalidRequest = { error: true, message: "invalid request." };
const internalError = { error: true, message: "internal error." };
const success = { error: false, message: "success." };
const types = ["vegetarian", "vegan", "normal"];

function decodeEntities(encodedString) {
  // Original https://stackoverflow.com/a/44195856
  const translateRe = /&(nbsp|amp|quot|lt|gt);/ug;
  const translate = {
    "nbsp": " ",
    "amp": "&",
    "quot": "\"",
    "lt": "<",
    "gt": ">"
  };

  return encodedString.replace(translateRe, (match, entity) => translate[entity])
    .replace(/&#(\d+);/ugi, (match, numStr) => String.fromCharCode(parseInt(numStr, 10)));
}

async function getMenu(date, menuType) {
  try {
    const type = { "vegetarian": "V", "vegan": "VEG", "normal": "O" }[menuType]

    if (!type) return { error: true, message: "Geçersiz yemek türü." };

    const url = `https://yks.iyte.edu.tr/yemekliste.aspx?tarih=${date}&ogun=${type}`;
    const config = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:66.0) Gecko/20100101 Firefox/66.0'
      }
    };
    const body = await fetch(url, config).then(res => res.text())

    const regex = /(?:<td>)(?<data>.*?)(?:<\/td>)/ug;
    let match = null;
    const matches = [];
    while ((match = regex.exec(body)) !== null) {
      matches.push(match.groups.data);
    }

    const foods = ["```\nYemek Menüsü " + date + "```"];
    for (let i = 0; i < matches.length; i += 2) {
      foods.push(`${matches[i]} \`${matches[i + 1]}\``)
    }

    if (foods.length == 1) foods.push("Yemek yok.")

    const menu = decodeEntities(foods.join("\n"));

    return {
      error: false,
      data: menu
    };
  } catch (e) {
    return {
      error: true,
      message: e.message
    }
  }
}

async function tg(type, data) {
  try {
    const response = await fetch('https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/' + type, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then(res => res.json());

    if (!response.ok) return {
      error: true,
      message: "telegram error.",
      data: response
    };

    return {
      error: false,
      data: response
    };
  } catch (e) {
    return {
      error: true,
      message: e.message,
    }
  }
}

async function handleStart(chatId) {
  return await tg('sendmessage', {
    chat_id: chatId,
    text: 'Hoşgeldin!'
  });
}

async function handleMenu(chatId, args) {
  let type = "normal";
  if (types.includes(args[0])) {
    type = args[0];
  } else if (types.includes(args[1])) {
    type = args[1];
  }

  let date = new Date();
  if (date.getDay() == 0) {
    date.setDate(date.getDate() + 1)
  } else if (date.getDay() == 6) {
    date.setDate(date.getDate() + 2)
  }
  date = new Date().toLocaleString("en-AS", { month: "2-digit", day: "2-digit", year: "numeric" }).replaceAll("/", ".");

  let res = await getMenu(date, type);

  if (res.error) return res;

  res = await tg('sendmessage', {
    chat_id: chatId,
    text: res.data,
    parse_mode: "MarkdownV2"
  });

  if (res.error) return res;

  return {
    error: false,
    message: "menu sent."
  };
}

async function handleRequest(request) {
  let res = invalidRequest;

  if (request.method == 'POST') {
    const data = await request.json()

    console.log(data);

    if (data.message !== undefined) {
      const chatId = data.message.chat.id;
      const text = data.message.text || '';

      if (text[0] == '/') {
        const [cmd, ...args] = text.substring(1).split(" ");

        switch (cmd) {
          case 'start':
            res = await handleStart(chatId)
            break
          case 'menu':
            res = await handleMenu(chatId, args)
            break
        }
      }
    }
  }

  return new Response(
    JSON.stringify(res),
    {
      headers: { 'content-type': 'application/json; charset=utf-8', },
    }
  )
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})