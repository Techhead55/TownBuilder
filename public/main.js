/// <reference path="scripts/jquery-1.10.2-vsdoc.js" />

function gid(id) {
    return document.getElementById(id);
}

function objRef(obj, str) {
    str = str.split(".");
    for (var i = 0; i < str.length; i++)
        obj = obj[str[i]];
    return obj;
}

Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

Array.prototype.min = function() {
  return Math.min.apply(null, this);
};


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

var Population = {
    assigned:           0,
    labourer:           function () { return Population.cap - Population.assigned; },
    cap:                0,

    updatePopulation:   function () { gid("Population").innerHTML = "Used Popluation: " + Population.assigned + "/" + Population.cap; }
};

function calculateHousing(){
    Population.cap = 0;
    for(var key in BuildingHouse){
        Population.cap += BuildingHouse[key].amount * BuildingHouse[key].basePop;
    }
    Population.updatePopulation();
}

function calculateWorkers(){
    Population.assigned = 0;
    for (var key in BuildingWork){
        for (var subkey in BuildingWork[key]){
            Population.assigned += BuildingWork[key][subkey].worker.amount;
        }
    }
    Population.updatePopulation();
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

function buildingWork(publicName, idName, workerCap, incomeResource, toolIncomeRef, expenseResource, toolExpenseRef, toolType){
    // Names
    this.publicName = publicName; // Name that the player sees on the page
    this.idName = idName; // Div and button IDs for dynamic rendering

    // Number of buildings
    this.amount = 0;

    // Building income - Array of each for the income calculation loop to easily call it
    this.incomeResource = incomeResource;
    this.toolIncomeRef = toolIncomeRef;

    // Building expense  - Array of each for the income calculation loop to easily call it
    this.expenseResource = expenseResource;
    this.toolExpenseRef = toolExpenseRef;
    
    // Building tool requirements - What tool the building's worker needs to generate income
    this.toolType = toolType;

    // Workers
    this.worker = {
        amount:         0,                                                   // Number of workers employed in this building
        capBase:        workerCap,                                           // Base amount of workers that can be employed as defined by the building
        capModifier:    1,                                                   // Modifer to change the base capapacity per building for any upgrade buffs (May be merged with base instead)
        capTotal:       function(){return this.capBase * this.capModifier;}, // Calculator for total worker capacity - I can't call this when rendering? How do?
        equippedTools:  {}
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

// Change worker for the building type - TODO: Have it automatically equip the best tool available
buildingWork.prototype.changeWorker = function (num) {
    if (isNaN(num) || num === 0) {          // Check if actually a number
        throw ("Stop trying to divide workers by 0");
    } else if (num > 0) {                   // Calculates the smallest amount it can add without going over any of the caps
        num = Math.min(num, Population.cap - Population.assigned, this.amount * this.worker.capBase - this.worker.amount)
    } else if (num < 0) {                   // Calculates the smallest amount it can subtract without going below 0 on anything - TODO: include unequipping
        num = Math.max(num, this.worker.amount * -1, this.worker.equippedTools.none * -1)
    }
    if (num === 0) {                        // Stop function if nothing to do
        return;
    }
    this.worker.amount += num;              // Change the worker amount
    this.worker.equippedTools.none += num;  // Change the unequipped tools
    calculateWorkers();                     // Calculate total used workers
    this.render();                          // Renders updated amounts to the screen
};

// Gets the total of every toolTeir from the toolType
buildingWork.prototype.getWorkerEquippedToolTotal = function (toolType) {
    var total = 0
    for (var key in this.worker.equippedTools[toolType]) {
        total += this.worker.equippedTools[toolType][key];
    }
    return total;
};

// Gets the total of every toolType and returns the amount of unequipped workers
buildingWork.prototype.getWorkerEquippedToolNone = function () {
    var totals = [];
    for (var i = 0; i < this.toolType.length; i++) {
            totals.push(this.getWorkerEquippedToolTotal(this.toolType[i]));
    }
    return this.worker.amount - totals.max();
}

// Changes the equipped tool amount
buildingWork.prototype.changeWorkerEquippedTool = function (num, toolType, toolTeir) {
    if (isNaN(num) || num === 0) {          // Check if actually a number
        throw ("Stop trying to divide by 0");
    } else if (num > 0) {                   // Calculates the smallest amount it can add without going over any of the caps
        num = Math.min(num, this.worker.amount - this.getWorkerEquippedToolTotal(toolType), this.worker.equippedTools.none, Tool[toolType][toolTeir].amount - Tool[toolType][toolTeir].equipped);
    } else if (num < 0) {                   // Calculates the smallest amount it can subtract without going below 0 on anything
        num = Math.max(num, this.worker.equippedTools[toolType][toolTeir] * -1, Tool[toolType][toolTeir].equipped * -1);
    }
    if (num === 0) {                        // Stop function if nothing to do
        return;
    }
    this.worker.equippedTools[toolType][toolTeir] += num;                   // Change the tool's amount
    Tool[toolType][toolTeir].changeEquipped(num);                           // Change the number of total equipped tools of that type game wide
    this.worker.equippedTools.none = this.getWorkerEquippedToolNone();      // Update the number of unequipped workers
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

function tool(publicName, idName, incomeRate){
    this.publicName = publicName;
    this.idName = idName;

    this.amount = 0;
    this.equipped = 0;

    this.incomeRate = incomeRate;
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

// Changes equipped total
tool.prototype.changeEquipped = function (num) {
    this.equipped += num; // Temporary
    this.render();
}


// ================================
//   OBJECT DEFINITIONS
// ================================

var Resource = {
    RawMaterial: {                         // Public Name       ID Name         Cap
        Clay:           new resource        ("Clay",            "Clay",         200),
        Logs:           new resource        ("Logs",            "Logs",         200),
        Stone:          new resource        ("Uncut Stone",     "Stone",        200)
    },
    Construction: {                        // Public Name       ID Name         Cap
        Planks:         new resource        ("Planks",          "Planks",       200),
        StoneBricks:    new resource        ("Stone Bricks",    "StoneBricks",  200),
        ClayBricks:     new resource        ("Clay Bricks",     "ClayBricks",   200)
    },
    Fuel: {                                // Public Name       ID Name         Cap
        Firewood:       new resource        ("Firewood",        "Firewood",     200),
        Charcoal:       new resource        ("Charcoal",        "Charcoal",     200),
        Coal:           new resource        ("Coal",            "Coal",         200),
        CoalCoke:       new resource        ("Coal Coke",       "CoalCoke",     200),
        Peat:           new resource        ("Peat",            "Peat",         200)
    },
    Ore: {                                 // Public Name       ID Name         Cap
        Cinnabar:       new resource        ("Cinnabar Ore",    "OreCinnabar",  200),
        Copper:         new resource        ("Copper Ore",      "OreCopper",    200),
        Galena:         new resource        ("Galena Ore",      "OreGalena",    200),
        Gold:           new resource        ("Gold Ore",        "OreGold",      200),
        Iron:           new resource        ("Iron Ore",        "OreIron",      200),
        Silver:         new resource        ("Silver Ore",      "OreSilver",    200),
        Tin:            new resource        ("Tin Ore",         "OreTin",       200)
    },
    Ingot: {                               // Public Name       ID Name         Cap
        Bronze:         new resource        ("Bronze Ingot",    "IngotBronze",  200),
        Copper:         new resource        ("Copper Ingot",    "IngotCopper",  200),
        Gold:           new resource        ("Gold Ingot",      "IngotGold",    200),
        Iron:           new resource        ("Iron Ingot",      "IngotIron",    200),
        Lead:           new resource        ("Lead Ingot",      "IngotLead",    200),
        Silver:         new resource        ("Silver Ingot",    "IngotSilver",  200),
        Steel:          new resource        ("Steel Ingot",     "IngotSteel",   200),
        Tin:            new resource        ("Tin Ingot",       "IngotTin",     200)
    },
    FoodRaw: {                             // Public Name       ID Name         Cap
        GrainBarley:    new resource        ("Barley Grain",    "GrainBarley",  200),
        GrainWheat:     new resource        ("Wheat Grain",     "GrainWheat",   200)
    },
    FoodIngredient: {                      // Public Name       ID Name         Cap
        FlourWheat:     new resource        ("Wheat Flour",     "FlourWheat",   200)
    },
    FoodCooked: {                          // Public Name       ID Name         Cap
        Bread:          new resource        ("Bread",           "Bread",        200)
    }
};

var BuildingWork = {
    Primary: {                             // Public Name       ID Name       Cap   Income Resource                         Income Tool     Expense Resource        Expense Tool    Tool Type
        CampClay:       new buildingWork    ("Clay Pit",        "CampClay",     5,  ["Resource.RawMaterial.Clay"],          [0],            null,                   null,           ["Shovel"]),
        CampLogs:       new buildingWork    ("Lumber Camp",     "CampLogs",     5,  [Resource.RawMaterial.Logs],            [0],            null,                   null,           ["Axe"]),
        CampStone:      new buildingWork    ("Stone Quarry",    "CampStone",    5,  [Resource.RawMaterial.Stone],           [0],            null,                   null,           ["Pickaxe"])
    },
    Mine: {                                // Public Name       ID Name       Cap   Income Resource                         Income Tool     Expense Resource        Expense Tool    Tool Type
        Copper:         new buildingWork    ("Copper Mine",     "MineCopper",   5,  [Resource.Ore.Copper],                  [0],            null,                   null,           ["Pickaxe"]),
        Galena:         new buildingWork    ("Lead Mine",       "MineGalena",   5,  [Resource.Ore.Galena],                  [0],            null,                   null,           ["Pickaxe"]),
        Gold:           new buildingWork    ("Gold Mine",       "MineGold",     5,  [Resource.Ore.Gold],                    [0],            null,                   null,           ["Pickaxe"]),
        Iron:           new buildingWork    ("Iron Mine",       "MineIron",     5,  [Resource.Ore.Iron],                    [0],            null,                   null,           ["Pickaxe"]),
        Silver:         new buildingWork    ("Silver Mine",     "MineSilver",   5,  [Resource.Ore.Silver],                  [0],            null,                   null,           ["Pickaxe"]),
        Tin:            new buildingWork    ("Tin Mine",        "MineTine",     5,  [Resource.Ore.Tin],                     [0],            null,                   null,           ["Pickaxe"])
    }
};

var BuildingHouse = {                      // Public Name       ID Name         Pop
    TentSmall:          new buildingHouse   ("Small Tent",      "TentSmall",    1),
    TentLarge:          new buildingHouse   ("Large Tent",      "TentLarge",    2),
    HutSmall:           new buildingHouse   ("Small Hut",       "HutSmall",     4)
};

var Tool = {
    Axe: {                                 // Public Name       ID Name             Income Rate
        Copper:         new tool            ("Copper Axe",      "AxeCopper",        2),
        Bronze:         new tool            ("Bronze Axe",      "AxeBronze",        4),
        Iron:           new tool            ("Iron Axe",        "AxeIron",          8),
        Steel:          new tool            ("Steel Axe",       "AxeSteel",         16)
    },
    Pickaxe: {                             // Public Name       ID Name             Income Rate
        Copper:         new tool            ("Copper Pickaxe",  "PickaxeCopper",    2),
        Bronze:         new tool            ("Bronze Pickaxe",  "PickaxeBronze",    4),
        Iron:           new tool            ("Iron Pickaxe",    "PickaxeIron",      8),
        Steel:          new tool            ("Steel Pickaxe",   "PickaxeSteel",     16)
    },
    Saw: {                                 // Public Name       ID Name             Income Rate
        Iron:           new tool            ("Iron Saw",        "SawIron",          8),
        Steel:          new tool            ("Steel Saw",       "SawSteel",         16)
    },
    Hoe: {                                 // Public Name       ID Name             Income Rate
        Copper:         new tool            ("Copper Hoe",      "HoeCopper",        2),
        Bronze:         new tool            ("Bronze Hoe",      "HoeBronze",        4),
        Iron:           new tool            ("Iron Hoe",        "HoeIron",          8),
        Steel:          new tool            ("Steel Hoe",       "HoeSteel",         16)
    },
    Shovel: {                              // Public Name       ID Name             Income Rate
        Copper:         new tool            ("Copper Shovel",   "ShovelCopper",     2),
        Bronze:         new tool            ("Bronze Shovel",   "ShovelBronze",     4),
        Iron:           new tool            ("Iron Shovel",     "ShovelIron",       8),
        Steel:          new tool            ("Steel Shovel",    "ShovelSteel",      16)
    },
    Sickle: {                              // Public Name       ID Name             Income Rate
        Copper:         new tool            ("Copper Sickle",   "SickleCopper",     2),
        Bronze:         new tool            ("Bronze Sickle",   "SickleBronze",     4),
        Iron:           new tool            ("Iron Sickle",     "SickleIron",       8),
        Steel:          new tool            ("Steel Sickle",    "SickleSteel",      16),
        Gold:           new tool            ("Gold Sickle",     "SickleGold",       4)
    },
    Scythe: {                              // Public Name       ID Name             Income Rate
        Copper:         new tool            ("Copper Scythe",   "ScytheCopper",     2),
        Bronze:         new tool            ("Bronze Scythe",   "ScytheBronze",     4),
        Iron:           new tool            ("Iron Scythe",     "ScytheIron",       8),
        Steel:          new tool            ("Steel Scythe",    "ScytheSteel",      16)
    },
    Hammer: {                              // Public Name       ID Name             Income Rate
        Stone:          new tool            ("Stone Hammer",    "HammerStone",      1),
        Copper:         new tool            ("Copper Hammer",   "HammerCopper",     2),
        Bronze:         new tool            ("Bronze Hammer",   "HammerBronze",     4),
        Iron:           new tool            ("Iron Hammer",     "HammerIron",       8),
        Steel:          new tool            ("Steel Hammer",    "HammerSteel",      16)
    },
    Spear: {                               // Public Name       ID Name             Income Rate
        Wood:           new tool            ("Spear",           "SpearWood",        1),
        Stone:          new tool            ("Stone Spear",     "SpearStone",       1),
        Copper:         new tool            ("Copper Spear",    "SpearCopper",      2),
        Bronze:         new tool            ("Bronze Spear",    "SpearBronze",      4),
        Iron:           new tool            ("Iron Spear",      "SpearIron",        8),
        Steel:          new tool            ("Steel Spear",     "SpearSteel",       16)
    },
    Bow: {                                 // Public Name       ID Name             Income Rate
        Hunting:        new tool            ("Hunting Bow",     "BowHunting",       8),
        Reflex:         new tool            ("Reflex Bow",      "BowReflex",        16)
    },
    Knife: {                               // Public Name       ID Name             Income Rate
        Stone:          new tool            ("Stone Knife",     "KnifeStone",       1),
        Copper:         new tool            ("Copper Knife",    "KnifeCopper",      2),
        Bronze:         new tool            ("Bronze Knife",    "KnifeBronze",      4),
        Iron:           new tool            ("Iron Knife",      "KnifeIron",        8),
        Steel:          new tool            ("Steel Knife",     "KnifeSteel",       16)
    },
    Fishing: {                             // Public Name       ID Name             Income Rate
        Pole:           new tool            ("Fishing Pole",    "FishingPole",      4),
        Net:            new tool            ("Fishing Net",     "FishingNet",       16)
    }
};


// ================================
//   OBJECT REFERENCE FUNCTIONS
// ================================

// Populate buildingWork.worker.equippedTool with each toolType
buildingWork.prototype.listWorkerTools = function () {
    // Loop through the toolType array
    for (var i = 0; i < this.toolType.length; i++) {
        // Create the tool type key
        this.worker.equippedTools[this.toolType[i]] = {}
        // Loop through each tier of tool for that toolType
        for (var property in Tool[this.toolType[i]]) {
            // This line is needed to make sure that it doesn't perform the iteration over inherited properties
            if (Tool[this.toolType[i]].hasOwnProperty(property)) {
                // Create the tool tier key
                this.worker.equippedTools[this.toolType[i]][property] = 0;
            }
        }
    }
    // Create a key for unequipped worker
    this.worker.equippedTools.none = 0;
};

// Function to be run on load to populate the rest of the references
function pageLoadDefinitions(){
    // Populate equippedTool for each building type
    for (var key in BuildingWork){
        for (var subkey in BuildingWork[key]){
            BuildingWork[key][subkey].listWorkerTools();
        }
    }
}


// ================================
//   RENDERING
// ================================

function init(){
    dayRender();

    Population.updatePopulation();

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
    pageLoadDefinitions();
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