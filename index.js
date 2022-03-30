const Cheerio = require('cheerio');
const Category = require('./Category');
const StoreWrapper = require('./Store');
const StrapiWrapper = require('./Strapi');

const InventoryItem = require('./InventoryItem');

const updateTime = 1;

const strapi = new StrapiWrapper("http://localhost:1337");
const store = new StoreWrapper("MAXPAY-PAWN", "1472", updateTime);

function serializeValue(val, type) {
    if (typeof val === 'string') {
        if (type === "float") {
            if (val === "") {
                return 0.00;
            } else {
                return parseFloat(val).toFixed(2);
            }
        }
    }
    return val
}

async function getAllItemSpecifics() {
    return new Promise(async (resolve, reject) => {
        await store.start();
        let strapiID = 100;
        let item = new InventoryItem("knife", "https://www.buya.com/Item/Details/DEWALT-DCD771/2e41e42446834d26b0c928dfa1946097/1472", "2e41e42446834d26b0c928dfa1946097");
        let itemInfo = await store.fetchItemInfo(item);
        console.log(itemInfo);
        let formData = new FormData();

        itemInfo.images.forEach(image => {
            formData.append('images', image);
        })

        strapi.update("Inventories", strapiID, formData);

        await store.stop();
    });
}

(async () => {
    await getAllItemSpecifics();
})();