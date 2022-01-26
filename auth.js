const jwtSecret = 'your_jwt_secret';

const jwt = require('jsonwebtoken'),
passport = require('passport');
// const { eq } = require('lodash');
// const { serializeUser } = require('passport');

require('./passports');

/** This function generates the jwt token
 * for the user
 * 
 * @param {object} user 
 * @returns {string} token
 */
let generateJWTToken = (user) => {
    return jwt.sign(user, jwtSecret, {
        subject: user.Username,
        expiresIn: '7d',
        algorithm: 'HS256'
    });
}

/** this is a test of jsdoc
 * 
 * @param {*} router 
 */
module.exports = (router) => {
    router.post('/login', (req, res) => {
        passport.authenticate('local',  {session: false }, (error, user, info) => {
            if (error || !user) {
                return res.status(400).json({
                    message: 'Something is not right (auth#18)',
                    user: user
                });
            }
            req.login(user, {session: false }, (error) => {
                if (error) {
                    res.send(error); 
                }
                let token = generateJWTToken(user.toJSON());
                return res.json({ user, token });
            });
        })(req, res);
    });
}
