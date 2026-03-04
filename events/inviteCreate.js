export default {
  name: 'inviteCreate',
  once: false,
  async execute(invite, client) {
    client.inviteCache.set(invite.code, invite.uses ?? 0);
  }
};
