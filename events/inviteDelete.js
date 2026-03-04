export default {
  name: 'inviteDelete',
  once: false,
  async execute(invite, client) {
    client.inviteCache.delete(invite.code);
  }
};