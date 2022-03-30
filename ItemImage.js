const Axios = require('axios');
const axiosRetry = require('axios-retry');
axiosRetry(Axios, {
    retries: 3,
    retryDelay: (retryCount) => {
        return retryCount*1000
    }
})
const fs = require('fs');
const Path = require('path');

class ItemImage {
    constructor(name, url) {
        this.name = name;
        this.url = url;
    }

    async download() {
        return new Promise((resolve, reject) => {
            const path = Path.resolve(__dirname, 'tmp', this.name);
            const writer = fs.createWriteStream(path);

            Axios.get(this.url, {
                responseType: "stream"
            }).then((response) => {
               response.data.pipe(writer);

               writer.on('finish', () => {
                   resolve(Path.resolve(__dirname, 'tmp', this.name));
                   //console.log("Finished the download of the file.")
               });
               writer.on('error', reject);
            });
        });
    }
}

module.exports = ItemImage;