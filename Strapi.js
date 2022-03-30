const Axios = require('axios');
const axiosRetry = require('axios-retry');
axiosRetry(Axios, {
    retries: 3,
    retryDelay: (retryCount) => {
        return retryCount*1000
    }
})


class Strapi {
    constructor(url) {
        this.url = url;
        this.axios = Axios.create({
            baseURL: url
        })
    }

    async post(extension, data, err) {
        return new Promise(async (resolve, reject) => {
            this.axios.post(extension, data).then(async (response) => {
                resolve(response);
            }).catch((error) => {
                //console.error(error);
                if (err) err(error);
                reject(error);
            })
        });
    }

    async get(extension, options, err) {
        return new Promise(async (resolve, reject) => {
            this.axios.get(extension, {
                params: options
            }).then(async (response) => {
                resolve(response);
            }).catch((error) => {
                //console.error(error);
                if (err) err(error);
                reject(error);
            })
        })
    }

    async update(extension, id, data, err, headers) {
        return new Promise(async (resolve, reject) => {
            this.axios.put(extension + "/" + id, data, {
                headers: {
                    ...headers
                }
            }).then((response) => {
                resolve(response);
            }).catch((error) => {
                //console.error(error);
                if (err) err(error);
                reject(error);
            })
        })
    }
}

module.exports = Strapi;