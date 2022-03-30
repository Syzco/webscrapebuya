class Category {
    constructor(name) {
        this.name = name;
        this.childCat = [];
        this.parentCat = "";
    }

    getName() {
        return this.name;
    }

    addParentCategory(parent) {
        if (!(parent instanceof Category)) {
            console.error("Item is not an instance of Category");
            return false;
        }

        this.parentCat = parent;
    }

    addChildCategory(child) {
        if (!(child instanceof Category)) {
            console.error("Item is not an instance of Category");
            return false;
        }

        this.childCat.push(child);
        child.addParentCategory(this);
    }

    getChildren() {
        if (this.childCat.length <= 0) {
            return false
        }

        return this.childCat;
    }
}

class SubCategory extends Category {

}

module.exports = Category;