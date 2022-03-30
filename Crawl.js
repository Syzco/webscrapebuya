const {Cluster} = require('puppeteer-cluster/dist');
const vanillaPuppeteer = require('puppeteer');
const { addExtra } = require('puppeteer-extra');
const AdBlock = require('puppeteer-extra-plugin-adblocker');
const adBlocker = AdBlock({
    blockTrackers: true,
    useCache: true
})
const Stealth = require('puppeteer-extra-plugin-stealth');
//const Angular = require('puppeteer-extra-plugin-angular');


class Process {
    constructor(url) {
        this.url = url;
        this.dateCreated = Date.now();
        this.dateQueued = "";
        this.dateProcessed = "";
    }
    geturl() {
        return this.url;
    }
    process() {
        this.dateProcessed = Date.now();
    }
    queued() {
        this.dateQueued = Date.now();
    }
}

class Crawl {
    constructor() {
        this.processes = [];
    }

    async start() {
        const puppeteer = addExtra(vanillaPuppeteer);
        puppeteer.use(Stealth());
        puppeteer.use(adBlocker);
        //puppeteer.use(Angular());

        this.crawler = await Cluster.launch({
            puppeteer,
            puppeteerOptions: {
                headless: true
            },
            concurrency: Cluster.CONCURRENCY_CONTEXT,
            maxConcurrency: 2,
            retryLimit: 100,
            retryDelay: 10000,
            monitor: false
        })
        this.crawler.on("taskerror", (err, data, willRetry) => {
            if (willRetry) {
                console.warn(`We have encountered an error while crawling ${data}.\nHere is the error information: ${err.message}\nRetrying this crawl...`);
            } else {
                console.error(`Failed to crawl ${data}: ${err.message}`);
            }
        });
        return this.crawler;
    }

    async addToQueue(url, cb, errFun) {
        let process = new Process(url);
        process.queued();

        this.crawler.queue(url, (async ({page, data: url}) => {
            await page.goto(url);

            let content = await page.content();

            process.process();
            this.processes.push(process);

            await cb(url, page);

            if (errFun) {
                this.crawler.on("taskerror", (err, data, willRetry) => {
                    errFun(err, data);
                });
            }
        })).then(r => {});
    }
    async idle() {
        return await this.crawler.idle();
    }
    async close() {
        this.processes = [];
        return await this.crawler.close();
    }
    printProcesses() {
        this.processes.forEach(process => {
            console.log(process);
        })
    }
}

module.exports = Crawl;