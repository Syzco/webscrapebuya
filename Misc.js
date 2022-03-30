const StoreWrapper = require('./Store');
const StrapiWrapper = require('./Strapi');

const updateTime = 1;

const strapi = new StrapiWrapper("http://localhost:1337");
const store = new StoreWrapper("MAXPAY-PAWN", "1472", updateTime);

async function saveStoreBaseCategories() {
    return new Promise(async (resolve, reject) => {
        await store.start();

        let tbl = [];
        let storeCats = await store.getCategoryList();
        storeCats.forEach((category, index) => {
            let mainName = category.getName();
            let mainChild = category.getChildren();

            console.log(mainName);
            strapi.post("Categories", {
                "name": mainName
            }).then((response) => {
                if (mainChild !== false) {
                    mainChild.forEach((sub) => {
                        let subName = sub.getName();
                        let parentID = response.data.id;

                        console.log(mainName + "(" + parentID + ") > " + subName);

                        strapi.post("Categories", {
                            "name": subName,
                            "parentID": parentID
                        }).then((response) => {});
                    })
                }
            });
        })

        resolve(await store.stop());
    })
}

async function saveAllInventory() {
    return new Promise(async (resolve, reject) => {
        await store.start();

        let items = await store.getItemList();

        await store.stop();

        for (let i = 0; i < items.length; i++) {
            console.log("Starting to send item: " + i);
            await setTimeout(() => {
                strapi.post("Inventories", {
                    "buyaID": serializeValue(items[i].getID()),
                    "uid": serializeValue(items[i].getID()),
                    "title": serializeValue(items[i].getTitle()),
                    "url": serializeValue(items[i].getURL()),
                    "condition": serializeValue(items[i].getCondition()),
                    "price": serializeValue(items[i].getPrice().replace("$", ""), "float"),
                    "shippingPrice": serializeValue(items[i].getShippingPrice().replace("$", ""), "float"),
                    "shippingMethod": serializeValue(items[i].getShippingMethod()),
                    "active": '1'
                }).then(async (response) => {
                    console.log("Completed posting of " + (i+1) + "/" + (items.length) + ": " + (((i+1)/items.length)*100) + "%")
                    if (i === items.length-1) {
                        resolve();
                    }
                })
            }, i*1000);
        }
    })
}