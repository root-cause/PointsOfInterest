var pointsMenu = null;
var pointsListMenu = null;
var pointBlips = [];

function removeBlips() {
    for (var i = 0; i < pointBlips.length; i++) API.deleteEntity(pointBlips[i]);
    pointBlips = [];
}

function saveLocation(isWaypoint = false) {
    var pos = new Vector3();

    if (isWaypoint) {
        pos = API.getWaypointPosition();
    } else {
        pos = API.getEntityPosition(API.getLocalPlayer());
    }

    var name = API.getUserInput("", 30);
    name = name.trim();

    if (name.length > 0)
    {
        API.triggerServerEvent("SavePoint", name, (API.getStreetName(pos) + ", " + API.getZoneNameLabel(pos)), pos);
        pointsMenu.Visible = false;
    }
}

API.onResourceStart.connect(function() {
    // create menus
    pointsMenu = API.createMenu("Points of Interest", "", 0, 0, 6);
    pointsListMenu = API.addSubMenu(pointsMenu, "Saved Points", "", 0, 0, 6);

    // fill the main menu with options
    var temp_item = API.createMenuItem("Save Player Location", "");
    pointsMenu.AddItem(temp_item);

    temp_item = API.createMenuItem("Save Waypoint Location", "");
    pointsMenu.AddItem(temp_item);

    // menu events
    pointsMenu.OnItemSelect.connect(function(menu, item, index) {
        switch (index)
        {
            case 0:
                API.sendChatMessage("Selecting an item will set your waypoint.");
                API.sendChatMessage("Press ~y~DEL/Delete ~w~to remove an item.");
            break;

            case 1:
                saveLocation();
            break;

            case 2:
                if (!API.isWaypointSet())
                {
                    API.callNative("_SET_NOTIFICATION_BACKGROUND_COLOR", 8);
                    API.sendNotification("Set a waypoint first!");
                    return;
                }

                saveLocation(true);
            break;
        }
    });

    pointsListMenu.OnItemSelect.connect(function(menu, item, index) {
        var pos = API.getBlipPosition(pointBlips[index]);
        API.setWaypoint(pos.X, pos.Y);
    });
});

API.onKeyUp.connect(function(e, key) {
    if (key.KeyCode == Keys.P)
    {
        if (API.isChatOpen() || API.isAnyMenuOpen()) return;
        pointsMenu.Visible = !pointsMenu.Visible;
    }

    if (key.KeyCode == Keys.Delete)
    {
        if (API.isChatOpen() || !pointsListMenu.Visible) return;
        API.callNative("_SET_NOTIFICATION_BACKGROUND_COLOR", 20);
        API.sendNotification("Removed \"" + pointsListMenu.MenuItems[ pointsListMenu.CurrentSelection ].Text + "\".");
        API.triggerServerEvent("DeletePoint", pointsListMenu.CurrentSelection);
    }
});

API.onServerEventTrigger.connect(function(eventName, args) {
    if (eventName == "ReceivePoints")
    {
        // definitely not the best way to update things but it works, so...
        pointsListMenu.Clear();
        removeBlips();

        var data = JSON.parse(args[0]);
        for (var i = 0; i < data.length; i++)
        {
            var temp_item = API.createMenuItem(data[i].Name, "Location: ~b~" + data[i].Location);
            pointsListMenu.AddItem(temp_item);

            var temp_blip = API.createBlip(new Vector3(data[i].Position.X, data[i].Position.Y, data[i].Position.Z)); // using data[i].Position directly doesn't work, therefore this happened
            API.setBlipShortRange(temp_blip, true);
            API.setBlipName(temp_blip, "Point of Interest - " + data[i].Name);
            API.setBlipSprite(temp_blip, 162);
            pointBlips.push(temp_blip);
        }
    }
});

API.onResourceStop.connect(function() {
    removeBlips();
});