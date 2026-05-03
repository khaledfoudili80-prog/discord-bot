<<<<<<< HEAD
module.exports.loadReactionRoles = async function(guild, db) {
  const reactionRoles = db.get(`reaction_roles_${guild.id}`) || {};
};

=======
module.exports.loadReactionRoles = async function(guild, db) {
  const reactionRoles = db.get(`reaction_roles_${guild.id}`) || {};
};

>>>>>>> eb1f6ec23ff2493c913df02ceb15407b72918b99
const { loadReactionRoles } = require('./reactionRoleHandler.js');