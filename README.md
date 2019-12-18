# Generic Socket.io Server
Socket.io server for sending and receiving generic "commmands" with data arguments. Also contains basic functionality for interfacing via TCP.

## Install and run

    $ cd lp.socket-io-server
    $ npm install
    $ npm start

On Windows, you can choose to install the server as a service (via the [winser](http://jfromaniello.github.io/winser/) package using [nssm](https://nssm.cc/)) with:

    $ npm install
    $ npm run install-windows-service

and then run, configure and manage the service just as you would any other service. To uninstall the service:

    $ npm run uninstall-windows-service

To test crashing behavior with the service running, see "Crash test" below.

## Usage
### Port configuration
The Socket.io port defaults to `3000` and the TCP Socket port defaults to `4000`. You can customize these with the `$SOCKET_IO_PORT` and `$TCP_SOCKET_PORT` environment variables, respectively.

## Logs
You can view server logs by navigating to `/logs` from a client. The log files themselves are stored in the `/logs` folder on the server.

## Crash test
You can purposefully crash the server by navigating to `/iamsurethatiwanttocrashtheserver` from a client.

### Client Initialization
Example in Unity/C\#:

```Unity/csharp
SocketOptions options = new SocketOptions();
options.AutoConnect = true;
options.ConnectWith = BestHTTP.SocketIO.Transports.TransportTypes.WebSocket;
Manager = new SocketManager(new Uri("http://127.0.0.1:8080/socket.io/"), options);
Manager.Socket.On("serverupdate", OnServerUpdate);
Manager.Socket.On("chatMessage", OnChatMessage);
Manager.Open();
```

### Client Handlers
Example in Unity/C\#:

```Unity/csharp
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
        
          void SetUserName()
    {
        Manager.Socket.Emit("adduser", NodeName, NodeRoom);
    }

```

### Send data from client
Example in Unity/C\#:

```Unity/csharp
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

### Packaging
Package in to an exe. OSX and Linux are available but need to be configured in package.json

`$ pkg .`

### BlacklistedEvents
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
