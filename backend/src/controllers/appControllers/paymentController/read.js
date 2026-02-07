const mongoose = require('mongoose');

const read = async (req, res) => {
    const Model = mongoose.model('Payment');
    try {
        // Find document by id with population
        const result = await Model.findOne({
            _id: req.params.id,
            removed: false,
        })
            .populate('client villa invoice')
            .exec();

        // If no results found, return document not found
        if (!result) {
            return res.status(404).json({
                success: false,
                result: null,
                message: 'No document found ',
            });
        } else {
            // Return success response
            return res.status(200).json({
                success: true,
                result,
                message: 'we found this document ',
            });
        }
    } catch (error) {
        console.log("PAYMENT READ ERROR:", error);
        try {
            require('fs').appendFileSync('error_log.txt', 'READ ERROR: ' + JSON.stringify(error, Object.getOwnPropertyNames(error)) + '\nStack: ' + error.stack + '\n');
        } catch (fsErr) {
            console.error("Failed to write error log", fsErr);
        }
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error: ' + error.message,
        });
    }
};

module.exports = read;
