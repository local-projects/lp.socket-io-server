## SocketioGenericServer
Socket.io generic server

###Install

    $ cd SocketioGenericServer
    $ npm install
    $ npm install socket.io
	$ npm install pkg
    $ npm start`

###usage
#####initialization
```csharp
SocketOptions options = new SocketOptions();
options.AutoConnect = true;
options.ConnectWith = BestHTTP.SocketIO.Transports.TransportTypes.WebSocket;
Manager = new SocketManager(new Uri("http://127.0.0.1:8080/socket.io/"), options);
Manager.Socket.On("serverupdate", OnServerUpdate);
Manager.Socket.On("chatMessage", OnChatMessage);
Manager.Open();
```

#####handlers
```csharp
Manager.Socket.On(SocketIOEventTypes.Error, (socket, packet, args) => Debug.LogError(string.Format("Error: {0}", args[0].ToString())));
Manager.Socket.On(SocketIOEventTypes.Connect, (socket, packet, args) => SetUserName());

void OnServerUpdate(Socket socket, Packet packet, params object[] args)
        {
            Dictionary<string, object> data = args[0] as Dictionary<string, object>;

            string response = "got OnServerUpdate"
                + " type " + data["type"]
                + " who " + data["username"]
                + " room " + data["room"]
                + " rooms " + (data["rooms"] as List<object>)[0] as string
                + " users " + (data["users"] as Dictionary<string, object>).Count
                + " \n";

            Debug.Log(response);
        }

        void OnChatMessage(Socket socket, Packet packet, params object[] args)
        {
            Dictionary<string, object> data = args[0] as Dictionary<string, object>;

            string response = "got chat"
                + " who " + data["username"]
                + " data " + data["data"]
                + " \n";

            Debug.Log(response);
        }
```

#####send data
```csharp
 IEnumerator SendFrame(float waitTime)
    {
        while (DoSendFrameData) { 
            yield return new WaitForSeconds(waitTime);

            if (framedataListLocal.Count > 0)
            {
                framedataListToSend.Clear();
                foreach (KeyValuePair<string, GameObject> attachStat in framedataListLocal)
                {
                    List<string> position = new List<string>();
                    position.Add(attachStat.Value.transform.position.x.ToString());
                    position.Add(attachStat.Value.transform.position.y.ToString());
                    position.Add(attachStat.Value.transform.position.z.ToString());
                    framedataListToSend[attachStat.Key] = position;
                }

                SocketCommunicationManager.Instance.Manager.Socket.Emit("sendmessage", "frameData", framedataListToSend);
                //Debug.Log("sending");
            }
        }
    }
```

###package
Package in to an exe. OSX and Linux are available but need to be configures in package.json

`$ pkg .`

###BlacklistedEvents
Some events are blacklisted because they are used by the low level server.

- "connect"
- "connect_error"
- "connect_timeout"
- "disconnect"
- "error"
- "reconnect"
- "reconnect_attempt"
- "reconnect_failed"
- "reconnect_error"
- "reconnecting"
