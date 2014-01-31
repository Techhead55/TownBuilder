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
//   OBJECT CONSTRUCTORS
// ================================

// --------------------------------
// Resources
// --------------------------------

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


// --------------------------------
// Production Buildings
// --------------------------------

function buildingWork(publicName, idName, workerCap, incomeResource, incomeAmount, expenseResource, expenseAmount, toolType, toolAmount){
    // Names
    this.publicName = publicName; // Name that the player sees on the page
    this.idName = idName; // Div and button IDs for dynamic rendering

    // Number of buildings
    this.amount = 0;

    // Building income - Array of each for the income calculation loop to easily call it
    this.incomeResource = incomeResource;
    this.baseIncomeAmount = incomeAmount;

    // Building expense  - Array of each for the income calculation loop to easily call it
    this.expenseResource = expenseResource;
    this.baseExpenseAmount = expenseAmount;
    
    // Building tool requirements - What tool the building's worker needs to generate income and how many of each is needed
    this.toolType = toolType;
    this.toolAmount = toolAmount;

    // Workers
    this.worker = {
        amount:         0,                                                   // Number of workers employed in this building
        capBase:        workerCap,                                           // Base amount of workers that can be employed as defined by the building
        capModifier:    1,                                                   // Modifer to change the base capapacity per building for any upgrade buffs (May be merged with base instead)
        capTotal:       function(){return this.capBase * this.capModifier;} // Calculator for total worker capacity - I can't call this when rendering? How do?
    };
}

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


// --------------------------------
// Housing Buildings
// --------------------------------

function buildingHouse(publicName, idName, basePop){
    this.publicName = publicName;
    this.idName = idName;

    this.amount = 0;
    this.basePop = basePop;
    //this.popModifier = 0; TODO: Add tech tree modifiers here
}

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


// --------------------------------
// Tools
// --------------------------------

function tool(publicName, idName){
    this.publicName = publicName;
    this.idName = idName;

    this.amount = 0;
    this.equipped = 0;
}

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


// ================================
//   OBJECT DEFINITIONS
// ================================

var Resource = {
    RawMaterial: {                 // Public Name       ID Name         Cap
        Clay:           new resource("Clay",            "Clay",         200),
        Logs:           new resource("Logs",            "Logs",         200),
        Stone:          new resource("Uncut Stone",     "Stone",        200)
    },
    Construction: {                // Public Name       ID Name         Cap
        Planks:         new resource("Planks",          "Planks",       200),
        StoneBricks:    new resource("Stone Bricks",    "StoneBricks",  200),
        ClayBricks:     new resource("Clay Bricks",     "ClayBricks",   200)
    },
    Fuel: {                        // Public Name       ID Name         Cap
        Firewood:       new resource("Firewood",        "Firewood",     200),
        Charcoal:       new resource("Charcoal",        "Charcoal",     200),
        Coal:           new resource("Coal",            "Coal",         200),
        CoalCoke:       new resource("Coal Coke",       "CoalCoke",     200),
        Peat:           new resource("Peat",            "Peat",         200)
    },
    Ore: {                         // Public Name       ID Name         Cap
        Cinnabar:       new resource("Cinnabar Ore",    "OreCinnabar",  200),
        Copper:         new resource("Copper Ore",      "OreCopper",    200),
        Galena:         new resource("Galena Ore",      "OreGalena",    200),
        Gold:           new resource("Gold Ore",        "OreGold",      200),
        Iron:           new resource("Iron Ore",        "OreIron",      200),
        Silver:         new resource("Silver Ore",      "OreSilver",    200),
        Tin:            new resource("Tin Ore",         "OreTin",       200)
    },
    Ingot: {                       // Public Name       ID Name         Cap
        Bronze:         new resource("Bronze Ingot",    "IngotBronze",  200),
        Copper:         new resource("Copper Ingot",    "IngotCopper",  200),
        Gold:           new resource("Gold Ingot",      "IngotGold",    200),
        Iron:           new resource("Iron Ingot",      "IngotIron",    200),
        Lead:           new resource("Lead Ingot",      "IngotLead",    200),
        Silver:         new resource("Silver Ingot",    "IngotSilver",  200),
        Steel:          new resource("Steel Ingot",     "IngotSteel",   200),
        Tin:            new resource("Tin Ingot",       "IngotTin",     200)
    },
    FoodRaw: {                     // Public Name       ID Name         Cap
        GrainBarley:    new resource("Barley Grain",    "GrainBarley",  200),
        GrainWheat:     new resource("Wheat Grain",     "GrainWheat",   200)
    },
    FoodIngredient: {              // Public Name       ID Name         Cap
        FlourWheat:     new resource("Wheat Flour",     "FlourWheat",   200)
    },
    FoodCooked: {                  // Public Name       ID Name         Cap
        Bread:          new resource("Bread",           "Bread",        200)
    }
};

var BuildingWork = {
    Primary: {                      // Public Name      ID Name       Cap   Income Resource                     Income Amount   Expense Resource        Expense Amount  Tool Type           Tool Amount
        CampClay:   new buildingWork("Clay Pit",        "CampClay",     5,  [Resource.RawMaterial.Clay],        [2],            null,                   null,           ["Shovel"],      [1]),
        CampLogs:   new buildingWork("Lumber Camp",     "CampLogs",     5,  [Resource.RawMaterial.Logs],        [2],            null,                   null,           ["Axe"],         [1]),
        CampStone:  new buildingWork("Stone Quarry",    "CampStone",    5,  [Resource.RawMaterial.Stone],       [2],            null,                   null,           ["Pickaxe"],     [1])
    },
    Mine: {                         // Public Name      ID Name       Cap   Income Resource                     Income Amount   Expense Resource        Expense Amount  Tool Type           Tool Amount
        Copper:     new buildingWork("Copper Mine",     "MineCopper",   5,  [Resource.Ore.Copper],              [2],            null,                   null,           ["Pickaxe"],     [1]),
        Galena:     new buildingWork("Lead Mine",       "MineGalena",   5,  [Resource.Ore.Galena],              [2],            null,                   null,           ["Pickaxe"],     [1]),
        Gold:       new buildingWork("Gold Mine",       "MineGold",     5,  [Resource.Ore.Gold],                [2],            null,                   null,           ["Pickaxe"],     [1]),
        Iron:       new buildingWork("Iron Mine",       "MineIron",     5,  [Resource.Ore.Iron],                [2],            null,                   null,           ["Pickaxe"],     [1]),
        Silver:     new buildingWork("Silver Mine",     "MineSilver",   5,  [Resource.Ore.Silver],              [2],            null,                   null,           ["Pickaxe"],     [1]),
        Tin:        new buildingWork("Tin Mine",        "MineTine",     5,  [Resource.Ore.Tin],                 [2],            null,                   null,           ["Pickaxe"],     [1])
    }
};

var BuildingHouse = {               // Public Name      ID Name       Pop
    TentSmall:  new buildingHouse("Small Tent",         "TentSmall",    1),
    TentLarge:  new buildingHouse("Large Tent",         "TentLarge",    2),
    HutSmall:   new buildingHouse("Small Hut",          "HutSmall",     4)
};

var Tool = {
    Axe: {
        Copper: new tool("Copper Axe", "AxeCopper"),
        Bronze: new tool("Bronze Axe", "AxeBronze"),
        Iron: new tool("Iron Axe", "AxeIron"),
        Steel: new tool("Steel Axe", "AxeSteel")
    },
    Pickaxe: {
        Copper: new tool("Copper Pickaxe", "PickaxeCopper"),
        Bronze: new tool("Bronze Pickaxe", "PickaxeBronze"),
        iron: new tool("Iron Pickaxe", "PickaxeIron"),
        steel: new tool("Steel Pickaxe", "PickaxeSteel")
    },
    Saw: {
        Iron: new tool("Iron Saw", "AawIron"),
        Steel: new tool("Steel Saw", "AawSteel")
    },
    Hoe: {
        Copper: new tool("Copper Hoe", "HoeCopper"),
        Bronze: new tool("Bronze Hoe", "HoeBronze"),
        Iron: new tool("Iron Hoe", "HoeIron"),
        Steel: new tool("Steel Hoe", "HoeSteel")
    },
    Shovel: {
        Copper: new tool("Copper Shovel", "ShovelCopper"),
        Bronze: new tool("Bronze Shovel", "ShovelBronze"),
        Iron: new tool("Iron Shovel", "ShovelIron"),
        Steel: new tool("Steel Shovel", "ShovelSteel")
    },
    Farming: {
        SickleCopper: new tool("Copper Sickle", "SickleCopper"),
        SickleBronze: new tool("Bronze Sickle", "SickleBronze"),
        SickleIron: new tool("Iron Sickle", "SickleIron"),
        SickleSteel: new tool("Steel Sickle", "SickleSteel"),
        SickleGold: new tool("Gold Sickle", "SickleGold"),
        ScytheCopper: new tool("Copper Scythe", "ScytheCopper"),
        ScytheBronze: new tool("Bronze Scythe", "ScytheBronze"),
        ScytheIron: new tool("Iron Scythe", "ScytheIron"),
        ScytheSteel: new tool("Steel Scythe", "ScytheSteel")
    },
    Hammer: {
        Stone: new tool("Stone Hammer", "HammerStone"),
        Copper: new tool("Copper Hammer", "HammerCopper"),
        Bronze: new tool("Bronze Hammer", "HammerBronze"),
        Iron: new tool("Iron Hammer", "HammerIron"),
        Steel: new tool("Steel Hammer", "HammerSteel")
    },
    Hunting: {
        SpearWood: new tool("Spear", "SpearWood"),
        SpearStone: new tool("Stone Spear", "SpearStone"),
        SpearCopper: new tool("Copper Spear", "SpearCopper"),
        SpearBronze: new tool("Bronze Spear", "SpearBronze"),
        SpearIron: new tool("Iron Spear", "SpearIron"),
        SpearSteel: new tool("Steel Spear", "SpearSteel"),
        BowHunting: new tool("Hunting Bow", "BowHunting"),
        BowReflex: new tool("Reflex Bow", "BowReflex"),
        KnifeStone: new tool("Stone Knife", "KnifeStone"),
        KnifeCopper: new tool("Copper Knife", "KnifeCopper"),
        KnifeBronze: new tool("Bronze Knife", "KnifeBronze"),
        KnifeIron: new tool("Iron Knife", "KnifeIron"),
        KnifeSteel: new tool("Steel Knife", "KnifeSteel")
    },
    Fishing: {
        Pole: new tool("Fishing Pole", "FishingPole"),
        Net: new tool("Fishing Net", "FishingNet")
    }
};


// ================================
//   OBJECT REFERENCE FUNCTIONS
// ================================

//TODO: Add tool list, crafting requirements, etc.

// ================================
//   RENDERING
// ================================

function init(){
    dayRender();

    population.updatePopulation();

    for(var key in Resource.RawMaterial){
        console.log(key);
        Resource.RawMaterial[key].render();
    }
    for (var key in Tool.Axe){
        console.log(key);
        Tool.Axe[key].render();
    }
    for (var key in BuildingHouse){
        console.log(key);
        BuildingHouse[key].render();
    }
    for (var key in BuildingWork.Primary){
        console.log(key);
        BuildingWork.Primary[key].render();
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
    for (var key in Resource.RawMaterial) {
        $("#debug-tab-resources").append(
            "<div id='debugString" + Resource.RawMaterial[key].idName + "'>" +
                Resource.RawMaterial[key].publicName + ": " +
                "<button onclick='debugChangeInputValue(-10, \"debugInput" + Resource.RawMaterial[key].idName + "\")'>--</button>" +
                "<button onclick='debugChangeInputValue(-1, \"debugInput" + Resource.RawMaterial[key].idName + "\")'>-</button>" +
                "<input type='text' class='debugInput' id='debugInput" + Resource.RawMaterial[key].idName + "' value='0' />" +
                "<button onclick='debugChangeInputValue(1, \"debugInput" + Resource.RawMaterial[key].idName + "\")'>+</button>" +
                "<button onclick='debugChangeInputValue(10, \"debugInput" + Resource.RawMaterial[key].idName + "\")'>++</button>" +
                "<button onclick='Resource.RawMaterial." + key + ".changeAmount(parseInt(gid(\"debugInput" + Resource.RawMaterial[key].idName + "\").value))'>Apply</button>" +
                "<button onclick='Resource.RawMaterial." + key + ".checkAmount(parseInt(gid(\"debugInput" + Resource.RawMaterial[key].idName + "\").value))'>Check</button>" +
            "</div>");
    }
}

function debugGenerateTools(){
    for (var key in Tool.Axe){
        $("#debug-tab-tools").append(
            "<div id='debugString" + Tool.Axe[key].idName + "'>" +
                Tool.Axe[key].publicName + ": " +
                "<button onclick='debugChangeInputValue(-10, \"debugInput" + Tool.Axe[key].idName + "\")'>--</button>" +
                "<button onclick='debugChangeInputValue(-1, \"debugInput" + Tool.Axe[key].idName + "\")'>-</button>" +
                "<input type='text' class='debugInput' id='debugInput" + Tool.Axe[key].idName + "' value='0' />" +
                "<button onclick='debugChangeInputValue(1, \"debugInput" + Tool.Axe[key].idName + "\")'>+</button>" +
                "<button onclick='debugChangeInputValue(10, \"debugInput" + Tool.Axe[key].idName + "\")'>++</button>" +
                "<button onclick='Tool.Axe." + key + ".changeAmount(parseInt(gid(\"debugInput" + Tool.Axe[key].idName + "\").value))'>Apply</button>" +
            "</div>"
        );
    }
}

function debugGenerateBuildingWork(){
    for (var key in BuildingWork){
        $("#debug-tab-buildings").append(
        "<h3>" + BuildingWork[key] + "</h3>");
        for (var subkey in BuildingWork[key]) {
            $("#debug-tab-buildings").append(
                "<div id='debugString" + BuildingWork[key][subkey].idName + "'>" +
                    BuildingWork[key][subkey].publicName + ": " +
                    "<button onclick='debugChangeInputValue(-10, \"debugInput" + BuildingWork[key][subkey].idName + "\")'>--</button>" +
                    "<button onclick='debugChangeInputValue(-1, \"debugInput" + BuildingWork[key][subkey].idName + "\")'>-</button>" +
                    "<input type='text' class='debugInput' id='debugInput" + BuildingWork[key][subkey].idName + "' value='0' />" +
                    "<button onclick='debugChangeInputValue(1, \"debugInput" + BuildingWork[key][subkey].idName + "\")'>+</button>" +
                    "<button onclick='debugChangeInputValue(10, \"debugInput" + BuildingWork[key][subkey].idName + "\")'>++</button>" +
                    "<button onclick='BuildingWork." + key + "." + subkey + ".add(parseInt(gid(\"debugInput" + BuildingWork[key][subkey].idName + "\").value))'>Apply</button>" +
                "</div>"
            );
        }
    }
}

function debugGenerateBuildingHouse(){
    for (var key in BuildingHouse){
        $("#debug-tab-houses").append(
            "<div id='debugString" + BuildingHouse[key].idName + "'>" +
                BuildingHouse[key].publicName + ": " +
                "<button onclick='debugChangeInputValue(-10, \"debugInput" + BuildingHouse[key].idName + "\")'>--</button>" +
                "<button onclick='debugChangeInputValue(-1, \"debugInput" + BuildingHouse[key].idName + "\")'>-</button>" +
                "<input type='text' class='debugInput' id='debugInput" + BuildingHouse[key].idName + "' value='0' />" +
                "<button onclick='debugChangeInputValue(1, \"debugInput" + BuildingHouse[key].idName + "\")'>+</button>" +
                "<button onclick='debugChangeInputValue(10, \"debugInput" + BuildingHouse[key].idName + "\")'>++</button>" +
                "<button onclick='BuildingHouse." + key + ".add(parseInt(gid(\"debugInput" + BuildingHouse[key].idName + "\").value))'>Apply</button>" +
            "</div>"
        );
    }
}