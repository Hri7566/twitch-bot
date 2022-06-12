const { level, Level } = require('level');

const db = new Level('users.db', {
    valueEncoding: 'json'
});

class Db {
    static db = db;

    static get(key, callback) {
        this.db.get(key, (err, value) => {
            if (err !== null) {
                callback(err);
            } else {
                callback(null, value);
            }
        });
    }

    static put(key, value, callback) {
        this.db.put(key, value, (err) => {
            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        });
    }

    static del(key, callback) {
        this.db.del(key, (err) => {
            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        });
    }

    static exists(key, callback) {
        this.db.get(key, (err, value) => {
            if (err) {
                callback(err, false);
            } else {
                callback(null, true);
            }
        });
    }
}

module.exports = Db;
