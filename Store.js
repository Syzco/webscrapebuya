const Crawl = require('./Crawl');
const Cheerio = require('cheerio');
const InventoryItem = require('./InventoryItem');
const ItemImage = require('./ItemImage');
const Category = require('./Category');
const fs = require('fs');
const Request = require('request');

class Store {
    constructor(name, id, updateTime) {
        this.id = id;
        this.name = name;
        this.updateTime = (updateTime*1000)*60;
        this.itemCount = 1;
        this.itemList = [];
        this.listLastUpdate = 0;
        this.categories = [];
        this.buya = "https://www.buya.com";
        this.description = `${this.buya}/StoreProfile/About/${this.name}/${this.id}`;
        this.itemListPage = `https://www.buya.com/Store/${this.name}/${this.id}?page=1`;
        this.crawler = new Crawl();
    }

    /**
     * Start the crawler.
     * @returns Promise of Start.
     */
    async start() {
        console.log("Starting the store...")
        return await this.crawler.start();
    }

    /**
     * Stops the crawler.
     * @returns Promise after file write.
     */
    async stop() {
        console.log("Stopping the store...")
        return new Promise(async (resolve, reject) => {
            this.crawler.printProcesses();
            await this.crawler.idle();
            resolve(await this.crawler.close());
        });
    }

    /**
     * Get the name of the store.
     * @returns name.
     */
    getName() {
        return this.name;
    }

    /**
     * Get the id of the store.
     * @returns id.
     */
    getId() {
        return this.id;
    }

    /**
     * Gets the Buya home link.
     * @returns BuyaLink.
     */
    getBuya() {
        return this.buya;
    }

    getListLastUpdate() {
        return this.listLastUpdate;
    }

    updateListLastUpdate() {
        this.listLastUpdate = Date.now();
    }

    listNeedUpdate() {
        if (Date.now() >= (this.listLastUpdate+this.updateTime) || this.itemList.length === 0) {
            return true
        }
        return false
    }

    /**
     * Get the item count.
     * @param force - Whether or not to force a new query to the site.
     * @returns Promise of item count.
     */
    getItemCount() {
        return this.itemCount;
    }

    /**
     * Get the item list.
     * @return Promise of all items in the list.
     */
    async getItemList() {
        let list = this.itemList;
        if (this.listNeedUpdate()) {
            try {
                list = await this.fetchItemList();
            } catch (reason) {
                //Handle the WRONGCOUNT rejection.
                if (reason.message === "WRONGCOUNT") {
                    console.log("Requested with the wrong count. Trying again...")
                    this.itemCount = reason.realCount;
                    list = await this.getItemList();
                }
            }
        }
        return list;
    }

    async getCategoryList() {
        let list = this.categories;
        if (list.length === 0) {
            list = await this.fetchAllCategories();
        }
        return list;
    }

    /**
     * Helper Function:
     * Serialize the parsed data to remove whitespace code.
     * @param data - Data to be serialized.
     * @returns Serialized Data.
     */
    serializeData(data) {
        let rtn = data.replace(/(\r\n|\n|\r|\t)/gm, "");
        return rtn.trim();
    }

    /**
     * Helper Function:
     * Add item to store's list.
     * @param item
     * @returns ONLY IF NOT VALID INPUT.
     */
    addItemToList(item) {
        if (!(item instanceof InventoryItem)) {
            console.error("Item is not an instance of Inventory Item");
            return false;
        }

        this.itemList.push(item);
    }

    /**
     * Helper Function:
     * Add main category to store's list.
     * @param category
     * @returns ONLIY IF NOT VALID INPUT.
     */
    addMainCategory(category) {
        if (!(category instanceof Category)) {
            console.error("Item is not an instance of Category");
            return false;
        }

        this.categories.push(category);
    }

    /**
     * Fetches the item list from the ALL page.
     * @returns Promise of the entire item list.
     */
    async fetchItemList() {
        console.log("Fetching item list...");
        let itemCount = this.getItemCount();
        return new Promise(async (resolve, reject) => {
            await this.crawler.addToQueue(this.itemListPage + `&pageSize=${itemCount}&sort=5&listView=true`, async (url, page) => {
                let $ = Cheerio.load(await page.content(), {
                    normalizeWhitespace: true
                });

                let realItemCount = parseInt($('.total-items').text().split(" ")[2]);
                //console.log(itemCount + " " + realItemCount);
                if (parseInt(itemCount) !== realItemCount) {
                    reject({
                        message: "WRONGCOUNT",
                        realCount: realItemCount
                    });
                    return false;
                }

                let allItems = $('.wrapper > article');

                this.itemList = []; //Clear memory of previous item list.

                allItems.each((key, val) => {
                    let item = new InventoryItem($(val).find('.col-name > h3 > a').text(), this.buya + $(val).find('.col-name > h3 > a').attr('href'), $(val).find('.col-name > h3 > a').attr('href').split("/")[4]);

                    item.setCondition(this.serializeData($(val).find('.quality').text()));
                    item.setDescription(this.serializeData($(val).find('.description').text()));
                    item.setPrice(this.serializeData($(val).find('.price-without-icon').text()));
                    item.setShippingPrice(this.serializeData($(val).find('.price-with-icon').text()));
                    item.setShippingMethod(this.serializeData($(val).find('.instore-only').text()));

                    this.addItemToList(item);

                    if (key === (allItems.length-1)) {
                        console.log("Resolving item list...");
                        this.updateListLastUpdate();
                        resolve(this.itemList);
                    }
                })

            }, (err) => {
                reject(err);
            })
        })
    }

    async fetchItemListRequest() {
        console.log("Fetching item list...");
        let itemCount = this.getItemCount();
        return new Promise(async (resolve, reject) => {
            Request(this.itemListPage + `&pageSize=${itemCount}&sort=5&listView=true`, async (url, page) => {
                let $ = Cheerio.load(await page.content(), {
                    normalizeWhitespace: true
                });

                let realItemCount = parseInt($('.total-items').text().split(" ")[2]);
                console.log(itemCount + " " + realItemCount);
                if (parseInt(itemCount) !== realItemCount) {
                    reject({
                        message: "WRONGCOUNT",
                        realCount: realItemCount
                    });
                    return false;
                }

                let allItems = $('.wrapper > article');

                this.itemList = []; //Clear memory of previous item list.

                allItems.each((key, val) => {
                    let item = new InventoryItem($(val).find('.col-name > h3 > a').text(), this.buya + $(val).find('.col-name > h3 > a').attr('href'), $(val).find('.col-name > h3 > a').attr('href').split("/")[4]);

                    item.setCondition(this.serializeData($(val).find('.quality').text()));
                    item.setDescription(this.serializeData($(val).find('.description').text()));
                    item.setPrice(this.serializeData($(val).find('.price-without-icon').text()));
                    item.setShippingPrice(this.serializeData($(val).find('.price-with-icon').text()));
                    item.setShippingMethod(this.serializeData($(val).find('.instore-only').text()));

                    this.addItemToList(item);

                    if (key === (allItems.length-1)) {
                        console.log("Resolving item list...");
                        this.updateListLastUpdate();
                        resolve(this.itemList);
                    }
                })

            }, (err) => {
                reject(err);
            })
        })
    }

    /**
     * Fetches the item specific info from buya.
     * @param item - InventoryItem only.
     * @returns Promise but empty.
     */
    async fetchItemInfo(item) {
        console.log("Fetching item info...");
        return new Promise(async (resolve, reject) => {
            await this.crawler.addToQueue(item.getURL(), async (url, page) => {
                let $ = Cheerio.load(await page.content(), {
                    normalizeWhitespace: true
                })

                let returnValues = [];

                let categories = [];
                let breadCrumb = $('.breadcrumb > span');
                breadCrumb.each((k, v) => {
                    categories.push(this.serializeData($(v).text()));
                })
                categories.pop();
                categories.pop();
                categories.shift();
                categories.shift();

                returnValues.category = "";
                categories.forEach((v, i) => {
                    if (i === 0) {
                        returnValues.category += v;
                    } else {
                        returnValues.category += ">" + v;
                    }
                })

                returnValues.inventoryNumber = this.serializeData($('.brief-descrpt > div:nth-child(2) > span:nth-child(2)').text());

                returnValues.itemDesc = this.serializeData($('.description-block > .description').text());

                returnValues.itemReturn = this.serializeData($('.brief-descrpt > div:nth-child(4) > span:nth-child(2)').text());

                returnValues.itemBrand = this.serializeData($('.brief-descrpt > div:nth-child(5) > span:nth-child(2) > a:nth-child(1)').text().replace("View all by ", ""));

                returnValues.specificDetails = [];
                let characteristics = $('.characteristics > tbody > tr');
                characteristics.each((k, v) => {
                    returnValues.specificDetails[this.serializeData($(v).find('td:nth-child(1)').text())] = this.serializeData($(v).find('td:nth-child(2)').text());
                })

                returnValues.images = [];
                let images = $('.gallery > .thumbnails > ul > li > a > img');
                images.each(async (k, v) => {
                    let image = new ItemImage(item.getID()+"_"+k+".jpg", $(v).attr("src"));
                    image.download().then((val) => {
                        returnValues.images.push(val);
                        if (returnValues.images.length === images.length) {
                            resolve(returnValues);
                        }
                    }).catch((reason) => {
                        console.error(reason);
                    })
                })
            }, (err, data) => {
                reject(err, data)
            })
        })
    }

    /**
     * Fetches all of the categories and stores them in the store.
     * @returns Promise of all categories.
     */
    async fetchAllCategories() {
        console.log("Fetching all categories...");
        return new Promise(async (resolve, reject) => {
            await this.crawler.addToQueue("https://www.buya.com/Category/All", async (url, page) => {
                let $ = Cheerio.load(await page.content(), {
                    normalizeWhitespace: true
                })

                let mainCats = $('.categories-line > .category-list')
                mainCats.each((i, main) => {
                    let mainName = $(main).find('h3 > a').text();
                    let mainChild = $(main).find('div > div > a');
                    console.log(mainName);
                    let mainCat = new Category(mainName);

                    if (mainChild !== "") {
                        mainChild.each((i, sub) => {
                            let subName = $(sub).text();
                            console.log(mainName + " > " + subName);

                            let subCat = new Category(subName);
                            mainCat.addChildCategory(subCat);
                        })
                    }
                    this.addMainCategory(mainCat);
                })

                resolve(this.categories);
            }, (err) => {
                reject(err);
            })
        })
    }
}

module.exports = Store;