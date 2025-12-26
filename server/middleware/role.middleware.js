export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(403).json({
          success: false,
          message: "User role not found",
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied for this role",
        });
      }

      next();
    } catch (error) {
      console.error("ROLE AUTH ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Role authorization failed",
      });
    }
  };
};
