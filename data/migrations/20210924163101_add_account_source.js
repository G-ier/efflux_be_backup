// Idea is to add source and sourceId columns and use it instead of fbId
// Required for different oauth accounts support

exports.up = function(knex) {
    return knex.schema.table("users", (tbl) => {
        tbl.string('provider');
        tbl.string('providerId');
    });
};

exports.down = function(knex) {
    return knex.schema.table("users", (tbl) => {
        tbl.dropColumn('provider');
        tbl.dropColumn('providerId');
    });
};
