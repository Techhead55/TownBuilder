/// <reference path="scripts/jquery-1.10.2-vsdoc.js" />

// ================================
//   ENGINE
// ================================

// Options

var options = {
    debugMenu: true
};

// Countdown Timer
function countdown(elementID, fn, seconds){
    var seconds = seconds-1;
    var interval = setInterval(function () {
        var minutes = Math.round((seconds - 30) / 60);
        var remainingSeconds = seconds % 60;
        if (remainingSeconds < 10) {
            remainingSeconds = "0" + remainingSeconds;
        }
        document.getElementById(elementID).innerHTML = minutes + ":" + remainingSeconds;
        if (seconds == 0) {
            clearInterval(interval);
            fn();
        } else {
            seconds--;
        };
    }, 1000)
};

// Day Controller

var dayCount = 0;

window.onload = function () {
    countdown("dayTimer", dailyFunctions, 15);
}

function dailyFunctions(){
    countdown("dayTimer", dailyFunctions, 15);
    dailyIncome()
    dayCount++
};

// Population

var currentPopulation = 0;
var totalPopulation = 0;

function calculateHousing(){
    totalPopulation = 0;
    for(var key in buildingHouse){
        var totalPop = buildingHouse[key].amount * buildingHouse[key].basePop;
        totalPopulation += totalPop;
        console.log(buildingHouse[key].publicName + "s population: " + totalPop);
    };
    console.log("Total: " + totalPopulation);
};

// ================================
//   RESOURCES
// ================================

// Resource constructors

function resource(publicName, idName, amountCap) {
    
    // Name handlers
    this.publicName = publicName;
    this.idName = idName;
    
    // Economics
    this.income = 0;
    this.expense = 0;
    this.profit = this.income - this.expense;
    
    // Storage
    this.amount = 0;
    this.amountCap = amountCap;

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
    this.subtract = function (num) {
        if (this.amount >= num) {
            this.amount -= num;
        } else {
            return false;
        };
    };
};

var resource = {
    rawMaterial: {
        clay: new resource("Clay", "clay", 200),
        logs: new resource("Logs", "logs", 200),
        stone: new resource("Uncut Stone", "stone", 200)
    },
    construction: {
        planks: new resource("Planks", "planks", 200),
        stoneBricks: new resource("Stone Bricks", "stoneBricks", 200),
        clayBricks: new resource("Clay Bricks", "clayBricks", 200)
    },
    fuel: {
        firewood: new resource("Firewood", "firewood", 200),
        charcoal: new resource("Charcoal", "charcoal", 200),
        coal: new resource("Coal", "coal", 200),
        coalCoke: new resource("Coal Coke", "coalCoke", 200),
        peat: new resource("Peat", "peat", 200)
    },
    ore: {
        cinnabar: new resource("Cinnabar Ore", "oreCinnabar", 200),
        copper: new resource("Copper Ore", "oreCopper", 200),
        galena: new resource("Galena Ore", "oreGalena", 200),
        gold: new resource("Gold Ore", "oreGold", 200),
        iron: new resource("Iron Ore", "oreIron", 200),
        silver: new resource("Silver Ore", "oreSilver", 200),
        tin: new resource("Tin Ore", "oreTin", 200)
    },
    ingot: {
        brass: new resource("Brass Ingot", "ingotBrass", 200),
        bronze: new resource("Bronze Ingot", "ingotBronze", 200),
        copper: new resource("Copper Ingot", "ingotCopper", 200),
        gold: new resource("Gold Ingot", "ingotGold", 200),
        iron: new resource("Iron Ingot", "ingotIron", 200),
        lead: new resource("Lead Ingot", "ingotLead", 200),
        silver: new resource("Silver Ingot", "ingotSilver", 200),
        steel: new resource("Steel Ingot", "ingotSteel", 200),
        tin: new resource("Tin Ingot", "ingotTin", 200)
    },
    rawFood: {
        grainBarley: new resource("Barley Grain", "grainBarley", 200),
        grainWheat: new resource("Wheat Grain", "grainWheat", 200)
    },
    ingredient: {
        flourWheat: new resource("Wheat Flour", "flourWheat", 200)
    },
    cookedFood: {
        bread: new resource("Bread", "bread", 200)
    }
};

// Daily Income

var dailyIncome = function () {
    resource.rawMaterial.logs.add(resource.rawMaterial.logs.profit)
};

// ================================
//   BUILDINGS
// ================================

// Producers - Provides resources

function buildingWork(publicName, idName, workerCap){
    this.publicName = publicName;
    this.idName = idName;

    this.amount = 0;
    this.worker = 0;
    this.baseWorkerCap = workerCap;
    this.totalWorkerCap = this.baseWorkerCap * this.amount;

    // Methods
    this.add = function (num) {
        this.amount += num;
    };

    this.addWorker = function (num) {
        if (this.worker + num > this.totalWorkerCap) {
            this.worker = this.totalWorkerCap;
        } else {
            this.worker += num;
        };
    };

    this.subtractWorker = function (num) {
        if (this.worker >= num) {
            this.worker -= num;
        } else {
            return false;
        };
    };
};

var buildingWork = {
    
    mine: {
        copper: new buildingWork("Copper Mine", "mineCopper"),
        galena: new buildingWork("Lead Mine", "mineGalena"),
        gold: new buildingWork("Gold Mine", "mineGold"),
        iron: new buildingWork("Iron Mine", "mineIron"),
        silver: new buildingWork("Silver Mine", "mineSilver"),
        tin: new buildingWork("Tin Mine", "mineTine")
    }
};

// Housing - Provides population

function buildingHouse(publicName, idName, basePop){
    this.publicName = publicName;
    this.idName = idName;

    this.amount = 0;
    this.basePop = basePop;
    //this.popModifier = 0; TODO: Add tech tree modifiers here

    //Methods
    this.add = function (num) {
        this.amount += num;
        console.log("Total " + this.publicName + "s: " + this.amount);
        console.log("Total population from " + this.publicName + ": " + (this.amount * this.basePop));
        calculateHousing();
    };
};

var buildingHouse = {
    tentSmall: new buildingHouse("Small Tent", "tentSmall", 1),
    tentLarge: new buildingHouse("Large Tent", "tentLarge", 2),
    hutSmall: new buildingHouse("Small Hut", "hutSmall", 4)
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