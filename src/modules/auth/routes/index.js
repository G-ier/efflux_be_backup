const route = require("express").Router();
const Auth0Controller = require("../controllers/Auth0Controller");
const RolesController = require("../controllers/RoleController");
const UsersController = require("../controllers/UserController");

const PermissionController = require("../controllers/PermissionController");

const auth0Controller = new Auth0Controller();
const roleController = new RolesController();
const permissionController = new PermissionController();
const usersController = new UsersController();


// Auth0 Routes
route.post("/login", async (req, res) => await auth0Controller.login(req, res));

// Joint user management routes
route.get("/getUsers", async (req, res) => await auth0Controller.getUsers(req, res));
route.post("/createUser", async (req, res) => await auth0Controller.createUser(req, res));
route.post("/inviteUser", async (req, res) => await auth0Controller.inviteUser(req, res));
route.post("/deleteUser", async (req, res) => await auth0Controller.deleteUser(req, res));
route.post("/editUserInfo", async (req, res) => await auth0Controller.editUserInfo(req, res));
route.post("/editUserRights", async (req, res) => await auth0Controller.editUserRights(req, res));
route.post("/editUserPassword", async (req, res) => await auth0Controller.editUserPassword(req, res));

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


module.exports = route;
