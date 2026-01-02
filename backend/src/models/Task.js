const mongoose = require('mongoose');
const TaskSchema = new mongoose.Schema({
title: { type: String, required: true },
description: { type: String },
target: { type: Number, default: 1 },
maxMarks: { type: Number, default: 0 }
});
module.exports = mongoose.model('Task', TaskSchema);