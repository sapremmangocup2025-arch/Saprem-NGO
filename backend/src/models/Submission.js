const mongoose = require('mongoose');
const SubmissionSchema = new mongoose.Schema({
village: { type: mongoose.Schema.Types.ObjectId, ref: 'Village', required: true },
competition: { type: mongoose.Schema.Types.ObjectId, ref: 'Competition', required: true },
task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
submittedValue: { type: Number, required: true },
status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
awardedMarks: { type: Number, default: 0 },
proof: { type: String } // could be URL or note
}, { timestamps: true });
module.exports = mongoose.model('Submission', SubmissionSchema);