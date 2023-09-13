const CompositeAdController = require("./controllers/CompositeAdController");
const route = require("express").Router();

const compositeAdController = new CompositeAdController();

route.post("/", async (req, res) => {
  try {
    const response = await compositeAdController.saveCompositeAdData(req, res)
    res.status(200).json(response);
  } catch ({ message }) {
    res.status(404).json({ message });
  }
});

// update
route.patch("/", async (req, res) => {
  try {
    const response = await compositeAdController.updateCompositeAdData(req, res)
    res.status(200).json(response);
  } catch ({ message }) {
    res.status(404).json({ message });
  }
})

// get
route.get("/", async (req, res) => {
  try {
    const response = await compositeAdController.getCompositeAdData(req, res)
    res.status(200).json(response);
  } catch ({ message }) {
    res.status(404).json({ message });
  }
})

// delete
route.delete("/", async (req, res) => {
  try {
    const response = await compositeAdController.deleteCompositeAdData(req, res)
    res.status(200).json(response);
  } catch ({ message }) {
    res.status(404).json({ message });
  }
})

module.exports = route;
