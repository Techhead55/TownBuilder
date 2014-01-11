/// <reference path="scripts/jquery-1.10.2-vsdoc.js" />

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
        };
        gid(elementID).innerHTML = minutes + ":" + remainingSeconds;
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
};

// Population

var populationCurrent = 0;
var populationTotal = 0;
var populationLabourer = populationTotal - populationCurrent;

function calculateHousing(){
    populationTotal = 0;
    for(var key in buildingHouse){
        populationTotal += buildingHouse[key].amount * buildingHouse[key].basePop;
    };
    updatePopulation();
};

function calculateWorkers(){
    populationCurrent = 0;
    for (var key in buildingWork){
        for (var subkey in buildingWork[key]){
            populationCurrent += buildingWork[key][subkey].worker;
        };
    };
    updatePopulation();
};

function updatePopulation(){
    gid("population").innerHTML = "Used Popluation: " + populationCurrent + "/" + populationTotal;
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
    
    // Storage
    this.amount = 0;
    this.amountCap = amountCap;

    // Methods
    // Render the object
    this.render = function () {
        gid(this.idName).innerHTML = this.publicName + ": " + this.amount;
    };

    // Add to the amount
    this.changeAmount = function (num) {
        // Change the number to include the changed value "num"
        if (!isNaN(num)) {
            if (this.amount + num > this.amountCap) {
                this.amount = this.amountCap;
            } else if (this.amount + num < 0) {
                this.amount = 0;
            } else {
                this.amount += num;
            };
        };
        // Push the new value to the screen
        this.render();
    };

    // Check amount for crafting recipes
    this.checkAmount = function (num) {
        if (!isNaN(num)) {
            var number = 0;
            if (num >= 0) {
                if (num + this.amount > this.amountCap) {
                    number = num + this.amount - this.amountCap;
                } else {
                    number = 0;
                };
            } else {
                if (this.amount + num < 0) {
                    number = this.amount + num;
                } else {
                    number = 0;
                };
            };
            console.log(number);
            return number;
        } else {
            return false;
        };
    };
};

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

var dailyIncome = function () {
    //for (var key in resource) {
    //    for (var subkey in resource[key]) {
    //        resource[key][subkey].changeAmount(resource[key][subkey].income - resource[key][subkey].expense);
    //    };
    //};
};

// ================================
//   BUILDINGS
// ================================

// Producers - Provides resources

function buildingWork(publicName, idName, workerCap, incomeResource, expenseResource){
    this.publicName = publicName;
    this.idName = idName;

    this.amount = 0;
    this.worker = 0;
    this.baseWorkerCap = workerCap;

    this.incomeResource = incomeResource;
    this.expenseResource = expenseResource;

    // Methods
    this.render = function () {
        gid(this.idName).innerHTML = this.publicName + "s: " + this.amount + " - Workers: " + this.worker + "/" + (this.amount * this.baseWorkerCap);
    };

    this.add = function (num) {
        this.amount += num;
        this.render();
    };

    this.addWorker = function (num) {
        if (num <= populationTotal - populationCurrent) {
            if (this.worker + num > this.amount * this.baseWorkerCap) {
                this.worker = this.amount * this.baseWorkerCap;
            } else {
                this.worker += num;
            };
            calculateWorkers();
            this.render();
        } else {
            console.log("Not enough spare workers");
            return false;
        };
    };

    this.subtractWorker = function (num) {
        if (this.worker >= num) {
            this.worker -= num;
        } else {
            return false;
        };
        calculateWorkers();
        this.render();
    };
};

var buildingWork = {
    primary: {                      // Public Name      ID Name       Cap   Income Resource
        campClay:   new buildingWork("Clay Pit",        "campClay",     5,  [resource.rawMaterial.clay, 2]),
        campLogs:   new buildingWork("Lumber Camp",     "campLogs",     5,  [resource.rawMaterial.logs, 2]),
        campStone:  new buildingWork("Stone Quarry",    "campStone",    5,  [resource.rawMaterial.stone, 2])
    },
    mine: {                         // Public Name      ID Name       Cap   Income Resource
        copper:     new buildingWork("Copper Mine",     "mineCopper",   5,  [resource.ore.copper, 2]),
        galena:     new buildingWork("Lead Mine",       "mineGalena",   5,  [resource.ore.galena, 2]),
        gold:       new buildingWork("Gold Mine",       "mineGold",     5,  [resource.ore.gold, 2]),
        iron:       new buildingWork("Iron Mine",       "mineIron",     5,  [resource.ore.iron, 2]),
        silver:     new buildingWork("Silver Mine",     "mineSilver",   5,  [resource.ore.silver, 2]),
        tin:        new buildingWork("Tin Mine",        "mineTine",     5,  [resource.ore.tin, 2])
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
    this.render = function () {
        gid(this.idName).innerHTML = this.publicName + "s: " + this.amount + " - Population: " + (this.amount * this.basePop);
    };

    this.add = function (num) {
        this.amount += num;
        calculateHousing();
        this.render();
    };
};

var buildingHouse = {               // Public Name      ID Name       Pop
    tentSmall:  new buildingHouse("Small Tent",         "tentSmall",    1),
    tentLarge:  new buildingHouse("Large Tent",         "tentLarge",    2),
    hutSmall:   new buildingHouse("Small Hut",          "hutSmall",     4)
};


// ================================
//   RENDERING
// ================================

function init(){
    dayRender();

    updatePopulation();

    for(var key in resource.rawMaterial){
        console.log(key);
        resource.rawMaterial[key].render();
    };
    for (var key in buildingHouse){
        console.log(key);
        buildingHouse[key].render();
    };
    for (var key in buildingWork.primary){
        console.log(key);
        buildingWork.primary[key].render();
    };
};

$(document).ready(function () {
    countdown("dayTimer", dailyFunctions, 15);
    init();
    debugGenerateResources();
});

// Debugging Menu

$(document).ready(function () {
    $("#debug-button").click(function () {
        $("#debug-div").slideToggle("slow");
    });

    if (options.debugMenu == true) {
        $("#debug").css("display", "block");
    };

    $("#debug-tabs").tabs();
});

function debugChangeInputValue(num, id){
    var v = parseInt(gid(id).value);
    v = isNaN(v) ? 0 : v;
    v += num;
    gid(id).value = v;
}

function debugGenerateResources(){
    for (var key in resource.rawMaterial){
        $("#debug-table-resources").append(
            "<div id='debugString" + resource.rawMaterial[key].idName + "'>" +
                resource.rawMaterial[key].publicName + ": " +
                "<button onclick='debugChangeInputValue(-10, \"debugInput" + resource.rawMaterial[key].idName + "\")'>--</button>" +
                "<button onclick='debugChangeInputValue(-1, \"debugInput" + resource.rawMaterial[key].idName + "\")'>-</button>" +
                "<input type='text' class='debugInput' id='debugInput" + resource.rawMaterial[key].idName + "' value='0' />" +
                "<button onclick='debugChangeInputValue(1, \"debugInput" + resource.rawMaterial[key].idName + "\")'>+</button>" +
                "<button onclick='debugChangeInputValue(10, \"debugInput" + resource.rawMaterial[key].idName + "\")'>++</button>" +
                "<button onclick='resource.rawMaterial." + key + ".changeAmount(parseInt(gid(\"debugInput" + resource.rawMaterial[key].idName + "\").value))'>Apply</button>" +
                "<button onclick='resource.rawMaterial." + key + ".checkAmount(parseInt(gid(\"debugInput" + resource.rawMaterial[key].idName + "\").value))'>Check</button>" +
            "</div>")};
}