const express = require("express");
const validator = require("validator");
const Task = require("../models/task.js");
const auth = require("../middleware/auth.js");

const router = new express.Router();

router.post("/tasks", auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id,
  });

  try {
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

//query supported: completed, limit, skip, sortBy
router.get("/tasks", auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.completed) match.completed = req.query.completed === "true";
  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "asc" ? 1 : -1;
  }

  try {
    await req.user.populate({
      path: "tasks",
      match,
      options: {
        limit: parseInt(parseInt(req.query.limit)),
        skip: parseInt(parseInt(req.query.skip)),
        sort,
      },
    });

    res.send(req.user.tasks);
  } catch (e) {
    res.sendStatus(500);
  }
});

router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  if (_id.length !== 24 || !validator.isHexadecimal(_id))
    return res
      .status(400)
      .send("Task ID must be 24 characters long and hexadecimal.");

  try {
    // const task = await Task.findById(_id);
    const task = await Task.findOne({
      _id,
      owner: req.user._id,
    });

    if (!task) res.sendStatus(404);
    else {
      res.send(task);
    }
  } catch (e) {
    res.sendStatus(500);
  }
});

router.patch("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  if (_id.length !== 24 || !validator.isHexadecimal(_id))
    return res
      .status(400)
      .send("Task ID must be 24 characters long and hexadecimal.");

  const updateKeys = Object.keys(req.body);
  const allowedUpdateKeys = ["desc", "completed"];

  const result = updateKeys.every((key) => allowedUpdateKeys.includes(key));

  if (!result)
    res
      .status(400)
      .send({ error: "Trying to update nonexistent property on task!" });

  try {
    // const task = await Task.findById(_id);
    const task = await Task.findOne({ _id, owner: req.user._id });

    if (!task) return res.sendStatus(404);

    updateKeys.forEach((key) => (task[key] = req.body[key]));
    await task.save();

    res.send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  if (_id.length !== 24 || !validator.isHexadecimal(_id))
    return res
      .status(400)
      .send("Task ID must be 24 characters long and hexadecimal.");

  try {
    //const task = await Task.findByIdAndDelete(_id);
    const task = await Task.findOneAndDelete({ _id, owner: req.user._id });

    if (!task) res.status(404).send("task does not exist!");
    else res.send(task);
  } catch (e) {
    res.sendStatus(500);
  }
});

module.exports = router;
