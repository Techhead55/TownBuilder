/// <reference path="scripts/jquery-1.10.2-vsdoc.js" />

// ================================
//   ENGINE
// ================================

// Options

var options = {
    debugMenu: true
};

// Day Controller

var dayCount = 0
//var dayTimer = setInterval(dailyFunctions, 15000)

function dailyFunctions(){
    dailyIncome()
    dayCount++
    console.log("Day " + dayCount)
};

// ================================
//   RESOURCES
// ================================

// Resource constructors

function createResource(publicName, idName, amountCap) {
    
    // Name handlers
    this.publicName = publicName;
    this.idName = idName;
    
    // Economics
    this.income = 5;
    this.expense = 0;
    this.profit = this.income - this.expense;
    
    // Storage
    this.amount = 0;
    this.amountCap = amountCap;

    console.log("Created " + this.idName); // Debug to check if created

    // Methods
    // Render the object
    this.render = function () {
        document.getElementById(this.idName).innerHTML = this.amount;
    };

    // Add to the amount
    this.add = function (num) {
        if (this.amount + num > this.amountCap) {
            this.amount = this.amountCap;
        } else {
            this.amount += num;
        };
        this.render();
    };

    // Subtract from the amount
//    this.subtract = function (num) {
//        this.amount -= num;
//        document.getElementById(this.idName).innerHTML = this.amount;
//    };
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
        tin: new createResource("Tin Ingot", "ingotTin", 200)
    },
    rawFood: {
        grainBarley: new createResource("Barley Grain", "grainBarley", 200),
        grainWheat: new createResource("Wheat Grain", "grainWheat", 200)
    },
    ingredient: {
        flourWheat: new createResource("Wheat Flour", "flourWheat", 200)
    },
    cookedFood: {
        bread: new createResource("Bread", "bread", 200)
    }
};

// Daily Income

var dailyIncome = function () {
    resource.rawMaterial.logs.add(resource.rawMaterial.logs.profit)
};

// ================================
//   RENDERING
// ================================


// Debugging Menu

$(document).ready(function () {
    $("#debug-button").click(function () {
        $("#debug-div").slideToggle("slow");
    });

    if (options.debugMenu == true){
        $("#debug").css("display", "block");
    };
});