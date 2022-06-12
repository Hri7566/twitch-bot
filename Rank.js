const Db = require('./db');

class Rank {
    static ranks = {};

    static async getRank(user_id) {
        return new Promise((resolve, reject) => {
            Db.get(`rank:${user_id}`, (err, value) => {
                if (err !== null) {
                    reject(err);
                } else {
                    let rank = Rank.ranks[value];
                    resolve(rank);
                }
            });
        });
    }

    static async setRank(user_id, rank_id) {
        return new Promise((resolve, reject) => {
            Db.put(`rank:${user_id}`, rank_id, (err) => {
                if (err !== null) {
                    reject(err);
                } else {
                    let rank = Rank.ranks[rank_id];
                    resolve(rank);
                }
            });
        });
    }

    static getRankByID(rank_id) {
        return this.ranks[rank_id];
    }

    constructor (id, name) {
        this.id = id;
        this.name = name;

        Rank.ranks[id] = this;
    }
}

new Rank(0, 'User');
new Rank(1, 'Moderator');
new Rank(2, 'Admin');
new Rank(3, 'Owner');

module.exports = Rank;
