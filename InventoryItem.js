class InventoryItem {
    constructor(title, url, id) {
        this.id = id;
        this.inventoryNumber = "";
        this.title = title;
        this.manufacturer = "";
        this.model = "";
        this.url = url;
        this.primaryImage = "";
        this.images = "";
        this.upc = "";
        this.condition = "";
        this.notes = "";
        this.price = "";
        this.shippingMethod = "";
        this.shippingPrice = "";
        this.category = "";
    }
    getInfo() {
        let tbl = {
            id: this.id,
            inventoryNumber: this.inventoryNumber,
            title: this.title,
            manufacturer: this.manufacturer,
            model: this.model,
            url: this.url,
            primaryImage: this.primaryImage,
            upc: this.upc,
            condition: this.condition,
            notes: this.notes,
            price: this.price,
            shippingPrice: this.shippingPrice,
            shippingMethod: this.shippingMethod
        }
        return tbl;
    }
    getID() {
        return this.id;
    }
    getInventoryNumber() {
        return this.inventoryNumber;
    }

    getTitle() {
        return this.title;
    }

    getManufacturer() {
        return this.manufacturer;
    }

    getModel() {
        return this.model;
    }

    getURL() {
        return this.url;
    }

    getPrimaryImage() {
        return this.primaryImage;
    }

    getImages() {
        return this.images;
    }

    getUPC() {
        return this.upc;
    }

    getCondition() {
        return this.condition;
    }

    getNotes() {
        return this.notes;
    }

    getPrice() {
        return this.price;
    }

    getShippingPrice() {
        return this.shippingPrice;
    }

    getCategory(table) {
        let rtnVal = this.category;
        if (table == true) {
            rtnVal = rtnVal.split(">");
        }
        return rtnVal;
    }

    getDescription() {
        return this.description;
    }

    getShippingMethod() {
        return this.shippingMethod;
    }

    setInventoryNumber(value) {
        this.inventoryNumber = value;
    }

    setTitle(value) {
        this.title = value;
    }

    setManufacturer(value) {
        this.manufacturer = value;
    }

    setModel(value) {
        this.model = value;
    }

    setURL(value) {
        this.url = value;
    }

    setPrimaryImage(value) {
        this.primaryImage = value;
    }

    setImages(value) {
        this.images = value;
    }

    setUPC(value) {
        this.upc = value;
    }

    setCondition(value) {
        this.condition = value;
    }

    setNotes(value) {
        this.notes = value;
    }

    setPrice(value) {
        this.price = value;
    }

    setShippingPrice(value) {
        this.shippingPrice = value;
    }

    setCategory(category) {
        this.category = category.join(">");
    }

    setShippingMethod(method) {
        this.shippingMethod = method;
    }

    setDescription(desc) {
        this.description = desc;
    }
}

module.exports = InventoryItem;