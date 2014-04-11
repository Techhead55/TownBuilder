/// <reference path="scripts/jquery-1.11.0-vsdoc.js" />

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

function newHide(element) {
    $(element).slideUp("fast", function () {
        $(element).addClass('hide')
            .slideDown(0);
    });
}

function newShow(element) {
    $(element).slideUp(0, function () {
        $(element).removeClass('hide')
            .slideDown("fast");
    });
}

function newSlideToggle(e) {
    var $next = $(e).next();
    var $arrow = $(e).find(">:first-child");
    if (!$($next).hasClass("hide")) {
        $arrow.html("►")
        newHide($next);
    } else {
        $arrow.html("▼")
        newShow($next);
    }
}

var sortHelper = function (e, ui) {
    ui.children().each(function() {
		$(this).width($(this).width());
	});
	return ui;
}

// ================================
//   ENGINE
// ================================

// Options

var options = {
    versionNumber: "a0.1",
    debugMenu: true,
    tutorialMessages: true
};

var cityName = {
    name: "Cityville",

    changeName: function () {
        var newName = prompt("Enter a new name:", cityName.name);
        if (newName !== null) {
            cityName.name = newName;
            cityName.render();
        }
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
        $("#" + elementID).html(minutes + ":" + remainingSeconds);
        if (seconds === 0) {
            clearInterval(interval);
            fn();
        } else {
            seconds--;

        }
    }, 1000);
}

// Popup

var popup = {
    hide: function () {
        $("#popup").slideUp("fast", function () {
            $("#popup").addClass('hide')
                .slideDown(0);
        });
        $("#popup").html("");
    },
    show: function () {
        $("#popup").slideUp(0, function () {
            $("#popup").removeClass('hide')
                .slideDown("fast");
        });
    },
    toggle: function () {
        if (!$("#popup").hasClass("hide")) {
            this.hide();
        } else {
            this.show();
        }
    }
}

var popupObjClass = "";
var popupObjReference = "";
var popupObjPath = "";

function tooltipPath() {
    if ($("#"+ thisID).data("class") === undefined) {
        return $("#" + thisID).data("object");
    } else {
        return objRef(window, $("#" + thisID).data("class") + "." + $("#" + thisID).data("subClass") + "." + $("#" + thisID).data("object")); 
    }
};

// Day Controller

var dayCount = 0;

function dayRender(){
    var day = dayCount % 7 + 1;
    var week = Math.floor(dayCount / 7) + 1;
    
    $("#dayCounter").html(" - W" + week + "D" + day + " - ");
}

function dayIncome() {
    for (var key in BuildingPrimary) {
        for (var subkey in BuildingPrimary[key]){
            BuildingPrimary[key][subkey].dayCycle();
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

    updatePopulation:   function () { $("#Population").html("Employed Workers: " + Population.assigned + "/" + Population.cap); }
};

function calculateHousing(){
    Population.cap = 0;
    for(var key in BuildingHouse){
        for (var subkey in BuildingHouse[key]) {
            Population.cap += BuildingHouse[key][subkey].amount * BuildingHouse[key][subkey].basePop;
        }
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

resource.prototype.renderAmount = function () {
    $("." + this.idName + "Amount").html(this.amount);
};

resource.prototype.renderAmountCap = function () {
    $("." + this.idName + "AmountCap").html(this.amountCap);
};

resource.prototype.renderIncome = function () {
    var income = this.income
    $("." + this.idName + "Income").html(function () {
        if (income > 0) {
            return "+" + income;
        } else {
            return "0"
        }
    });
};

resource.prototype.renderExpense = function () {
    var expense = this.expense
    $("." + this.idName + "Expense").html(function () {
        if (expense > 0) {
            return "-" + expense;
        } else {
            return "0"
        }
    });
};

resource.prototype.renderProfit = function () {
    var profit = this.income - this.expense;
    $("." + this.idName + "Profit").html(function () {
        if (profit > 0) {
            return "+" + profit;
        } else {
            return profit;
        }
    });
};

// Render the object
resource.prototype.renderAmountOld = function () {
    $("#" + this.idName + "Old").html(this.publicName + ": " + this.amount + "/" + this.amountCap);
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
    this.renderAmountOld();
};

resource.prototype.changeIncome = function (num) {
    this.income += num;
    this.renderIncome();
    this.renderProfit();
};

resource.prototype.changeExpense = function (num) {
    this.expense += num;
    this.renderExpense();
    this.renderProfit();
}


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
    this.incomeRate = [];
    
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

buildingPrimary.prototype.renderAmount = function () {
    $("." + this.idName + "Amount").html(this.amount);
};

buildingPrimary.prototype.renderWorker = function () {
    $("." + this.idName + "Worker").html(this.worker.amount);
};

buildingPrimary.prototype.renderWorkerCap = function () {
    $("." + this.idName + "WorkerCap").html(this.amount * this.worker.capBase);
};

buildingPrimary.prototype.renderIncome = function () {
    for (var i = 0; i < this.incomeRate.length; i++) {
        $("." + this.idName + objRef(window, this.incomeResource[i]).idName + "Income").html(this.incomeRate[i]);
    }
};

buildingPrimary.prototype.renderTool = function () {
    for (var i = 0; i < this.toolType.length; i++) {
        for (var workerTools in this.worker.equippedTools[this.toolType[i]]) {
            $("." + this.idName + "Tool" + Tool[this.toolType[i]][workerTools].idName).html(
                this.worker.equippedTools[this.toolType[i]][workerTools]
            );
        }
    }
};

buildingPrimary.prototype.renderPopup = function () {
    $("#popup").html(
        "<div class='left padding-div'><div class='content'>" +
            "<table id='popupLeftTable" + this.idName + "'>" +
                "<tr>" +
                    "<td>" +
                        this.publicName +
                    "</td>" +
                    "<td class='right'>" +
                        "<span class='" + this.idName + "Amount" + "'></span>" +
                    "</td>" +
                    "<td colspan='2'>" +
                        "<button id='craft" + this.idName + "' class='craft tooltip'>Build</button>" +
                    "</td>" +
                "</tr>" +
                "<tr>" +
                    "<td>" +
                        "Workers" +
                    "</td>" +
                    "<td class='right'>" +
                        "<span class='" + this.idName + "Worker'></span>/<span class='" + this.idName + "WorkerCap'></span>" +
                    "</td>" +
                    "<td>" +
                        "<button id='unemploy" + this.idName + "' class='workerSub'>-</button>" +
                    "</td>" +
                    "<td class='right'>" +
                        "<button id='employ" + this.idName + "' class='workerAdd'>+</button>" +
                    "</td>" +
                "</tr>" +
                "<tr>" +
                    "<td>" +
                        "<strong>Income</strong>" +
                    "</td>" +
                "</tr>" +
            "</table>" +
        "</div></div>" +
        "<div class='right padding-div'><div id='popupRight" + this.idName + "' class='content'>" +
            "<table id='popupRightTable" + this.idName + "'>" +
            "</table>" +
        "</div></div>"
    );

    $("#craft" + this.idName).data({
        object: this,
        tooltipContent: function () {
            var content = "<table class='vseperator'>" +
                "<tr>" +
                    "<th class='left'>" +
                        "Required Material" +
                    "</th>" +
                    "<th class='right'>" +
                        "Need" +
                    "</th>" +
                    "<th class='right'>" +
                        "Have" +
                    "</th>" +
                "</tr>";

            for (var i = 0; i < popupObjPath.craftType.length; i++) {
                content +=
                    "<tr>" +
                        "<td class='left'>" +
                            objRef(window, popupObjPath.craftType[i]).publicName +
                        "</td>" +
                        "<td class='right'>" +
                            popupObjPath.craftAmount[i] +
                        "</td>" +
                        "<td class='right'>" +
                            "<span class='" + objRef(window, popupObjPath.craftType[i]).idName + "Amount'>" + objRef(window, popupObjPath.craftType[i]).amount + "</span>" +
                        "</td>" +
                    "</tr>";
            }

            content += "</table>";
            return content;
        }
    });

    for (var i = 0; i < this.incomeRate.length; i++) {
        $("#popupLeftTable" + this.idName).append(
            "<tr>" +
                "<td>" +
                    objRef(window, this.incomeResource[i]).publicName +
                "</td>" +
                "<td></td>" +
                "<td></td>" +
                "<td class='right'>" +
                    "<span class='" + this.idName + objRef(window, this.incomeResource[i]).idName + "Income'></span>" +
                "</td>" +
            "</tr>"
        );
    }

    for (var i = 0; i < this.toolType.length; i++) {
        if (i !== 0) {
            $("#popupRight" + this.idName).append(
                "<hr>"
            );
        }

        $("#popupRight" + this.idName).append(
            "<table id='popupRightTable" + this.idName + i + "'>" +
            "</table>"
        );

        var workerTools = Object.keys(this.worker.equippedTools[this.toolType[i]])
        for (var j = 0; j < workerTools.length; j++) {
            $("#popupRightTable" + this.idName + i).append(
                "<tr id='toolTooltip" + this.idName + "Tool" + Tool[this.toolType[i]][workerTools[j]].idName + "' class='tooltip'>" +
                    "<td>" +
                        Tool[this.toolType[i]][workerTools[j]].publicName +
                    "</td>" +
                    "<td class='right'>" +
                        "<span class='" + this.idName + "Tool" + Tool[this.toolType[i]][workerTools[j]].idName + "'></span>" +
                    "</td>" +
                    "<td>" +
                        "<button id='unequip" + this.idName + "Tool" + Tool[this.toolType[i]][workerTools[j]].idName + "' class='unequipTool'>-</button>" +
                    "</td>" +
                    "<td>" +
                        "<button id='equip" + this.idName + "Tool" + Tool[this.toolType[i]][workerTools[j]].idName + "' class='equipTool'>+</button>" +
                    "</td>" +
                "</tr>"
            );

            $("#toolTooltip" + this.idName + "Tool" + Tool[this.toolType[i]][workerTools[j]].idName).data({
                toolType: "" + this.toolType[i],
                toolTier: "" + workerTools[j],
                tooltipContent: function () {
                    var toolPosition = popupObjPath.toolType.indexOf($("#" + thisID).data("toolType"));
                    var content = "<table>" +
                        "<tr>" +
                            "<td>" +
                                "Spare" +
                            "</td>" +
                            "<td class='right'>" +
                                "<span class='" + Tool[$("#" + thisID).data("toolType")][$("#" + thisID).data("toolTier")].idName + "Unequipped'>" + (Tool[$("#" + thisID).data("toolType")][$("#" + thisID).data("toolTier")].amount - Tool[$("#" + thisID).data("toolType")][$("#" + thisID).data("toolTier")].equipped) + "</span>" +
                            "</td>" +
                        "</tr>" +
                        "<tr>" +
                            "<td colspan='2'>" +
                                "<hr>" +
                            "</td>" +
                        "</tr>";

                    for (var k = 0; k < popupObjPath.incomeResource.length; k++) {
                        if (toolPosition === popupObjPath.toolIncomeRef[k]) {
                            content += "<tr>" +
                                "<td>" +
                                    objRef(window, popupObjPath.incomeResource[k]).publicName +
                                "</td>" +
                                "<td class='left-padding right'>" +
                                    "+" + Tool[$("#" + thisID).data("toolType")][$("#" + thisID).data("toolTier")].incomeRate +
                                "</td>" +
                            "</tr>";
                        }
                    }

                    content += "</table>";
                    return content;
                }
            })
            $("#unequip" + this.idName + "Tool" + Tool[this.toolType[i]][workerTools[j]].idName).data({
                toolType: "" + this.toolType[i],
                toolTier: "" + workerTools[j]
            });
            $("#equip" + this.idName + "Tool" + Tool[this.toolType[i]][workerTools[j]].idName).data({
                toolType: "" + this.toolType[i],
                toolTier: "" + workerTools[j]
            });
        }
    }

    this.renderAmount();
    this.renderWorker();
    this.renderWorkerCap();
    this.renderIncome();
    this.renderTool();
};

// Add more of this building type
buildingPrimary.prototype.changeAmount = function (num) {
    this.amount += num;
    this.renderAmount();
    this.renderWorkerCap();
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
    this.renderWorker();                    // Renders updated amounts to the screen
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
            // Update income rate of each for this building for player information
            this.incomeRate[i] = this.getIncomeByToolType(toolType);
            this.renderIncome();
            // Subtract the old value and add the new one to update the income. This means multiple buildings can provide the same resource
            objRef(window, this.incomeResource[i]).changeIncome(oldIncome * -1);
            objRef(window, this.incomeResource[i]).changeIncome(this.getIncomeByToolType(toolType));
        }
    }
};

buildingPrimary.prototype.dayCycle = function () {
    for (var i = 0; i < this.incomeRate.length; i++) {
        objRef(window, this.incomeResource[i]).changeAmount(this.incomeRate[i]);
    }
}

buildingPrimary.prototype.checkCraft = fnCheckCraft;

buildingPrimary.prototype.applyCraft = fnApplyCraft;

// --------------------------------
// Factories
// --------------------------------

function buildingFactory(strPublicName, strIdName, intWorkerCap, arrIncomeResource, arrIncomeRate, arrExpenseResource, arrExpenseRate, strMachineType, arrMachineTypeAddon, arrCraftType, arrCraftAmount) {
    this.publicName = strPublicName;
    this.idName = strIdName;

    this.amount = 0;
    this.workRate = 0;

    this.incomeResource = arrIncomeResource;
    this.incomeRate = arrIncomeRate;
    this.income = [];

    this.expenseResource = arrExpenseResource;
    this.expenseRate = arrExpenseRate;
    this.expense = [];

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
    $("." + this.idName + "Amount").html(this.amount);
};

buildingFactory.prototype.renderWorkRate = function () {
    $("." + this.idName + "WorkRate").html(this.workRate)
};

buildingFactory.prototype.renderWorker = function () {
    $("." + this.idName + "Worker").html(this.worker.amount);
};

buildingFactory.prototype.renderWorkerCap = function () {
    $("." + this.idName + "WorkerCap").html(this.amount * this.worker.capBase);
};

buildingFactory.prototype.renderIncome = function () {
    for (var i = 0; i < this.income.length; i++) {
        if (this.income[i] > 0) {
            $("." + this.idName + objRef(window, this.incomeResource[i]).idName + "Income").html("+" + this.income[i]);
        } else {
            $("." + this.idName + objRef(window, this.incomeResource[i]).idName + "Income").html("0");
        }
    }
};

buildingFactory.prototype.renderExpense = function () {
    for (var i = 0; i < this.expense.length; i++) {
        if (this.expense[i] > 0) {
            $("." + this.idName + objRef(window, this.expenseResource[i]).idName + "Expense").html("-" + this.expense[i]);
        } else {
            $("." + this.idName + objRef(window, this.expenseResource[i]).idName + "Expense").html("0");
        }
    }
};

buildingFactory.prototype.renderMachine = function () {
    for (var workerMachines in this.equippedMachines[this.machineType]) {
        $("." + this.idName + "Machine" + Machine[this.machineType][workerMachines].idName).html(
            this.equippedMachines[this.machineType][workerMachines]
        );
    }
    if (this.machineTypeAddon !== null) {
        for (var i = 0; i < this.machineTypeAddon.length; i++) {
            for (var workerMachines in this.equippedMachines[this.machineTypeAddon[i]]) {
                $("." + this.idName + "Machine" + Machine[this.machineTypeAddon[i]][workerMachines].idName).html(
                    this.equippedMachines[this.machineTypeAddon[i]][workerMachines]
                );
            }
        }
    }
};

buildingFactory.prototype.renderPopup = function () {
    $("#popup").html(
        "<div class='left padding-div'><div class='content'>" +
            "<table id='popupLeftTable" + this.idName + "'>" +
                "<tr>" +
                    "<td>" +
                        this.publicName +
                    "</td>" +
                    "<td class='right'>" +
                        "<span class='" + this.idName + "Amount" + "'></span>" +
                    "</td>" +
                    "<td colspan='2'>" +
                        "<button id='craft" + this.idName + "' class='craft tooltip'>Build</button>" +
                    "</td>" +
                "</tr>" +
                "<tr>" +
                    "<td>" +
                        "Workers" +
                    "</td>" +
                    "<td class='right'>" +
                        "<span class='" + this.idName + "Worker'></span>/<span class='" + this.idName + "WorkerCap'></span>" +
                    "</td>" +
                    "<td>" +
                        "<button id='unemploy" + this.idName + "' class='workerSub'>-</button>" +
                    "</td>" +
                    "<td class='right'>" +
                        "<button id='employ" + this.idName + "' class='workerAdd'>+</button>" +
                    "</td>" +
                "</tr>" +
                "<tr>" +
                    "<td>" +
                        "Work Rate" +
                    "</td>" +
                    "<td>" +
                    "</td>" +
                    "<td>" +
                    "</td>" +
                    "<td class='right'>" +
                        "<span class='" + this.idName + "WorkRate'></span>" +
                    "</td>" +
                "</tr>" +
                "<tr>" +
                    "<td>" +
                        "<strong id='cycle" + this.idName + "' class='tooltip'>Work Cycle</strong>" +
                    "</td>" +
                "</tr>" +
            "</table>" +
        "</div></div>" +
        "<div class='right padding-div'><div id='popupRight" + this.idName + "' class='content'>" +
            "<table id='popupRightTable" + this.idName + "'>" +
                "<tr>" +
                    "<td>" +
                        "<strong id='coreMachine" + this.idName + "'>Core Machine</strong>" +
                    "</td>" +
                "</tr>" +
            "</table>" +
        "</div></div>"
    );

    $("#craft" + this.idName).data({
        object: this,
        tooltipContent: function () {
            var content = "<table class='vseperator'>" +
                "<tr>" +
                    "<th class='left'>" +
                        "Required Material" +
                    "</th>" +
                    "<th class='right'>" +
                        "Need" +
                    "</th>" +
                    "<th class='right'>" +
                        "Have" +
                    "</th>" +
                "</tr>";

            for (var i = 0; i < popupObjPath.craftType.length; i++) {
                content +=
                    "<tr>" +
                        "<td>" +
                            objRef(window, popupObjPath.craftType[i]).publicName +
                        "</td>" +
                        "<td class='right'>" +
                            popupObjPath.craftAmount[i] +
                        "</td>" +
                        "<td class='right'>" +
                            "<span class='" + objRef(window, popupObjPath.craftType[i]).idName + "Amount'>" + objRef(window, popupObjPath.craftType[i]).amount + "</span>" +
                        "</td>" +
                    "</tr>";
            }

            content += "</table>";
            return content;
        }
    });

    $("#cycle" + this.idName).data({
        tooltipContent: function () {
            var content = "<table class='vseperator'>" +
                "<tr>" +
                    "<th class='left'>" +
                        "Resource" +
                    "</th>" +
                    "<th class='right'>" +
                        "Expense" +
                    "</th>" +
                "</tr>";

            for (var i = 0; i < popupObjPath.expenseResource.length; i++) {
                content += "<tr>" +
                    "<td>" +
                        objRef(window, popupObjPath.expenseResource[i]).publicName +
                    "</td>" +
                    "<td class='right'>" +
                        "-" + popupObjPath.expenseRate[i] +
                    "</td>" +
                "</tr>";
            }

            content += "<tr><td colspan='2'><hr></td></tr>" +
                "<tr>" +
                    "<th class='left'>" +
                        "Resource" +
                    "</th>" +
                    "<th class='right'>" +
                        "Income" +
                    "</th>" +
                "</tr>";

            for (var i = 0; i < popupObjPath.incomeResource.length; i++) {
                content += "<tr>" +
                    "<td>" +
                        objRef(window, popupObjPath.incomeResource[i]).publicName +
                    "</td>" +
                    "<td class='right'>" +
                        "+" + popupObjPath.incomeRate[i] +
                    "</td>" +
                "</tr>";
            }
            if (options.tutorialMessages) {
                content += "<tr><td colspan='2'>" +
                        "<hr>" +
                        "This recipe is multiplied by the work rate." +
                    "</td></tr>";
            }

            content += "</table>";
            return content;
        }
    });

    for (var i = 0; i < this.expense.length; i++) {
        $("#popupLeftTable" + this.idName).append(
            "<tr>" +
                "<td>" +
                    objRef(window, this.expenseResource[i]).publicName +
                "</td>" +
                "<td></td>" +
                "<td></td>" +
                "<td class='right'>" +
                    "<span class='" + this.idName + objRef(window, this.expenseResource[i]).idName + "Expense'></span>" +
                "</td>" +
            "</tr>"
        );
    }

    for (var i = 0; i < this.income.length; i++) {
        $("#popupLeftTable" + this.idName).append(
            "<tr>" +
                "<td>" +
                    objRef(window, this.incomeResource[i]).publicName +
                "</td>" +
                "<td></td>" +
                "<td></td>" +
                "<td class='right'>" +
                    "<span class='" + this.idName + objRef(window, this.incomeResource[i]).idName + "Income'></span>" +
                "</td>" +
            "</tr>"
        );
    }

    for (var key in Machine[this.machineType]) {
        $("#popupRightTable" + this.idName).append(
            "<tr id='machineTooltip" + this.idName + "Machine" + Machine[this.machineType][key].idName + "' class='tooltip''>" +
                "<td>" +
                    Machine[this.machineType][key].publicName +
                "</td>" +
                "<td class='right'>" +
                    "<span class='" + this.idName + "Machine" + Machine[this.machineType][key].idName + "'></span>" +
                "</td>" +
                "<td>" +
                    "<button id='unequip" + this.idName + "Machine" + Machine[this.machineType][key].idName + "' class='unequipMachine'>-</button>" +
                "</td>" +
                "<td>" +
                    "<button id='equip" + this.idName + "Machine" + Machine[this.machineType][key].idName + "' class='equipMachine'>+</button>" +
                "</td>" +
            "</tr>"
        );

        $("#machineTooltip" + this.idName + "Machine" + Machine[this.machineType][key].idName).data({
            machineType: "" + this.machineType,
            machineTier: "" + key,
            tooltipContent: function () {
                var content = "<table>" +
                    "<tr>" +
                        "<td>" +
                            "Spare" +
                        "</td>" +
                        "<td class='right'>" +
                            "<span class='" + Machine[$("#" + thisID).data("machineType")][$("#" + thisID).data("machineTier")].idName + "Unequipped'>" + (Machine[$("#" + thisID).data("machineType")][$("#" + thisID).data("machineTier")].amount - Machine[$("#" + thisID).data("machineType")][$("#" + thisID).data("machineTier")].equipped) + "</span>" +
                        "</td>" +
                    "</tr>" +
                    "<tr>" +
                        "<td colspan='2'>" +
                            "<hr>" +
                        "</td>" +
                    "</tr>";

                for (var k = 0; k < popupObjPath.incomeResource.length; k++) {
                    content += "<tr>" +
                        "<td>" +
                            "Base work rate" +
                        "</td>" +
                        "<td class='left-padding right'>" +
                            Machine[$("#" + thisID).data("machineType")][$("#" + thisID).data("machineTier")].multiplier +
                        "</td>" +
                    "</tr>";
                }

                content += "</table>";
                return content;
            }
        })
        $("#unequip" + this.idName + "Machine" + Machine[this.machineType][key].idName).data({
            machineType: "" + this.machineType,
            machineTier: "" + key
        });
        $("#equip" + this.idName + "Machine" + Machine[this.machineType][key].idName).data({
            machineType: "" + this.machineType,
            machineTier: "" + key
        });
    }

    if (this.machineTypeAddon !== null) {
        for (var i = 0; i < this.machineTypeAddon.length; i++) {
            if (i > 0) {
                $("#popupRight" + this.idName).append(
                    "<hr>"
                );
            } else {
                $("#popupRight" + this.idName).append(
                    "<strong id='addonMachine" + this.idName + "'>Addon Machines</strong>"
                );
            }

            $("#popupRight" + this.idName).append(
                "<table id='popupRightTable" + this.idName + i + "'>" +
                "</table>"
            );

            for (var key in Machine[this.machineTypeAddon[i]]) {
                $("#popupRightTable" + this.idName + i).append(
                    "<tr id='machineTooltip" + this.idName + "Machine" + Machine[this.machineTypeAddon[i]][key].idName + "' class='tooltip'>" +
                        "<td>" +
                            Machine[this.machineTypeAddon[i]][key].publicName +
                        "</td>" +
                        "<td class='right'>" +
                            "<span class='" + this.idName + "Machine" + Machine[this.machineTypeAddon[i]][key].idName + "'></span>" +
                        "</td>" +
                        "<td>" +
                            "<button id='unequip" + this.idName + "Machine" + Machine[this.machineTypeAddon[i]][key].idName + "' class='unequipMachine'>-</button>" +
                        "</td>" +
                        "<td>" +
                            "<button id='equip" + this.idName + "Machine" + Machine[this.machineTypeAddon[i]][key].idName + "' class='equipMachine'>+</button>" +
                        "</td>" +
                    "</tr>"
                );
                $("#machineTooltip" + this.idName + "Machine" + Machine[this.machineTypeAddon[i]][key].idName).data({
                    machineType: "" + this.machineTypeAddon[i],
                    machineTier: "" + key,
                    tooltipContent: function () {
                        var content = "<table>" +
                            "<tr>" +
                                "<td>" +
                                    "Spare" +
                                "</td>" +
                                "<td class='right'>" +
                                    "<span class='" + Machine[$("#" + thisID).data("machineType")][$("#" + thisID).data("machineTier")].idName + "Unequipped'>" + (Machine[$("#" + thisID).data("machineType")][$("#" + thisID).data("machineTier")].amount - Machine[$("#" + thisID).data("machineType")][$("#" + thisID).data("machineTier")].equipped) + "</span>" +
                                "</td>" +
                            "</tr>" +
                            "<tr>" +
                                "<td colspan='2'>" +
                                    "<hr>" +
                                "</td>" +
                            "</tr>";

                        for (var k = 0; k < popupObjPath.incomeResource.length; k++) {
                            content += "<tr>" +
                                "<td>" +
                                    "Modify work rate" +
                                "</td>" +
                                "<td class='left-padding right'>" +
                                    "+" + Machine[$("#" + thisID).data("machineType")][$("#" + thisID).data("machineTier")].multiplier +
                                "</td>" +
                            "</tr>";
                        }

                        content += "</table>";
                        return content;
                    }
                })
                $("#unequip" + this.idName + "Machine" + Machine[this.machineTypeAddon[i]][key].idName).data({
                    machineType: "" + this.machineTypeAddon[i],
                    machineTier: "" + key
                });
                $("#equip" + this.idName + "Machine" + Machine[this.machineTypeAddon[i]][key].idName).data({
                    machineType: "" + this.machineTypeAddon[i],
                    machineTier: "" + key
                });
            }
        }
    }

    if (options.tutorialMessages) {
        $("#coreMachine" + this.idName).addClass("tooltip");
        $("#addonMachine" + this.idName).addClass("tooltip");
    }
    $("#coreMachine" + this.idName).data({
        tooltipContent: "This machine is what defines the base work rate for each building of this type. Each machine will support as many workers as the building supports."
    });
    $("#addonMachine" + this.idName).data({
        tooltipContent: "These machines add to the work rate of the core machine, making them more efficient for each worker working on them."
    });


    this.renderAmount();
    this.renderWorkRate();
    this.renderWorker();
    this.renderWorkerCap();
    this.renderExpense();
    this.renderIncome();
    this.renderMachine();
};

// Add more of this building type
buildingFactory.prototype.changeAmount = function (num) {
    this.amount += num;
    this.renderAmount();
    this.renderWorkerCap();
};

// Change worker for the building type
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
    this.workCalc();
    calculateWorkers();
    this.renderAmount();
    this.renderWorker();
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
    this.workCalc();



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

    var oldIncome = this.income;
    var oldExpense = this.expense;

    for (var i = 0; i < this.income.length; i++) {
        objRef(window, this.incomeResource[i]).changeIncome(oldIncome[i] * -1);
    }
    for (var i = 0; i < this.expense.length; i++) {
        objRef(window, this.expenseResource[i]).changeExpense(oldExpense[i] * -1);
    }

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

    this.workRate = resourceTotal;
    this.calcIncome();

    var newIncome = this.income;
    var newExpense = this.expense;

    for (var i = 0; i < this.income.length; i++) {
        objRef(window, this.incomeResource[i]).changeIncome(newIncome[i]);
    }
    for (var i = 0; i < this.expense.length; i++) {
        objRef(window, this.expenseResource[i]).changeExpense(newExpense[i]);
    }

    this.renderWorkRate();
};

buildingFactory.prototype.calcIncome = function () {
    this.expense = [];
    for (var i = 0; i < this.expenseRate.length; i++) {
        this.expense.push(this.expenseRate[i] * this.workRate);
    }

    this.income = [];
    for (var i = 0; i < this.incomeRate.length; i++) {
        this.income.push(this.incomeRate[i] * this.workRate);
    }

    this.renderExpense();
    this.renderIncome();
}

buildingFactory.prototype.checkIncome = function () {
    // Get how much work the building is capable of
    var work = this.workRate;

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
    var work = this.workRate;

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

buildingHouse.prototype.renderAmount = function () {
    $("." + this.idName + "Amount").html(this.amount);
};

buildingHouse.prototype.renderPopulation = function () {
    $("." + this.idName + "Population").html(this.amount * this.basePop)
};

// Add more of this building type
buildingHouse.prototype.changeAmount = function (num) {
    this.amount += num;
    calculateHousing();
    this.renderAmount();
    this.renderPopulation();
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

tool.prototype.renderAmount = function () {
    $("." + this.idName + "Amount").html(this.amount);
};

tool.prototype.renderEquipped = function () {
    $("." + this.idName + "Equipped").html(this.equipped);
};

tool.prototype.renderUnequipped = function () {
    $("." + this.idName + "Unequipped").html(this.amount - this.equipped);
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
    this.renderUnequipped();
};

// Changes equipped total
tool.prototype.changeEquipped = function (num) {
    this.equipped += num; // TODO: Temporary
    this.renderEquipped();
    this.renderUnequipped();
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
    $("." + this.idName + "Amount").html(this.amount);
};

machine.prototype.renderEquipped = function () {
    $("." + this.idName + "Equipped").html(this.equipped);
};

machine.prototype.renderUnequipped = function () {
    $("." + this.idName + "Unequipped").html(this.amount - this.equipped);
};

machine.prototype.renderAmountOld = function () {
    $("#" + this.idName + "Old").html(this.publicName + ": " + this.equipped + "/" + this.amount);
};

machine.prototype.changeAmount = function (num) {
    this.amount += num;
    this.renderAmountOld();
    this.renderAmount();
    this.renderUnequipped();
};

machine.prototype.changeEquipped = function (num) {
    this.equipped += num;
    this.renderAmountOld();
    this.renderEquipped();
    this.renderUnequipped();
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

item.prototype.renderAmount = function () {
    $("." + this.idName + "Amount").html(this.amount);
};

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
                                            [50]),
        Wheat:          new buildingPrimary ("Wheat Farm",      "FarmWheat",    5,  ["Resource.FoodRaw.GrainWheat"],        [0],            ["Scythe"],
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

var BuildingHouse = {                      
    Tent: {                                // Public Name       ID Name         Pop
        TentSmall:      new buildingHouse   ("Small Tent",      "TentSmall",    1,
                                            ["Resource.RawMaterial.Skins"],
                                            [20]),
        TentLarge:      new buildingHouse   ("Large Tent",      "TentLarge",    2,
                                            ["Resource.RawMaterial.Skins"],
                                            [40])
    },
    Hut: {                                 // Public Name       ID Name         Pop
        HutSmall:       new buildingHouse   ("Small Hut",       "HutSmall",     4,
                                            ["Resource.RawMaterial.Logs"],
                                            [100])
    }
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
        Basic:              new machine     ("Basic Furnace",           "FurnaceBasic",     1,
                                            ["Resource.RawMaterial.Logs"],
                                            [20]),
        Large:              new machine     ("Large Furnace",           "FurnaceLarge",     2,
                                            ["Resource.Construction.StoneBricks"],
                                            [50]),
        Blast:              new machine     ("Blast Furnace",           "FurnaceBlast",     3,
                                            ["Resource.Construction.StoneBricks"],
                                            [200])
    },
    Saw: {                                 // Public Name               ID Name             Multiplier
        Basic:              new machine     ("Basic Sawmill Saw",       "SawBasic",         1,
                                            ["Item.Engineering.GearboxWood",    "Resource.Ingot.Iron"],
                                            [1,                                 10]),
        Advanced:           new machine     ("Advanced Sawmill Saw",    "SawAdvanced",      2,
                                            ["Item.Engineering.GearboxWood",    "Resource.Ingot.Steel"],
                                            [4,                                 10])
    },
    Crane: {
        Basic:              new machine     ("Basic Crane",             "CraneBasic",       1,
                                            ["Item.Engineering.GearboxWood",    "Item.Component.WoodenShaft"],
                                            [1,                                 4])
    },
    Crucible: {
        Small:              new machine     ("Small Cruicible",         "CrucibleSmall",    1,
                                            ["Resource.RawMaterial.Clay"],
                                            [20]),
        Large:              new machine     ("Large Cruicible",         "CrucibleLarge",    2,
                                            ["Resource.RawMaterial.Clay"],
                                            [50])
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

// Populate buildingPrimary.incomeRate array with number of resources
buildingPrimary.prototype.blankIncome = function () {
    for (var i = 0; i < this.incomeResource.length; i++) {
        this.incomeRate.push(0);
    }
};

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

buildingFactory.prototype.fillIncomeExpense = function () {
    this.workCalc();
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
    this.equippedMachinesOrder[this.machineType].reverse();
    if (this.machineTypeAddon !== null) {
        for (var i = 0; i < this.machineTypeAddon.length; i++) {
            this.equippedMachinesOrder[this.machineTypeAddon[i]] = Object.keys(Machine[this.machineTypeAddon[i]]);
            this.equippedMachinesOrder[this.machineTypeAddon[i]].reverse();
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
            BuildingPrimary[key][subkey].blankIncome();
        }
    }
    // Populate equippedMachine for each factory type
    for (var key in BuildingFactory){
        for (var subkey in BuildingFactory[key]){
            BuildingFactory[key][subkey].listMachines();
            BuildingFactory[key][subkey].sortMachines();
            BuildingFactory[key][subkey].fillIncomeExpense();
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
    BuildingHouse.Tent.TentSmall.changeAmount(3);
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
    pageBuildFrame();
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
    pageButtonEvents();
    countdown("dayTimer", dailyFunctions, 10);
    newGame();
}

function pageBuildFrame() {
    $("#game").append(
        "<div id='game-header'></div>" +
        "<div id='game-header-filler'></div>" +
        "<div id='game-content'></div>"
    );
}

function pageBuildHeader(){
    $("#game-header").append(
        "<div id='city-name' style='display: inline'></div>" +
        "<button onclick='cityName.changeName()'>Change</button>" +
        "<div id='dayTimer' style='display: inline'></div> " +
        "<div id='dayCounter' style='display: inline'></div> " +
        "<div id='Population' style='display: inline'></div>"
    );
}

function pageBuildTabs(){
    $("#game-content").append(
        "<div id='game-tabs'>" +
            "<div id='game-tab-selector' class='scroller'>" +
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
            "<div id='game-tab-content' class='scroller'>" +
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
        "</div>" +
        "<div id='popup' class='shadow hide'></div>"
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

function pageButtonEvents() {
    $(document.body).on("click", ".toggleContainer", function () {
        newSlideToggle(this);
    });

    $(document.body).on("click", ".popupButton", function () {
        popupObjClass = $(this).data("objClass");
        popupObjReference = $(this).data("objReference");
        popupObjPath = objRef(window, popupObjClass + "." + popupObjReference);

        if ($("#popup").hasClass("hide")) {
            $("#popup").position({
                my: "left top",
                at: "left bottom",
                of: this,
                collision: "flipfit"
            });
            $("#popup").html(
                "<div id='popup" + popupObjPath.idName + "'></div>"
            );
            popupObjPath.renderPopup();
            popup.show();
        }
    });

    $(document).mouseup(function (e) {
        if (!$("#popup").hasClass("hide")) {
            if (!$("#popup").is(e.target) && $("#popup").has(e.target).length === 0) {
                popup.hide();
            }
        }
    });

    $(document).on("click", ".craft", function () {
        tooltipPath().applyCraft();
    });

    $(document).tooltip({
        items: ".tooltip",
        content: function () {
            thisID = $(this).attr("id");
            return $(this).data("tooltipContent");
        }
    });

    $(document).on("click", ".workerAdd", function () {
        popupObjPath.changeWorker(1);
    });

    $(document).on("click", ".workerSub", function () {
        popupObjPath.changeWorker(-1);
    });

    $(document).on("click", ".equipTool", function () {
        popupObjPath.changeWorkerEquippedTool(1, $(this).data("toolType"), $(this).data("toolTier"));
    });

    $(document).on("click", ".unequipTool", function () {
        popupObjPath.changeWorkerEquippedTool(-1, $(this).data("toolType"), $(this).data("toolTier"));
    });

    $(document).on("click", ".equipMachine", function () {
        popupObjPath.changeEquippedMachine(1, $(this).data("machineType"), $(this).data("machineTier"))
    })

    $(document).on("click", ".unequipMachine", function () {
        popupObjPath.changeEquippedMachine(-1, $(this).data("machineType"), $(this).data("machineTier"))
    })
}

function gameGenerateResource() {
    $("#game-tab-resource").append(
        "<ul id='game-tab-resource-list' class='game-resource-layer-1'>" +
            "<li>" +
                "<div class='toggleContainer'><div>▼</div><div>Raw Materials</div></div>" +
                "<div><table id='resource-RawMaterial' class='game-resource-layer-2'></table></div>" +
            "</li>" +
            "<li>" +
                "<div class='toggleContainer'><div>▼</div><div>Construction Materials</div></div>" +
                "<div><table id='resource-Construction' class='game-resource-layer-2'></table></div>" +
            "</li>" +
            "<li>" +
                "<div class='toggleContainer'><div>▼</div><div>Fuel</div></div>" +
                "<div><table id='resource-Fuel' class='game-resource-layer-2'></table></div>" +
            "</li>" +
            "<li>" +
                "<div class='toggleContainer'><div>▼</div><div>Ore</div></div>" +
                "<div><table id='resource-Ore' class='game-resource-layer-2'></table></div>" +
            "</li>" +
            "<li>" +
                "<div class='toggleContainer'><div>▼</div><div>Metal Ingots</div></div>" +
                "<div><table id='resource-Ingot' class='game-resource-layer-2'></table></div>" +
            "</li>" +
            "<li>" +
                "<div class='toggleContainer'><div>▼</div><div>Raw Food</div></div>" +
                "<div><table id='resource-FoodRaw' class='game-resource-layer-2'></table></div>" +
            "</li>" +
            "<li>" +
                "<div class='toggleContainer'><div>▼</div><div>Ingredients</div></div>" +
                "<div><table id='resource-FoodIngredient' class='game-resource-layer-2'></table></div>" +
            "</li>" +
            "<li>" +
                "<div class='toggleContainer'><div>▼</div><div>Cooked Food</div></div>" +
                "<div><table id='resource-FoodCooked' class='game-resource-layer-2'></table></div>" +
            "</li>" +
        "</ul>"
    );

    for (var key in Resource) {
        $("#resource-" + key).append (
            "<thead>" +
                "<tr>" +
                    "<th class='left'>" +
                        "Name" +
                    "</td>" +
                    "<th class='right left-padding'>" +
                        "Amount" +
                    "</th>" +
                    "<th class='right left-padding'>" +
                        "Profit" +
                    "</th>" +
                "</tr>" +
            "<thead>"
        );
        for (var subkey in Resource[key]) {
            $("#resource-" + key).append(
                "<tr>" +
                    "<td>" +
                        Resource[key][subkey].publicName +
                    "</td>" +
                    "<td class='right left-padding'>" +
                        "<span class='" + Resource[key][subkey].idName + "Amount'></span>/<span class='" + Resource[key][subkey].idName + "AmountCap'></span>" +
                    "</td>" +
                    "<td id='" + Resource[key][subkey].idName + "Profit' class='right left-padding tooltip'>" +
                        "<span class='" + Resource[key][subkey].idName + "Profit'></span>" +
                    "</td>" +
                "</tr>"
            );

            $("#" + Resource[key][subkey].idName + "Profit").data({
                class: "Resource",
                subClass: key,
                object: subkey,
                tooltipContent: function () {
                    var content = "<table class='vseperator'>" +
                        "<tr>" +
                            "<th>" +
                                "Income" +
                            "</th>" +
                            "<th>" +
                                "Expense" +
                            "</th>" +
                        "</tr>" +
                        "<tr>" +
                            "<td class='right'>";

                    if (tooltipPath().income > 0) {
                        content += "<span class='" + tooltipPath().idName + "Income'>+" + tooltipPath().income + "</span>";
                    } else {
                        content += "<span class='" + tooltipPath().idName + "Income'>" + tooltipPath().income + "</span>";
                    }

                    content +=  "</td>" +
                                "<td class='right'>";
                    if (tooltipPath().expense > 0) {
                        content += "<span class='" + tooltipPath().idName + "Expense'>-" + tooltipPath().expense + "</span>";
                    } else {
                        content += "<span class='" + tooltipPath().idName + "Expense'>" + tooltipPath().expense + "</span>";
                    }

                    content += "</td>" +
                        "</tr>" +
                    "</table>"

                    return content;
                }
            })

            Resource[key][subkey].renderAmount();
            Resource[key][subkey].renderAmountCap();
            Resource[key][subkey].renderProfit();
            Resource[key][subkey].renderIncome();
            Resource[key][subkey].renderExpense();
        }
    }

    $("#game-tab-resource-list").sortable({
        placeholder: "ui-state-highlight",
        start: function (e, ui) {
            ui.placeholder.height(ui.item.height());
            ui.placeholder.width(ui.item.width());
        }
    });
    for (var key in Resource) {
        $("#resource-" + key + " tbody").sortable({
            helper: sortHelper,
            placeholder: "ui-state-highlight"
        });
    }
}

function gameGeneratePrimary() {
    $("#game-tab-primary").append(
        "<ul id='game-tab-primary-list' class='game-primary-layer-1'>" +
            "<li>" +
                "<div class='toggleContainer'><div>▼</div><div>Primary Resources</div></div>" +
                "<div><ul id='primary-Primary' class='game-primary-layer-2'></ul></div>" +
            "</li>" +
            "<li>" +
                "<div class='toggleContainer'><div>▼</div><div>Mines</div></div>" +
                "<div><ul id='primary-Mine' class='game-primary-layer-2'></ul></div>" +
            "</li>" +
            "<li>" +
                "<div class='toggleContainer'><div>▼</div><div>Farms</div></div>" +
                "<div><ul id='primary-Farm' class='game-primary-layer-2'></ul></div>" +
            "</li>" +
        "</ul>"
    );

    for (var key in BuildingPrimary) {
        for (var subkey in BuildingPrimary[key]) {
            $("#primary-" + key).append(
                "<li id='popupButton" + BuildingPrimary[key][subkey].idName + "' class='popupButton'>" + BuildingPrimary[key][subkey].publicName + "</li>"
            );
            $("#popupButton" + BuildingPrimary[key][subkey].idName).data({
                objClass: "BuildingPrimary",
                objReference: key + "." + subkey
            })
        }
    }

    $("#game-tab-primary-list").sortable({
        placeholder: "ui-state-highlight",
        start: function (e, ui) {
            ui.placeholder.height(ui.item.height());
            ui.placeholder.width(ui.item.width());
        }
    });
    for (var key in BuildingPrimary) {
        $("#primary-" + key).sortable({
            placeholder: "ui-state-highlight"
        });
    }
}

function gameGenerateFactory() {
    $("#game-tab-factory").append(
        "<ul id='game-tab-factory-list' class='game-factory-layer-1'>" +
            "<li>" +
                "<div class='toggleContainer'><div>▼</div><div>Construction</div></div>" +
                "<div><ul id='factory-Construction' class='game-factory-layer-2'></ul></div>" +
            "</li>" +
            "<li>" +
                "<div class='toggleContainer'><div>▼</div><div>Smelters</div></div>" +
                "<div><ul id='factory-Smelter' class='game-factory-layer-2'></ul></div>" +
            "</li>" +
        "</ul>"
    );

    for (var key in BuildingFactory) {
        for (var subkey in BuildingFactory[key]) {
            $("#factory-" + key).append(
                "<li id='popupButton" + BuildingFactory[key][subkey].idName + "' class='popupButton'>" + BuildingFactory[key][subkey].publicName + "</li>"
            );
            $("#popupButton" + BuildingFactory[key][subkey].idName).data({
                objClass: "BuildingFactory",
                objReference: key + "." + subkey
            })
        }
    }

    $("#game-tab-factory-list").sortable({
        placeholder: "ui-state-highlight",
        start: function (e, ui) {
            ui.placeholder.height(ui.item.height());
            ui.placeholder.width(ui.item.width());
        }
    });
    for (var key in BuildingFactory) {
        $("#factory-" + key).sortable({
            placeholder: "ui-state-highlight"
        });
    }
}

function gameGenerateHouse() {
    $("#game-tab-house").append(
        "<ul id='game-tab-house-list' class='game-house-layer-1'>" +
            "<li>" +
                "<div class='toggleContainer'><div>▼</div><div>Tents</div></div>" +
                "<div><ul id='house-Tent' class='game-house-layer-2'></ul></div>" +
            "</li>" +
            "<li>" +
                "<div class='toggleContainer'><div>▼</div><div>Huts</div></div>" +
                "<div><ul id='house-Hut' class='game-house-layer-2'></ul></div>" +
            "</li>" +
        "</ul>"
    );

    for (var key in BuildingHouse) {
        for (var subkey in BuildingHouse[key]) {
            $("#house-" + key).append(
                "<li id='house-list-" + BuildingHouse[key][subkey].idName + "'></li>"
            );
            $("#house-list-" + BuildingHouse[key][subkey].idName).html(
                "<table class='fill'>" +
                    "<tr>" +
                        "<td>" +
                            BuildingHouse[key][subkey].publicName +
                        "</td>" +
                        "<td class='right'>" +
                            "<span class='" + BuildingHouse[key][subkey].idName + "Amount" + "'></span>" +
                        "</td>" +
                        "<td class='right'>" +
                            "<button id='craft" + BuildingHouse[key][subkey].idName + "' class='craft tooltip'>Build</button>" +
                        "</td>" +
                    "</tr>" +
                    "<tr>" +
                        "<td>" +
                            "Population" +
                        "</td>" +
                        "<td>" +
                        "</td>" +
                        "<td class='right'>" +
                            "<span class='" + BuildingHouse[key][subkey].idName + "Population'></span>" +
                        "</td>" +
                    "</tr>" +
                    "<tr>" +
                        "<td>" +
                            "Population Each" +
                        "</td>" +
                        "<td>" +
                        "</td>" +
                        "<td class='right'>" +
                            BuildingHouse[key][subkey].basePop +
                        "</td>" +
                    "</tr>" +
                "</table>"
            );

            $("#craft" + BuildingHouse[key][subkey].idName).data({
                class: "BuildingHouse",
                subClass: key,
                object: subkey,
                tooltipContent: function () {
                    var content = "<table class='vseperator'>" +
                        "<tr>" +
                            "<th class='left'>" +
                                "Required Material" +
                            "</th>" +
                            "<th class='right'>" +
                                "Need" +
                            "</th>" +
                            "<th class='right'>" +
                                "Have" +
                            "</th>" +
                        "</tr>";

                    for (var i = 0; i < tooltipPath().craftType.length; i++) {
                        content +=
                            "<tr>" +
                                "<td>" +
                                    objRef(window, tooltipPath().craftType[i]).publicName +
                                "</td>" +
                                "<td class='right'>" +
                                    tooltipPath().craftAmount[i] +
                                "</td>" +
                                "<td class='right'>" +
                                    "<span class='" + objRef(window, tooltipPath().craftType[i]).idName + "Amount'>" + objRef(window, tooltipPath().craftType[i]).amount + "</span>" +
                                "</td>" +
                            "</tr>";
                    }

                    content += "</table>";
                    return content;
                }
            })

            BuildingHouse[key][subkey].renderAmount();
            BuildingHouse[key][subkey].renderPopulation();
        }
    }



    $("#game-tab-house-list").sortable({
        placeholder: "ui-state-highlight",
        start: function (e, ui) {
            ui.placeholder.height(ui.item.height());
            ui.placeholder.width(ui.item.width());
        }
    });
    for (var key in BuildingHouse) {
        $("#house-" + key).sortable({
            placeholder: "ui-state-highlight"
        });
    }
}

function gameGenerateTool() {
    $("#game-tab-tool").append(
        "<ul id='game-tab-tool-list' class='game-tool-layer-1'>" +
            "<li>" +
                "<div class='toggleContainer'><div>►</div><div>Axes</div></div>" +
                "<div class='hide'><ul id='tool-Axe' class='game-tool-layer-2'></ul></div>" +
            "</li>" +
            "<li>" +
                "<div class='toggleContainer'><div>►</div><div>Pickaxes</div></div>" +
                "<div class='hide'><ul id='tool-Pickaxe' class='game-tool-layer-2'></ul></div>" +
            "</li>" +
            "<li>" +
                "<div class='toggleContainer'><div>►</div><div>Hoes</div></div>" +
                "<div class='hide'><ul id='tool-Hoe' class='game-tool-layer-2'></ul></div>" +
            "</li>" +
            "<li>" +
                "<div class='toggleContainer'><div>►</div><div>Shovels</div></div>" +
                "<div class='hide'><ul id='tool-Shovel' class='game-tool-layer-2'></ul></div>" +
            "</li>" +
            "<li>" +
                "<div class='toggleContainer'><div>►</div><div>Sickles</div></div>" +
                "<div class='hide'><ul id='tool-Sickle' class='game-tool-layer-2'></ul></div>" +
            "</li>" +
            "<li>" +
                "<div class='toggleContainer'><div>►</div><div>Scythes</div></div>" +
                "<div class='hide'><ul id='tool-Scythe' class='game-tool-layer-2'></ul></div>" +
            "</li>" +
            "<li>" +
                "<div class='toggleContainer'><div>►</div><div>Hammers</div></div>" +
                "<div class='hide'><ul id='tool-Hammer' class='game-tool-layer-2'></ul></div>" +
            "</li>" +
            "<li>" +
                "<div class='toggleContainer'><div>►</div><div>Hunting Equipment</div></div>" +
                "<div class='hide'><ul id='tool-Hunting' class='game-tool-layer-2'></ul></div>" +
            "</li>" +
            "<li>" +
                "<div class='toggleContainer'><div>►</div><div>Knives</div></div>" +
                "<div class='hide'><ul id='tool-Knife' class='game-tool-layer-2'></ul></div>" +
            "</li>" +
            "<li>" +
                "<div class='toggleContainer'><div>►</div><div>Fishing Equipment</div></div>" +
                "<div class='hide'><ul id='tool-Fishing' class='game-tool-layer-2'></ul></div>" +
            "</li>" +
        "</ul>"
    );

    for (var key in Tool) {
        for (var subkey in Tool[key]) {
            $("#tool-" + key).append(
                "<li id='tool-list-" + Tool[key][subkey].idName + "'></li>"
            );
            $("#tool-list-" + Tool[key][subkey].idName).html(
                "<table class='fill'>" +
                    "<tr>" +
                        "<td>" +
                            Tool[key][subkey].publicName +
                        "</td>" +
                        "<td class='right'>" +
                            "<span class='" + Tool[key][subkey].idName + "Equipped" + "'></span>/<span class='" + Tool[key][subkey].idName + "Amount" + "'></span>" +
                        "</td>" +
                        "<td class='right'>" +
                            "<button id='craft" + Tool[key][subkey].idName + "' class='craft tooltip'>Craft</button>" +
                        "</td>" +
                    "</tr>" +
                "</table>"
            );

            $("#craft" + Tool[key][subkey].idName).data({
                class: "Tool",
                subClass: key,
                object: subkey,
                tooltipContent: function () {
                    var content = "<table class='vseperator'>" +
                        "<tr>" +
                            "<th class='left'>" +
                                "Required Material" +
                            "</th>" +
                            "<th class='right'>" +
                                "Need" +
                            "</th>" +
                            "<th class='right'>" +
                                "Have" +
                            "</th>" +
                        "</tr>";

                    for (var i = 0; i < tooltipPath().craftType.length; i++) {
                        content +=
                            "<tr>" +
                                "<td>" +
                                    objRef(window, tooltipPath().craftType[i]).publicName +
                                "</td>" +
                                "<td class='right'>" +
                                    tooltipPath().craftAmount[i] +
                                "</td>" +
                                "<td class='right'>" +
                                    "<span class='" + objRef(window, tooltipPath().craftType[i]).idName + "Amount'>" + objRef(window, tooltipPath().craftType[i]).amount + "</span>" +
                                "</td>" +
                            "</tr>";
                    }

                    content += "</table>";
                    return content;
                }
            })

            Tool[key][subkey].renderAmount();
            Tool[key][subkey].renderEquipped();
        }
    }



    $("#game-tab-tool-list").sortable({
        placeholder: "ui-state-highlight",
        start: function (e, ui) {
            ui.placeholder.height(ui.item.height());
            ui.placeholder.width(ui.item.width());
        }
    });
    for (var key in Tool) {
        $("#tool-" + key).sortable({
            placeholder: "ui-state-highlight"
        });
    }
}

function gameGenerateMachine() {
    $("#game-tab-machine").append(
        "<ul id='game-tab-machine-list' class='game-machine-layer-1'>" +
            "<li>" +
                "<div class='toggleContainer'><div>►</div><div>Charcoal</div></div>" +
                "<div class='hide'><ul id='machine-Charcoal' class='game-machine-layer-2'></ul></div>" +
            "</li>" +
            "<li>" +
                "<div class='toggleContainer'><div>►</div><div>Chisels</div></div>" +
                "<div class='hide'><ul id='machine-Chisel' class='game-machine-layer-2'></ul></div>" +
            "</li>" +
            "<li>" +
                "<div class='toggleContainer'><div>►</div><div>Furnaces</div></div>" +
                "<div class='hide'><ul id='machine-Furnace' class='game-machine-layer-2'></ul></div>" +
            "</li>" +
            "<li>" +
                "<div class='toggleContainer'><div>►</div><div>Saws</div></div>" +
                "<div class='hide'><ul id='machine-Saw' class='game-machine-layer-2'></ul></div>" +
            "</li>" +
            "<li>" +
                "<div class='toggleContainer'><div>►</div><div>Cranes</div></div>" +
                "<div class='hide'><ul id='machine-Crane' class='game-machine-layer-2'></ul></div>" +
            "</li>" +
            "<li>" +
                "<div class='toggleContainer'><div>►</div><div>Crucibles</div></div>" +
                "<div class='hide'><ul id='machine-Crucible' class='game-machine-layer-2'></ul></div>" +
            "</li>" +
        "</ul>"
    );

    for (var key in Machine) {
        for (var subkey in Machine[key]) {
            $("#machine-" + key).append(
                "<li id='machine-list-" + Machine[key][subkey].idName + "'></li>"
            );
            $("#machine-list-" + Machine[key][subkey].idName).html(
                "<table class='fill'>" +
                    "<tr>" +
                        "<td>" +
                            Machine[key][subkey].publicName +
                        "</td>" +
                        "<td class='right'>" +
                            "<span class='" + Machine[key][subkey].idName + "Equipped" + "'></span>/<span class='" + Machine[key][subkey].idName + "Amount" + "'></span>" +
                        "</td>" +
                        "<td class='right'>" +
                            "<button id='craft" + Machine[key][subkey].idName + "' class='craft tooltip'>Craft</button>" +
                        "</td>" +
                    "</tr>" +
                "</table>"
            );

            $("#craft" + Machine[key][subkey].idName).data({
                class: "Machine",
                subClass: key,
                object: subkey,
                tooltipContent: function () {
                    var content = "<table class='vseperator'>" +
                        "<tr>" +
                            "<th class='left'>" +
                                "Required Material" +
                            "</th>" +
                            "<th class='right'>" +
                                "Need" +
                            "</th>" +
                            "<th class='right'>" +
                                "Have" +
                            "</th>" +
                        "</tr>";

                    for (var i = 0; i < tooltipPath().craftType.length; i++) {
                        content +=
                            "<tr>" +
                                "<td>" +
                                    objRef(window, tooltipPath().craftType[i]).publicName +
                                "</td>" +
                                "<td class='right'>" +
                                    tooltipPath().craftAmount[i] +
                                "</td>" +
                                "<td class='right'>" +
                                    "<span class='" + objRef(window, tooltipPath().craftType[i]).idName + "Amount'>" + objRef(window, tooltipPath().craftType[i]).amount + "</span>" +
                                "</td>" +
                            "</tr>";
                    }

                    content += "</table>";
                    return content;
                }
            })

            Machine[key][subkey].renderAmount();
            Machine[key][subkey].renderEquipped();
        }
    }



    $("#game-tab-machine-list").sortable({
        placeholder: "ui-state-highlight",
        start: function (e, ui) {
            ui.placeholder.height(ui.item.height());
            ui.placeholder.width(ui.item.width());
        }
    });
    for (var key in Machine) {
        $("#machine-" + key).sortable({
            placeholder: "ui-state-highlight"
        });
    }
}

function gameGenerateItem() {
    $("#game-tab-item").append(
        "<ul id='game-tab-item-list' class='game-item-layer-1'>" +
            "<li>" +
                "<div class='toggleContainer'><div>►</div><div>Components</div></div>" +
                "<div class='hide'><ul id='item-Component' class='game-item-layer-2'></ul></div>" +
            "</li>" +
            "<li>" +
                "<div class='toggleContainer'><div>►</div><div>Engineering</div></div>" +
                "<div class='hide'><ul id='item-Engineering' class='game-item-layer-2'></ul></div>" +
            "</li>" +
        "</ul>"
    );

    for (var key in Item) {
        for (var subkey in Item[key]) {
            $("#item-" + key).append(
                "<li id='item-list-" + Item[key][subkey].idName + "'></li>"
            );
            $("#item-list-" + Item[key][subkey].idName).html(
                "<table class='fill'>" +
                    "<tr>" +
                        "<td>" +
                            Item[key][subkey].publicName +
                        "</td>" +
                        "<td class='right'>" +
                            "<span class='" + Item[key][subkey].idName + "Amount" + "'></span>" +
                        "</td>" +
                        "<td class='right'>" +
                            "<button id='craft" + Item[key][subkey].idName + "' class='craft tooltip'>Craft</button>" +
                        "</td>" +
                    "</tr>" +
                "</table>"
            );

            $("#craft" + Item[key][subkey].idName).data({
                class: "Item",
                subClass: key,
                object: subkey,
                tooltipContent: function () {
                    var content = "<table class='vseperator'>" +
                        "<tr>" +
                            "<td colspan='2'>" +
                                "Produces" +
                            "</td>" +
                            "<td class='right'>" +
                                tooltipPath().producedAmount +
                            "</td>" +
                        "</tr>" +
                        "<tr>" +
                            "<th class='left'>" +
                                "Required Material" +
                            "</th>" +
                            "<th class='right'>" +
                                "Need" +
                            "</th>" +
                            "<th class='right'>" +
                                "Have" +
                            "</th>" +
                        "</tr>";

                    for (var i = 0; i < tooltipPath().craftType.length; i++) {
                        content +=
                            "<tr>" +
                                "<td>" +
                                    objRef(window, tooltipPath().craftType[i]).publicName +
                                "</td>" +
                                "<td class='right'>" +
                                    tooltipPath().craftAmount[i] +
                                "</td>" +
                                "<td class='right'>" +
                                    "<span class='" + objRef(window, tooltipPath().craftType[i]).idName + "Amount'>" + objRef(window, tooltipPath().craftType[i]).amount + "</span>" +
                                "</td>" +
                            "</tr>";
                    }

                    content += "</table>";
                    return content;
                }
            })

            Item[key][subkey].renderAmount();
        }
    }



    $("#game-tab-item-list").sortable({
        placeholder: "ui-state-highlight",
        start: function (e, ui) {
            ui.placeholder.height(ui.item.height());
            ui.placeholder.width(ui.item.width());
        }
    });
    for (var key in Machine) {
        $("#item-" + key).sortable({
            placeholder: "ui-state-highlight"
        });
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
    var v = parseInt($("#" + id).val());
    v = isNaN(v) ? 0 : v;
    v += num;
    $("#" + id).val(v);
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
                    "<button onclick='Resource." + key + "." + subkey + ".changeAmount(parseInt($(\"#debugInput" + Resource[key][subkey].idName + "\").val()))'>Apply</button>" +
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
                    "<button onclick='Tool." + key + "." + subkey + ".changeAmount(parseInt($(\"#debugInput" + Tool[key][subkey].idName + "\").val()))'>Apply</button>" +
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
                    "<button onclick='BuildingPrimary." + key + "." + subkey + ".changeAmount(parseInt($(\"#debugInput" + BuildingPrimary[key][subkey].idName + "\").val()))'>Apply</button>" +
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
                    "<button onclick='BuildingFactory." + key + "." + subkey + ".changeAmount(parseInt($(\"#debugInput" + BuildingFactory[key][subkey].idName + "\").val()))'>Apply</button>" +
                "</div>"
            );
        }
    }
}

function debugGenerateBuildingHouse(){
    for (var key in BuildingHouse){
        for (var subkey in BuildingHouse[key]) {
            $("#debug-tab-houses").append(
                "<div id='debugString" + BuildingHouse[key][subkey].idName + "'>" +
                    BuildingHouse[key][subkey].publicName + ": " +
                    "<button onclick='debugChangeInputValue(-10, \"debugInput" + BuildingHouse[key][subkey].idName + "\")'>--</button>" +
                    "<button onclick='debugChangeInputValue(-1, \"debugInput" + BuildingHouse[key][subkey].idName + "\")'>-</button>" +
                    "<input type='text' class='debugInput' id='debugInput" + BuildingHouse[key][subkey].idName + "' value='0' />" +
                    "<button onclick='debugChangeInputValue(1, \"debugInput" + BuildingHouse[key][subkey].idName + "\")'>+</button>" +
                    "<button onclick='debugChangeInputValue(10, \"debugInput" + BuildingHouse[key][subkey].idName + "\")'>++</button>" +
                    "<button onclick='BuildingHouse." + key + "." + subkey + ".changeAmount(parseInt($(\"#debugInput" + BuildingHouse[key][subkey].idName + "\").val()))'>Apply</button>" +
                "</div>"
            );
        }
    }
}