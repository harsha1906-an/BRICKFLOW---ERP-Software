const roleCheck = (allowedRoles) => {
    return (req, res, next) => {
        try {
            // Check if user exists (should be set by auth middleware)
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
            }

            // Check if user's role is in allowed roles
            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Insufficient permissions.'
                });
            }

            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Authorization error'
            });
        }
    };
};

module.exports = roleCheck;
