﻿/// <reference path="scripts/jquery-1.10.2-vsdoc.js" />

function gid(id) {
    return document.getElementById(id);
}

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
        gid(elementID).innerHTML = minutes + ":" + remainingSeconds;
        if (seconds === 0) {
            clearInterval(interval);
            fn();
        } else {
            seconds--;
        }
    }, 1000);
}

// Day Controller

var dayCount = 0;

function dayRender(){
    var day = dayCount % 7 + 1;
    var week = Math.floor(dayCount / 7) + 1;
    
    gid("dayCounter").innerHTML = " - Week: " + week + " - Day: " + day;
}

function dailyFunctions(){
    countdown("dayTimer", dailyFunctions, 15);
    dayCount++;
    dayRender();
    dailyIncome();
}

// Population

var population = {
    assigned:           0,
    labourer:           function () { return population.cap - population.assigned; },
    cap:                0,

    updatePopulation:   function () { gid("population").innerHTML = "Used Popluation: " + population.assigned + "/" + population.cap; }
};

function calculateHousing(){
    population.cap = 0;
    for(var key in buildingHouse){
        population.cap += buildingHouse[key].amount * buildingHouse[key].basePop;
    }
    population.updatePopulation();
}

function calculateWorkers(){
    population.assigned = 0;
    for (var key in buildingWork){
        for (var subkey in buildingWork[key]){
            population.assigned += buildingWork[key][subkey].worker.amount;
        }
    }
    population.updatePopulation();
}

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
    
    // Storage
    this.amount = 0;
    this.amountCap = amountCap;
}

// Object methods

// Render the object
resource.prototype.render = function () {
    gid(this.idName).innerHTML = this.publicName + ": " + this.amount;
};

// Change the amount
resource.prototype.changeAmount = function (num) {
    // Change the number to include the changed value "num"
    if (!isNaN(num)) {
        if (this.amount + num > this.amountCap) {
            this.amount = this.amountCap;
        } else if (this.amount + num < 0) {
            this.amount = 0;
        } else {
            this.amount += num;
        }
    }
    // Push the new value to the screen
    this.render();
};

// Check amount for crafting recipes - May not be needed
resource.prototype.checkAmount = function (num) {
    if (!isNaN(num)) {
        var number = 0;
        if (num >= 0) {
            if (num + this.amount > this.amountCap) {
                number = num + this.amount - this.amountCap;
            } else {
                number = 0;
            }
        } else {
            if (this.amount + num < 0) {
                number = this.amount + num;
            } else {
                number = 0;
            }
        }
        console.log(number);
        return number;
    } else {
        return false;
    }
};

// Object definitions

var resource = {
    rawMaterial: {                 // Public Name       ID Name         Cap
        clay:           new resource("Clay",            "clay",         200),
        logs:           new resource("Logs",            "logs",         200),
        stone:          new resource("Uncut Stone",     "stone",        200)
    },
    construction: {                // Public Name       ID Name         Cap
        planks:         new resource("Planks",          "planks",       200),
        stoneBricks:    new resource("Stone Bricks",    "stoneBricks",  200),
        clayBricks:     new resource("Clay Bricks",     "clayBricks",   200)
    },
    fuel: {                        // Public Name       ID Name         Cap
        firewood:       new resource("Firewood",        "firewood",     200),
        charcoal:       new resource("Charcoal",        "charcoal",     200),
        coal:           new resource("Coal",            "coal",         200),
        coalCoke:       new resource("Coal Coke",       "coalCoke",     200),
        peat:           new resource("Peat",            "peat",         200)
    },
    ore: {                         // Public Name       ID Name         Cap
        cinnabar:       new resource("Cinnabar Ore",    "oreCinnabar",  200),
        copper:         new resource("Copper Ore",      "oreCopper",    200),
        galena:         new resource("Galena Ore",      "oreGalena",    200),
        gold:           new resource("Gold Ore",        "oreGold",      200),
        iron:           new resource("Iron Ore",        "oreIron",      200),
        silver:         new resource("Silver Ore",      "oreSilver",    200),
        tin:            new resource("Tin Ore",         "oreTin",       200)
    },
    ingot: {                       // Public Name       ID Name         Cap
        bronze:         new resource("Bronze Ingot",    "ingotBronze",  200),
        copper:         new resource("Copper Ingot",    "ingotCopper",  200),
        gold:           new resource("Gold Ingot",      "ingotGold",    200),
        iron:           new resource("Iron Ingot",      "ingotIron",    200),
        lead:           new resource("Lead Ingot",      "ingotLead",    200),
        silver:         new resource("Silver Ingot",    "ingotSilver",  200),
        steel:          new resource("Steel Ingot",     "ingotSteel",   200),
        tin:            new resource("Tin Ingot",       "ingotTin",     200)
    },
    foodRaw: {                     // Public Name       ID Name         Cap
        grainBarley:    new resource("Barley Grain",    "grainBarley",  200),
        grainWheat:     new resource("Wheat Grain",     "grainWheat",   200)
    },
    foodIngredient: {              // Public Name       ID Name         Cap
        flourWheat:     new resource("Wheat Flour",     "flourWheat",   200)
    },
    foodCooked: {                  // Public Name       ID Name         Cap
        bread:          new resource("Bread",           "bread",        200)
    }
};

// Daily Income

function dailyIncome() {
    //for (var key in resource) {
    //    for (var subkey in resource[key]) {
    //        resource[key][subkey].changeAmount(resource[key][subkey].income - resource[key][subkey].expense);
    //    };
    //};
}

// ================================
//   BUILDINGS
// ================================

// Producers - Provides resources

function buildingWork(publicName, idName, workerCap, incomeResource, incomeAmount, expenseResource, expenseAmount, toolType, toolAmount){
    // Names
    this.publicName = publicName; // Name that the player sees on the page
    this.idName = idName; // Div and button IDs for dynamic rendering

    // Number of buildings
    this.amount = 0;

    // Workers
    this.worker = {
        amount:         0,                                                   // Number of workers employed in this building
        capBase:        workerCap,                                           // Base amount of workers that can be employed as defined by the building
        capModifier:    1,                                                   // Modifer to change the base capapacity per building for any upgrade buffs (May be merged with base instead)
        capTotal:       function(){return this.capBase * this.capModifier;}, // Calculator for total worker capacity - I can't call this when rendering? How do?
        equippedTools:  {
            // To be populated by toolType
        }
    };

    // Building income - Array of each for the income calculation loop to easily call it
    this.incomeResource = incomeResource;
    this.baseIncomeAmount = incomeAmount;

    // Building expense  - Array of each for the income calculation loop to easily call it
    this.expenseResource = expenseResource;
    this.baseExpenseAmount = expenseAmount;
    
    // Building tool requirements - What tool the building's worker needs to generate income and how many of each is needed
    this.toolType = toolType;
    this.toolAmount = toolAmount;
}

// Object Methods

// Update the HTML on the page
buildingWork.prototype.render = function () {
    gid(this.idName).innerHTML = this.publicName + "s: " + this.amount + " - Workers: " + this.worker.amount + "/" + (this.amount * this.worker.capBase);
};

// Add more of this building type
buildingWork.prototype.add = function (num) {
    this.amount += num;
    this.render();
};

// Add worker to the building type (Soon to handle equipment and firing workers)
buildingWork.prototype.addWorker = function (num) {
    if (num <= population.cap - population.assigned) {
        if (this.worker.amount + num > this.amount * this.worker.capBase) {
            this.worker.amount = this.amount * this.worker.capBase;
        } else {
            this.worker.amount += num;
        }
        calculateWorkers();
        this.render();
    } else {
        console.log("Not enough spare workers");
        return false;
    }
};

// Remove worker from building type (Old and will be replaced)
buildingWork.prototype.subtractWorker = function (num) {
    if (this.worker.amount >= num) {
        this.worker.amount -= num;
    } else {
        return false;
    }
    calculateWorkers();
    this.render();
};

// Object Definition

var buildingWork = {
    primary: {                      // Public Name      ID Name       Cap   Income Resource                     Income Amount   Expense Resource        Expense Amount  Tool Type           Tool Amount
        campClay:   new buildingWork("Clay Pit",        "campClay",     5,  [resource.rawMaterial.clay],        [2],            null,                   null,           [tool.shovel],      [1]),
        campLogs:   new buildingWork("Lumber Camp",     "campLogs",     5,  [resource.rawMaterial.logs],        [2],            null,                   null,           [tool.axe],         [1]),
        campStone:  new buildingWork("Stone Quarry",    "campStone",    5,  [resource.rawMaterial.stone],       [2],            null,                   null,           [tool.pickaxe],     [1])
    },
    mine: {                         // Public Name      ID Name       Cap   Income Resource                     Income Amount   Expense Resource        Expense Amount  Tool Type           Tool Amount
        copper:     new buildingWork("Copper Mine",     "mineCopper",   5,  [resource.ore.copper],              [2],            null,                   null,           [tool.pickaxe],     [1]),
        galena:     new buildingWork("Lead Mine",       "mineGalena",   5,  [resource.ore.galena],              [2],            null,                   null,           [tool.pickaxe],     [1]),
        gold:       new buildingWork("Gold Mine",       "mineGold",     5,  [resource.ore.gold],                [2],            null,                   null,           [tool.pickaxe],     [1]),
        iron:       new buildingWork("Iron Mine",       "mineIron",     5,  [resource.ore.iron],                [2],            null,                   null,           [tool.pickaxe],     [1]),
        silver:     new buildingWork("Silver Mine",     "mineSilver",   5,  [resource.ore.silver],              [2],            null,                   null,           [tool.pickaxe],     [1]),
        tin:        new buildingWork("Tin Mine",        "mineTine",     5,  [resource.ore.tin],                 [2],            null,                   null,           [tool.pickaxe],     [1])
    }
};

// Housing - Provides population

function buildingHouse(publicName, idName, basePop){
    this.publicName = publicName;
    this.idName = idName;

    this.amount = 0;
    this.basePop = basePop;
    //this.popModifier = 0; TODO: Add tech tree modifiers here
}

// Object Methods

// Update the HTML on the page
buildingHouse.prototype.render = function () {
    gid(this.idName).innerHTML = this.publicName + "s: " + this.amount + " - Population: " + (this.amount * this.basePop);
};

// Add more of this building type
buildingHouse.prototype.add = function (num) {
    this.amount += num;
    calculateHousing();
    this.render();
};

// Object Definitions

var buildingHouse = {               // Public Name      ID Name       Pop
    tentSmall:  new buildingHouse("Small Tent",         "tentSmall",    1),
    tentLarge:  new buildingHouse("Large Tent",         "tentLarge",    2),
    hutSmall:   new buildingHouse("Small Hut",          "hutSmall",     4)
};

// ================================
//   TOOLS
// ================================

// Constructor

function tool(publicName, idName){
    this.publicName = publicName;
    this.idName = idName;

    this.amount = 0;
    this.equipped = 0;
}

// Object Methods

// Update the HTML on the page
tool.prototype.render = function () {
    gid(this.idName).innerHTML = this.publicName + ": " + this.equipped + "/" + this.amount;
};

// Change the amount
tool.prototype.changeAmount = function (num) {
    // Change the number to include the changed value "num"
    if (!isNaN(num)) {
        if (this.amount + num < 0) {
            this.amount = 0;
        } else {
            this.amount += num;
        }
    }
    this.render();
};

// Object Definition

var tool = {
    axe: {
        copper: new tool("Copper Axe", "axeCopper"),
        bronze: new tool("Bronze Axe", "axeBronze"),
        iron: new tool("Iron Axe", "axeIron"),
        steel: new tool("Steel Axe", "axeSteel")
    },
    pickaxe: {
        copper: new tool("Copper Pickaxe", "pickaxeCopper"),
        bronze: new tool("Bronze Pickaxe", "pickaxeBronze"),
        iron: new tool("Iron Pickaxe", "pickaxeIron"),
        steel: new tool("Steel Pickaxe", "pickaxeSteel")
    },
    saw: {
        iron: new tool("Iron Saw", "sawIron"),
        steel: new tool("Steel Saw", "sawSteel")
    },
    hoe: {
        copper: new tool("Copper Hoe", "hoeCopper"),
        bronze: new tool("Bronze Hoe", "hoeBronze"),
        iron: new tool("Iron Hoe", "hoeIron"),
        steel: new tool("Steel Hoe", "hoeSteel")
    },
    shovel: {
        copper: new tool("Copper Shovel", "shovelCopper"),
        bronze: new tool("Bronze Shovel", "shovelBronze"),
        iron: new tool("Iron Shovel", "shovelIron"),
        steel: new tool("Steel Shovel", "shovelSteel")
    },
    farming: {
        sickleCopper: new tool("Copper Sickle", "sickleCopper"),
        sickleBronze: new tool("Bronze Sickle", "sickleBronze"),
        sickleIron: new tool("Iron Sickle", "sickleIron"),
        sickleSteel: new tool("Steel Sickle", "sickleSteel"),
        sickleGold: new tool("Gold Sickle", "sickleGold"),
        scytheCopper: new tool("Copper Scythe", "scytheCopper"),
        scytheBronze: new tool("Bronze Scythe", "scytheBronze"),
        scytheIron: new tool("Iron Scythe", "scytheIron"),
        scytheSteel: new tool("Steel Scythe", "scytheSteel")
    },
    hammer: {
        stone: new tool("Stone Hammer", "hammerStone"),
        copper: new tool("Copper Hammer", "hammerCopper"),
        bronze: new tool("Bronze Hammer", "hammerBronze"),
        iron: new tool("Iron Hammer", "hammerIron"),
        steel: new tool("Steel Hammer", "hammerSteel")
    },
    hunting: {
        spearWood: new tool("Spear", "spearWood"),
        spearStone: new tool("Stone Spear", "spearStone"),
        spearCopper: new tool("Copper Spear", "spearCopper"),
        spearBronze: new tool("Bronze Spear", "spearBronze"),
        spearIron: new tool("Iron Spear", "spearIron"),
        spearSteel: new tool("Steel Spear", "spearSteel"),
        bowHunting: new tool("Hunting Bow", "bowHunting"),
        bowReflex: new tool("Reflex Bow", "bowReflex"),
        knifeStone: new tool("Stone Knife", "knifeStone"),
        knifeCopper: new tool("Copper Knife", "knifeCopper"),
        knifeBronze: new tool("Bronze Knife", "knifeBronze"),
        knifeIron: new tool("Iron Knife", "knifeIron"),
        knifeSteel: new tool("Steel Knife", "knifeSteel")
    },
    fishing: {
        pole: new tool("Fishing Pole", "fishingPole"),
        net: new tool("Fishing Net", "fishingNet")
    }
};



// ================================
//   RENDERING
// ================================

function init(){
    dayRender();

    population.updatePopulation();

    for(var key in resource.rawMaterial){
        console.log(key);
        resource.rawMaterial[key].render();
    }
    for (var key in tool.axe){
        console.log(key);
        tool.axe[key].render();
    }
    for (var key in buildingHouse){
        console.log(key);
        buildingHouse[key].render();
    }
    for (var key in buildingWork.primary){
        console.log(key);
        buildingWork.primary[key].render();
    }
}

$(document).ready(function () {
    countdown("dayTimer", dailyFunctions, 15);
    init();
    debugGenerateResources();
    debugGenerateTools();
    debugGenerateBuildingWork();
    debugGenerateBuildingHouse();
});

// Debugging Menu

$(document).ready(function () {
    $("#debug-button").click(function () {
        $("#debug-div").slideToggle("slow");
    });

    if (options.debugMenu === true) {
        $("#debug").css("display", "block");
    }

    $("#debug-tabs").tabs();
});

function debugChangeInputValue(num, id){
    var v = parseInt(gid(id).value);
    v = isNaN(v) ? 0 : v;
    v += num;
    gid(id).value = v;
}

function debugGenerateResources(){
    for (var key in resource.rawMaterial) {
        $("#debug-tab-resources").append(
            "<div id='debugString" + resource.rawMaterial[key].idName + "'>" +
                resource.rawMaterial[key].publicName + ": " +
                "<button onclick='debugChangeInputValue(-10, \"debugInput" + resource.rawMaterial[key].idName + "\")'>--</button>" +
                "<button onclick='debugChangeInputValue(-1, \"debugInput" + resource.rawMaterial[key].idName + "\")'>-</button>" +
                "<input type='text' class='debugInput' id='debugInput" + resource.rawMaterial[key].idName + "' value='0' />" +
                "<button onclick='debugChangeInputValue(1, \"debugInput" + resource.rawMaterial[key].idName + "\")'>+</button>" +
                "<button onclick='debugChangeInputValue(10, \"debugInput" + resource.rawMaterial[key].idName + "\")'>++</button>" +
                "<button onclick='resource.rawMaterial." + key + ".changeAmount(parseInt(gid(\"debugInput" + resource.rawMaterial[key].idName + "\").value))'>Apply</button>" +
                "<button onclick='resource.rawMaterial." + key + ".checkAmount(parseInt(gid(\"debugInput" + resource.rawMaterial[key].idName + "\").value))'>Check</button>" +
            "</div>");
    }
}

function debugGenerateTools(){
    for (var key in tool.axe){
        $("#debug-tab-tools").append(
            "<div id='debugString" + tool.axe[key].idName + "'>" +
                tool.axe[key].publicName + ": " +
                "<button onclick='debugChangeInputValue(-10, \"debugInput" + tool.axe[key].idName + "\")'>--</button>" +
                "<button onclick='debugChangeInputValue(-1, \"debugInput" + tool.axe[key].idName + "\")'>-</button>" +
                "<input type='text' class='debugInput' id='debugInput" + tool.axe[key].idName + "' value='0' />" +
                "<button onclick='debugChangeInputValue(1, \"debugInput" + tool.axe[key].idName + "\")'>+</button>" +
                "<button onclick='debugChangeInputValue(10, \"debugInput" + tool.axe[key].idName + "\")'>++</button>" +
                "<button onclick='tool.axe." + key + ".changeAmount(parseInt(gid(\"debugInput" + tool.axe[key].idName + "\").value))'>Apply</button>" +
            "</div>"
        );
    }
}

function debugGenerateBuildingWork(){
    for (var key in buildingWork){
        $("#debug-tab-buildings").append(
        "<h3>" + buildingWork[key] + "</h3>");
        for (var subkey in buildingWork[key]) {
            $("#debug-tab-buildings").append(
                "<div id='debugString" + buildingWork[key][subkey].idName + "'>" +
                    buildingWork[key][subkey].publicName + ": " +
                    "<button onclick='debugChangeInputValue(-10, \"debugInput" + buildingWork[key][subkey].idName + "\")'>--</button>" +
                    "<button onclick='debugChangeInputValue(-1, \"debugInput" + buildingWork[key][subkey].idName + "\")'>-</button>" +
                    "<input type='text' class='debugInput' id='debugInput" + buildingWork[key][subkey].idName + "' value='0' />" +
                    "<button onclick='debugChangeInputValue(1, \"debugInput" + buildingWork[key][subkey].idName + "\")'>+</button>" +
                    "<button onclick='debugChangeInputValue(10, \"debugInput" + buildingWork[key][subkey].idName + "\")'>++</button>" +
                    "<button onclick='buildingWork." + key + "." + subkey + ".add(parseInt(gid(\"debugInput" + buildingWork[key][subkey].idName + "\").value))'>Apply</button>" +
                "</div>"
            );
        }
    }
}

function debugGenerateBuildingHouse(){
    for (var key in buildingHouse){
        $("#debug-tab-houses").append(
            "<div id='debugString" + buildingHouse[key].idName + "'>" +
                buildingHouse[key].publicName + ": " +
                "<button onclick='debugChangeInputValue(-10, \"debugInput" + buildingHouse[key].idName + "\")'>--</button>" +
                "<button onclick='debugChangeInputValue(-1, \"debugInput" + buildingHouse[key].idName + "\")'>-</button>" +
                "<input type='text' class='debugInput' id='debugInput" + buildingHouse[key].idName + "' value='0' />" +
                "<button onclick='debugChangeInputValue(1, \"debugInput" + buildingHouse[key].idName + "\")'>+</button>" +
                "<button onclick='debugChangeInputValue(10, \"debugInput" + buildingHouse[key].idName + "\")'>++</button>" +
                "<button onclick='buildingHouse." + key + ".add(parseInt(gid(\"debugInput" + buildingHouse[key].idName + "\").value))'>Apply</button>" +
            "</div>"
        );
    }
}