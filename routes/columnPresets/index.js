const route = require('express').Router();
const wrap = require("../../utils/wrap");
const assert = require('assert');
const db = require("../../data/dbConfig");

// @route     /api/column-presets
route.get('/',
  wrap(async (req, res) => {

    const user_id = req.query.user_id;

    try {
      assert(user_id, 'User ID is required');
    } catch (err) {
      return res.status(400).json(err.message);
    }

    if (user_id === 'admin') {
      const results = await db('column_presets');
      return res.status(200).json(results);
    }

    const results = await db('column_presets').where('user_id', user_id);
    return res.status(200).json(results);

  })
);

// @route     /api/column-presets
route.post('/',
  wrap(async (req, res) => {
    console.log("Request Body", req.body)
    const body = req.body;
    try {
      assert(body.name, 'Name is required');
      assert(body.presets, 'Presets are required');
      assert(body.user_id, 'User ID is required');
    } catch (err) {
      return res.status(400).json(err.message);
    }

    if (body.user_id === 'admin') body.user_id = null;

    const response = await db('column_presets').insert(body).returning('*')
    console.log("Response", response)
    return res.status(200).json(response[0]);
  })

);

// @route     /api/column-presets
route.delete('/',
  wrap(async (req, res) => {

    const presetId = req.query.id;

    try{
      assert(presetId, 'ID is required');
    }
    catch(err){
      return res.status(400).json(err.message);
    }

    try {
      await db('column_presets').where('id', presetId).del();
    } catch (err) {
      return res.status(400).json("Preset record not found");
    }

    return res.status(200).json("Preset deleted");

  })
);

module.exports = route;
