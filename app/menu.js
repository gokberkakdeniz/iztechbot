const request = require("request-promise");
const moment = require("moment");

class InvalidParameterException extends Error {
    constructor(message, { code }) {
        super(message);
        this.name = "InvalidParameterException";
        this.code = code;
    }
}

const getMenuTypeQuery = (menuType) => {
    let type = null;
    if (menuType == "vegetarian") {
        type = "V";
    } else if (menuType == "vegan") {
        type = "VEG";
    } else if (menuType == "normal") {
        type = "O";
    } else {
        throw new Error("menuType should be one of normal, normal, vegetarian.");
    }
    return type;
}

const urlBuild = (date, menuType) => {
    const type = getMenuTypeQuery(menuType);
    if (!moment(date, "DD.MM.YYYY", "tr", true).isValid()) throw new InvalidParameterException("Invalid date format.", { code: "ERR_INVALID_DATE" });

    return `https://yks.iyte.edu.tr/yemekliste.aspx?tarih=${moment(date, "DD.MM.YYYY").format("MM.DD.YYYY")}&ogun=${type}`;
}

// Original https://stackoverflow.com/a/44195856
const decodeEntities = (encodedString) => {
    const translateRe = /&(nbsp|amp|quot|lt|gt);/ug;
    const translate = {
        "nbsp": " ",
        "amp": "&",
        "quot": "\"",
        "lt": "<",
        "gt": ">"
    };
    return encodedString.replace(translateRe, function (match, entity) {
        return translate[entity];
    }).replace(/&#(\d+);/ugi, function (match, numStr) {
        const num = parseInt(numStr, 10);
        return String.fromCharCode(num);
    });
}

const getMenu = async (date, menuType, logger) => {
    const url = urlBuild(date, menuType);

    try {
        const body = await request(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:66.0) Gecko/20100101 Firefox/66.0'
            }
        });
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
    } catch (err) {
        logger.error(err.name + (err.statusCode ? " " + err.statusCode : ""));
        return null;
    }
}

const getTodaysMenu = async (logger) => {
    const menus = {};
    menus.date = moment().format("DD.MM.YYYY");
    menus.normal = await getMenu(menus.date, "normal", logger);
    menus.vegan = await getMenu(menus.date, "vegan", logger);
    menus.vegetarian = await getMenu(menus.date, "vegetarian", logger);
    return menus;
};

module.exports = {
    getMenu,
    getTodaysMenu
};