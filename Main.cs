using System;
using System.IO;
using System.Collections.Generic;
using GrandTheftMultiplayer.Server.API;
using GrandTheftMultiplayer.Server.Elements;
using GrandTheftMultiplayer.Shared;
using GrandTheftMultiplayer.Shared.Math;
using Newtonsoft.Json;

namespace PointsOfInterest
{
    public class Point
    {
        public string Name { get; set; }
        public string Location { get; set; }
        public Vector3 Position { get; set; }

        public Point(string name, string location, Vector3 position)
        {
            Name = name;
            Location = location;
            Position = position;
        }
    }

    public class Main : Script
    {
        Dictionary<NetHandle, List<Point>> PlayerPoints = new Dictionary<NetHandle, List<Point>>();

        public Main()
        {
            API.onResourceStart += Points_Init;
            API.onPlayerFinishedDownload += Points_PlayerJoin;
            API.onClientEventTrigger += Points_EventTrigger;
            API.onPlayerDisconnected += Points_PlayerLeave;
            API.onResourceStop += Points_Exit;
        }

        #region Methods
        public string GetPlayerFile(Client player)
        {
            return API.getResourceFolder() + Path.DirectorySeparatorChar + "PlayerData" + Path.DirectorySeparatorChar + player.socialClubName + ".json";
        }
        #endregion

        #region Events
        public void Points_Init()
        {
            string dirPath = API.getResourceFolder() + Path.DirectorySeparatorChar + "PlayerData";
            if (!Directory.Exists(dirPath)) Directory.CreateDirectory(dirPath);
        }

        public void Points_PlayerJoin(Client player)
        {
            string playerFile = GetPlayerFile(player);
            List<Point> playerData = null;

            if (File.Exists(playerFile)) playerData = JsonConvert.DeserializeObject<List<Point>>(File.ReadAllText(playerFile));
            PlayerPoints.Add(player.handle, playerData ?? new List<Point>());

            player.triggerEvent("ReceivePoints", API.toJson(PlayerPoints[player.handle]));
        }

        public void Points_EventTrigger(Client player, string eventName, params object[] args)
        {
            switch (eventName)
            {
                case "SavePoint":
                {
                    if (args.Length < 3 || !PlayerPoints.ContainsKey(player.handle)) return;
                    string name = args[0].ToString();
                    string location = args[1].ToString();
                    Vector3 position = (Vector3)args[2];

                    PlayerPoints[player.handle].Add(new Point(name, location, position));
                    player.triggerEvent("ReceivePoints", API.toJson(PlayerPoints[player.handle]));

                    File.WriteAllText(GetPlayerFile(player), JsonConvert.SerializeObject(PlayerPoints[player.handle], Formatting.Indented));
                    break;
                }

                case "DeletePoint":
                {
                    if (args.Length < 1 || !PlayerPoints.ContainsKey(player.handle)) return;
                    int idx = Convert.ToInt32(args[0]);
                    if (idx < 0 || idx >= PlayerPoints[player.handle].Count) return;

                    PlayerPoints[player.handle].RemoveAt(idx);
                    player.triggerEvent("ReceivePoints", API.toJson(PlayerPoints[player.handle]));

                    File.WriteAllText(GetPlayerFile(player), JsonConvert.SerializeObject(PlayerPoints[player.handle], Formatting.Indented));
                    break;
                }
            }
        }

        public void Points_PlayerLeave(Client player, string reason)
        {
            if (PlayerPoints.ContainsKey(player.handle)) PlayerPoints.Remove(player.handle);
        }

        public void Points_Exit()
        {
            PlayerPoints.Clear();
        }
        #endregion
    }
}
