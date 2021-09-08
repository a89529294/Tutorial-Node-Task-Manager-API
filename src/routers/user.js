const express = require("express");
const validator = require("validator");
const multer = require("multer");
const sharp = require("sharp");

const User = require("../models/user.js");
const auth = require("../middleware/auth.js");
const {
  sendWelcomeEmail,
  sendCancelationEmail,
} = require("../emails/account.js");

const router = new express.Router();

router.post("/users", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    const token = await user.generateAuthToken();
    sendWelcomeEmail(user.email, user.name);
    return res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    if (!user) return res.sendStatus(404);

    const token = await user.generateAuthToken();
    return res.send({ user: user, token });
  } catch (e) {
    res.sendStatus(500);
  }
});

router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token !== req.token
    );

    await req.user.save();

    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

router.patch("/users/me", auth, async (req, res) => {
  const updateKeys = Object.keys(req.body);
  const allowedUpdateKeys = ["name", "email", "password", "age"];

  const result = updateKeys.every((key) => allowedUpdateKeys.includes(key));

  if (!result)
    res
      .status(400)
      .send({ error: "Trying to update nonexistent property on user!" });

  try {
    const user = req.user;

    updateKeys.forEach((key) => {
      user[key] = req.body[key];
    });

    await user.save();

    res.send(user);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    sendCancelationEmail(req.user.email, req.user.name);
    res.send(req.user);
  } catch (e) {
    res.sendStatus(500);
  }
});

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/))
      return cb(new Error("file must be an image."));
    cb(undefined, true);

    // cb(new Error("file must be a PDF"));
    // cb(undefined, true);
    // cb(undefined, false);
  },
});

router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  try {
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send(e.message);
  }
});

router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) {
      throw new Error();
    } else {
      res.set("Content-Type", "image/png");
      res.send(user.avatar);
    }
  } catch (e) {
    res.status(404).send();
  }
});

module.exports = router;
