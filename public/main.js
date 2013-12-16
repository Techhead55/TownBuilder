// ================================
//   RESOURCES
// ================================

// Resource constructors

function resourceMethods(){
    this.add = function (num) {
        this.amount += num;
        document.getElementById(this.idName).innerHTML = this.amount;
    };

};

function createResource(publicName, idName, amountCap) {
    this.publicName = publicName;
    this.idName = idName;
    this.amount = 0;
    this.amountCap = amountCap;
    console.log("Created " + this.idName);

    //  Methods
    this.add = function (num) {
        this.amount += num;
        document.getElementById(this.idName).innerHTML = this.amount;
    };

    this.subtract = function (num) {
        this.amount -= num;
        document.getElementById(this.idName).innerHTML = this.amount;
    };
};

function createRawMaterial(){
    this.income = 0;
};

var resource = {
    rawMaterial: {
        clay: new createResource("Clay", "clay", 200),
        logs: new createResource("Logs", "logs", 200),
        stone: new createResource("Uncut Stone", "stone", 200)
    },
    construction: {
        planks: new createResource("Planks", "planks", 200),
        stoneBricks: new createResource("Stone Bricks", "stoneBricks", 200),
        clayBricks: new createResource("Clay Bricks", "clayBricks", 200)
    },
    fuel: {
        firewood: new createResource("Firewood", "firewood", 200),
        charcoal: new createResource("Charcoal", "charcoal", 200),
        coal: new createResource("Coal", "coal", 200),
        coalCoke: new createResource("Coal Coke", "coalCoke", 200),
        peat: new createResource("Peat", "peat", 200)
    },
    ore: {
        cinnabar: new createResource("Cinnabar Ore", "oreCinnabar", 200),
        copper: new createResource("Copper Ore", "oreCopper", 200),
        galena: new createResource("Galena Ore", "oreGalena", 200),
        gold: new createResource("Gold Ore", "oreGold", 200),
        iron: new createResource("Iron Ore", "oreIron", 200),
        silver: new createResource("Silver Ore", "oreSilver", 200),
        tin: new createResource("Tin Ore", "oreTin", 200)
    },
    ingot: {
        brass: new createResource("Brass Ingot", "ingotBrass", 200),
        bronze: new createResource("Bronze Ingot", "ingotBronze", 200),
        copper: new createResource("Copper Ingot", "ingotCopper", 200),
        gold: new createResource("Gold Ingot", "ingotGold", 200),
        iron: new createResource("Iron Ingot", "ingotIron", 200),
        lead: new createResource("Lead Ingot", "ingotLead", 200),
        silver: new createResource("Silver Ingot", "ingotSilver", 200),
        steel: new createResource("Steel Ingot", "ingotSteel", 200),
        tin: new createResource("Tin Ingot", "ingotTin", 200),
        zinc: new createResource("Zinc Ingot", "ingotZinc", 200)
    },
    rawFood: {
        grainBarley: new createResource("Barley Grain", "grainBarley", 200),
        grainWheat: new createResource("Wheat Grain", "grainWheat", 200)
    },
    ingredient: {
        flourWheat: new createResource("Wheat Flour", "flourWheat", 200)
    },
    cookedFood: {
        bread: new createResource("Bread", "bread")
    }
};

// ================================
//   RENDERING
// ================================

