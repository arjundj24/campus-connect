function authorizeRoles() {
  const allowedRoles = Array.from(arguments);

  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please login first.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission for this action.'
      });
    }

    next();
  };
}

module.exports = authorizeRoles;
