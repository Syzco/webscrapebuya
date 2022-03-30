const cron = require('node-cron');
const express = require('express');

app = express();

const StoreWrapper = require('./Store');
const StrapiWrapper = require('./Strapi');

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

async function updateInventory() {
    return new Promise(async (resolve, reject) => {
        console.log("Starting to update inventory...");
        let t0 = Date.now();
        await store.start();
        let t1 = Date.now();
        let items = await store.getItemList();
        let t2 = Date.now();
        await store.stop();
        console.log("It took " + (t2-t1) + "ms to grab a list of all items.");

        let cache = await strapi.get("Inventories", {
            active: '1',
            _limit: '-1'
        })

        let lookup = [];
        cache.data.forEach(val => {
            lookup[val.buyaID] = val;
        })

        let process = 0;
        let uPriceCount = 0;
        let uShipCount = 0;
        let uShipMethodCount = 0;
        let uConditionCount = 0;
        let newCount = 0;
        let oldCount = 0
        for (let i=0; i < items.length; i++) {
            if (typeof lookup[items[i].getID()] != 'undefined') {
                //New Item is Found in Cache
                console.log("Item Present (Need to Verify): " + items[i].getID());

                let id = items[i].getID();
                let cacheItem = lookup[id];
                //console.log(cacheItem)
                let strapiID = lookup[items[i].getID()].id;
                //console.log(items[i])
                //console.log("Checking condition...")
                if (cacheItem.condition !== items[i].getCondition()) {
                    console.log("Condition: " + cacheItem.condition + " is not correct. Updating the value to " + items[i].getCondition() + "...");

                    uConditionCount++;
                    process++;
                    await setTimeout(() => {
                        strapi.update("Inventories", strapiID, {
                            "condition": serializeValue(items[i].getCondition())
                        }).then((response) => {
                            console.log("["+process+"] Completed updating the condition of: " + id);
                            process--;
                        });
                    }, process*1000);
                }
                //console.log("Checking price...")
                if (parseFloat(cacheItem.price) !== parseFloat(items[i].getPrice().replace("$", ""))) {
                    console.log("Price: "+ parseFloat(cacheItem.price) + " is not correct. Updating the value to "+ parseFloat(items[i].getPrice().replace("$", "")) + "...");

                    uPriceCount++;
                    process++;
                    await setTimeout(() => {
                        strapi.update("Inventories", strapiID, {
                            "price": serializeValue(items[i].getPrice().replace("$", ""), "float")
                        }).then(async (response) => {
                            console.log("["+process+"] Completed updating the price of: " + id);
                            process--;
                        });
                    }, process*1000);
                }
                //console.log("Checking shipping price...")
                if (parseFloat(cacheItem.shippingPrice) !== parseFloat(items[i].getShippingPrice().replace("$", ""))) {
                    if ((parseFloat(cacheItem.shippingPrice) !== 0 && items[i].getShippingPrice() !== '') || (parseFloat(cacheItem.shippingPrice) !== 0 && items[i].getShippingPrice() === '') ) {
                        console.log("Shipping price: " + parseFloat(cacheItem.shippingPrice) + " is not correct. Updating the value to " + parseFloat(items[i].getShippingPrice().replace("$", "")) + "...");

                        uShipCount++;
                        process++;
                        await setTimeout(() => {
                            strapi.update("Inventories", strapiID, {
                                "shippingPrice": serializeValue(items[i].getShippingPrice().replace("$", ""), "float")
                            }).then((response) => {
                                console.log("["+process+"] Completed updating the shipping price of: " + id);
                                process--;
                            });
                        }, process*1000);
                    }
                }
                //console.log("Checking shipping method...")
                if (cacheItem.shippingMethod !== items[i].getShippingMethod()) {
                    console.log("Shipping method: " + cacheItem.shippingMethod + " is not correct. Updating the value to " + items[i].getShippingMethod() + "...");

                    uShipMethodCount++;
                    process++;
                    await setTimeout(() => {
                        strapi.update("Inventories", strapiID, {
                            "shippingMethod": serializeValue(items[i].getShippingMethod())
                        }).then((response) => {
                            console.log("[" + process + "] Completed updating the shipping method of: " + id);
                            process--;
                        });
                    }, process*1000);
                }

                //Remove from cache list.
                delete lookup[items[i].getID()];
            } else {
                //New Item was not Found in Cache
                console.log("Item Not Present (Need to Add): " + items[i].getID());

                newCount++;
                process++;
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
                        "active":'1'
                    }).then((response) => {
                        console.log("[" + process + "] Completed adding of new inventory item: " + items[i].getID());
                        process--;
                    }).catch(err => {
                        if (err.data.statusCode === "500") {
                            strapi.update()
                        }
                    })
                }, process*1000);
            }
        }

        //console.log(lookup);

        for (let index in lookup) {
            if (typeof lookup[index] != 'undefined') {
                //Item No Longer Active
                console.log("Item No Longer Active (Need to Set Inactive): " + index)

                oldCount++;
                process++;
                await setTimeout(() => {
                    strapi.update("Inventories", lookup[index].id, {
                        "active": 0
                    }).then((response) => {
                        console.log("[" + process + "] Completed changing the active status of: " + index);
                        process--;
                    });
                }, process*1000);
            }
        }

        let t3 = Date.now();
        console.log("Finished updating inventory...");
        console.log("There were " + uConditionCount + " conditions fixed.");
        console.log("There were " + uPriceCount + " prices fixed.");
        console.log("There were " + uShipCount + " shipping prices fixed.");
        console.log("There were " + uShipMethodCount + " shipping methods fixed.");
        console.log("There were " + newCount + " items added.");
        console.log("There were " + oldCount + " items removed.");
        console.log("Ended at " + Date.now() + ". It took " + (t3-t0) + "ms to complete this update.");

        resolve();
    })
}

cron.schedule("*/5 * * * *", async () => {
    console.log("Running the check every 5 minutes...")
    await updateInventory();
},{
    scheduled: true
});

app.listen("3128");

exports.updateInventory = updateInventory();