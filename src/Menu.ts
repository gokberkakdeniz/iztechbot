import { Result, Ok, Err } from "./Result";
import { get } from 'https';
import moment = require('moment');

type MenuType = "vegetarian" | "vegan" | "normal";
type MenuTypeQuery = "V" | "VEG" | "O";

interface Menu {
    date: Date | string;
    normal: string;
    vegan: string;
    vegetarian: string;
}

class InvalidParameterException extends Error {
    code: any;

    constructor(message, { code }) {
        super(message);
        this.name = "InvalidParameterException";
        this.code = code;
    }
}

function getMenuTypeQuery(menuType: MenuType) : MenuTypeQuery {
    switch (menuType) {
        case "vegetarian":
            return "V"
        case "vegan":
            return "VEG"
        case "normal":
            return "O"
        default:
            throw new InvalidParameterException("The parameter 'menuType' should be one of normal, vegan, vegetarian.", { code: "ERR_INVALID_MENU_TYPE" });
    }
}

function getMenuURL(date, menuType: MenuType) {
    if (!moment(date, "DD.MM.YYYY", "tr", true).isValid()) 
        throw new InvalidParameterException("The parameter 'date' should be in format of 'DD.MM.YYYY'.", { code: "ERR_INVALID_DATE" });

    const type = getMenuTypeQuery(menuType);
    
    return `https://yks.iyte.edu.tr/yemekliste.aspx?tarih=${moment(date, "DD.MM.YYYY").format("MM.DD.YYYY")}&ogun=${type}`;
}

// Original https://stackoverflow.com/a/44195856
function decodeEntities(encodedString) {
    const translateRe = /&(nbsp|amp|quot|lt|gt);/ug;
    const translate = {
        "nbsp": " ",
        "amp": "&",
        "quot": "\"",
        "lt": "<",
        "gt": ">"
    };
    
    return encodedString.replace(translateRe, (match, entity) => translate[entity])
                        .replace(/&#(\d+);/ugi, (match, numStr) =>  String.fromCharCode(parseInt(numStr, 10)));
}

async function httpsGetRequest(url, options) : Promise<Result<string, string>> {
    return new Promise((resolve, reject) => {
        get(url, options, res => {
            if (res.statusCode !== 200) {
                res.resume();
                resolve(new Err(`Request failed. Server returned ${res.statusCode} status code.`))
            }

            res.setEncoding('utf8');
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => resolve(new Ok(data)));
        }).on('error', (e) => {
            resolve(new Err(e.message));
        });
    })
}

async function getMenu(date, menuType: MenuType) {
    const url = getMenuURL(date, menuType);

    const body = (await httpsGetRequest(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:66.0) Gecko/20100101 Firefox/66.0'
        }
    })).unwrap();

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
    return menu;
}

async function getTodaysMenu() : Promise<Result<Menu, string>> {
    try {
        const date = moment().format("DD.MM.YYYY");
        const normal = await getMenu(date, "normal");
        const vegan = await getMenu(date, "vegan");
        const vegetarian = await getMenu(date, "vegetarian");
        return new Ok({ date, normal, vegan, vegetarian });
    } catch (e) {
        return new Err(e.name + (e.statusCode ? " " + e.statusCode : ""));
    }
};

export {
    getTodaysMenu,
    getMenu,
    Menu
};