const express = require("express");
const passport = require("passport");
const EventsService = require("../services/events");
const UsersService = require("../services/users");
const { eventSchema, updateEventSchema } = require("../schemas/events");
const { userSubscribeSchema } = require("../schemas/users");
require("../utils/auth/strategies/jwt");

function eventsApi(app) {
  const router = express.Router();
  app.use("/api/events", router);

  const eventsService = new EventsService();
  const usersService = new UsersService();

  router.get(
    "/",
    passport.authenticate("jwt", { session: false }),
    async function (req, res, next) {
      const { tags } = req.query;
      try {
        const events = await eventsService.getEvents({ tags });
        res.status(200).json({
          data: events,
          message: "events listed",
        });
      } catch (err) {
        next(err);
      }
    }
  );

  router.get(
    "/user/:userId",
    passport.authenticate("jwt", { session: false }),
    async function (req, res, next) {
      const { userId } = req.params
      
      try {
        const events = await eventsService.getEventsByUser({ userId })
        
        res.status(200).json({
          data: events,
          message: "user events"
        })
      } catch (err) {
        next(err)
      }

    }
  );

  router.get(
    "/:eventId",
    passport.authenticate("jwt", { session: false }),
    async function (req, res, next) {
      const { eventId } = req.params;
      try {
        const event = await eventsService.getEvent({ eventId });
        res.status(200).json({
          data: event,
          message: "event retrieved",
        });
      } catch (err) {
        next(err);
      }
    }
  );

  router.post(
    "/",
    passport.authenticate("jwt", { session: false }),
    async function (req, res, next) {
      const { body: event } = req;
      let result = null;

      result = eventSchema.validate(event);

      if (result.error) {
        res.status(400).json({
          data: null,
          message: result.error.details[0].message,
        });
      } else {
        try {
          const createEventId = await eventsService.createEvent({ event });
          let message = "event created";

          res.status(201).json({
            data: createEventId,
            message,
          });
        } catch (err) {
          next(err);
        }
      }
    }
  );

  router.put(
    "/:eventId",
    passport.authenticate("jwt", { session: false }),
    async function (req, res, next) {
      const { eventId } = req.params;
      const { body: event } = req;
      let result = null;

      result = updateEventSchema.validate(event);

      if (result.error) {
        res.status(400).json({
          data: null,
          message: result.error.details[0].message,
        });
      } else {
        try {
          const updateEventId = await eventsService.updateEvent({
            eventId,
            event,
          });
          res.status(200).json({
            data: updateEventId,
            message: "event updated",
          });
        } catch (err) {
          next(err);
        }
      }
    }
  );

  router.put(
    "/subscribe/:eventId",
    passport.authenticate("jwt", { session: false }),
    async function (req, res, next) {
      const { eventId } = req.params;
      const { body: user } = req;
      let result = null;

      result = userSubscribeSchema.validate(user);

      if (result.error) {
        res.status(400).json({
          data: null,
          message: result.error.details[0].message,
        });
      } else {
        try {
          const event = await eventsService.getEvent({ eventId });
          let updateEvent;
          let arrayUsers = [];

          if (event.limit > 0) {
            let { userId } = user;
            const currentUser = await usersService.getUser({ userId });
            if (!currentUser._id) {
              res.status(400).json({
                data: {},
                message: "user not found",
              });
            }
            event.limit = event.limit - 1;
            if (event.users) {
              arrayUsers = event.users;
            }
            arrayUsers.push(currentUser);
            event.users = arrayUsers;
            updateEvent = await eventsService.updateEvent({
              eventId,
              event,
            });
          }
          res.status(200).json({
            data: updateEvent,
            message: "event updated",
          });
        } catch (err) {
          next(err);
        }
      }
    }
  );

  router.delete(
    "/:eventId",
    passport.authenticate("jwt", { session: false }),
    async function (req, res, next) {
      const { eventId } = req.params;
      try {
        const deleteEventId = await eventsService.deleteEvent({ eventId });
        res.status(200).json({
          data: deleteEventId,
          message: "events deleted",
        });
      } catch (err) {
        next(err);
      }
    }
  );
}

module.exports = eventsApi;
