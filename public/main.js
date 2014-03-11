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
    versionNumber: "a0.1",
    debugMenu: true
};

var cityName = {
    name: "Cityville",

    changeName: function () {
        var newName = prompt("Enter a new name:", cityName.name);
        cityName.name = newName;
        cityName.render();
    },
    render: function () {
        $("#city-name").html(
            "<h3 style='display: inline'>" + cityName.name + "</h3>"
        );
    }
}

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

function dayIncome() {
    for (var key in Resource) {
        for (var subkey in Resource[key]){
            Resource[key][subkey].changeAmount(Resource[key][subkey].income);
        }
    }
    for (var key in BuildingFactory){
        for (var subkey in BuildingFactory[key]){
            BuildingFactory[key][subkey].applyIncome();
        }
    }
}

function dailyFunctions(){
    countdown("dayTimer", dailyFunctions, 10);
    dayIncome();
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
    for (var key in BuildingPrimary){
        for (var subkey in BuildingPrimary[key]){
            Population.assigned += BuildingPrimary[key][subkey].worker.amount;
        }
    }
    for (var key in BuildingFactory){
        for (var subkey in BuildingFactory[key]){
            Population.assigned += BuildingFactory[key][subkey].worker.amount;
        }
    }

    Population.updatePopulation();
}

// Crafting

var fnCheckCraft = function (num) {
    // If no extra number is passed then automatically check for 1 craft
    if (num == null) {
        num = 1;
    }

    // Cycle through each required resource and check if there's enough in storage. If not then fail
    for (var i = 0; i < this.craftType.length; i++) {
        if (this.craftAmount[i] * num > objRef(window, this.craftType[i]).amount) {
            return false;
        }
    }
    
    // Else return true
    return true;
};

var fnApplyCraft = function (num) {
    // If no extra number is passed then automatically check for 1 craft
    if (num == null) {
        num = 1;
    }

    // Produces 1 unless specified by item
    var produced = 1;

    if (this.hasOwnProperty("producedAmount")) {
        produced = this.producedAmount;
    }

    // If the check returns true then cycle through each resource subtracting the requirement, add the produced amount
    if (this.checkCraft(num)) {
        for (var i = 0; i < this.craftType.length; i++) {
            objRef(window, this.craftType[i]).changeAmount((this.craftAmount[i] * num) * -1);
        }
        this.changeAmount(produced * num);
    }
};


// ================================
//   OBJECT CONSTRUCTORS
// ================================

// --------------------------------
// Resources
// --------------------------------

function resource(strPublicName, strIdName, intAmountCap) {
    // Name handlers
    this.publicName = strPublicName;
    this.idName = strIdName;
    
    // Economics
    this.income = 0;
    this.expense = 0;
    
    // Storage
    this.amount = 0;
    this.amountCap = intAmountCap;
}

// Render the object
resource.prototype.renderAmount = function () {
    $("#" + this.idName).html(this.publicName + ": " + this.amount + "/" + this.amountCap);
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
    this.renderAmount();
};


// --------------------------------
// Production Buildings
// --------------------------------

function buildingPrimary(strPublicName, strIdName, intWorkerCap, arrIncomeResource, arrToolIncomeRef, arrToolType, arrCraftType, arrCraftAmount){
    // Names
    this.publicName = strPublicName; // Name that the player sees on the page
    this.idName = strIdName; // Div and button IDs for dynamic rendering

    // Number of buildings
    this.amount = 0;

    // Building income - Array of each for the income calculation loop to easily call it
    this.incomeResource = arrIncomeResource;
    this.toolIncomeRef = arrToolIncomeRef;
    
    // Building tool requirements - What tool the building's worker needs to generate income
    this.toolType = arrToolType;

    // Workers
    this.worker = {
        amount:         0,                                                   // Number of workers employed in this building
        capBase:        intWorkerCap,                                        // Base amount of workers that can be employed as defined by the building
        capModifier:    1,                                                   // Modifer to change the base capapacity per building for any upgrade buffs (May be merged with base instead)
        capTotal:       function(){return this.capBase * this.capModifier;}, // Calculator for total worker capacity - I can't call this when rendering? How do?
        equippedTools:  {}
    };

    this.craftType = arrCraftType;
    this.craftAmount = arrCraftAmount;
}

// Update the HTML on the page
buildingPrimary.prototype.renderAmount = function () {
    $("#" + this.idName).html(this.publicName + "s: " + this.amount + " - Workers: " + this.worker.amount + "/" + (this.amount * this.worker.capBase));
};

buildingPrimary.prototype.renderTool = function () {
    for (var i = 0; i < this.toolType.length; i++) {
        for (var workerTools in this.worker.equippedTools[this.toolType[i]]) {
            $("#" + this.idName + "Tool" + Tool[this.toolType[i]][workerTools].idName).html(
                Tool[this.toolType[i]][workerTools].publicName + " - " + this.worker.equippedTools[this.toolType[i]][workerTools]
            );
        }
    }
};

// Add more of this building type
buildingPrimary.prototype.changeAmount = function (num) {
    this.amount += num;
    this.renderAmount();
};

// Change worker for the building type - TODO: Have it automatically equip the best tool available
buildingPrimary.prototype.changeWorker = function (num) {
    if (isNaN(num) || num === 0) {          // Check if actually a number
        throw ("Stop trying to divide workers by 0");
    } else if (num > 0) {                   // Calculates the smallest amount it can add without going over any of the caps
        num = Math.min(num, Population.cap - Population.assigned, this.amount * this.worker.capBase - this.worker.amount);
    } else if (num < 0) {                   // Calculates the smallest amount it can subtract without going below 0 on anything - TODO: include unequipping
        num = Math.max(num, this.worker.amount * -1, this.worker.equippedTools.none * -1);
    }
    if (num === 0) {                        // Stop function if nothing to do
        return;
    }

    var oldIncome = [];
    for (var i = 0; i < this.toolType.length; i++) {
        oldIncome.push(this.getIncomeByToolType(this.toolType[i]));
    }

    this.worker.amount += num;              // Change the worker amount
    this.worker.equippedTools.none += num;  // Change the unequipped tools
    calculateWorkers();                     // Calculate total used workers
    for (var i = 0; i < this.toolType.length; i++) {
        this.applyIncomeByToolType(this.toolType[i], oldIncome[i]);
    }
    this.renderAmount();                    // Renders updated amounts to the screen
};

// Gets the total of every toolTier from the toolType
buildingPrimary.prototype.getWorkerEquippedToolTotal = function (toolType) {
    var total = 0;
    for (var key in this.worker.equippedTools[toolType]) {
        total += this.worker.equippedTools[toolType][key];
    }
    return total;
};

// Gets the total of every toolType and returns the amount of unequipped workers
buildingPrimary.prototype.getWorkerEquippedToolNone = function () {
    var totals = [];
    for (var i = 0; i < this.toolType.length; i++) {
        totals.push(this.getWorkerEquippedToolTotal(this.toolType[i]));
    }
    return this.worker.amount - totals.max();
};

// Changes the equipped tool amount
buildingPrimary.prototype.changeWorkerEquippedTool = function (num, toolType, toolTier) {
    if (isNaN(num) || num === 0) {          // Check if actually a number
        throw ("Stop trying to divide by 0");
    } else if (num > 0) {                   // Calculates the smallest amount it can add without going over any of the caps
        num = Math.min(num, this.worker.amount - this.getWorkerEquippedToolTotal(toolType), Tool[toolType][toolTier].amount - Tool[toolType][toolTier].equipped);
    } else if (num < 0) {                   // Calculates the smallest amount it can subtract without going below 0 on anything
        num = Math.max(num, this.worker.equippedTools[toolType][toolTier] * -1, Tool[toolType][toolTier].equipped * -1);
    }
    if (num === 0) {                        // Stop function if nothing to do
        return;
    }

    var oldIncome = this.getIncomeByToolType(toolType);                     // Gets the old income value before making the change

    this.worker.equippedTools[toolType][toolTier] += num;                   // Change the tool's amount
    Tool[toolType][toolTier].changeEquipped(num);                           // Change the number of total equipped tools of that type game wide
    this.worker.equippedTools.none = this.getWorkerEquippedToolNone();      // Update the number of unequipped workers
    this.applyIncomeByToolType(toolType, oldIncome);                        // Applies new income value to the resources
    this.renderTool();                                                      // Updates the screen with new tool count
};

// Get income value for tool type
buildingPrimary.prototype.getIncomeByToolType = function (toolType) {
    var total = 0;
    // Collect the income rate of each equipped tool in the catagory
    for (var key in this.worker.equippedTools[toolType]) {
        total += (this.worker.equippedTools[toolType][key] * Tool[toolType][key].incomeRate);
    }
    // Add the carriers for each equipped worker
    if (total > 0) {
        total += Math.min(this.worker.equippedTools.none, this.getWorkerEquippedToolTotal(toolType));
    }
    return total;
};

// Apply changes to income rate of a resource after the tool has been changed in the building
buildingPrimary.prototype.applyIncomeByToolType = function (toolType, oldIncome) {
    // Get position of toolType in the array. Used to compare against resource
    var toolPosition = this.toolType.indexOf(toolType);
    // Loop through each resource for the building, checking if the tool matches the resource
    for (var i = 0; i < this.incomeResource.length; i++) {
        if (toolPosition === this.toolIncomeRef[i]) {
            // Subtract the old value and add the new one to update the income. This means multiple buildings can provide the same resource
            objRef(window, this.incomeResource[i]).income -= oldIncome;
            objRef(window, this.incomeResource[i]).income += this.getIncomeByToolType(toolType);
        }
    }
};

buildingPrimary.prototype.checkCraft = fnCheckCraft;

buildingPrimary.prototype.applyCraft = fnApplyCraft;

// --------------------------------
// Factories
// --------------------------------

function buildingFactory(strPublicName, strIdName, intWorkerCap, arrIncomeResource, arrIncomeRate, arrExpenseResource, arrExpenseRate, strMachineType, arrMachineTypeAddon, arrCraftType, arrCraftAmount) {
    this.publicName = strPublicName;
    this.idName = strIdName;

    this.amount = 0;

    this.incomeResource = arrIncomeResource;
    this.incomeRate = arrIncomeRate;

    this.expenseResource = arrExpenseResource;
    this.expenseRate = arrExpenseRate;

    this.machineType = strMachineType;
    this.machineTypeAddon = arrMachineTypeAddon
    this.equippedMachines = {};
    this.equippedMachinesOrder = {};
    
    this.worker = {
        amount:             0,                                                   // Number of workers employed in this building
        capBase:            intWorkerCap                                         // Base amount of workers that can be employed as defined by the building
    };

    this.craftType = arrCraftType;
    this.craftAmount = arrCraftAmount;
}

buildingFactory.prototype.renderAmount = function () {
    $("#" + this.idName).html(this.publicName + "s: " + this.amount + " - Workers: " + this.worker.amount + "/" + (this.amount * this.worker.capBase));
};

buildingFactory.prototype.renderMachine = function () {
    for (var workerMachines in this.equippedMachines[this.machineType]) {
        $("#" + this.idName + "Machine" + Machine[this.machineType][workerMachines].idName).html(
            Machine[this.machineType][workerMachines].publicName + " - " + this.equippedMachines[this.machineType][workerMachines]
        );
    }
    if (this.machineTypeAddon !== null) {
        for (var i = 0; i < this.machineTypeAddon.length; i++) {
            for (var workerMachines in this.equippedMachines[this.machineTypeAddon[i]]) {
                $("#" + this.idName + "Machine" + Machine[this.machineTypeAddon[i]][workerMachines].idName).html(
                    Machine[this.machineTypeAddon[i]][workerMachines].publicName + " - " + this.equippedMachines[this.machineTypeAddon[i]][workerMachines]
                );
            }
        }
    }

}

buildingFactory.prototype.changeAmount = function (num) {
    this.amount += num;
    this.renderAmount();
};

buildingFactory.prototype.changeWorker = function (num) {
    if (isNaN(num) || num === 0) {          // Check if actually a number
        throw ("Stop trying to divide workers by 0");
    } else if (num > 0) {                   // Calculates the smallest amount it can add without going over any of the caps
        num = Math.min(num, Population.cap - Population.assigned, this.amount * this.worker.capBase - this.worker.amount);
    } else if (num < 0) {                   // Calculates the smallest amount it can subtract without going below 0 on anything - TODO: include unequipping
        num = Math.max(num, this.worker.amount * -1);
    }
    if (num === 0) {                        // Stop function if nothing to do
        return;
    }

    this.worker.amount += num;
    calculateWorkers();
    this.renderAmount();
};

buildingFactory.prototype.getEquippedMachineTotal = function (machineType) {
    var total = 0;
    for (var key in this.equippedMachines[machineType]) {
        total += this.equippedMachines[machineType][key];
    }
    return total;
};

buildingFactory.prototype.changeEquippedMachine = function (num, machineType, machineTier) {
    if (isNaN(num) || num === 0) {
        throw ("Stop trying to divide by 0");
    } else if (num > 0) {
        num = Math.min(num, this.amount - this.getEquippedMachineTotal(machineType), Machine[machineType][machineTier].amount - Machine[machineType][machineTier].equipped)
    } else if (num < 0) {
        num = Math.max(num, this.equippedMachines[machineType][machineTier] * -1, Machine[machineType][machineTier].equipped * -1)
    }
    if (num === 0) {
        return;
    }

    this.equippedMachines[machineType][machineTier] += num;
    Machine[machineType][machineTier].changeEquipped(num);
    this.renderMachine();
};

buildingFactory.prototype.workCalc = function () {
    var resourceTotal = 0;
    var workerTotal = this.worker.amount;
    var coreMachine = {
        workerCap: [],
        i: 0
    };
    var addonMachine = {};

    // Build addonMachine sub objects
    if (this.machineTypeAddon !== null) {
        for (var i = 0; i < this.machineTypeAddon.length; i++) {
            addonMachine[this.machineTypeAddon[i]] = { workerCap: [], i: 0 }
        }
    }
    // Populate core machine cap
    for (var i = 0; i < this.equippedMachinesOrder[this.machineType].length; i++) {
        coreMachine.workerCap.push(this.equippedMachines[this.machineType][this.equippedMachinesOrder[this.machineType][i]] * this.worker.capBase);
    }
    // Populate addon machine caps
    for (var key in addonMachine) {
        for (var i = 0; i < this.equippedMachinesOrder[key].length; i++) {
            addonMachine[key].workerCap.push(this.equippedMachines[key][this.equippedMachinesOrder[key][i]] * this.worker.capBase);
        }
    }

    // Builds the array to calculate the smallest group to be multiplied
    function calcMinMulti() {
        var a = []
        // Populate with definite values
        a.push(coreMachine.workerCap[coreMachine.i]);
        a.push(workerTotal);
        // Check if the optional machines have any more space for work and add them to the array if they do
        for (var key in addonMachine) {
            if (!isNaN(addonMachine[key].workerCap[addonMachine[key].i])) {
                a.push(addonMachine[key].workerCap[addonMachine[key].i]);
            }
        }
        return a;
    }

    // Loop calculating total for resourceTotal
    while (coreMachine.i < coreMachine.workerCap.length) {
        // Grabs smallest capacity to add multiple to
        var num = Math.min.apply(this, calcMinMulti());

        // Total the multiplier for the tech level
        var multi = 0;
        multi += Machine[this.machineType][this.equippedMachinesOrder[this.machineType][coreMachine.i]].multiplier;

        for (var key in addonMachine) {
            if (addonMachine[key].i < addonMachine[key].workerCap.length) {
                multi += Machine[key][this.equippedMachinesOrder[key][addonMachine[key].i]].multiplier;
            }
        }

        // Adds the total of that tier to the resource total
        resourceTotal += num * multi;

        // Subtract num from workers, breaking if there's none left
        workerTotal -= num;
        if (workerTotal === 0) {
            break;
        }

        // Subtract num from the core machine's worker cap, cycling to the next one if there's none left
        coreMachine.workerCap[coreMachine.i] -= num;
        if (coreMachine.workerCap[coreMachine.i] === 0) {
            coreMachine.i++;
        }

        // Subtract num from each addon machines' worker cap, cycling to the next one if there's none left
        for (var key in addonMachine) {
            if (addonMachine[key].i < addonMachine[key].workerCap.length) {
                addonMachine[key].workerCap[addonMachine[key].i] -= num;
                if (addonMachine[key].workerCap[addonMachine[key].i] === 0) {
                    addonMachine[key].i++;
                }
            }
        }
    }

    return resourceTotal;
};

buildingFactory.prototype.checkIncome = function () {
    // Get how much work the building is capable of
    var work = this.workCalc();

    // Cycle through each expense resource to check if there's enough and return false if not
    for (var i = 0; i < this.expenseRate.length; i++) {
        if (this.expenseRate[i] * work > objRef(window, this.expenseResource[i]).amount) {
            return false;
        }
    }
    for (var i = 0; i < this.incomeRate.length; i++) {
        if (objRef(window, this.incomeResource[i]).amountCap - objRef(window, this.incomeResource[i]).amount === 0) {
            return false;
        }
    }

    // Else return true
    return true;
};

buildingFactory.prototype.applyIncome = function () {
    var work = this.workCalc();

    if (this.checkIncome()) {
        for (var i = 0; i < this.expenseRate.length; i++) {
            objRef(window, this.expenseResource[i]).changeAmount((this.expenseRate[i] * work) * -1);
        }
        for (var i = 0; i < this.incomeRate.length; i++) {
            objRef(window, this.incomeResource[i]).changeAmount((this.incomeRate[i] * work));
        }
    }
}

buildingFactory.prototype.checkCraft = fnCheckCraft;

buildingFactory.prototype.applyCraft = fnApplyCraft;


// --------------------------------
// Housing Buildings
// --------------------------------

function buildingHouse(strPublicName, strIdName, intBasePop, arrCraftType, arrCraftAmount){
    this.publicName = strPublicName;
    this.idName = strIdName;

    this.amount = 0;
    this.basePop = intBasePop;
    //this.popModifier = 0; TODO: Add tech tree modifiers here

    this.craftType = arrCraftType;
    this.craftAmount = arrCraftAmount;
}

// Update the HTML on the page
buildingHouse.prototype.renderAmount = function () {
    $("#" + this.idName).html(this.publicName + "s: " + this.amount + " - Population: " + (this.amount * this.basePop));
};

// Add more of this building type
buildingHouse.prototype.changeAmount = function (num) {
    this.amount += num;
    calculateHousing();
    this.renderAmount();
};

buildingHouse.prototype.checkCraft = fnCheckCraft;

buildingHouse.prototype.applyCraft = fnApplyCraft;


// --------------------------------
// Tools
// --------------------------------

function tool(strPublicName, strIdName, intIncomeRate, arrCraftType, arrCraftAmount){
    this.publicName = strPublicName;
    this.idName = strIdName;

    this.amount = 0;
    this.equipped = 0;

    this.incomeRate = intIncomeRate;

    this.craftType = arrCraftType;
    this.craftAmount = arrCraftAmount;
}

// Update the HTML on the page
tool.prototype.renderAmount = function () {
    $("#" + this.idName).html(this.publicName + ": " + this.equipped + "/" + this.amount);
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
    this.renderAmount();
};

// Changes equipped total
tool.prototype.changeEquipped = function (num) {
    this.equipped += num; // Temporary
    this.renderAmount();
};

tool.prototype.checkCraft = fnCheckCraft;

tool.prototype.applyCraft = fnApplyCraft;


// --------------------------------
// Machine
// --------------------------------

function machine(strPublicName, strIdName, intMultiplier, arrCraftType, arrCraftAmount){
    this.publicName = strPublicName;
    this.idName = strIdName;

    this.amount = 0;
    this.equipped = 0;

    this.multiplier = intMultiplier;
    
    this.craftType = arrCraftType;
    this.craftAmount = arrCraftAmount;
}

machine.prototype.renderAmount = function () {
    $("#" + this.idName).html(this.publicName + ": " + this.equipped + "/" + this.amount);
};

machine.prototype.changeAmount = function (num) {
    this.amount += num;
    this.renderAmount();
};

machine.prototype.changeEquipped = function (num) {
    this.equipped += num;
    this.renderAmount();
};

machine.prototype.checkCraft = fnCheckCraft;

machine.prototype.applyCraft = fnApplyCraft;


// --------------------------------
// Items
// --------------------------------

function item(strPublicName, strIdName, intProducedAmount, arrCraftType, arrCraftAmount){
    this.publicName = strPublicName;
    this.idName = strIdName;

    this.amount = 0;

    this.producedAmount = intProducedAmount;
    this.craftType = arrCraftType;
    this.craftAmount = arrCraftAmount;
}

item.prototype.renderAmount = function (){
    $("#" + this.idName).html(this.publicName + ": " + this.amount);
}

item.prototype.changeAmount = function (num) {
    this.amount += num;
    this.renderAmount();
};

item.prototype.checkCraft = fnCheckCraft;

item.prototype.applyCraft = fnApplyCraft;


// ================================
//   OBJECT DEFINITIONS
// ================================

var Resource = {
    RawMaterial: {                         // Public Name       ID Name         Cap
        Clay:           new resource        ("Clay",            "Clay",         500),
        Hemp:           new resource        ("Hemp Fibers",     "Hemp",         200),
        Logs:           new resource        ("Logs",            "Logs",         500),
        Skins:          new resource        ("Animal Skins",    "Skins",        200),
        Stone:          new resource        ("Uncut Stone",     "Stone",        500)
    },
    Construction: {                        // Public Name       ID Name         Cap
        Planks:         new resource        ("Planks",          "Planks",       500),
        StoneBricks:    new resource        ("Stone Bricks",    "StoneBricks",  500)
        //ClayBricks:     new resource        ("Clay Bricks",     "ClayBricks",   200)
    },
    Fuel: {                                // Public Name       ID Name         Cap
        Firewood:       new resource        ("Firewood",        "Firewood",     200),
        Charcoal:       new resource        ("Charcoal",        "Charcoal",     200),
        Coal:           new resource        ("Coal",            "Coal",         200),
        CoalCoke:       new resource        ("Coal Coke",       "CoalCoke",     200),
        Peat:           new resource        ("Peat",            "Peat",         200)
    },
    Ore: {                                 // Public Name       ID Name         Cap
        //Cinnabar:       new resource        ("Cinnabar Ore",    "OreCinnabar",  200),
        Copper:         new resource        ("Copper Ore",      "OreCopper",    200),
        //Galena:         new resource        ("Galena Ore",      "OreGalena",    200),
        Gold:           new resource        ("Gold Ore",        "OreGold",      200),
        Iron:           new resource        ("Iron Ore",        "OreIron",      200),
        Silver:         new resource        ("Silver Ore",      "OreSilver",    200),
        Tin:            new resource        ("Tin Ore",         "OreTin",       200)
    },
    Ingot: {                               // Public Name       ID Name         Cap
        Bronze:         new resource        ("Bronze Ingot",    "IngotBronze",  100),
        Copper:         new resource        ("Copper Ingot",    "IngotCopper",  100),
        Gold:           new resource        ("Gold Ingot",      "IngotGold",    100),
        Iron:           new resource        ("Iron Ingot",      "IngotIron",    100),
        //Lead:           new resource        ("Lead Ingot",      "IngotLead",    200),
        Silver:         new resource        ("Silver Ingot",    "IngotSilver",  100),
        Steel:          new resource        ("Steel Ingot",     "IngotSteel",   100),
        Tin:            new resource        ("Tin Ingot",       "IngotTin",     100)
    },
    FoodRaw: {                             // Public Name       ID Name         Cap
        //GrainBarley:    new resource        ("Barley Grain",    "RawBarley",    200),
        GrainWheat:     new resource        ("Wheat Grain",     "RawWheat",     200),
        Meat:           new resource        ("Meat",            "RawMeat",      200)
    },
    FoodIngredient: {                      // Public Name       ID Name         Cap
        FlourWheat:     new resource        ("Wheat Flour",     "FlourWheat",   200)
    },
    FoodCooked: {                          // Public Name       ID Name         Cap
        Bread:          new resource        ("Bread",           "Bread",        200)
    }
};

var BuildingPrimary = {
    Primary: {                             // Public Name       ID Name       Cap   Income Resource                                             Income Tool     Tool Type
        CampClay:       new buildingPrimary ("Clay Pit",        "CampClay",     2,  ["Resource.RawMaterial.Clay"],                              [0],            ["Shovel"],
                                            ["Resource.RawMaterial.Logs"],
                                            [50]),
        CampLogs:       new buildingPrimary ("Lumber Camp",     "CampLogs",     2,  ["Resource.RawMaterial.Logs", "Resource.Fuel.Firewood"],    [0, 0],         ["Axe"],
                                            ["Resource.RawMaterial.Logs"],
                                            [50]),
        CampStone:      new buildingPrimary ("Stone Quarry",    "CampStone",    5,  ["Resource.RawMaterial.Stone"],                             [0],            ["Pickaxe"],
                                            ["Resource.RawMaterial.Logs"],
                                            [50]),
        CampHunting:    new buildingPrimary ("Hunting Camp",    "CampHunting",  2,  ["Resource.RawMaterial.Skins", "Resource.FoodRaw.Meat"],    [0, 1],         ["Knife", "Hunting"],
                                            ["Resource.RawMaterial.Logs"],
                                            [50])
    },
    Mine: {                                // Public Name       ID Name       Cap   Income Resource                         Income Tool     Tool Type
        Coal:           new buildingPrimary ("Coal Mine",       "MineCoal",     10, ["Resource.Fuel.Coal"],                 [0],            ["Pickaxe"],
                                            ["Resource.RawMaterial.Logs"],
                                            [50]),
        Copper:         new buildingPrimary ("Copper Mine",     "MineCopper",   10, ["Resource.Ore.Copper"],                [0],            ["Pickaxe"],
                                            ["Resource.RawMaterial.Logs"],
                                            [50]),
        //Galena:         new buildingPrimary ("Lead Mine",       "MineGalena",   10, ["Resource.Ore.Galena"],                [0],            ["Pickaxe"],
        //                                    ["Resource.RawMaterial.Logs"],
        //                                    [50]),
        Gold:           new buildingPrimary ("Gold Mine",       "MineGold",     5,  ["Resource.Ore.Gold"],                  [0],            ["Pickaxe"],
                                            ["Resource.RawMaterial.Logs"],
                                            [50]),
        Iron:           new buildingPrimary ("Iron Mine",       "MineIron",     10, ["Resource.Ore.Iron"],                  [0],            ["Pickaxe"],
                                            ["Resource.RawMaterial.Logs"],
                                            [50]),
        Silver:         new buildingPrimary ("Silver Mine",     "MineSilver",   5,  ["Resource.Ore.Silver"],                [0],            ["Pickaxe"],
                                            ["Resource.RawMaterial.Logs"],
                                            [50]),
        Tin:            new buildingPrimary ("Tin Mine",        "MineTin",      10, ["Resource.Ore.Tin"],                   [0],            ["Pickaxe"],
                                            ["Resource.RawMaterial.Logs"],
                                            [50])
    },
    Farm: {
        Hemp:           new buildingPrimary ("Hemp Farm",       "FarmHemp",     5,  ["Resource.RawMaterial.Hemp"],          [0],            ["Scythe"],
                                            ["Resource.RawMaterial.Logs"],
                                            [50])
    }
};

var BuildingFactory = {
    Construction: {
        Sawmill:        new buildingFactory ("Sawmill",         "ConstructionSawmill",  5,  ["Resource.Construction.Planks"],       [4],    ["Resource.RawMaterial.Logs"],  [1],    "Saw",      ["Crane"],
                                            ["Resource.RawMaterial.Logs"],
                                            [100]),
        Stonemason:     new buildingFactory ("Stonemason",      "ConstructionMason",    5,  ["Resource.Construction.StoneBricks"],  [2],    ["Resource.RawMaterial.Stone"], [2],    "Chisel",   ["Crane"],
                                            ["Resource.RawMaterial.Logs"],
                                            [100]),
        Charcoal:       new buildingFactory ("Charcoal Hut",    "CharcoalHut",          5,  ["Resource.Fuel.Charcoal"],             [5],    ["Resource.RawMaterial.Logs"],  [20],   "Charcoal", null,
                                            ["Resource.RawMaterial.Logs"],
                                            [20])
    },
    Smelter: {
        Bronze:         new buildingFactory ("Bronze Smelter",  "SmelterBronze",        5,  ["Resource.Ingot.Bronze"],          [2],    ["Resource.Fuel.Charcoal", "Resource.Ore.Copper", "Resource.Ore.Tin"],  [5, 9, 1],  "Furnace",  ["Crane", "Crucible"],
                                            ["Resource.RawMaterial.Logs"],
                                            [100]),
        Copper:         new buildingFactory ("Copper Smelter",  "SmelterCopper",        5,  ["Resource.Ingot.Copper"],          [2],    ["Resource.Fuel.Firewood", "Resource.Ore.Copper"],                      [10, 10],   "Furnace",  ["Crane", "Crucible"],
                                            ["Resource.RawMaterial.Logs"],
                                            [30]),
        Gold:           new buildingFactory ("Gold Smelter",    "SmelterGold",          5,  ["Resource.Ingot.Gold"],            [2],    ["Resource.Fuel.Charcoal", "Resource.Ore.Gold"],                        [5, 10],    "Furnace",  ["Crane", "Crucible"],
                                            ["Resource.Construction.Planks"],
                                            [100]),
        Iron:           new buildingFactory ("Iron Smelter",    "SmelterIron",          5,  ["Resource.Ingot.Iron"],            [2],    ["Resource.Fuel.Coal", "Resource.Ore.Iron"],                            [10, 10],   "Furnace",  ["Crane", "Crucible"],
                                            ["Resource.Construction.StoneBricks",   "Resource.RawMaterial.Logs"],
                                            [250,                                   100]),
        Silver:         new buildingFactory ("Silver Smelter",  "SmelterSilver",        5,  ["Resource.Ingot.Silver"],          [2],    ["Resource.Fuel.Charcoal", "Resource.Ore.Silver"],                      [5, 10],    "Furnace",  ["Crane", "Crucible"],
                                            ["Resource.RawMaterial.Logs"],
                                            [100]),
        Steel:          new buildingFactory ("Steel Smelter",  "SmelterSteel",          5,  ["Resource.Ingot.Steel"],           [2],    ["Resource.Fuel.Coal", "Resource.Ore.Iron"],                            [20, 10],   "Furnace",  ["Crane", "Crucible"],
                                            ["Resource.Construction.StoneBricks",   "Resource.RawMaterial.Logs"],
                                            [400,                                   200]),
        Tin:            new buildingFactory ("Tin Smelter",  "SmelterTin",              5,  ["Resource.Ingot.Tin"],             [2],    ["Resource.Fuel.Charcoal", "Resource.Ore.Tin"],                         [5, 10],    "Furnace",  ["Crane", "Crucible"],
                                            ["Resource.RawMaterial.Logs"],
                                            [100])
    }
}

var BuildingHouse = {                      // Public Name       ID Name         Pop
    TentSmall:          new buildingHouse   ("Small Tent",      "TentSmall",    1,
                                            ["Resource.RawMaterial.Skins"],
                                            [20]),
    TentLarge:          new buildingHouse   ("Large Tent",      "TentLarge",    2,
                                            ["Resource.RawMaterial.Skins"],
                                            [40]),
    HutSmall:           new buildingHouse   ("Small Hut",       "HutSmall",     4,
                                            ["Resource.RawMaterial.Logs"],
                                            [100])
};

var Tool = {
    Axe: {                                 // Public Name       ID Name             Income Rate
        Copper:         new tool            ("Copper Axe",      "AxeCopper",        4,
                                            ["Resource.Ingot.Copper",   "Item.Component.ToolHandle"],
                                            [1,                         1]),
        Bronze:         new tool            ("Bronze Axe",      "AxeBronze",        8,
                                            ["Resource.Ingot.Bronze",   "Item.Component.ToolHandle"],
                                            [1,                         1]),
        Iron:           new tool            ("Iron Axe",        "AxeIron",          12,
                                            ["Resource.Ingot.Iron",     "Item.Component.ToolHandle"],
                                            [1,                         1]),
        Steel:          new tool            ("Steel Axe",       "AxeSteel",         16,
                                            ["Resource.Ingot.Steel",    "Item.Component.ToolHandle"],
                                            [1,                         1])
    },
    Pickaxe: {                             // Public Name       ID Name             Income Rate
        Copper:         new tool            ("Copper Pickaxe",  "PickaxeCopper",    4,
                                            ["Resource.Ingot.Copper",   "Item.Component.ToolHandle"],
                                            [1,                         1]),
        Bronze:         new tool            ("Bronze Pickaxe",  "PickaxeBronze",    8,
                                            ["Resource.Ingot.Bronze",   "Item.Component.ToolHandle"],
                                            [1,                         1]),
        Iron:           new tool            ("Iron Pickaxe",    "PickaxeIron",      12,
                                            ["Resource.Ingot.Iron",     "Item.Component.ToolHandle"],
                                            [1,                         1]),
        Steel:          new tool            ("Steel Pickaxe",   "PickaxeSteel",     16,
                                            ["Resource.Ingot.Steel",    "Item.Component.ToolHandle"],
                                            [1,                         1])
    },
    Hoe: {                                 // Public Name       ID Name             Income Rate
        Copper:         new tool            ("Copper Hoe",      "HoeCopper",        4,
                                            ["Resource.Ingot.Copper",   "Item.Component.ToolHandle"],
                                            [1,                         1]),
        Bronze:         new tool            ("Bronze Hoe",      "HoeBronze",        8,
                                            ["Resource.Ingot.Bronze",   "Item.Component.ToolHandle"],
                                            [1,                         1]),
        Iron:           new tool            ("Iron Hoe",        "HoeIron",          12,
                                            ["Resource.Ingot.Iron",     "Item.Component.ToolHandle"],
                                            [1,                         1]),
        Steel:          new tool            ("Steel Hoe",       "HoeSteel",         16,
                                            ["Resource.Ingot.Steel",    "Item.Component.ToolHandle"],
                                            [1,                         1])
    },
    Shovel: {                              // Public Name       ID Name             Income Rate
        Copper:         new tool            ("Copper Shovel",   "ShovelCopper",     4,
                                            ["Resource.Ingot.Copper",   "Item.Component.ToolHandle"],
                                            [1,                         1]),
        Bronze:         new tool            ("Bronze Shovel",   "ShovelBronze",     8,
                                            ["Resource.Ingot.Bronze",   "Item.Component.ToolHandle"],
                                            [1,                         1]),
        Iron:           new tool            ("Iron Shovel",     "ShovelIron",       12,
                                            ["Resource.Ingot.Iron",     "Item.Component.ToolHandle"],
                                            [1,                         1]),
        Steel:          new tool            ("Steel Shovel",    "ShovelSteel",      16,
                                            ["Resource.Ingot.Steel",    "Item.Component.ToolHandle"],
                                            [1,                         1])
    },
    Sickle: {                              // Public Name       ID Name             Income Rate
        Copper:         new tool            ("Copper Sickle",   "SickleCopper",     4,
                                            ["Resource.Ingot.Copper",   "Item.Component.ToolHandle"],
                                            [1,                         1]),
        Bronze:         new tool            ("Bronze Sickle",   "SickleBronze",     8,
                                            ["Resource.Ingot.Bronze",   "Item.Component.ToolHandle"],
                                            [1,                         1]),
        Iron:           new tool            ("Iron Sickle",     "SickleIron",       12,
                                            ["Resource.Ingot.Iron",     "Item.Component.ToolHandle"],
                                            [1,                         1]),
        Steel:          new tool            ("Steel Sickle",    "SickleSteel",      16,
                                            ["Resource.Ingot.Steel",    "Item.Component.ToolHandle"],
                                            [1,                         1]),
        Gold:           new tool            ("Gold Sickle",     "SickleGold",       4,
                                            ["Resource.Ingot.Gold",    "Item.Component.ToolHandle"],
                                            [1,                         1])
    },
    Scythe: {                              // Public Name       ID Name             Income Rate
        Copper:         new tool            ("Copper Scythe",   "ScytheCopper",     4,
                                            ["Resource.Ingot.Copper",   "Item.Component.ToolHandle"],
                                            [2,                         1]),
        Bronze:         new tool            ("Bronze Scythe",   "ScytheBronze",     8,
                                            ["Resource.Ingot.Bronze",   "Item.Component.ToolHandle"],
                                            [2,                         1]),
        Iron:           new tool            ("Iron Scythe",     "ScytheIron",       12,
                                            ["Resource.Ingot.Iron",     "Item.Component.ToolHandle"],
                                            [2,                         1]),
        Steel:          new tool            ("Steel Scythe",    "ScytheSteel",      16,
                                            ["Resource.Ingot.Steel",    "Item.Component.ToolHandle"],
                                            [2,                         1])
    },
    Hammer: {                              // Public Name       ID Name             Income Rate
        Copper:         new tool            ("Copper Hammer",   "HammerCopper",     4,
                                            ["Resource.Ingot.Copper",   "Item.Component.ToolHandle"],
                                            [2,                         1]),
        Bronze:         new tool            ("Bronze Hammer",   "HammerBronze",     8,
                                            ["Resource.Ingot.Bronze",   "Item.Component.ToolHandle"],
                                            [2,                         1]),
        Iron:           new tool            ("Iron Hammer",     "HammerIron",       12,
                                            ["Resource.Ingot.Iron",     "Item.Component.ToolHandle"],
                                            [2,                         1]),
        Steel:          new tool            ("Steel Hammer",    "HammerSteel",      16,
                                            ["Resource.Ingot.Steel",    "Item.Component.ToolHandle"],
                                            [2,                         1])
    },
    Hunting: {                             // Public Name       ID Name             Income Rate
        Spear:          new tool            ("Hunting Spear",   "HuntingSpear",     4,
                                            ["Item.Component.ToolHandle"],
                                            [1]),
        Hunting:        new tool            ("Hunting Bow",     "HuntingBow",       10,
                                            ["Item.Component.ToolHandle",   "Item.Component.CordHemp"],
                                            [1,                             2]),
        Reflex:         new tool            ("Reflex Bow",      "HuntingReflexBow", 14,
                                            ["Item.Component.ToolHandle",   "Item.Component.CordHemp"],
                                            [4,                             4])
    },
    Knife: {                               // Public Name       ID Name             Income Rate
        Copper:         new tool            ("Copper Knife",    "KnifeCopper",      4,
                                            ["Resource.Ingot.Copper",   "Item.Component.ToolHandle"],
                                            [1,                         1]),
        Bronze:         new tool            ("Bronze Knife",    "KnifeBronze",      8,
                                            ["Resource.Ingot.Bronze",   "Item.Component.ToolHandle"],
                                            [1,                         1]),
        Iron:           new tool            ("Iron Knife",      "KnifeIron",        12,
                                            ["Resource.Ingot.Iron",     "Item.Component.ToolHandle"],
                                            [1,                         1]),
        Steel:          new tool            ("Steel Knife",     "KnifeSteel",       16,
                                            ["Resource.Ingot.Steel",    "Item.Component.ToolHandle"],
                                            [1,                         1])
    },
    Fishing: {                             // Public Name       ID Name             Income Rate
        Pole:           new tool            ("Fishing Pole",    "FishingPole",      4,
                                            ["Item.Component.ToolHandle",   "Item.Component.CordHemp"],
                                            [2,                             2]),
        Net:            new tool            ("Fishing Net",     "FishingNet",       16,
                                            ["Item.Component.CordHemp"],
                                            [50])
    }
};

var Machine = {
    Charcoal: {
        Pit:                new machine     ("Charcoal Pit",            "CharcoalPit",      1,
                                            ["Resource.RawMaterial.Logs"],
                                            [10])
    },
    Chisel: {
        Basic:              new machine     ("Mason's Chisels",         "ChiselBasic",      1,
                                            ["Resource.Ingot.Bronze"],
                                            [5])
    },
    Furnace: {
        Blast:              new machine     ("Blast Furnace",           "FurnaceBlast",     3,
                                            ["Resource.Construction.StoneBricks"],
                                            [200]),
        Large:              new machine     ("Large Furnace",           "FurnaceLarge",     2,
                                            ["Resource.Construction.StoneBricks"],
                                            [50]),
        Basic:              new machine     ("Basic Furnace",           "FurnaceBasic",     1,
                                            ["Resource.RawMaterial.Logs"],
                                            [20])
    },
    Saw: {                                 // Public Name               ID Name             Multiplier
        Advanced:           new machine     ("Advanced Sawmill Saw",    "SawAdvanced",      2,
                                            ["Item.Engineering.GearboxWood",    "Resource.Ingot.Steel"],
                                            [4,                                 10]),
        Basic:              new machine     ("Basic Sawmill Saw",       "SawBasic",         1,
                                            ["Item.Engineering.GearboxWood",    "Resource.Ingot.Iron"],
                                            [1,                                 10])
    },
    Crane: {
        Basic:              new machine     ("Basic Crane",             "CraneBasic",       1,
                                            ["Item.Engineering.GearboxWood",    "Item.Component.WoodenShaft"],
                                            [1,                                 4])
    },
    Crucible: {
        Large:              new machine     ("Large Cruicible",         "CrucibleLarge",    2,
                                            ["Resource.RawMaterial.Clay"],
                                            [50]),
        Small:              new machine     ("Small Cruicible",         "CrucibleSmall",    1,
                                            ["Resource.RawMaterial.Clay"],
                                            [20])
    }
};

var Item = {
    Component: {                           // Public Name           ID Name             Produces
        WoodenShaft:        new item        ("Wooden Shaft",        "WoodenShaft",      8,
                                            ["Resource.RawMaterial.Logs"],
                                            [1]),
        ToolHandle:         new item        ("Tool Handle",         "ToolHandle",       2,
                                            ["Item.Component.WoodenShaft"],
                                            [1]),
        CordHemp:               new item    ("Hemp Cord",           "CordHemp",         1,
                                            ["Resource.RawMaterial.Hemp"],
                                            [4])
    },
    Engineering: {                         // Public Name           ID Name             Produces
        GearWood:           new item        ("Wood Gear Cog",       "GearWood",         5,
                                            ["Resource.RawMaterial.Logs"],
                                            [1]),
        DriveshaftWood:     new item        ("Wood Driveshaft",     "DriveshaftWood",   4,
                                            ["Resource.RawMaterial.Logs"],
                                            [1]),
        GearboxWood:        new item        ("Wood Gearbox",        "GearboxWood",      1,
                                            ["Item.Engineering.DriveshaftWood", "Item.Engineering.GearWood"],
                                            [2,                                 10])
    }
};


// ================================
//   OBJECT REFERENCE FUNCTIONS
// ================================

// Populate buildingPrimary.worker.equippedTool with each toolType to store totals of each equipped in that building type
buildingPrimary.prototype.listWorkerTools = function () {
    // Loop through the toolType array
    for (var i = 0; i < this.toolType.length; i++) {
        // Create the tool type key
        this.worker.equippedTools[this.toolType[i]] = {};
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

// Populate buildingFactory.worker.equippedMachine with each machineType to store totals of each equipped in that building type
buildingFactory.prototype.listMachines = function () {
    this.equippedMachines[this.machineType] = {};
    for (var key in Machine[this.machineType]) {
        if (Machine[this.machineType].hasOwnProperty(key)) {
            this.equippedMachines[this.machineType][key] = 0;
        }
    }
    // Loop through the machineTypeAddon array
    if (this.machineTypeAddon !== null) {
        for (var i = 0; i < this.machineTypeAddon.length; i++) {
            // Checks if the building actually needs a tool
            // Create the machine type key
            this.equippedMachines[this.machineTypeAddon[i]] = {};
            // Loop through each tier of tool for that toolType
            for (var key in Machine[this.machineTypeAddon[i]]) {
                // This line is needed to make sure that it doesn't perform the iteration over inherited properties
                if (Machine[this.machineTypeAddon[i]].hasOwnProperty(key)) {
                    // Create the tool tier key
                    this.equippedMachines[this.machineTypeAddon[i]][key] = 0;
                }
            }
        }   
    }
};

// Sorts machines into order of the tier multiplier to calculate income
buildingFactory.prototype.sortMachines = function () {
    this.equippedMachinesOrder[this.machineType] = Object.keys(Machine[this.machineType]);
    if (this.machineTypeAddon !== null) {
        for (var i = 0; i < this.machineTypeAddon.length; i++) {
            this.equippedMachinesOrder[this.machineTypeAddon[i]] = Object.keys(Machine[this.machineTypeAddon[i]]);
            //this.equippedMachinesOrder[this.machineType[i]].sort(function(a, b){
            //    return Machine[this.machineType[i]][a].tierMultiplier > Machine[this.machineType[i]][b].tierMultiplier ? -1 : Machine[this.machineType[i]][a].tierMultiplier == Machine[this.machineType[i]][b].tierMultiplier ? 0 : 1;
            //})
        }
    }
}

// Function to be run on load to populate the rest of the references
function pageLoadDefinitions(){
    // Populate equippedTool for each primary producer
    for (var key in BuildingPrimary){
        for (var subkey in BuildingPrimary[key]){
            BuildingPrimary[key][subkey].listWorkerTools();
        }
    }
    // Populate equippedMachine for each factory type
    for (var key in BuildingFactory){
        for (var subkey in BuildingFactory[key]){
            BuildingFactory[key][subkey].listMachines();
            BuildingFactory[key][subkey].sortMachines();
        }
    }
}


// ================================
//   RENDERING
// ================================

$(document).ready(function () {
    init();
});

function newGame() {
    // Give starting kit
    BuildingHouse.TentSmall.changeAmount(3);
    BuildingPrimary.Primary.CampLogs.changeAmount(1);
    BuildingPrimary.Primary.CampHunting.changeAmount(1);
    BuildingPrimary.Mine.Copper.changeAmount(1);
    Tool.Axe.Copper.changeAmount(1);
    Tool.Hunting.Spear.changeAmount(1);
    Tool.Knife.Copper.changeAmount(1);
    Tool.Pickaxe.Copper.changeAmount(1);

    // Apply starting kid
    BuildingPrimary.Primary.CampLogs.changeWorker(1);
    BuildingPrimary.Primary.CampLogs.changeWorkerEquippedTool(1, "Axe", "Copper");
    BuildingPrimary.Primary.CampHunting.changeWorker(1);
    BuildingPrimary.Primary.CampHunting.changeWorkerEquippedTool(1, "Hunting", "Spear");
    BuildingPrimary.Primary.CampHunting.changeWorkerEquippedTool(1, "Knife", "Copper");
    BuildingPrimary.Mine.Copper.changeWorker(1);
    BuildingPrimary.Mine.Copper.changeWorkerEquippedTool(1, "Pickaxe", "Copper");
}

function pageLayout(){
    pageBuildHeader();
    pageBuildTabs();

    // Header
    cityName.render();
    dayRender();
    Population.updatePopulation();
    
    debugHTMLLoad();
}

function init(){
    pageLoadDefinitions();
    pageLayout();
    countdown("dayTimer", dailyFunctions, 10);
    newGame();
}

function pageBuildHeader(){
    $("#game").append(
        "<div id='game-header'>" +
            "<div id='city-name' style='display: inline'></div>" +
            "<button onclick='cityName.changeName()'>Change</button>" +
            "<div id='dayTimer' style='display: inline'></div> " +
            "<div id='dayCounter' style='display: inline'></div> " +
            "<div id='Population' style='display: inline'></div>" +
        "</div>"
    );
}

function pageBuildTabs(){
    $("#game").append(
        "<div id='game-tabs'>" +
            "<div class='scroller'>" +
                "<ul>" +
                    "<li><a href='#game-tab-resource'>Resources</a></li>" +
                    "<li><a href='#game-tab-primary'>Primary Production</a></li>" +
                    "<li><a href='#game-tab-factory'>Factories</a></li>" +
                    "<li><a href='#game-tab-house'>Houses</a></li>" +
                    "<li><a href='#game-tab-tool'>Tools</a></li>" +
                    "<li><a href='#game-tab-machine'>Machines</a></li>" +
                    "<li><a href='#game-tab-item'>Items</a></li>" +
                "</ul>" +
            "</div>" +
            "<div class='scroller'>" +
                "<div id='game-tab-resource'>" +
                "</div>" +
                "<div id='game-tab-primary'>" +
                "</div>" +
                "<div id='game-tab-factory'>" +
                "</div>" +
                "<div id='game-tab-house'>" +
                "</div>" +
                "<div id='game-tab-tool'>" +
                "</div>" +
                "<div id='game-tab-machine'>" +
                "</div>" +
                "<div id='game-tab-item'>" +
                "</div>" +
            "</div>" +
        "</div>"
    );
    $("#game-tabs").tabs();

    gameGenerateResource();
    gameGeneratePrimary();
    gameGenerateFactory();
    gameGenerateHouse();
    gameGenerateTool();
    gameGenerateMachine();
    gameGenerateItem();
}

function gameGenerateResource() {
    $("#game-tab-resource").append(
        "<div id='resource-RawMaterial'>" +
            "<h3>Raw Materials</h3>" +
        "</div>" +
        "<div id='resource-Construction'>" +
            "<h3>Construction Materials</h3>" +
        "</div>" +
        "<div id='resource-Fuel'>" +
            "<h3>Fuel</h3>" +
        "</div>" +
        "<div id='resource-Ore'>" +
            "<h3>Ore</h3>" +
        "</div>" +
        "<div id='resource-Ingot'>" +
            "<h3>Metal Ingots</h3>" +
        "</div>" +
        "<div id='resource-FoodRaw'>" +
            "<h3>Raw Food</h3>" +
        "</div>" +
        "<div id='resource-FoodIngredient'>" +
            "<h3>Ingredients</h3>" +
        "</div>" +
        "<div id='resource-FoodCooked'>" +
            "<h3>Cooked Food</h3>" +
        "</div>"
    );
    
    for (var key in Resource){
        for (var subkey in Resource[key]){
            $("#resource-" + key).append(
                "<div>" +
                    "<div id='" + Resource[key][subkey].idName + "'></div>" +
                "</div>"
            );
            Resource[key][subkey].renderAmount();
        }
    }
}

function gameGeneratePrimary() {
    $("#game-tab-primary").append(
        "<div id='primary-Primary'>" +
            "<h3>Primary Resources</h3>" +
        "</div>" +
        "<div id='primary-Mine'>" +
            "<h3>Mines</h3>" +
        "</div>" +
        "<div id='primary-Farm'>" +
            "<h3>Farms</h3>" +
        "</div>"
    );

    for (var key in BuildingPrimary) {
        for (var subkey in BuildingPrimary[key]) {
            $("#primary-" + key).append(
                "<div class='border'>" +
                    "<button onclick='BuildingPrimary." + key + "." + subkey + ".applyCraft()'>Build</button>" +
                    "<div id='" + BuildingPrimary[key][subkey].idName + "' style='display: inline'></div>" +
                    "<button onclick='BuildingPrimary." + key + "." + subkey + ".changeWorker(-1)'>-</button>" +
                    "<button onclick='BuildingPrimary." + key + "." + subkey + ".changeWorker(1)'>+</button>" +
                    "<div id='" + BuildingPrimary[key][subkey].idName + "Cost'><b>Cost</b> | </div>" +
                    "<div id='" + BuildingPrimary[key][subkey].idName + "Tool'><b>Tools:</b>" +
                "</div>"
            );
            for (var i = 0; i < BuildingPrimary[key][subkey].craftType.length; i++) {
                $("#" + BuildingPrimary[key][subkey].idName + "Cost").append(
                    objRef(window, BuildingPrimary[key][subkey].craftType[i]).publicName + ": " + BuildingPrimary[key][subkey].craftAmount[i] + " | "
                );

            }
            for (var i = 0; i < BuildingPrimary[key][subkey].toolType.length; i++) {
                $("#" + BuildingPrimary[key][subkey].idName + "Tool").append(
                    "<div class='border' id='" + BuildingPrimary[key][subkey].idName + "Tool" + BuildingPrimary[key][subkey].toolType[i] + "'></div>"
                );
                var workerTools = Object.keys(BuildingPrimary[key][subkey].worker.equippedTools[BuildingPrimary[key][subkey].toolType[i]])
                for (var j = 0; j < workerTools.length; j++) {
                    function buildingIncome() {
                        var resourceNames = ""
                        for (var k = 0; k < BuildingPrimary[key][subkey].incomeResource.length; k++) {
                            if (i === BuildingPrimary[key][subkey].toolIncomeRef[k]) {
                                if (resourceNames != "") {
                                    resourceNames += ", ";
                                }
                                resourceNames += objRef(window, BuildingPrimary[key][subkey].incomeResource[k]).publicName;
                            }
                        }
                        return resourceNames;
                    }

                    $("#" + BuildingPrimary[key][subkey].idName + "Tool" + BuildingPrimary[key][subkey].toolType[i]).append(
                        "<div>" +
                            "<div id='" + BuildingPrimary[key][subkey].idName + "Tool" + Tool[BuildingPrimary[key][subkey].toolType[i]][workerTools[j]].idName + "' style='display: inline;'></div>" +
                            "<button onclick='BuildingPrimary." + key + "." + subkey + "." + "changeWorkerEquippedTool(-1, \"" + BuildingPrimary[key][subkey].toolType[i] + "\", " + "\"" + workerTools[j] + "\")'>Unequip</button>" +
                            "<button onclick='BuildingPrimary." + key + "." + subkey + "." + "changeWorkerEquippedTool(1, \"" + BuildingPrimary[key][subkey].toolType[i] + "\", " + "\"" + workerTools[j] + "\")'>Equip</button>" +
                            "Income: +" + Tool[BuildingPrimary[key][subkey].toolType[i]][workerTools[j]].incomeRate + " " + buildingIncome() + " each" +
                        "</div>"
                    );
                }
            }

            BuildingPrimary[key][subkey].renderAmount();
            BuildingPrimary[key][subkey].renderTool();
        }
    }
}

function gameGenerateFactory() {
    $("#game-tab-factory").append(
        "<div id='factory-Construction'>" +
            "<h3>Construction</h3>" +
        "</div>" +
        "<div id='factory-Smelter'>" +
            "<h3>Smelters</h3>" +
        "</div>"
    );

    for (var key in BuildingFactory) {
        for (var subkey in BuildingFactory[key]) {
            $("#factory-" + key).append(
                "<div class='border'>" +
                    "<button onclick='BuildingFactory." + key + "." + subkey + ".applyCraft()'>Build</button>" +
                    "<div id='" + BuildingFactory[key][subkey].idName + "' style='display: inline'></div>" +
                    "<button onclick='BuildingFactory." + key + "." + subkey + ".changeWorker(-1)'>-</button>" +
                    "<button onclick='BuildingFactory." + key + "." + subkey + ".changeWorker(1)'>+</button>" +
                    "<div id='" + BuildingFactory[key][subkey].idName + "Cost'><b>Cost</b> | </div>" +
                    "<div id='" + BuildingFactory[key][subkey].idName + "Production'><b>Work Rate:</b>" +
                        "<div id='" + BuildingFactory[key][subkey].idName + "ProductionIncome'>Income: | </div>" +
                        "<div id='" + BuildingFactory[key][subkey].idName + "ProductionExpense'>Expense: | </div>" +
                    "</div>" +
                    "<div id='" + BuildingFactory[key][subkey].idName + "Machine'><b>Machines:</b>" +
                "</div>"
            );

            for (var i = 0; i < BuildingFactory[key][subkey].craftType.length; i++) {
                $("#" + BuildingFactory[key][subkey].idName + "Cost").append(
                    objRef(window, BuildingFactory[key][subkey].craftType[i]).publicName + ": " + BuildingFactory[key][subkey].craftAmount[i] + " | "
                );
            }

            for (var i = 0; i < BuildingFactory[key][subkey].incomeResource.length; i++) {
                $("#" + BuildingFactory[key][subkey].idName + "ProductionIncome").append(
                    objRef(window, BuildingFactory[key][subkey].incomeResource[i]).publicName + ": " + BuildingFactory[key][subkey].incomeRate[i] + " | "                    
                )
            }

            for (var i = 0; i < BuildingFactory[key][subkey].expenseResource.length; i++) {
                $("#" + BuildingFactory[key][subkey].idName + "ProductionExpense").append(
                    objRef(window, BuildingFactory[key][subkey].expenseResource[i]).publicName + ": " + BuildingFactory[key][subkey].expenseRate[i] + " | "                    
                )
            }

            $("#" + BuildingFactory[key][subkey].idName + "Machine").append(
                "<div class='border' id='" + BuildingFactory[key][subkey].idName + "Machine" + BuildingFactory[key][subkey].machineType + "'></div>"
            );
            var workerMachines = Object.keys(BuildingFactory[key][subkey].equippedMachines[BuildingFactory[key][subkey].machineType])
            for (var j = 0; j < workerMachines.length; j++) {
                $("#" + BuildingFactory[key][subkey].idName + "Machine" + BuildingFactory[key][subkey].machineType).append(
                    "<div>" +
                        "<div id='" + BuildingFactory[key][subkey].idName + "Machine" + Machine[BuildingFactory[key][subkey].machineType][workerMachines[j]].idName + "' style='display: inline;'></div>" +
                        "<button onclick='BuildingFactory." + key + "." + subkey + "." + "changeEquippedMachine(-1, \"" + BuildingFactory[key][subkey].machineType + "\", " + "\"" + workerMachines[j] + "\")'>Unequip</button>" +
                        "<button onclick='BuildingFactory." + key + "." + subkey + "." + "changeEquippedMachine(1, \"" + BuildingFactory[key][subkey].machineType + "\", " + "\"" + workerMachines[j] + "\")'>Equip</button>" +
                        "Work Multiplier: " + Machine[BuildingFactory[key][subkey].machineType][workerMachines[j]].multiplier +
                    "</div>"
                );
            }
            if (BuildingFactory[key][subkey].machineTypeAddon !== null) {
                for (var i = 0; i < BuildingFactory[key][subkey].machineTypeAddon.length; i++) {
                    $("#" + BuildingFactory[key][subkey].idName + "Machine").append(
                        "<div class='border' id='" + BuildingFactory[key][subkey].idName + "Machine" + BuildingFactory[key][subkey].machineTypeAddon[i] + "'></div>"
                    );
                    var workerMachines = Object.keys(BuildingFactory[key][subkey].equippedMachines[BuildingFactory[key][subkey].machineTypeAddon[i]])
                    for (var j = 0; j < workerMachines.length; j++) {
                        $("#" + BuildingFactory[key][subkey].idName + "Machine" + BuildingFactory[key][subkey].machineTypeAddon[i]).append(
                            "<div>" +
                                "<div id='" + BuildingFactory[key][subkey].idName + "Machine" + Machine[BuildingFactory[key][subkey].machineTypeAddon[i]][workerMachines[j]].idName + "' style='display: inline;'></div>" +
                                "<button onclick='BuildingFactory." + key + "." + subkey + "." + "changeEquippedMachine(-1, \"" + BuildingFactory[key][subkey].machineTypeAddon[i] + "\", " + "\"" + workerMachines[j] + "\")'>Unequip</button>" +
                                "<button onclick='BuildingFactory." + key + "." + subkey + "." + "changeEquippedMachine(1, \"" + BuildingFactory[key][subkey].machineTypeAddon[i] + "\", " + "\"" + workerMachines[j] + "\")'>Equip</button>" +
                                "Work Added to Multiplier: " + Machine[BuildingFactory[key][subkey].machineTypeAddon[i]][workerMachines[j]].multiplier +
                            "</div>"
                        );
                    }
                }
            }

            BuildingFactory[key][subkey].renderMachine();
            BuildingFactory[key][subkey].renderAmount();
        }
    }
}

function gameGenerateHouse() {
    $("#game-tab-house").append(
        "<div id='house-All'>" +
            "<h3>All Housing</h3>" +
        "</div>"
    );

    for (var key in BuildingHouse) {
        $("#house-All").append(
            "<div class='border'>" +
                "<button onclick='BuildingHouse." + key + ".applyCraft()'>Build</button>" +
                "<div id='" + BuildingHouse[key].idName + "' style='display: inline'></div>" +
                "<div id='" + BuildingHouse[key].idName + "Cost'><b>Cost</b> | </div>" +
            "</div>"
        );
        for (var i = 0; i < BuildingHouse[key].craftType.length; i++) {
            $("#" + BuildingHouse[key].idName + "Cost").append(
                objRef(window, BuildingHouse[key].craftType[i]).publicName + ": " + BuildingHouse[key].craftAmount[i] + " | "
            );
        }
        BuildingHouse[key].renderAmount();
    }
}

function gameGenerateTool() {
    $("#game-tab-tool").append(
        "<div id='tool-Axe'>" +
            "<h3>Axes</h3>" +
        "</div>" +
        "<div id='tool-Pickaxe'>" +
            "<h3>Pickaxes</h3>" +
        "</div>" +
        "<div id='tool-Hoe'>" +
            "<h3>Hoes</h3>" +
        "</div>" +
        "<div id='tool-Shovel'>" +
            "<h3>Shovels</h3>" +
        "</div>" +
        "<div id='tool-Sickle'>" +
            "<h3>Sickles</h3>" +
        "</div>" +
        "<div id='tool-Scythe'>" +
            "<h3>Scythes</h3>" +
        "</div>" +
        "<div id='tool-Hammer'>" +
            "<h3>Hammers</h3>" +
        "</div>" +
        "<div id='tool-Hunting'>" +
            "<h3>Hunting Equipment</h3>" +
        "</div>" +
        "<div id='tool-Knife'>" +
            "<h3>Knives</h3>" +
        "</div>" +
        "<div id='tool-Fishing'>" +
            "<h3>Fishing Equipment</h3>" +
        "</div>"
    );

    for (var key in Tool){
        for (var subkey in Tool[key]){
            $("#tool-" + key).append(
                "<div class='border'>" +
                    "<button onclick='Tool." + key + "." + subkey + ".applyCraft()'>Craft</button>" +
                    "<div id='" + Tool[key][subkey].idName + "' style='display: inline'></div>" +
                    "<div id='" + Tool[key][subkey].idName + "Cost'><b>Cost</b> | </div>" +
                "</div>"
            );
            for (var i = 0; i < Tool[key][subkey].craftType.length; i++) {
                $("#" + Tool[key][subkey].idName + "Cost").append(
                    objRef(window, Tool[key][subkey].craftType[i]).publicName + ": " + Tool[key][subkey].craftAmount[i] + " | "
                );
            }
            Tool[key][subkey].renderAmount();
        }
    }
}

function gameGenerateMachine() {
    $("#game-tab-machine").append(
        "<div id='machine-Charcoal'>" +
            "<h3>Charcoal</h3>" +
        "</div>" +
        "<div id='machine-Chisel'>" +
            "<h3>Chisels</h3>" +
        "</div>" +
        "<div id='machine-Furnace'>" +
            "<h3>Furnaces</h3>" +
        "</div>" +
        "<div id='machine-Saw'>" +
            "<h3>Saws</h3>" +
        "</div>" +
        "<div id='machine-Crane'>" +
            "<h3>Cranes</h3>" +
        "</div>" +
        "<div id='machine-Crucible'>" +
            "<h3>Crucibles</h3>" +
        "</div>"
    );

    for (var key in Machine) {
        for (var subkey in Machine[key]) {
            $("#machine-" + key).append(
                "<div class='border'>" +
                    "<button onclick='Machine." + key + "." + subkey + ".applyCraft()'>Craft</button>" +
                    "<div id='" + Machine[key][subkey].idName + "' style='display: inline'></div>" +
                    "<div id='" + Machine[key][subkey].idName + "Cost'><b>Cost</b> | </div>" +
                "</div>"
            );
            for (var i = 0; i < Machine[key][subkey].craftType.length; i++) {
                $("#" + Machine[key][subkey].idName + "Cost").append(
                    objRef(window, Machine[key][subkey].craftType[i]).publicName + ": " + Machine[key][subkey].craftAmount[i] + " | "
                );
            }
            Machine[key][subkey].renderAmount();
        }
    }
}

function gameGenerateItem() {
    $("#game-tab-item").append(
        "<div id='item-Component'>" +
            "<h3>Components</h3>" +
        "</div>" +
        "<div id='item-Engineering'>" +
            "<h3>Engineering</h3>" +
        "</div>"
    );

    for (var key in Item) {
        for (var subkey in Item[key]) {
            $("#item-" + key).append(
                "<div class='border'>" +
                    "<button onclick='Item." + key + "." + subkey + ".applyCraft()'>Craft</button>" +
                    "<div id='" + Item[key][subkey].idName + "' style='display: inline'></div>" +
                    "<div id='" + Item[key][subkey].idName + "Cost'><b>Cost</b> | </div>" +
                "</div>"
            );
            for (var i = 0; i < Item[key][subkey].craftType.length; i++) {
                $("#" + Item[key][subkey].idName + "Cost").append(
                    objRef(window, Item[key][subkey].craftType[i]).publicName + ": " + Item[key][subkey].craftAmount[i] + " | "
                );
            }
            Item[key][subkey].renderAmount();
        }
    }
}

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

function debugHTMLLoad() {
    $("body").append(
        "<div id='debug'>" +
            "<div style='height: 21px'><div id='debug-button'>Debug</div></div>" +
            "<div id='debug-div'>" +
                "<div id='debug-tabs'>" +
                    "<div class='scroller'>" +
                        "<ul>" +
                            "<li><a href='#debug-tab-resources'>Resources</a></li>" +
                            "<li><a href='#debug-tab-tools'>Tools</a></li>" +
                            "<li><a href='#debug-tab-primaries'>Primary Buildings</a></li>" +
                            "<li><a href='#debug-tab-factories'>Factory Buildings</a></li>" +
                            "<li><a href='#debug-tab-houses'>Housing</a></li>" +
                        "</ul>" +
                    "</div>" +
                    "<div class='scroller content'>" +
                        "<div id='debug-tab-resources'>" +
                        "</div>" +
                        "<div id='debug-tab-tools'>" +
                        "</div>" +
                        "<div id='debug-tab-primaries'>" +
                        "</div>" +
                        "<div id='debug-tab-factories'>" +
                        "</div>" +
                        "<div id='debug-tab-houses'>" +
                        "</div>" +
                    "</div>" +
                "</div>" +
            "</div>" +
        "</div>"
    );
    debugGenerateResources();
    debugGenerateTools();
    debugGenerateBuildingPrimary();
    debugGenerateBuildingFactory();
    debugGenerateBuildingHouse();
};

function debugChangeInputValue(num, id){
    var v = parseInt(gid(id).value);
    v = isNaN(v) ? 0 : v;
    v += num;
    gid(id).value = v;
}

function debugGenerateResources(){
    for (var key in Resource) {
        for (var subkey in Resource[key]){
            $("#debug-tab-resources").append(
                "<div id='debugString" + Resource[key][subkey].idName + "'>" +
                    Resource[key][subkey].publicName + ": " +
                    "<button onclick='debugChangeInputValue(-10, \"debugInput" + Resource[key][subkey].idName + "\")'>--</button>" +
                    "<button onclick='debugChangeInputValue(-1, \"debugInput" + Resource[key][subkey].idName + "\")'>-</button>" +
                    "<input type='text' class='debugInput' id='debugInput" + Resource[key][subkey].idName + "' value='0' />" +
                    "<button onclick='debugChangeInputValue(1, \"debugInput" + Resource[key][subkey].idName + "\")'>+</button>" +
                    "<button onclick='debugChangeInputValue(10, \"debugInput" + Resource[key][subkey].idName + "\")'>++</button>" +
                    "<button onclick='Resource." + key + "." + subkey + ".changeAmount(parseInt(gid(\"debugInput" + Resource[key][subkey].idName + "\").value))'>Apply</button>" +
                "</div>"
            );
        }
    }
}

function debugGenerateTools(){
    for (var key in Tool){
        for (var subkey in Tool[key]) {
            $("#debug-tab-tools").append(
                "<div id='debugString" + Tool[key][subkey].idName + "'>" +
                    Tool[key][subkey].publicName + ": " +
                    "<button onclick='debugChangeInputValue(-10, \"debugInput" + Tool[key][subkey].idName + "\")'>--</button>" +
                    "<button onclick='debugChangeInputValue(-1, \"debugInput" + Tool[key][subkey].idName + "\")'>-</button>" +
                    "<input type='text' class='debugInput' id='debugInput" + Tool[key][subkey].idName + "' value='0' />" +
                    "<button onclick='debugChangeInputValue(1, \"debugInput" + Tool[key][subkey].idName + "\")'>+</button>" +
                    "<button onclick='debugChangeInputValue(10, \"debugInput" + Tool[key][subkey].idName + "\")'>++</button>" +
                    "<button onclick='Tool." + key + "." + subkey + ".changeAmount(parseInt(gid(\"debugInput" + Tool[key][subkey].idName + "\").value))'>Apply</button>" +
                "</div>"
            )
        }
    }
}

function debugGenerateBuildingPrimary(){
    for (var key in BuildingPrimary){
        for (var subkey in BuildingPrimary[key]) {
            $("#debug-tab-primaries").append(
                "<div id='debugString" + BuildingPrimary[key][subkey].idName + "'>" +
                    BuildingPrimary[key][subkey].publicName + ": " +
                    "<button onclick='debugChangeInputValue(-10, \"debugInput" + BuildingPrimary[key][subkey].idName + "\")'>--</button>" +
                    "<button onclick='debugChangeInputValue(-1, \"debugInput" + BuildingPrimary[key][subkey].idName + "\")'>-</button>" +
                    "<input type='text' class='debugInput' id='debugInput" + BuildingPrimary[key][subkey].idName + "' value='0' />" +
                    "<button onclick='debugChangeInputValue(1, \"debugInput" + BuildingPrimary[key][subkey].idName + "\")'>+</button>" +
                    "<button onclick='debugChangeInputValue(10, \"debugInput" + BuildingPrimary[key][subkey].idName + "\")'>++</button>" +
                    "<button onclick='BuildingPrimary." + key + "." + subkey + ".changeAmount(parseInt(gid(\"debugInput" + BuildingPrimary[key][subkey].idName + "\").value))'>Apply</button>" +
                "</div>"
            );
        }
    }
}

function debugGenerateBuildingFactory(){
    for (var key in BuildingFactory){
        for (var subkey in BuildingFactory[key]) {
            $("#debug-tab-factories").append(
                "<div id='debugString" + BuildingFactory[key][subkey].idName + "'>" +
                    BuildingFactory[key][subkey].publicName + ": " +
                    "<button onclick='debugChangeInputValue(-10, \"debugInput" + BuildingFactory[key][subkey].idName + "\")'>--</button>" +
                    "<button onclick='debugChangeInputValue(-1, \"debugInput" + BuildingFactory[key][subkey].idName + "\")'>-</button>" +
                    "<input type='text' class='debugInput' id='debugInput" + BuildingFactory[key][subkey].idName + "' value='0' />" +
                    "<button onclick='debugChangeInputValue(1, \"debugInput" + BuildingFactory[key][subkey].idName + "\")'>+</button>" +
                    "<button onclick='debugChangeInputValue(10, \"debugInput" + BuildingFactory[key][subkey].idName + "\")'>++</button>" +
                    "<button onclick='BuildingFactory." + key + "." + subkey + ".changeAmount(parseInt(gid(\"debugInput" + BuildingFactory[key][subkey].idName + "\").value))'>Apply</button>" +
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
                "<button onclick='BuildingHouse." + key + ".changeAmount(parseInt(gid(\"debugInput" + BuildingHouse[key].idName + "\").value))'>Apply</button>" +
            "</div>"
        );
    }
}