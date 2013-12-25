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

var dayCount = 0
window.onload = function () {
    countdown("dayTimer", dailyFunctions, 15);
}

function dailyFunctions(){
    countdown("dayTimer", dailyFunctions, 15);
    dailyIncome()
    dayCount++
    console.log("Day " + dayCount)
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