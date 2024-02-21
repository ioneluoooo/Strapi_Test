"use strict";

const { default: axios } = require("axios");
const { Server } = require("socket.io");

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap(/*{ strapi }*/) {
    const io = new Server(strapi.server.httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
    io.on("connection", function (socket) {
      console.log("a user connected");
      socket.on("join", () => {
        console.log("an username joined");
      });

      socket.on("setLocation", async (location) => {
        let strapiData = {
          data: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        };

        await axios
          .post("http://localhost:1337/api/locations", strapiData)
          .catch((e) => console.log("error", e.message));

        const sendLocationContinously = () => {
          const locationUpdate = setInterval(async () => {
            io.emit("getLocation", {
              latitude: location.latitude,
              longitude: location.longitude,
            });
          }, 5000);

          socket.on("stopSendingLocation", () => {
            clearInterval(locationUpdate);
          });

          return () => clearInterval(locationUpdate);
        };
        sendLocationContinously();
      });
    });
  },
};
