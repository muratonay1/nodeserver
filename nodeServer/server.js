//websoket küt.
var WebSocketServer = require('ws').Server;
//websoket oluşturuluyor.
var wss = new WebSocketServer({ port: 4000 });
//sokete bağlı tüm kullanıcılar
var users = {};
//kullanıcı sokete bağlandığı zaman
wss.on('connection', function(connection) {
    console.log("\n--RESTARTED SERVER, THIS IS NEW COMMUNICATION LOG");
    console.log("Bilinmeyen bir kullanici baglandi");
    //servere bağlı kullanıcı işlemleri için case yapı  
    connection.on('message', function(message) {
        var data;
        try {
            data = JSON.parse(message);
            //console.log(data); 
        } catch (e) {
            console.log("Invalid JSON");
            data = {};
        }
        switch (data.type) {
            //login
            case "login":
                //burada sadece servere bağlanma bilgisi veriyoruz.
                if (users[data.name]) {
                    sendTo(connection, {
                        type: "login",
                        success: false
                    });
                } else {
                    //kullanıcıyı server da kaydediyoruz.
                    console.log("Kullanici kaydi: ", data.name);
                    users[data.name] = connection;
                    connection.name = data.name;

                    sendTo(connection, {
                        type: "login",
                        success: true
                    });
                }
                break;
            case "leave":
                try {
                    console.log("Disconnecting from", data.name);
                    var conn = users[data.name];
                    conn.otherName = null;
                    //Diğer kullanıcılara, çıkış ile bildirim verme
                    if (conn != null) {
                        sendTo(conn, {
                            type: "leave"
                        });
                    }
                    break;
                } catch (error) {
                    console.log("case: 'leave' de patladi.");
                }
            case "GoToBack":
                try {
                    delete users[connection.name];
                } catch (error) {
                    console.log("geri dönüs gerçeklesmedi");
                }
            default:
                sendTo(connection, {
                    type: "error",
                    message: "Command not found: " + data.type
                });
                break;
        }
    });
    //Kullanıcı çıkışı gerçekleştiğinde
    connection.on("close", function() {
        try {
            if (connection.name) {
                delete users[connection.name];
                if (connection.otherName) {
                    console.log("Disconnecting from ", connection.otherName);
                    var conn = users[connection.otherName];
                    conn.otherName = null;
                    if (conn != null) {
                        sendTo(conn, {
                            type: "leave"
                        });
                    }
                }
            }
        } catch (error) {
            console.log(error, " HATASI 'close yani type:leave de gerçeklesti'");
        }
    });
});

function sendTo(connection, message) {
    console.log("sendTo fonksiyonu ile  connection'a message degiskeni gönderildi.");
    connection.send(JSON.stringify(message));
}