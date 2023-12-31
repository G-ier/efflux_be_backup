const route = require("express").Router();
const Auth0Controller = require("../controllers/Auth0Controller");
const RolesController = require("../controllers/RoleController");
const PermissionController = require("../controllers/PermissionController");

const auth0Controller = new Auth0Controller();
const roleController = new RolesController();
const permissionController = new PermissionController();

// Auth0 Routes
route.post("/login", async (req, res) => await auth0Controller.login(req, res));
route.post("/users", async (req, res) => await auth0Controller.createUser(req, res));

// Role Routes
route.post("/roles", async (req, res) => await roleController.saveRole(req, res)); 
route.post("/roles/bulk", async (req, res) => await roleController.saveRolesInBulk(req, res)); 
route.get("/roles", async (req, res) => await roleController.fetchRoles(req, res));
route.get("/roles/:id", async (req, res) => await roleController.fetchOne(req, res));
route.put("/roles", async (req, res) => await roleController.updateRole(req, res));
route.delete("/roles", async (req, res) => await roleController.deleteRole(req, res)); 


// Permission Routes
route.post("/permissions", async (req, res) => await permissionController.savePermission(req, res));
route.post("/permissions/bulk", async (req, res) => await permissionController.savePermissionsInBulk(req, res)); 
route.get("/permissions", async (req, res) => await permissionController.fetchPermissions(req, res));
route.get("/permissions/:id", async (req, res) => await permissionController.fetchOne(req, res));
route.put("/permissions", async (req, res) => await permissionController.updatePermission(req, res));
route.delete("/permissions", async (req, res) => await permissionController.deletePermission(req, res)); 

// Permission Routes
route.post("/permissions", async (req, res) => await permissionController.savePermission(req, res));
route.get("/permissions", async (req, res) => await permissionController.fetchPermissions(req, res));
// ... other permission routes ...

module.exports = route;
